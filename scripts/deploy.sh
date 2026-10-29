#!/usr/bin/env bash
# 빌드 결과(out/)만 deploy 브랜치로 올린다. 서버는 deploy 브랜치를 받아 nginx로 서빙.
#   bash scripts/deploy.sh <묶음 1~4> <https://도메인>
# 서버 갱신: cd /var/www/cr_prj && git fetch -q origin deploy && git reset -q --hard origin/deploy
set -euo pipefail
WAVE=${1:?묶음(1~4)}; URL=${2:?https://도메인}
cd "$(dirname "$0")/.."
python -I scripts/make_og.py  # og 이미지(public/og, git 제외) 없는 것만 생성
rm -rf out
OPEN_WAVE=$WAVE SITE_URL=$URL npx next build
grep -q "$URL" out/sitemap.xml || { echo "sitemap에 도메인이 없음"; exit 1; }
# 열린 페이지가 쓰는 og 이미지만 남긴다(안 열린 키워드 이름이 파일명으로 드러나지 않게, 용량도 줄임)
python -I - <<'PYEOF'
import glob, os, re, urllib.parse
used = set()
for f in glob.glob('out/**/*.html', recursive=True):
    for u in re.findall(r'/og/([^"?]+[.]jpg)', open(f, encoding='utf-8', errors='ignore').read()):
        used.add(urllib.parse.unquote(u))
rm = [f for f in glob.glob('out/og/*.jpg') if os.path.basename(f) not in used]
for f in rm: os.remove(f)
print(f'og 이미지: 사용 {len(used)}장 남김, 미사용 {len(rm)}장 제외')
PYEOF
REMOTE=$(git remote get-url origin)
cd out
git init -q -b deploy && git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "deploy: ${WAVE}단계 $(date +%F)"
git push -q -f "$REMOTE" deploy
rm -rf .git
echo "deploy 브랜치 갱신 완료: ${WAVE}단계, $(find . -name '*.html' | wc -l) html"
