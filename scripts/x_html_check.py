"""빌드된 키워드 페이지 표본(2026-11-24 레이 구조 점검): main 글자(공백 제외)·p 수(200자당 1개 이하)·h2·키워드 든 h2·본문 내부링크.  python -I scripts/x_html_check.py out data/site-pages.json"""
import html, json, os, random, re, sys
out, pj = sys.argv[1], sys.argv[2]
for s in (sys.stdout,):
    s.reconfigure(encoding='utf-8')
P = json.load(open(pj, encoding='utf-8'))['pages']
files = [(p['kw'], os.path.join(out, p['slug'], 'index.html')) for p in P]
files = [f for f in files if os.path.exists(f[1])]
random.seed(5)
S = random.sample(files, min(60, len(files)))
rows = []
for kw, f in S:
    t = open(f, encoding='utf-8').read()
    m = re.search(r'<main[^>]*>(.*?)</main>', t, re.S).group(1)
    m = re.sub(r'<script.*?</script>', '', m, flags=re.S)
    body = m.split('class="closing"')[0]
    txt = html.unescape(re.sub(r'<[^>]+>', '', body))
    chars = len(re.sub(r'\s', '', txt))
    ps = len(re.findall(r'<p[ >]', body))
    h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', body, re.S)
    kwh2 = sum(1 for h in h2 if kw in html.unescape(re.sub(r'<[^>]+>', '', h)))
    links = len(re.findall(r'<a [^>]*href="/', body.split('</nav>', 1)[-1]))
    rows.append((chars, ps, len(h2), kwh2, links))
avg = lambda i: sum(r[i] for r in rows) / len(rows)
print(f'표본 {len(rows)} | main 글자 평균 {avg(0):.0f} | p 평균 {avg(1):.1f} (200자당 1개 기준 {avg(0)/200:.1f}) | h2 평균 {avg(2):.1f} · 키워드 든 h2 {avg(3):.1f} | 본문 내부링크 평균 {avg(4):.1f} (최소 {min(r[4] for r in rows)} 최대 {max(r[4] for r in rows)}) | 쪼개진 페이지 {sum(1 for r in rows if r[1] > r[0]/200)}')
