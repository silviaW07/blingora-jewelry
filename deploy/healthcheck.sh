#!/usr/bin/env bash
# Periodic health check for production frontend (:3000) + rpc (:3100).
# Install: crontab -e
#   */2 * * * * /home/admin/my-website/blingora-jewelry/deploy/healthcheck.sh >> /home/admin/my-website/blingora-jewelry/logs/healthcheck.log 2>&1
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCK="/tmp/blingora-health.lock"
FRONT_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3000/}"
RPC_URL="${HEALTHCHECK_RPC_URL:-http://127.0.0.1:3100/healthz}"
MAX_FAILS="${HEALTHCHECK_MAX_FAILS:-2}"
STATE_FILE="/tmp/blingora-health.fails"

mkdir -p "$ROOT/logs"

if [[ -f "$LOCK" ]]; then
  if find "$LOCK" -mmin +5 | grep -q .; then
    rm -f "$LOCK"
  else
    exit 0
  fi
fi
echo $$ >"$LOCK"
trap 'rm -f "$LOCK"' EXIT

front_code="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$FRONT_URL" || true)"
rpc_code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$RPC_URL" || true)"

front_ok=0
rpc_ok=0
[[ "$front_code" == "200" || "$front_code" == "304" || "$front_code" == "307" || "$front_code" == "308" ]] && front_ok=1
[[ "$rpc_code" == "200" ]] && rpc_ok=1
# rpc without healthz yet but port open → treat as ok
if (( rpc_ok == 0 )) && ss -lntp 2>/dev/null | grep -q ':3100'; then
  rpc_ok=1
fi

if (( front_ok == 1 && rpc_ok == 1 )); then
  echo 0 >"$STATE_FILE"
  exit 0
fi

fails=0
[[ -f "$STATE_FILE" ]] && fails="$(cat "$STATE_FILE" 2>/dev/null || echo 0)"
fails=$((fails + 1))
echo "$fails" >"$STATE_FILE"
echo "$(date -Is) HEALTH FAIL front=$front_code rpc=$rpc_code fails=$fails"

if (( fails < MAX_FAILS )); then
  exit 1
fi

echo "$(date -Is) recovering via ensure-online.sh"
bash "$ROOT/deploy/ensure-online.sh" || true

sleep 5
front2="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$FRONT_URL" || true)"
rpc2="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$RPC_URL" || true)"
echo "$(date -Is) after recover front=$front2 rpc=$rpc2"
if [[ "$front2" == "200" || "$front2" == "304" || "$front2" == "307" || "$front2" == "308" ]]; then
  echo 0 >"$STATE_FILE"
fi
