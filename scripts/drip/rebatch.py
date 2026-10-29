"""site-pages.json 의 wave 를 '작은 묶음'으로 다시 나눈다 (오픈 7일 안에 나눠 여는 용도).

  python -I rebatch.py <site-pages.json> [--plan 25,50,75,100 | --pct 25] [--keep-first] [--dry]

- 순서: 기존 (wave, no) 순서 그대로 — 시·군·구 → 생활권 → 동 순서가 유지된다.
- --keep-first: 이미 공개된 wave 1 은 그대로 1번 묶음으로 둔다 (공개된 페이지를 닫지 않기 위해).
- 표기 변형(variantOf)은 대표 페이지보다 먼저 열리지 않게 대표와 같은 묶음 이후로 민다.
- --plan: 묶음마다 '누적 %' (점점 크게 여는 가속 일정, 기본). --pct: 같은 크기로 나누기.
build_pages.py 를 다시 돌리면 wave 가 원래대로 덮어써지므로 그 뒤에 이 스크립트를 다시 돌린다.
"""
import json, math, sys
from collections import Counter


def rebatch(pages, pct=10, keep_first=False, plan=None):
    order = sorted(pages, key=lambda p: (p.get('wave', 1), p.get('no', 0)))
    size = max(1, math.ceil(len(pages) * pct / 100))
    first = [p for p in order if keep_first and p.get('wave', 1) == 1]
    rest = [p for p in order if not (keep_first and p.get('wave', 1) == 1)]
    batch = {}
    for p in first: batch[p['slug']] = 1
    start = 2 if first else 1
    if plan:  # 누적 % → 경계 (전체 기준). 이미 연 양보다 작은 단계는 건너뛴다
        cuts = [c for c in (math.ceil(len(pages) * x / 100) - len(first) for x in plan) if c > 0]
        for i, p in enumerate(rest): batch[p['slug']] = start + sum(1 for c in cuts if i >= c)
    else:
        for i, p in enumerate(rest): batch[p['slug']] = start + i // size
    for p in pages:  # 변형은 대표보다 앞서 열리지 않게
        c = p.get('variantOf')
        if c in batch: batch[p['slug']] = max(batch[p['slug']], batch[c])
    for p in pages: p['wave'] = batch[p['slug']]
    return pages


def demo():
    pg = [{'slug': f's{i}', 'no': i, 'wave': 1 if i < 3 else 2} for i in range(20)]
    pg.append({'slug': 'v', 'no': 0, 'wave': 1, 'variantOf': 's19'})
    rebatch(pg, pct=25, keep_first=True)
    w = {p['slug']: p['wave'] for p in pg}
    assert all(w[f's{i}'] == 1 for i in range(3)), w   # 공개분 유지
    assert w['s3'] == 2 and w['s19'] > 2, w             # 나머지는 순서대로
    assert w['v'] == w['s19'], w                        # 변형은 대표와 함께
    pg2 = [{'slug': f'x{i}', 'no': i, 'wave': 1 if i < 10 else 2} for i in range(100)]
    rebatch(pg2, keep_first=True, plan=[30, 60, 100])
    c = Counter(p['wave'] for p in pg2)
    assert (c[1], c[2], c[3], c[4]) == (10, 20, 30, 40), c
    print('demo ok')


if __name__ == '__main__':
    if len(sys.argv) < 2: demo(); sys.exit()
    path = sys.argv[1]; a = sys.argv[2:]
    pct = float(a[a.index('--pct') + 1]) if '--pct' in a else 10
    plan = [float(x) for x in a[a.index('--plan') + 1].split(',')] if '--plan' in a else None
    raw = open(path, encoding='utf-8').read(); d = json.loads(raw)
    l2 = raw.splitlines()[1] if '\n' in raw else ''
    ind = len(l2) - len(l2.lstrip()) if l2 else None  # 원래 들여쓰기 유지 (diff 최소)
    pages = d['pages'] if isinstance(d, dict) else d
    rebatch(pages, pct, '--keep-first' in a, plan)
    cnt = Counter(p['wave'] for p in pages); acc = 0
    for w in sorted(cnt):
        acc += cnt[w]; print(f'묶음 {w}: +{cnt[w]} (누적 {acc}, {acc * 100 // len(pages)}%)')
    if '--dry' not in a:
        json.dump(d, open(path, 'w', encoding='utf-8', newline=''), ensure_ascii=False, indent=ind)
        print('저장:', path)
