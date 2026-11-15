"""정적 빌드(out/) 후처리 — next build 뒤, deploy 브랜치 푸시 전에 돌린다.

  python -I scripts/postbuild.py out [상태파일=.lastmod.json]

1. lastmod 를 실제 수정일로: 페이지 <main> 글의 해시가 지난 빌드와 같으면 지난 날짜를 유지, 다르거나 처음 보면 오늘.
   (빌드 시각이 아닌 lastmod — 예: 블로그 글 날짜 — 는 처음 볼 때 그대로 둔다.) 상태는 프로젝트 폴더의 .lastmod.json.
2. sitemap.xml 을 색인 파일로 바꾸고 묶음으로 나눈다: sitemap-core.xml(메인·허브·priority 0.8+) /
   sitemap-blog.xml / sitemap-kw-N.xml(1,000개씩). 주소 sitemap.xml 은 그대로라 등록된 사이트맵이 안 깨진다.
3. llms.txt: 메인 title·description + 핵심 페이지·최근 블로그 글 목록.
"""
import datetime as dt, hashlib, html, json, os, re, sys, urllib.parse
from collections import Counter

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass
CHUNK = 1000
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'


def local(out, loc):
    p = urllib.parse.unquote(urllib.parse.urlparse(loc).path).strip('/')
    for f in (os.path.join(out, p, 'index.html'), os.path.join(out, p + '.html'), os.path.join(out, p)):
        if os.path.isfile(f): return f


def page_info(f):
    t = open(f, encoding='utf-8', errors='ignore').read()
    m = re.search(r'<main.*?</main>', t, re.S)
    body = re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>', ' ', m.group(0) if m else t, flags=re.S)
    ti = re.search(r'<title>(.*?)</title>', t, re.S)
    de = re.search(r'<meta name="description" content="([^"]*)"', t)
    return (hashlib.md5(' '.join(body.split()).encode()).hexdigest()[:12],
            html.unescape(ti.group(1)).strip() if ti else '', html.unescape(de.group(1)) if de else '')


def urlset(entries):
    rows = ''.join(f'<url><loc>{html.escape(u)}</loc><lastmod>{d}</lastmod></url>\n' for u, d in entries)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="{NS}">\n{rows}</urlset>\n'


def main(out, state_path):
    src = open(os.path.join(out, 'sitemap.xml'), encoding='utf-8').read()
    if '<sitemapindex' in src: raise SystemExit('sitemap.xml 이 이미 색인 파일 — 빌드 직후에만 돌린다')
    urls = []
    for blk in re.findall(r'<url>(.*?)</url>', src, re.S):
        g = lambda tag: (re.search(rf'<{tag}>(.*?)</{tag}>', blk, re.S) or [None, ''])[1].strip()
        urls.append((html.unescape(g('loc')), g('lastmod'), float(g('priority') or 0.5)))
    build_time = Counter(l for _, l, _ in urls).most_common(1)[0][0] if urls else ''
    state = json.load(open(state_path, encoding='utf-8')) if os.path.exists(state_path) else {}
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat()  # KST
    base = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlparse(urls[0][0]))
    core, blog, kw, new_state, titles = [], [], [], {}, {}
    for loc, lastmod, prio in urls:
        f = local(out, loc)
        if not f: raise SystemExit(f'sitemap 에 파일 없는 URL: {loc}')
        h, title, _ = page_info(f)
        old = state.get(loc)
        date = old[1] if old and old[0] == h else (lastmod[:10] if lastmod and lastmod != build_time and not old else today)
        new_state[loc] = [h, date]; titles[loc] = title
        path = urllib.parse.unquote(urllib.parse.urlparse(loc).path)
        (blog if re.match(r'/blog/.+', path) else core if prio >= 0.8 else kw).append((loc, date))
    parts = [('sitemap-core.xml', core)] + ([('sitemap-blog.xml', blog)] if blog else []) + \
            [(f'sitemap-kw-{i // CHUNK + 1}.xml', kw[i:i + CHUNK]) for i in range(0, len(kw), CHUNK)]
    for name, entries in parts:
        open(os.path.join(out, name), 'w', encoding='utf-8', newline='\n').write(urlset(entries))
    idx = ''.join(f'<sitemap><loc>{base}/{n}</loc><lastmod>{max(d for _, d in e)}</lastmod></sitemap>\n' for n, e in parts)
    open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="{NS}">\n{idx}</sitemapindex>\n')
    json.dump(new_state, open(state_path, 'w', encoding='utf-8'), ensure_ascii=False)

    _, title, desc = page_info(os.path.join(out, 'index.html'))
    link = lambda u: f'- [{titles[u] or u}]({u})'
    recent = sorted(blog, key=lambda x: x[1], reverse=True)[:20]
    llms = [f'# {title}', '', f'> {desc}', '', '## 주요 페이지'] + [link(u) for u, _ in core[:60]]
    if recent: llms += ['', '## 최근 글'] + [link(u) for u, _ in recent]
    llms += ['', '## 사이트맵', f'- {base}/sitemap.xml']
    open(os.path.join(out, 'llms.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(llms) + '\n')
    changed = sum(1 for u in new_state if new_state[u][1] == today)
    print(f'postbuild: URL {len(urls)} (핵심 {len(core)} · 블로그 {len(blog)} · 키워드 {len(kw)}), 사이트맵 {len(parts)}개, 오늘 수정 {changed}, llms.txt')


def demo():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        mk = lambda p, body: (os.makedirs(os.path.join(d, p), exist_ok=True),
                              open(os.path.join(d, p, 'index.html'), 'w', encoding='utf-8').write(
                                  f'<title>{p or "home"}</title><meta name="description" content="d"><main>{body}</main>'))
        sm = lambda: open(os.path.join(d, 'sitemap.xml'), 'w', encoding='utf-8').write(
            f'<urlset>' + ''.join(f'<url><loc>https://a.kr/{p}</loc><lastmod>{l}</lastmod><priority>{pr}</priority></url>'
                                  for p, l, pr in (('', 'T', 1), ('x/', 'T', 0.6), ('y/', 'T', 0.6), ('blog/p/', '2026-01-02T00:00:00.000Z', 0.7))) + '</urlset>')
        for p in ('', 'x', 'y', 'blog/p'): mk(p, 'one')
        st = os.path.join(d, 's.json'); sm(); main(d, st)
        s = json.load(open(st)); s['https://a.kr/x/'][1] = s['https://a.kr/y/'][1] = '2020-01-01'; json.dump(s, open(st, 'w'))
        mk('y', 'two'); sm(); main(d, st)
        s = json.load(open(st)); kw = open(os.path.join(d, 'sitemap-kw-1.xml')).read()
        assert s['https://a.kr/x/'][1] == '2020-01-01' and s['https://a.kr/y/'][1] != '2020-01-01'   # 안 바뀐 건 유지, 바뀐 건 오늘
        assert s['https://a.kr/blog/p/'][1] == '2026-01-02'                                          # 글 날짜 유지
        assert '<sitemapindex' in open(os.path.join(d, 'sitemap.xml')).read() and '2020-01-01' in kw
        assert os.path.exists(os.path.join(d, 'llms.txt'))
    print('demo ok')


if __name__ == '__main__':
    if len(sys.argv) < 2: demo(); sys.exit()
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), '.lastmod.json'))
