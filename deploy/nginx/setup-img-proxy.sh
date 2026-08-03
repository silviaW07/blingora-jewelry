#!/usr/bin/env bash
# Install Nginx image proxy cache + site config for alicdn hotlink bypass.
# Run on server as root.
set -euo pipefail

mkdir -p /var/cache/nginx/img
chown -R www-data:www-data /var/cache/nginx/img 2>/dev/null || chown -R nginx:nginx /var/cache/nginx/img 2>/dev/null || true

cat > /etc/nginx/conf.d/00-img-proxy-cache.conf <<'EOF'
# Shared image cache for /img-proxy/*
proxy_cache_path /var/cache/nginx/img levels=1:2 keys_zone=img_cache:64m
                 max_size=4g inactive=14d use_temp_path=off;
EOF

SITE_SRC="$(cd "$(dirname "$0")" && pwd)/sourcingjewelry.com.conf"
if [[ -f "$SITE_SRC" ]]; then
  cp -a /etc/nginx/sites-available/default "/etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)" || true
  cp -f "$SITE_SRC" /etc/nginx/sites-available/default
  ln -sfn /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl reload nginx

echo "OK: image proxy ready"
echo "Test:"
echo "  curl -I 'https://sourcingjewelry.com/img-proxy/cbu01/img/ibank/O1CN01mjrWRF1npiSP1TtfD_!!2214558485139-0-cib.jpg'"
echo "  (expect HTTP 200 and later X-Img-Cache: HIT)"
