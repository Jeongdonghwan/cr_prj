"""오픈 뒤 추가 키워드 페이지(wave 5·6) → data/site-pages.json 뒤에 붙이고 keywords/파워크레인_추가키워드.xlsx 작성

  python -I scripts/add_extra_pages.py

다시 돌려도 같은 결과(기존 wave 5 이상 페이지를 지우고 다시 붙인다). 기존 페이지의 wave·슬러그는 건드리지 않는다.
build_pages.py → rebatch.py 를 다시 돌렸다면 그 뒤에 이 스크립트도 다시 돌린다.

고른 기준 (검색량 데이터 없음, 출동 권역 25곳 안에서만)
  1. keywords/지역_크레인_키워드.xlsx 에 있었지만 원본에서 페이지가 안 된 행 중 출동 권역 안의 것
     — 영등포구 8개 동, 강서구 과해·오곡·오쇠동 (동 × 크레인·카고크레인·미니크레인)
  2. 경기북부·서울서부 시군구 13곳 × 크레인 임대·대여 (인천·부천 시군구에는 이미 있는 축)
  3. 경기북부·서울서부 동·읍면 × 하이드로크레인·5톤·25톤 크레인·크레인 임대 (인천·부천 동에는 이미 있는 축)
  순서: 파주 차고지(심학산로)에서 가까운 지역부터, 지역 안에서는 시군구 → 동(regions.json 순서).
  앞 절반 wave 5(11/12), 뒤 절반 wave 6(11/14) — data/drip.json extra.
"""
import json, os, re, sys
from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, 'data', 'site-pages.json')
XLSX = os.path.join(ROOT, 'keywords', '파워크레인_추가키워드.xlsx')
DOMAIN = 'https://파워크레인.kr'
DATES = {5: '11-12', 6: '11-14'}

ORDER = ['파주시', '김포시', '일산', '고양시', '양주시', '의정부시', '은평구', '강서구', '마포구', '서대문구', '영등포구', '남양주시', '구리시']
DONG_TYPES = ['크레인', '카고크레인', '미니크레인', '하이드로크레인', '5톤 크레인', '25톤 크레인', '크레인 임대']
NEW_DONGS = {'영등포구', '강서구'}  # regions.json 의 동 중 아직 페이지 없는 동을 추가할 지역

regions = {r['name']: r for r in json.load(open(os.path.join(ROOT, 'data', 'regions.json'), encoding='utf-8'))['regions']}
data = json.load(open(PAGES, encoding='utf-8'))
pages = [p for p in data['pages'] if p['wave'] <= 4]
have = {p['slug'] for p in pages}
norm = lambda place: re.sub(r'(시|군|구)$', '', place.split(' ')[-1])  # build_pages.py 와 같은 표기 변형 키
keys = {(p['parent'], p['type'], norm(p['place']), p['level'] == '동·읍면') for p in pages}

new = []


def add(kw, place, typ, level, r):
    slug = kw.replace(' ', '-')
    key = (r['name'], typ, norm(place), level == '동·읍면')
    if slug in have or key in keys:
        return
    have.add(slug); keys.add(key)
    new.append(dict(kw=kw, slug=slug, place=place, type=typ, level=level, area=r['area'], parent=r['name']))


for name in ORDER:
    r = regions[name]
    for typ in ('크레인 임대', '크레인 대여'):
        add(f'{r["kw"]} {typ}', r['kw'], typ, '시군구', r)
    # 이 지역의 동 페이지 장소명(이미 쓰는 표기 그대로: '파주 문산읍', '일산 구산동' …)
    used = {p['place'].split(' ')[-1]: p['place'] for p in pages if p['parent'] == name and p['level'] == '동·읍면'}
    for d in r['dongs']:
        place = used.get(d) or (d if name in NEW_DONGS else None)
        if not place:
            continue
        for typ in DONG_TYPES:
            add(f'{place} {typ}', place, typ, '동·읍면', r)

no = max(p['no'] for p in pages)
half = (len(new) + 1) // 2
for i, p in enumerate(new):
    p['no'] = no + 1 + i
    p['wave'] = 5 if i < half else 6
data['pages'] = pages + [{k: p[k] for k in ('no', 'kw', 'slug', 'place', 'type', 'level', 'area', 'parent', 'wave')} for p in new]
json.dump(data, open(PAGES, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

wb = Workbook()
ws = wb.active
ws.title = '키워드'
ws.append(['키워드', 'URL', '오픈일'])
for p in new:
    ws.append([p['kw'], f'{DOMAIN}/{p["slug"]}/', DATES[p['wave']]])
for c in ws[1]: c.font = Font(bold=True)
for i, w in enumerate([28, 52, 10], 1): ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = 'A2'
wb.save(XLSX)

sys.stdout.reconfigure(encoding='utf-8')
from collections import Counter
print('추가', len(new), Counter(p['wave'] for p in new))
print(Counter((p['level'], p['type']) for p in new))
print('xlsx', XLSX)
