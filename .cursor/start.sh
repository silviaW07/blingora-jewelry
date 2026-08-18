#!/usr/bin/env bash
# Cloud Agent start script (runs per boot, after the repo checkout):
#   1. Bring up MariaDB (seeded data lives in /var/lib/mysql from the snapshot).
#   2. Regenerate the Prisma Linux engine, since the git-tracked
#      prisma-generated/client is reverted to its Windows-only copy on checkout.
# Must return once services are ready.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# mariadbd binds its socket in /run/mysqld; on some images /var/run is not a
# symlink to /run, so create both.
sudo mkdir -p /run/mysqld /var/run/mysqld
sudo chown mysql:mysql /run/mysqld /var/run/mysqld

if ! sudo mysqladmin ping >/dev/null 2>&1; then
  sudo bash -c 'nohup mariadbd --user=mysql >/var/log/mariadb.log 2>&1 &'
fi

up=0
for _ in $(seq 1 60); do
  if sudo mysqladmin ping >/dev/null 2>&1; then up=1; break; fi
  sleep 1
done
if [ "$up" != "1" ]; then
  echo "[start] MariaDB failed to start" >&2
  sudo tail -n 50 /var/log/mariadb.log >&2 || true
  exit 1
fi
echo "[start] MariaDB is up"

# Ensure the Prisma Linux query engine exists after checkout.
bash .cursor/gen-prisma-client.sh --if-missing

echo "[start] ready"
