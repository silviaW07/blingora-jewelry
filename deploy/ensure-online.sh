#!/usr/bin/env bash
# Bring frontend (:3000) + rpc (:3100) back online after reboot / crash / empty PM2.
# Safe to run repeatedly (idempotent).
#
#   bash deploy/ensure-online.sh
# Install boot recovery:
#   pm2 startup systemd -u admin --hp /home/admin
#   (run the command it prints, then)
#   pm2 save
# Install cron watchdog (every 2 min):
#   */2 * * * * /home/admin/my-website/blingora-jewelry/deploy/healthcheck.sh >> /home/admin/my-website/blingora-jewelry/logs/healthcheck.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}"
export UPLOAD_DIR
mkdir -p "$UPLOAD_DIR" "$ROOT/logs"

echo "==> ensure-online @ $(date -Is)"
echo "==> repo=$ROOT"

need_frontend=0
need_rpc=0

if ! pm2 describe frontend >/dev/null 2>&1; then
  need_frontend=1
elif ! ss -lntp 2>/dev/null | grep -q ':3000'; then
  need_frontend=1
fi

if ! pm2 describe rpc >/dev/null 2>&1; then
  need_rpc=1
elif ! ss -lntp 2>/dev/null | grep -q ':3100'; then
  need_rpc=1
fi

if (( need_frontend == 1 )); then
  if [[ ! -f .next/standalone/server.js ]]; then
    echo "ERROR: missing .next/standalone/server.js — run: bash deploy/build-frontend.sh" >&2
    exit 2
  fi
  echo "==> (re)starting frontend"
  bash "$ROOT/deploy/start-frontend.sh" || {
    echo "ERROR: start-frontend.sh failed" >&2
    pm2 logs frontend --lines 40 --nostream || true
    exit 3
  }
fi

if (( need_rpc == 1 )); then
  echo "==> (re)starting rpc"
  pm2 delete rpc >/dev/null 2>&1 || true
  if command -v fuser >/dev/null 2>&1; then
    fuser -k 3100/tcp >/dev/null 2>&1 || true
  fi
  sleep 1
  UPLOAD_DIR="$UPLOAD_DIR" pm2 start "$ROOT/deploy/ecosystem.config.cjs" --only rpc
fi

pm2 save >/dev/null 2>&1 || true

echo "==> wait ports"
for i in $(seq 1 30); do
  ok_front=0
  ok_rpc=0
  ss -lntp 2>/dev/null | grep -q ':3000' && ok_front=1
  ss -lntp 2>/dev/null | grep -q ':3100' && ok_rpc=1
  if (( ok_front == 1 && ok_rpc == 1 )); then
    break
  fi
  sleep 1
done

front_code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' http://127.0.0.1:3000/ || true)"
rpc_code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' http://127.0.0.1:3100/healthz || true)"

echo "frontend HTTP:$front_code  rpc healthz:$rpc_code"
pm2 list

if [[ "$front_code" != "200" && "$front_code" != "304" && "$front_code" != "307" && "$front_code" != "308" ]]; then
  echo "ERROR: frontend not healthy" >&2
  pm2 logs frontend --lines 30 --nostream || true
  exit 4
fi

if [[ "$rpc_code" != "200" ]]; then
  echo "WARN: rpc /healthz not 200 (got $rpc_code) — check: pm2 logs rpc --lines 40" >&2
  # Still exit 0 if process is listening; healthz may be new
  if ! ss -lntp 2>/dev/null | grep -q ':3100'; then
    exit 5
  fi
fi

echo "==> online OK"
