#!/usr/bin/env bash
# Generate the Prisma client + native (Linux) query engine into
# prisma-generated/client. The committed client only ships a Windows engine,
# and because that directory is git-tracked it gets reverted to the committed
# (Windows) copy on every fresh checkout — so this must run after checkout
# (from start.sh), not only once at install time.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ENGINE="prisma-generated/client/libquery_engine-debian-openssl-3.0.x.so.node"
if [ "${1:-}" = "--if-missing" ] && [ -f "$ENGINE" ]; then
  echo "[prisma] Linux engine already present, skipping generate"
  exit 0
fi

GEN_SCHEMA="prisma/.cloud-agent-generate.prisma"
sed -E 's|^([[:space:]]*)provider = "prisma-client-js"[[:space:]]*$|\1provider = "prisma-client-js"\n\1output = "../prisma-generated/client"\n\1binaryTargets = ["native", "debian-openssl-3.0.x"]|' \
  prisma/schema.prisma > "$GEN_SCHEMA"
npx prisma generate --schema "$GEN_SCHEMA"
rm -f "$GEN_SCHEMA"
