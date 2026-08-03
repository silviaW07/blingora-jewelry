#!/usr/bin/env bash
# Apply Nginx HTTPS config for sourcingjewelry.com
# Certs already on server:
#   /etc/nginx/ssl/sourcingjewelry.pem
#   /etc/nginx/ssl/sourcingjewelry.key
#
# Run on the server as root:
#   bash setup-ssl.sh
# Or with custom paths:
#   bash setup-ssl.sh /etc/nginx/ssl/sourcingjewelry.pem /etc/nginx/ssl/sourcingjewelry.key
set -euo pipefail

PEM_SRC="${1:-/etc/nginx/ssl/sourcingjewelry.pem}"
KEY_SRC="${2:-/etc/nginx/ssl/sourcingjewelry.key}"
DOMAIN="sourcingjewelry.com"
SSL_DIR="/etc/nginx/ssl"
SITE_AVAILABLE="/etc/nginx/sites-available/default"
CONF_SRC="$(cd "$(dirname "$0")" && pwd)/sourcingjewelry.com.conf"

if [[ ! -f "$PEM_SRC" ]]; then
  echo "PEM not found: $PEM_SRC"
  exit 1
fi
if [[ ! -f "$KEY_SRC" ]]; then
  echo "KEY not found: $KEY_SRC"
  exit 1
fi
if [[ ! -f "$CONF_SRC" ]]; then
  echo "Nginx conf not found: $CONF_SRC"
  exit 1
fi

mkdir -p "$SSL_DIR"
chmod 600 "$KEY_SRC" || true
chmod 644 "$PEM_SRC" || true

# Backup then write sites-available/default
if [[ -f "$SITE_AVAILABLE" ]]; then
  cp -a "$SITE_AVAILABLE" "${SITE_AVAILABLE}.bak.$(date +%Y%m%d%H%M%S)"
fi
cp -f "$CONF_SRC" "$SITE_AVAILABLE"

# Ensure default is enabled
if [[ -d /etc/nginx/sites-enabled ]]; then
  ln -sfn "$SITE_AVAILABLE" /etc/nginx/sites-enabled/default
fi

# Open firewall if ufw present
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "OK: HTTPS configured for https://${DOMAIN}"
echo "Cert: $PEM_SRC"
echo "Key:  $KEY_SRC"
echo "Site: $SITE_AVAILABLE"
echo "Test: curl -I https://${DOMAIN}"
