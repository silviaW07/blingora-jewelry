#!/usr/bin/env bash
# One-shot performance fix for sourcingjewelry.com
# 1) Referrer-Policy (fix alicdn 403)
# 2) /img-proxy + cache (rewrite RPC JSON to same-origin images)
# 3) Gzip types
# Run: sudo bash setup-perf.sh
set -euo pipefail

echo "==> cache dir"
mkdir -p /var/cache/nginx/img
chown -R www-data:www-data /var/cache/nginx/img 2>/dev/null || chown -R nginx:nginx /var/cache/nginx/img || true

echo "==> remove duplicate gzip snippet if present"
rm -f /etc/nginx/conf.d/gzip.conf

echo "==> proxy_cache_path"
cat > /etc/nginx/conf.d/00-img-proxy-cache.conf <<'EOF'
proxy_cache_path /var/cache/nginx/img levels=1:2 keys_zone=img_cache:64m
                 max_size=4g inactive=14d use_temp_path=off;
EOF

echo "==> enable gzip_types in nginx.conf (idempotent)"
# Uncomment common gzip_* lines if commented
sed -i -E 's/^(\s*)#\s*(gzip_vary on;)/\1\2/' /etc/nginx/nginx.conf || true
sed -i -E 's/^(\s*)#\s*(gzip_proxied any;)/\1\2/' /etc/nginx/nginx.conf || true
sed -i -E 's/^(\s*)#\s*(gzip_comp_level )[0-9]+;/\1gzip_comp_level 5;/' /etc/nginx/nginx.conf || true
sed -i -E 's/^(\s*)#\s*(gzip_types .+)/\1\2/' /etc/nginx/nginx.conf || true
# Ensure gzip on
grep -qE '^\s*gzip on;' /etc/nginx/nginx.conf || sed -i '/http {/a\    gzip on;' /etc/nginx/nginx.conf

BACKUP="/etc/nginx/sites-available/default.bak.perf.$(date +%Y%m%d%H%M%S)"
cp -a /etc/nginx/sites-available/default "$BACKUP"
echo "==> backup site -> $BACKUP"

# Keep existing SSL paths; write full site config
cat > /etc/nginx/sites-available/default <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name sourcingjewelry.com www.sourcingjewelry.com 8.221.118.113;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sourcingjewelry.com www.sourcingjewelry.com 8.221.118.113;

    ssl_certificate     /etc/nginx/ssl/sourcingjewelry.pem;
    ssl_certificate_key /etc/nginx/ssl/sourcingjewelry.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 50m;

    add_header Referrer-Policy "no-referrer" always;
    add_header X-Content-Type-Options nosniff always;

    location /img-proxy/cbu01/ {
        proxy_pass https://cbu01.alicdn.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host cbu01.alicdn.com;
        proxy_set_header Referer "";
        proxy_set_header User-Agent "Mozilla/5.0";
        proxy_hide_header Set-Cookie;
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
        proxy_cache img_cache;
        proxy_cache_valid 200 7d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        add_header X-Img-Cache $upstream_cache_status always;
        add_header Cache-Control "public, max-age=604800" always;
        expires 7d;
    }

    location /img-proxy/cbu02/ {
        proxy_pass https://cbu02.alicdn.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host cbu02.alicdn.com;
        proxy_set_header Referer "";
        proxy_set_header User-Agent "Mozilla/5.0";
        proxy_hide_header Set-Cookie;
        proxy_cache img_cache;
        proxy_cache_valid 200 7d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        add_header X-Img-Cache $upstream_cache_status always;
        expires 7d;
    }

    location /rpc/ {
        proxy_pass http://127.0.0.1:3100/rpc/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        # Allow sub_filter on JSON (disable upstream gzip for this location)
        proxy_set_header Accept-Encoding "";
        sub_filter_types application/json text/plain text/html;
        sub_filter_once off;
        sub_filter 'https://cbu01.alicdn.com/' 'https://$host/img-proxy/cbu01/';
        sub_filter 'https://cbu02.alicdn.com/' 'https://$host/img-proxy/cbu02/';
        sub_filter 'http://cbu01.alicdn.com/' 'https://$host/img-proxy/cbu01/';
        sub_filter 'http://cbu02.alicdn.com/' 'https://$host/img-proxy/cbu02/';
        sub_filter 'https://gw.alicdn.com/' 'https://$host/img-proxy/cbu01/';
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF

ln -sfn /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

echo "==> nginx -t"
nginx -t
systemctl reload nginx

echo "==> smoke tests"
curl -sI 'https://127.0.0.1/img-proxy/cbu01/img/ibank/O1CN01mjrWRF1npiSP1TtfD_!!2214558485139-0-cib.jpg' -k | head -12 || true
curl -sI 'https://sourcingjewelry.com/img-proxy/cbu01/img/ibank/O1CN01mjrWRF1npiSP1TtfD_!!2214558485139-0-cib.jpg' | head -12 || true
curl -sI https://sourcingjewelry.com/ | grep -iE 'HTTP/|referrer|content-encoding' || true

echo "OK. Open an incognito window and hard-refresh a product page."
echo "Expect img-proxy HTTP 200 (not Next.js 404) and Referrer-Policy: no-referrer"
