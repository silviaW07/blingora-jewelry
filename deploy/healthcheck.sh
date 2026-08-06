#!/usr/bin/env bash
# Periodic health check for production frontend.
# Install: crontab -e
#   */2 * * * * /home/admin/my-website/blingora-jewelry/deploy/healthcheck.sh >> /home/admin/my-website/blingora-jewelry/logs/healthcheck.log 2>&1
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCK="/tmp/blingora-frontend-health.lock"
URL="${HEALTHCHECK_URL:-http://127.0.0.1:3000/}"
MAX_FAILS="${HEALTHCHECK_MAX_FAILS:-2}"
STATE_FILE="/tmp/blingora-frontend-health.fails"

mkdir -p "$ROOT/logs"

if [[ -f "$LOCK" ]]; then
  # stale lock older than 5 minutes → remove
  if find "$LOCK" -mmin +5 | grep -q .; then
    rm -f "$LOCK"
  else
    exit 0
  fi
fi
echo $$ >"$LOCK"
trap 'rm -f "$LOCK"' EXIT

code="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL" || true)"
if [[ "$code" == "200" || "$code" == "304" || "$code" == "307" || "$code" == "308" ]]; then
  echo 0 >"$STATE_FILE"
  exit 0
fi

fails=0
[[ -f "$STATE_FILE" ]] && fails="$(cat "$STATE_FILE" 2>/dev/null || echo 0)"
fails=$((fails + 1))
echo "$fails" >"$STATE_FILE"
echo "$(date -Is) HEALTH FAIL code=$code fails=$fails"

if (( fails < MAX_FAILS )); then
  exit 1
fi

echo "$(date -Is) restarting frontend via PM2"
pm2 describe frontend >/dev/null 2>&1 && pm2 restart frontend --update-env || \
  UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}" pm2 start "$ROOT/deploy/ecosystem.config.cjs" --only frontend

# give it a moment then reset counter only if recovered
sleep 5
code2="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL" || true)"
echo "$(date -Is) after restart code=$code2"
if [[ "$code2" == "200" || "$code2" == "304" || "$code2" == "307" || "$code2" == "308" ]]; then
  echo 0 >"$STATE_FILE"
fi
