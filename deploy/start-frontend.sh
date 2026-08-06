#!/usr/bin/env bash
# Resume after a successful `next build --webpack` without rebuilding.
# Use when build-frontend.sh failed only on the (now fixed) turbopack name check.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}"
export UPLOAD_DIR
mkdir -p "$UPLOAD_DIR"

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: no standalone build. Run: bash deploy/build-frontend.sh" >&2
  exit 1
fi

echo "==> copy static + public"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -a .next/static .next/standalone/.next/
rm -rf .next/standalone/public
cp -a public .next/standalone/

echo "==> restart frontend"
pm2 delete frontend >/dev/null 2>&1 || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
fi
sleep 1
UPLOAD_DIR="$UPLOAD_DIR" pm2 start "$ROOT/deploy/ecosystem.config.cjs" --only frontend
pm2 save

echo "==> wait :3000"
ok=0
for i in $(seq 1 30); do
  ss -lntp 2>/dev/null | grep -q ':3000' && ok=1 && break
  sleep 1
done
[[ "$ok" == "1" ]] || { pm2 logs frontend --lines 40 --nostream; exit 1; }

home_code="$(curl -s -o /dev/null -m 30 -w '%{http_code}' http://127.0.0.1:3000/ || true)"
echo "home HTTP:$home_code"
pm2 list
