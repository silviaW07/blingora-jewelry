#!/usr/bin/env bash
# Rebuild + restart frontend the ONLY supported production way.
# Never run bare `next build` (Turbopack) or `next start` on this project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}"
export UPLOAD_DIR
export NODE_ENV=production

echo "==> repo: $ROOT"
echo "==> UPLOAD_DIR=$UPLOAD_DIR"
mkdir -p "$UPLOAD_DIR" "$ROOT/logs"
chmod +x "$ROOT/deploy/"*.sh 2>/dev/null || true

# Ensure .env has UPLOAD_DIR so standalone-entry / future restarts keep it
if [[ -f .env ]]; then
  if ! grep -q '^UPLOAD_DIR=' .env; then
    echo "UPLOAD_DIR=$UPLOAD_DIR" >> .env
    echo "==> appended UPLOAD_DIR to .env"
  fi
  # NEXT_PUBLIC_* is inlined at build time — AutoCoder here forces the 200/day quota
  if grep -q '^NEXT_PUBLIC_IMAGE_UPLOAD_URL=.*autocoder' .env; then
    echo "==> disabling AutoCoder NEXT_PUBLIC_IMAGE_UPLOAD_URL in .env (causes 200/day quota)"
    sed -i.bak '/^NEXT_PUBLIC_IMAGE_UPLOAD_URL=.*autocoder/d' .env || \
      sed -i '' '/^NEXT_PUBLIC_IMAGE_UPLOAD_URL=.*autocoder/d' .env
  fi
else
  echo "UPLOAD_DIR=$UPLOAD_DIR" > .env
  echo "==> created .env with UPLOAD_DIR"
fi
unset NEXT_PUBLIC_IMAGE_UPLOAD_URL || true
export NEXT_PUBLIC_IMAGE_UPLOAD_URL=

echo "==> git pull"
git pull --ff-only || git pull

echo "==> pnpm install"
pnpm install --frozen-lockfile || pnpm install

echo "==> clean .next"
rm -rf .next

echo "==> gen_rpc + next build --webpack"
pnpm run build

if [[ ! -f .next/standalone/server.js ]]; then
  echo "ERROR: .next/standalone/server.js missing" >&2
  exit 1
fi

# Only fail if the APP server output still requires turbopack runtime.
# (Next's own package under node_modules may contain the word "turbopack" — ignore that.)
if [[ -e '.next/standalone/.next/server/chunks/ssr/[turbopack]_runtime.js' ]] || \
   [[ -e '.next/standalone/.next/server/chunks/[turbopack]_runtime.js' ]] || \
   find .next/standalone/.next/server -name '[turbopack]_runtime.js' 2>/dev/null | grep -q .; then
  echo "ERROR: standalone server still depends on [turbopack]_runtime.js — rebuild with --webpack" >&2
  find .next/standalone/.next/server -name '[turbopack]_runtime.js' 2>/dev/null | head
  exit 1
fi

echo "==> webpack standalone OK (no app turbopack runtime)"

echo "==> copy static + public into standalone"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -a .next/static .next/standalone/.next/
rm -rf .next/standalone/public
cp -a public .next/standalone/

echo "==> stop old frontend (and free :3000)"
pm2 delete frontend >/dev/null 2>&1 || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti:3000 | xargs -r kill -9 || true
fi
sleep 1

echo "==> start via ecosystem (standalone-entry loads .env)"
UPLOAD_DIR="$UPLOAD_DIR" pm2 start "$ROOT/deploy/ecosystem.config.cjs" --only frontend
pm2 save

echo "==> wait for listen"
ok=0
for i in $(seq 1 30); do
  if ss -lntp 2>/dev/null | grep -q ':3000'; then
    ok=1
    break
  fi
  sleep 1
done
if [[ "$ok" != "1" ]]; then
  echo "ERROR: nothing listening on :3000" >&2
  pm2 logs frontend --lines 60 --nostream || true
  exit 1
fi

echo "==> smoke home"
home_code="$(curl -s -o /dev/null -m 30 -w '%{http_code}' http://127.0.0.1:3000/ || true)"
echo "home HTTP:$home_code"
if [[ "$home_code" != "200" && "$home_code" != "307" && "$home_code" != "308" ]]; then
  echo "ERROR: homepage not healthy" >&2
  pm2 logs frontend --lines 60 --nostream || true
  exit 1
fi

echo "==> smoke upload"
set +e
RESP="$(curl -s -m 30 -w '\nHTTP:%{http_code}' -X POST \
  -F "image=@${ROOT}/public/service-icons/payment.svg;type=image/svg+xml" \
  http://127.0.0.1:3000/api/upload-image/)"
set -e
echo "$RESP"
echo "$RESP" | grep -q 'HTTP:200' || echo "WARNING: upload smoke did not return HTTP 200 (check UPLOAD_DIR perms)"

echo "==> optional: install cron healthcheck (every 2 min)"
echo "    crontab -e  →  */2 * * * * $ROOT/deploy/healthcheck.sh >> $ROOT/logs/healthcheck.log 2>&1"

echo "==> done"
pm2 list
