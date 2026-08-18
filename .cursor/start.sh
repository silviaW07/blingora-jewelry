#!/usr/bin/env bash
# Cloud Agent start script: bring up MariaDB on every boot, then return.
# The seeded data lives in /var/lib/mysql (captured in the environment snapshot).
set -euo pipefail

sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

if ! sudo mysqladmin ping >/dev/null 2>&1; then
  sudo bash -c 'nohup mariadbd --user=mysql >/var/log/mariadb.log 2>&1 &'
fi

for _ in $(seq 1 60); do
  if sudo mysqladmin ping >/dev/null 2>&1; then
    echo "[start] MariaDB is up"
    exit 0
  fi
  sleep 1
done

echo "[start] MariaDB failed to start" >&2
sudo tail -n 50 /var/log/mariadb.log >&2 || true
exit 1
