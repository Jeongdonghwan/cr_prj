"""페이지별 og 이미지(1200x630 JPEG) 생성 → public/og/<slug>.jpg, home.jpg, area.jpg, blog.jpg, blog-<글 slug>.jpg
   python -I scripts/make_og.py           # 없는 것만 생성
   python -I scripts/make_og.py --force   # 전부 다시
"""
import datetime, json, os, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'og'
W, H = 1200, 630
PHOTOS = ['fleet-yard', 'fleet-trucks', 'fleet-line', 'fleet-aerial', 'work-concert', 'work-stage-truss']
BRAND, PHONE = '파워크레인', '010-5257-2449'  # lib/site.ts 와 맞출 것
ORANGE = (255, 106, 19)
# 한글 글꼴: Windows 맑은 고딕, 없으면(리눅스 예약 작업) 나눔·Noto CJK
_FONTS = [(r'C:\Windows\Fonts\malgunbd.ttf', r'C:\Windows\Fonts\malgun.ttf'),
          ('/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf', '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'),
          ('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')]
BOLD, REG = next((b, r) for b, r in _FONTS if Path(b).exists() and Path(r).exists())


def fnv(s):  # lib/data.ts hash 와 같은 FNV-1a (UTF-16 코드 단위 — 한글은 BMP라 ord 와 같음)
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h


def base(name):
    im = Image.open(ROOT / 'public' / 'images' / f'{name}.webp').convert('RGB')
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    im = ImageEnhance.Brightness(im.crop((l, t, l + W, t + H))).enhance(0.55)
    # 왼쪽 아래(글자 자리)로 갈수록 더 어둡게
    v = Image.new('L', (1, H)); v.putdata([int(235 * max(0, (y - H * 0.35) / (H * 0.65)) ** 1.2) for y in range(H)])
    h = Image.new('L', (W, 1)); h.putdata([int(150 * max(0, 1 - x / (W * 0.8))) for x in range(W)])
    shade = ImageChops.lighter(v.resize((W, H)), h.resize((W, H)))
    return Image.composite(Image.new('RGB', (W, H), (8, 12, 18)), im, shade)


def render(bases, slug, title, sub):
    im = bases[PHOTOS[fnv(slug) % len(PHOTOS)]].copy()
    d = ImageDraw.Draw(im)
    size = 96
    while size > 48 and d.textlength(title, font=ImageFont.truetype(BOLD, size)) > W - 140:
        size -= 4
    d.rectangle((70, 380, 150, 388), fill=ORANGE)
    d.text((70, 520), title, font=ImageFont.truetype(BOLD, size), fill='white', anchor='ls')
    d.text((70, 572), sub, font=ImageFont.truetype(REG, 32), fill=(215, 222, 230), anchor='ls')
    im.save(OUT / f'{slug}.jpg', 'JPEG', quality=80, optimize=True, progressive=True)


def blog_posts():
    """content/blog/*.md ('_' 로 시작하면 비공개, date/publishedAt 이 빌드일보다 미래면 제외 — lib/blog.ts 와 같은 규칙)
    → [(slug, keyword 또는 title)]"""
    today = os.environ.get('BUILD_DATE') or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
    out = []
    for f in sorted((ROOT / 'content' / 'blog').glob('*.md')):
        if f.name.startswith('_'):
            continue
        raw = f.read_text(encoding='utf-8')
        head = raw.split('---', 2)[1] if raw.startswith('---') else ''
        meta = {k.strip(): v.strip().strip("'") for k, v in (l.split(':', 1) for l in head.splitlines() if ':' in l)}
        if meta.get('slug') and (meta.get('date') or meta.get('publishedAt') or '') <= today:
            out.append((meta['slug'], meta.get('keyword') or meta.get('title', '')))
    return out


def main():
    force = '--force' in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    pages = json.loads((ROOT / 'data' / 'site-pages.json').read_text(encoding='utf-8'))['pages']
    jobs = [('home', '크레인 임대·작업 파워크레인'), ('area', '지역별 크레인 안내'), ('blog', '크레인 작업 안내 글')] + [(p['slug'], p['kw']) for p in pages]
    jobs += [(f'blog-{s}', kw) for s, kw in blog_posts()]  # 블로그 글: public/og/blog-<slug>.jpg (lib/blog 와 같은 키)
    jobs = [j for j in jobs if force or not (OUT / f'{j[0]}.jpg').exists()]
    bases = {n: base(n) for n in PHOTOS} if jobs else {}
    for i, (slug, title) in enumerate(jobs, 1):
        render(bases, slug, title, f'{BRAND} · {PHONE}')
        if i % 500 == 0:
            print(i, '/', len(jobs))
    print('생성', len(jobs), '/ 전체', len(pages) + 3 + len(blog_posts()))


if __name__ == '__main__':
    assert fnv('a') == 0xE40C292C  # FNV-1a 기준값
    main()
