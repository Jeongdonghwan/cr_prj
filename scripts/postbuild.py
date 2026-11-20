"""정적 빌드(out/) 후처리 — next build 뒤, deploy 브랜치 푸시 전에 돌린다.

  python -I scripts/postbuild.py out [상태파일=.lastmod.json]

1. lastmod 를 실제 날짜로: 주소를 처음 본 날(상태 파일)과 lib/site.ts 의 UPDATED(본문 개정일) 중 늦은 날.
   빌드 시각이 아닌 lastmod(블로그 글 날짜 등)는 그대로 둔다. 페이지 파일은 열지 않는다
   (이 PC 는 파일 하나 여는 데 0.15초 — 수만 쪽을 매일 열면 배포가 몇 시간 늘어난다).
2. sitemap.xml = 주소 전부 한 파일(urlset, 실제 lastmod). 참고용 묶음 파일 sitemap-core.xml / sitemap-blog.xml /
   sitemap-kw-N.xml 도 만들지만 sitemap.xml 에서 가리키지 않는다(네이버 색인 파일 지원 불확실 — 2026-11-20 되돌림).
3. llms.txt: 메인 title·description + 핵심 페이지·최근 블로그 글 목록.
4. .ops.json: 대시보드용 — 전체 제작 페이지 수·써 둔 글 수·앞으로 열릴 날짜별 수 (data/drip.json·site-pages.json·content/blog 가 있을 때).
"""
import datetime as dt, glob, html, json, os, re, sys, urllib.parse
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


def head(f):
    t = open(f, encoding='utf-8', errors='ignore').read(6000)
    ti, de = re.search(r'<title>(.*?)</title>', t, re.S), re.search(r'<meta name="description" content="([^"]*)"', t)
    return html.unescape(ti.group(1)).strip() if ti else '', html.unescape(de.group(1)) if de else ''


def urlset(entries):
    rows = ''.join(f'<url><loc>{html.escape(u)}</loc><lastmod>{d}</lastmod></url>\n' for u, d in entries)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="{NS}">\n{rows}</urlset>\n'


def ops(proj, today):
    """전체 제작 수와 남은 일정. 저장소마다 모양이 달라 읽히는 것만 넣는다."""
    o, sched = {}, {}
    try:
        d = json.load(open(os.path.join(proj, 'data', 'drip.json'), encoding='utf-8'))
        sp = json.load(open(os.path.join(proj, 'data', 'site-pages.json'), encoding='utf-8'))
        pages = sp if isinstance(sp, list) else next(v for v in sp.values() if isinstance(v, list))
        o['total_pages'] = len(pages)
        launch, ev = dt.date.fromisoformat(d['launch']), d.get('everyDays')
        extra = {x['wave']: x['date'] for x in d.get('extra', [])}
        for w, n in Counter(p.get('wave', 1) for p in pages).items():
            day = extra.get(w) or ((launch + dt.timedelta((w - 1) * ev)).isoformat() if ev and w <= d.get('maxWave', 0) else None)
            if day and day > today: sched.setdefault(day, {})['pages'] = sched.get(day, {}).get('pages', 0) + n
    except Exception: pass
    posts = [f for f in glob.glob(os.path.join(proj, 'content', 'blog', '*.md*')) if not os.path.basename(f).startswith('_')]
    if posts:
        o['total_posts'] = len(posts)
        for f in posts:
            m = re.search(r'^date:\s*["\']?(\d{4}-\d\d-\d\d)', open(f, encoding='utf-8', errors='ignore').read(800), re.M)
            if m and m.group(1) > today: sched.setdefault(m.group(1), {})['posts'] = sched.get(m.group(1), {}).get('posts', 0) + 1
    o['schedule'] = [{'date': k, **v} for k, v in sorted(sched.items())]
    return o


