#!/usr/bin/env bash
# Builds the GitHub Pages preview of v2 and publishes it to the gh-pages branch.
# GitHub Pages serves that branch at https://itzpraveen.github.io/printocards-website/
# The preview is noindex, so it never competes in search with printocards.com.
# Runs locally, so it doesn't use GitHub Actions minutes.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_URL=$(git remote get-url origin)
SHA=$(git rev-parse --short HEAD)
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

SITE_URL=https://itzpraveen.github.io BASE_PATH=/printocards-website PUBLIC_PREVIEW=1 \
  npx astro build --outDir "$OUT"
touch "$OUT/.nojekyll"

cd "$OUT"
git init -q -b gh-pages
git add -A
git commit -q -m "Pages preview build of v2 ($SHA)"
git push -q --force "$REPO_URL" gh-pages
echo "Published $SHA: https://itzpraveen.github.io/printocards-website/ (live in about a minute)"
