#!/usr/bin/env python3
"""발행 전 검증 — 통과한 글만 --done 처리한다.

  python validate_posts.py content/guide/insight --slugs 치과-블로그-비용,강남구-카페-플레이스-업체
      [--queue content/guide/_data/keywordQueue.json] [--known-paths known_paths.txt] [--check-url http://127.0.0.1:3000]
      [--min 1200 --max 2200]

검사(하나라도 실패하면 exit 1, 실패 글은 삭제하지 않고 목록만 출력):
  - 프런트매터 필수: slug, title, description, keyword, publishedAt  / slug == 파일명
  - 본문 길이(공백 제외) min~max
  - 첫 '##' 섹션이 존재하고 그 아래 문단이 2문장 이상 (답 먼저)
  - 내부링크 3개 이상, 전부 '/'로 시작 (외부 링크 금지), --known-paths 가 있으면 그 안에 있어야 함,
    --check-url 이 있으면 실제 응답 200
  - 금지 표현: 보장, 획기적, 완벽, 출처 없는 '평균 NN%' / 'NN배'
  - 키워드가 제목에 포함
  - 큐에 같은 슬러그로 이미 done 된 글이 없음 (중복 발행 방지)
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request
for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass

REQUIRED = ["slug", "title", "description", "keyword", "publishedAt"]
FORBIDDEN = [r"보장", r"획기적", r"완벽", r"평균\s*\d+\s*%", r"\d+\s*배\s*(상승|증가)", r"무조건"]


def parse(raw):
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$", raw)
    if not m:
        return None, None
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def check(path, a, done_slugs, known):
    errs = []
    raw = open(path, encoding="utf-8").read()
    meta, body = parse(raw)
    if meta is None:
        return ["프런트매터 없음"]
    for k in REQUIRED:
        if not meta.get(k) or meta[k] == "null":
            errs.append(f"프런트매터 {k} 비어 있음")
    fname = os.path.splitext(os.path.basename(path))[0]
    if meta.get("slug") and meta["slug"] != fname:
        errs.append(f"slug({meta['slug']}) ≠ 파일명({fname})")
    if meta.get("slug") in done_slugs:
        errs.append("큐에 같은 슬러그가 이미 done — 중복 발행")
    if meta.get("keyword") and meta.get("title") and meta["keyword"].replace(" ", "") not in meta["title"].replace(" ", ""):
        errs.append("제목에 키워드 없음")

    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", body)
    n = len(re.sub(r"\s", "", re.sub(r"^#.*$", "", text, flags=re.M)))
    if n < a.min or n > a.max:
        errs.append(f"본문 {n}자 (허용 {a.min}~{a.max})")

    secs = re.split(r"^##\s+", body, flags=re.M)
    if len(secs) < 3:
        errs.append("'##' 섹션 2개 미만")
    else:
        first = secs[1].split("\n", 1)[1] if "\n" in secs[1] else ""
        if len(re.findall(r"[.!?다요]\s", first + " ")) < 2:
            errs.append("첫 섹션에 답이 2문장 미만")

    links = re.findall(r"\]\(([^)]+)\)", body)
    internal = [l for l in links if l.startswith("/")]
    external = [l for l in links if re.match(r"https?://", l)]
    if len(internal) < 3:
        errs.append(f"내부링크 {len(internal)}개 (3개 이상)")
    if external:
        errs.append(f"외부링크 {len(external)}개")
    for l in internal:
        p = l.split("#")[0].split("?")[0]
        if known and p not in known and urllib.parse.unquote(p) not in known:
            errs.append(f"알 수 없는 경로 {p}")
        if a.check_url:
            try:
                req = urllib.request.Request(a.check_url.rstrip("/") + urllib.parse.quote(urllib.parse.unquote(p)), method="GET", headers={"User-Agent": "validate/1.0"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    if r.status != 200:
                        errs.append(f"{p} → HTTP {r.status}")
            except Exception as e:
                errs.append(f"{p} → {getattr(e, 'code', e)}")

    for pat in FORBIDDEN:
        if re.search(pat, body):
            errs.append(f"금지 표현 /{pat}/")
    return errs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--slugs", required=True)
    ap.add_argument("--queue")
    ap.add_argument("--known-paths", help="허용 내부 경로 목록 파일 (한 줄에 하나). 없으면 형식만 검사")
    ap.add_argument("--check-url", help="예: http://127.0.0.1:3000 — 내부링크를 실제로 요청해 200 확인")
    ap.add_argument("--min", type=int, default=1200)
    ap.add_argument("--max", type=int, default=2200)
    a = ap.parse_args()

    done_slugs = set()
    if a.queue and os.path.exists(a.queue):
        done_slugs = {q.get("publishedSlug") for q in json.load(open(a.queue, encoding="utf-8"))["queue"] if q["status"] == "done"}
    known = set(l.strip() for l in open(a.known_paths, encoding="utf-8")) if a.known_paths else set()

    ok, bad = [], {}
    for slug in [s.strip() for s in a.slugs.split(",") if s.strip()]:
        path = os.path.join(a.dir, slug + ".md")
        if not os.path.exists(path):
            bad[slug] = ["파일 없음"]
            continue
        errs = check(path, a, done_slugs, known)
        (bad.__setitem__(slug, errs) if errs else ok.append(slug))

    print(f"통과 {len(ok)}: {','.join(ok) if ok else '-'}")
    for s, e in bad.items():
        print(f"실패 {s}:\n  - " + "\n  - ".join(e))
    print("\nDONE_SLUGS=" + ",".join(ok))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
