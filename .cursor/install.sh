#!/usr/bin/env bash
# Cloud Agent install script for the Blingora storefront.
# Idempotent: safe to run repeatedly. Runs once per environment build to
# produce the base snapshot (MariaDB installed + seeded, deps installed,
# Prisma client generated). Per-boot service startup lives in start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DB_NAME="PROJ_fcb9e6ee_snap_20260726_092922_893"
DB_PASS="LocalDev123!"
DB_URL="mysql://root:${DB_PASS}@127.0.0.1:3306/${DB_NAME}"
MARKER="/var/lib/mysql/.cloud-agent-initialized"

# Non-interactive package manager behavior (no TTY during builds).
export CI=true

echo "[install] 1/6 Installing MariaDB server/client (if missing)"
if ! command -v mariadbd >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server mariadb-client
fi

echo "[install] configuring MariaDB (case-insensitive table names, localhost bind)"
sudo tee /etc/mysql/mariadb.conf.d/99-cloud-agent.cnf >/dev/null <<'CNF'
[mysqld]
lower_case_table_names=1
bind-address=127.0.0.1
skip-name-resolve
CNF

# mariadbd binds its socket in /run/mysqld; on some images /var/run is not a
# symlink to /run, so create both.
sudo mkdir -p /run/mysqld /var/run/mysqld
sudo chown mysql:mysql /run/mysqld /var/run/mysqld

echo "[install] 2/6 Initializing data directory (first build only)"
if [ ! -f "$MARKER" ]; then
  # Stop any server that may be holding the data dir before wiping it.
  sudo mysqladmin -u root -p"$DB_PASS" shutdown >/dev/null 2>&1 || sudo mysqladmin shutdown >/dev/null 2>&1 || true
  sleep 2
  sudo rm -rf /var/lib/mysql
  sudo mkdir -p /var/lib/mysql
  sudo chown mysql:mysql /var/lib/mysql
  sudo mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/tmp/mariadb-install-db.log 2>&1
fi

echo "[install] starting MariaDB"
if ! sudo mysqladmin ping >/dev/null 2>&1; then
  sudo bash -c 'nohup mariadbd --user=mysql >/var/log/mariadb-install.log 2>&1 &'
fi
for _ in $(seq 1 60); do sudo mysqladmin ping >/dev/null 2>&1 && break; sleep 1; done
sudo mysqladmin ping >/dev/null 2>&1 || { echo "[install] MariaDB failed to start"; sudo tail -n 50 /var/log/mariadb-install.log || true; exit 1; }

echo "[install] configuring root user + granting TCP access"
cat > /tmp/cloud-agent-root-setup.sql <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${DB_PASS}');
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
# Fresh data dir: root@localhost uses unix_socket (sudo). After the password is
# set (reruns), fall back to a TCP login with the password.
sudo mysql < /tmp/cloud-agent-root-setup.sql 2>/dev/null \
  || mysql -h 127.0.0.1 -u root -p"$DB_PASS" < /tmp/cloud-agent-root-setup.sql
rm -f /tmp/cloud-agent-root-setup.sql

echo "[install] writing .env (DATABASE_URL)"
printf 'DATABASE_URL="%s"\n' "${DB_URL}" > "${REPO_ROOT}/.env"

echo "[install] 3/6 Installing Node dependencies (pnpm)"
pnpm install --frozen-lockfile

echo "[install] 4/6 Generating Prisma client + Linux query engine into prisma-generated/client"
# NOTE: prisma-generated/client is git-tracked and ships only a Windows engine,
# so a fresh checkout reverts it. start.sh regenerates it per boot; this run is
# for local/first-build convenience.
bash .cursor/gen-prisma-client.sh

echo "[install] 5/6 Applying latest schema + seeding data"
export DATABASE_URL="${DB_URL}"

# Fresh main DB (latest schema) + temp DB for the committed snapshot dump.
mysql -h 127.0.0.1 -u root -p"$DB_PASS" <<SQL
DROP DATABASE IF EXISTS \`${DB_NAME}\`;
CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP DATABASE IF EXISTS \`snap_src\`;
CREATE DATABASE \`snap_src\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

# Build the current Prisma schema in the (empty) main DB.
npx prisma db push --skip-generate

# Load the committed snapshot (structure + data) into the temp DB. The dump is
# older than the current schema, so we copy its rows into the latest-schema
# tables using only the columns common to both.
mysql -h 127.0.0.1 -u root -p"$DB_PASS" snap_src < prisma/database.sql

mysql -h 127.0.0.1 -u root -p"$DB_PASS" -N > /tmp/cloud-agent-copy.sql <<SQL
SELECT CONCAT('INSERT INTO \`${DB_NAME}\`.\`', t, '\` (', cols, ') SELECT ', cols, ' FROM \`snap_src\`.\`', t, '\`;')
FROM (
  SELECT s.TABLE_NAME t,
         GROUP_CONCAT(CONCAT('\`', s.COLUMN_NAME, '\`') ORDER BY s.ORDINAL_POSITION) cols
  FROM information_schema.COLUMNS s
  JOIN information_schema.COLUMNS m
    ON m.TABLE_SCHEMA='${DB_NAME}' AND m.TABLE_NAME=s.TABLE_NAME AND m.COLUMN_NAME=s.COLUMN_NAME
  WHERE s.TABLE_SCHEMA='snap_src'
    AND s.TABLE_NAME IN (SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}')
  GROUP BY s.TABLE_NAME
) x;
SQL

{ echo "SET FOREIGN_KEY_CHECKS=0;"; cat /tmp/cloud-agent-copy.sql; echo "SET FOREIGN_KEY_CHECKS=1;"; } \
  | mysql -h 127.0.0.1 -u root -p"$DB_PASS"
mysql -h 127.0.0.1 -u root -p"$DB_PASS" -e "DROP DATABASE snap_src;"
rm -f /tmp/cloud-agent-copy.sql

sudo touch "$MARKER"
echo "[install] 6/6 Done — database seeded and dev toolchain ready."
