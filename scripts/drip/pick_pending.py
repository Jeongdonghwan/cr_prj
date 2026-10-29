#!/usr/bin/env python3
"""오늘 쓸 키워드 선택 / 발행 완료 처리.

  python pick_pending.py --n 10 [--queue content/guide/_data/keywordQueue.json]
      → 업종·채널·지역이 고르게 섞이도록 라운드로빈으로 N개 선택, JSON 출력
  python pick_pending.py --done 치과-블로그-비용,강남구-카페-플레이스-업체 [--date 2026-10-20]
      → 해당 슬러그(또는 키워드)를 done 으로, publishedAt 기록

선택만 하고 status 는 바꾸지 않는다 — 글이 실제로 저장된 뒤 --done 으로 확정한다.
그래야 중간에 실패해도 키워드가 사라지지 않는다.
"""
import argparse, datetime, json, os, re, sys
# Windows 콘솔(cp949)에서도 한글·기호가 깨지지 않게
for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass

SLUG_STRIP = re.compile(r"[^\w가-힣-]+")


def slugify(keyword):
    """'치과 블로그 비용' → '치과-블로그-비용' (한글 슬러그 — 검색결과에서 주제가 읽힌다)"""
    return SLUG_STRIP.sub("", keyword.strip().replace(" ", "-")).strip("-")


def pick(queue, n):
    pending = [q for q in queue if q["status"] == "pending"]
    # 라운드로빈: (industry, channel) 버킷을 돌아가며 하나씩 — 한 업종에 몰리지 않게
    buckets = {}
    for q in pending:
        buckets.setdefault((q["pattern"], q["industry"]), []).append(q)
    out, keys = [], sorted(buckets)
    while keys and len(out) < n:
        for k in list(keys):
            if len(out) >= n:
                break
            out.append(buckets[k].pop(0))
            if not buckets[k]:
                keys.remove(k)
    for q in out:
        q["suggestedSlug"] = slugify(q["keyword"])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", default="content/guide/_data/keywordQueue.json")
    ap.add_argument("--n", type=int, default=10)
    ap.add_argument("--done", help="완료 처리할 슬러그 또는 키워드, 쉼표 구분")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--manifest", help="선택 결과를 이 파일에 저장 — 중단되면 같은 목록으로 이어한다 (오늘 날짜가 아니면 무시하고 새로 뽑음)")
    a = ap.parse_args()
    data = json.load(open(a.queue, encoding="utf-8"))
    queue = data["queue"]

    if a.done:
        targets = {t.strip() for t in a.done.split(",") if t.strip()}
        hit = 0
        for q in queue:
            if q["keyword"] in targets or slugify(q["keyword"]) in targets or q.get("publishedSlug") in targets:
                q["status"], q["publishedSlug"], q["publishedAt"] = "done", slugify(q["keyword"]), a.date
                hit += 1
        data["done"] = sum(1 for q in queue if q["status"] == "done")
        json.dump(data, open(a.queue, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"done 처리 {hit}건 / 누적 {data['done']}/{data['total']}")
        if hit != len(targets):
            print("⚠ 못 찾은 항목이 있다 — 슬러그/키워드 철자를 확인", file=sys.stderr)
        return

    chosen = None
    if a.manifest and os.path.exists(a.manifest):
        m = json.load(open(a.manifest, encoding="utf-8"))
        if m.get("date") == a.date:
            chosen = m["picks"]
            print(f"# 이어하기: {a.manifest} ({len(chosen)}개)", file=sys.stderr)
    if chosen is None:
        chosen = pick(queue, a.n)
        if a.manifest:
            json.dump({"date": a.date, "picks": chosen}, open(a.manifest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(chosen, ensure_ascii=False, indent=1))
    print(f"\n# 남은 pending {sum(1 for q in queue if q['status'] == 'pending')}개", file=sys.stderr)


if __name__ == "__main__":
    main()