def main(out, state_path):
    proj = os.path.dirname(os.path.abspath(out))
    src = open(os.path.join(out, 'sitemap.xml'), encoding='utf-8').read()
    if '<sitemapindex' in src: raise SystemExit('sitemap.xml 이 이미 색인 파일 — 빌드 직후에만 돌린다')
    urls = []
    for blk in re.findall(r'<url>(.*?)</url>', src, re.S):
        g = lambda tag: (re.search(rf'<{tag}>(.*?)</{tag}>', blk, re.S) or [None, ''])[1].strip()
        urls.append((html.unescape(g('loc')), g('lastmod'), float(g('priority') or 0.5)))
    build_time = Counter(l for _, l, _ in urls).most_common(1)[0][0] if urls else ''
    state = json.load(open(state_path, encoding='utf-8')) if os.path.exists(state_path) else {}
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat()  # KST
    site_ts = os.path.join(proj, 'lib', 'site.ts')
    m = re.search(r"UPDATED\s*=\s*'(\d{4}-\d\d-\d\d)'", open(site_ts, encoding='utf-8').read()) if os.path.exists(site_ts) else None
    revised = m.group(1) if m else ''
    base = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlparse(urls[0][0]))
    core, blog, kw, new_state = [], [], [], {}
    for loc, lastmod, prio in urls:
        if not local(out, loc): raise SystemExit(f'sitemap 에 파일 없는 URL: {loc}')
        old = state.get(loc)
        seen = (old[1] if isinstance(old, list) else old) or today   # 옛 형식 [해시, 날짜] 도 읽는다
        new_state[loc] = seen
        date = lastmod[:10] if lastmod and lastmod != build_time else max(seen, revised)
        path = urllib.parse.unquote(urllib.parse.urlparse(loc).path)
        (blog if re.match(r'/blog/.+', path) else core if prio >= 0.8 else kw).append((loc, date))
    parts = [('sitemap-core.xml', core)] + ([('sitemap-blog.xml', blog)] if blog else []) + \
            [(f'sitemap-kw-{i // CHUNK + 1}.xml', kw[i:i + CHUNK]) for i in range(0, len(kw), CHUNK)]
    for name, entries in parts:
        open(os.path.join(out, name), 'w', encoding='utf-8', newline='\n').write(urlset(entries))
    # sitemap.xml 은 주소 전부를 담은 한 파일(urlset). 색인 파일(sitemapindex)로 바꾼 11/17 배포 다음 날부터 네이버 노출이
    # 전 사이트에서 같이 끊겼다(바꾸지 않은 도로시펫·jd8 은 정상) — 네이버가 색인 파일을 읽는다는 공식 문서도 없다. 묶음 파일은 참고용으로만 남긴다
    open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write(urlset(core + blog + kw))
    json.dump(new_state, open(state_path, 'w', encoding='utf-8'), ensure_ascii=False)

    title, desc = head(os.path.join(out, 'index.html'))
    link = lambda u: f'- [{head(local(out, u))[0] or u}]({u})'
    recent = sorted(blog, key=lambda x: x[1], reverse=True)[:20]
    llms = [f'# {title}', '', f'> {desc}', '', '## 주요 페이지'] + [link(u) for u, _ in core[:60]]
    if recent: llms += ['', '## 최근 글'] + [link(u) for u, _ in recent]
    llms += ['', '## 사이트맵', f'- {base}/sitemap.xml']
    open(os.path.join(out, 'llms.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(llms) + '\n')
    json.dump(ops(proj, today), open(os.path.join(out, '.ops.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'postbuild: URL {len(urls)} (핵심 {len(core)} · 블로그 {len(blog)} · 키워드 {len(kw)}), 사이트맵 {len(parts)}개, '
          f'오늘 처음 본 주소 {sum(1 for v in new_state.values() if v == today)}, llms.txt, .ops.json')


def demo():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, 'out')
        mk = lambda p: (os.makedirs(os.path.join(out, p), exist_ok=True),
                        open(os.path.join(out, p, 'index.html'), 'w', encoding='utf-8').write(f'<title>{p or "home"}</title><meta name="description" content="d">'))
        sm = lambda ps: open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8').write(
            '<urlset>' + ''.join(f'<url><loc>https://a.kr/{p}</loc><lastmod>{l}</lastmod><priority>{pr}</priority></url>' for p, l, pr in ps) + '</urlset>')
        base = [('', 'T', 1), ('x/', 'T', 0.6), ('blog/p/', '2026-01-02T00:00:00.000Z', 0.7)]
        for p in ('', 'x', 'y', 'blog/p'): mk(p)
        os.makedirs(os.path.join(d, 'lib')); st = os.path.join(d, 's.json')
        open(os.path.join(d, 'lib', 'site.ts'), 'w').write("export const UPDATED = '2021-05-05';")
        sm(base); main(out, st)
        s = json.load(open(st)); s['https://a.kr/x/'] = '2020-01-01'; json.dump(s, open(st, 'w'))
        sm(base + [('y/', 'T', 0.6)]); main(out, st)
        s = json.load(open(st)); kw = open(os.path.join(out, 'sitemap-kw-1.xml')).read()
        assert s['https://a.kr/x/'] == '2020-01-01' and s['https://a.kr/y/'] != '2020-01-01'            # 처음 본 날 유지
        assert 'x/</loc><lastmod>2021-05-05' in kw                                                    # 개정일이 더 늦으면 개정일
        assert '2026-01-02' in open(os.path.join(out, 'sitemap-blog.xml')).read()                     # 글 날짜 유지
        sm_ = open(os.path.join(out, 'sitemap.xml')).read(); assert '<urlset' in sm_ and sm_.count('<url>') == 4   # 한 파일에 전부
        assert os.path.exists(os.path.join(out, 'llms.txt')) and 'schedule' in json.load(open(os.path.join(out, '.ops.json')))
    print('demo ok')


if __name__ == '__main__':
    if len(sys.argv) < 2: demo(); sys.exit()
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), '.lastmod.json'))
