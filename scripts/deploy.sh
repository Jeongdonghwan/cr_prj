#!/usr/bin/env bash
# 빌드 결과(out/)만 deploy 브랜치로 올린다. 서버는 deploy 브랜치를 받아 nginx로 서빙.
#   bash scripts/deploy.sh <단계 1~4> <https://도메인>
# 서버 갱신: cd /var/www/cr_prj && git fetch -q origin deploy && git reset -q --hard origin/deploy
set -euo pipefail
WAVE=${1:?단계(1~4)}; URL=${2:?https://도메인}
cd "$(dirname "$0")/.."
rm -rf out
OPEN_WAVE=$WAVE SITE_URL=$URL npx next build
grep -q "$URL" out/sitemap.xml || { echo "sitemap에 도메인이 없음"; exit 1; }
REMOTE=$(git remote get-url origin)
cd out
git init -q -b deploy && git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "deploy: ${WAVE}단계 $(date +%F)"
git push -q -f "$REMOTE" deploy
rm -rf .git
echo "deploy 브랜치 갱신 완료: ${WAVE}단계, $(find . -name '*.html' | wc -l) html"
