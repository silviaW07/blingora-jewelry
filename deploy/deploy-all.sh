#!/usr/bin/env bash
# One-command production deploy for blingora-jewelry.
#
# Runs the FULL, correct sequence so no step (especially `prisma generate`)
# is ever skipped again:
#   1. git pull (auto-stash local/build artifacts first)
#   2. pnpm install
#   3. prisma generate         <- regenerate client to match schema
#   4. prisma migrate deploy    <- apply pending DB migrations (idempotent)
#   5. build:server             <- rebuild RPC action bundle
#   6. restart rpc (:3100)
#   7. build-frontend.sh        <- rebuild + restart frontend (:3000) + smoke
#   8. health summary
#
# Usage:
#   bash deploy/deploy-all.sh
#
# Optional env toggles (set to 1 to skip a phase):
#   SKIP_PULL=1        skip git pull (deploy current working tree)
#   SKIP_INSTALL=1     skip pnpm install
#   SKIP_MIGRATE=1     skip `prisma migrate deploy`
#   SKIP_FRONTEND=1    skip frontend rebuild (backend-only deploy)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOAD_DIR="${UPLOAD_DIR:-/home/admin/my-website/uploads}"
export UPLOAD_DIR
export NODE_ENV=production
mkdir -p "$UPLOAD_DIR" "$ROOT/logs"

log() { echo -e "\n==> $*"; }

log "deploy-all @ $(date -Is)"
log "repo=$ROOT"

# ---- 1. git pull (auto-stash build artifacts / local edits) --------------
if [[ "${SKIP_PULL:-0}" != "1" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    STASH_MSG="deploy-all autostash $(date +%F_%T)"
    log "working tree dirty -> git stash push -u (\"$STASH_MSG\")"
    git stash push -u -m "$STASH_MSG" || true
  fi
  log "git pull --ff-only"
  git pull --ff-only
else
  log "SKIP_PULL=1 -> skipping git pull"
fi

# ---- 2. install ----------------------------------------------------------
if [[ "${SKIP_INSTALL:-0}" != "1" ]]; then
  log "pnpm install --frozen-lockfile"
  pnpm install --frozen-lockfile || pnpm install
else
  log "SKIP_INSTALL=1 -> skipping pnpm install"
fi

# ---- 3. prisma generate (NEVER skip — this is what breaks otherwise) -----
log "prisma generate"
pnpm exec prisma generate

# ---- 4. prisma migrate deploy -------------------------------------------
if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
  log "prisma migrate deploy"
  pnpm exec prisma migrate deploy
  # Guard: register writes customerType; missing column → opaque storefront 500
  # prisma db execute requires --schema or --url (does not inherit package.json prisma key)
  log "verify sysuser.customerType column"
  if ! pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
SELECT `customerType` FROM `sysuser` LIMIT 0;
SQL
  then
    echo "WARN: customerType check failed — trying to add column if missing..." >&2
    pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<'SQL' || true
ALTER TABLE `sysuser` ADD COLUMN `customerType` VARCHAR(20) NOT NULL DEFAULT 'NEW';
SQL
    if ! pnpm exec prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
SELECT `customerType` FROM `sysuser` LIMIT 0;
SQL
    then
      echo "ERROR: sysuser.customerType still missing after migrate — register will fail." >&2
      echo "  Fix: pnpm exec prisma migrate deploy" >&2
      echo "  Or:  ALTER TABLE sysuser ADD COLUMN customerType VARCHAR(20) NOT NULL DEFAULT 'NEW';" >&2
      exit 1
    fi
    echo "OK: customerType column is present"
  fi
else
  log "SKIP_MIGRATE=1 -> skipping prisma migrate deploy"
fi

# ---- 5. build RPC action bundle -----------------------------------------
log "pnpm run build:server"
pnpm run build:server

# ---- 6. (re)start rpc (:3100) via ecosystem -----------------------------
# 用 startOrReload + ecosystem 文件：每次都重新计算 ecosystem 里的 env
# （如 DATABASE_URL 连接池参数、FRONTEND_INSTANCES），否则 `restart --update-env`
# 只会沿用旧 env，导致连接池/实例数改动不生效。
log "pm2 startOrReload ecosystem --only rpc (re-reads env incl. DB pool params)"
UPLOAD_DIR="$UPLOAD_DIR" pm2 startOrReload "$ROOT/deploy/ecosystem.config.cjs" --only rpc --update-env
pm2 save >/dev/null 2>&1 || true

# ---- 7. frontend rebuild + restart (:3000) ------------------------------
if [[ "${SKIP_FRONTEND:-0}" != "1" ]]; then
  log "bash deploy/build-frontend.sh"
  bash "$ROOT/deploy/build-frontend.sh"
else
  log "SKIP_FRONTEND=1 -> skipping frontend rebuild"
fi

# ---- 8. health summary ---------------------------------------------------
log "wait for ports"
for i in $(seq 1 30); do
  ok_rpc=0; ok_front=0
  if ss -lntp 2>/dev/null | grep -q ':3100'; then ok_rpc=1; fi
  if [[ "${SKIP_FRONTEND:-0}" == "1" ]]; then
    ok_front=1
  elif ss -lntp 2>/dev/null | grep -q ':3000'; then
    ok_front=1
  fi
  if (( ok_rpc == 1 && ok_front == 1 )); then break; fi
  sleep 1
done

rpc_code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' http://127.0.0.1:3100/healthz || true)"
front_code="skipped"
if [[ "${SKIP_FRONTEND:-0}" != "1" ]]; then
  front_code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' http://127.0.0.1:3000/ || true)"
fi

log "health: rpc healthz=$rpc_code  frontend home=$front_code"
pm2 list

if [[ "$rpc_code" != "200" ]]; then
  echo "WARN: rpc /healthz not 200 (got $rpc_code) — check: pm2 logs rpc --lines 40" >&2
fi
if [[ "${SKIP_FRONTEND:-0}" != "1" && "$front_code" != "200" && "$front_code" != "307" && "$front_code" != "308" ]]; then
  echo "ERROR: frontend not healthy (got $front_code) — check: pm2 logs frontend --lines 40" >&2
  exit 1
fi

log "deploy-all done"
