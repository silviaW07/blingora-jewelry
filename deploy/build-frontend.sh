#!/usr/bin/env bash
# Rebuild + restart the Next.js frontend the stable way (webpack standalone).
# Run from anywhere; script cds to the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}"
export UPLOAD_DIR
export NODE_ENV=production

echo "==> repo: $ROOT"
echo "==> UPLOAD_DIR=$UPLOAD_DIR"

mkdir -p "$UPLOAD_DIR"

echo "==> git pull"
git pull --ff-only

echo "==> pnpm install"
pnpm install --frozen-lockfile || pnpm install

echo "==> clean .next"
rm -rf .next

echo "==> next build --webpack (NOT turbopack)"
pnpm exec next build --webpack

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: .next/standalone/server.js missing after build" >&2
  exit 1
fi

echo "==> copy static + public into standalone"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -a .next/static .next/standalone/.next/
rm -rf .next/standalone/public
cp -a public .next/standalone/

echo "==> restart PM2 frontend"
pm2 delete frontend >/dev/null 2>&1 || true
# free port 3000 if a stray node still holds it
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
fi
UPLOAD_DIR="$UPLOAD_DIR" pm2 start "$ROOT/deploy/ecosystem.config.cjs" --only frontend
pm2 save

sleep 2
echo "==> listeners on :3000"
ss -lntp | grep ':3000' || echo "WARNING: nothing listening on 3000"

echo "==> smoke upload"
set +e
RESP="$(curl -s -m 20 -w '\nHTTP:%{http_code}' -X POST \
  -F "image=@${ROOT}/public/service-icons/payment.svg;type=image/svg+xml" \
  http://127.0.0.1:3000/api/upload-image/)"
set -e
echo "$RESP"

echo "==> done. Check: pm2 logs frontend --lines 50"
