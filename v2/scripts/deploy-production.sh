#!/usr/bin/env bash
# Builds the site for https://printocards.com and publishes it to the gh-pages branch, which
# GitHub Pages serves on that domain. The CNAME file keeps the custom domain attached: a push
# without it detaches the domain and takes the site down.
# Runs locally, so it doesn't use GitHub Actions minutes.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN=printocards.com
REPO_URL=$(git remote get-url origin)
SHA=$(git rev-parse --short HEAD)
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

# A stray preview setting would publish a noindex, sub-path build to the live domain.
env -u SITE_URL -u BASE_PATH -u PUBLIC_PREVIEW npx astro build --outDir "$OUT"
if grep -q 'name="robots" content="noindex"' "$OUT/index.html"; then
  echo "Refusing to publish: the home page is marked noindex." >&2
  exit 1
fi
echo "$DOMAIN" > "$OUT/CNAME"
touch "$OUT/.nojekyll"

cd "$OUT"
git init -q -b gh-pages
git add -A
git commit -q -m "Production build of v2 ($SHA)"
git push -q --force "$REPO_URL" gh-pages
echo "Published $SHA: https://$DOMAIN/ (live in about a minute)"
