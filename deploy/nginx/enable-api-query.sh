#!/usr/bin/env bash
# Patch live nginx: add /api/query/ (same proxy as /rpc/) without rewriting the whole site conf.
# Chrome adblockers often stall /rpc/; the storefront client now posts to /api/query/.
# Run: sudo bash deploy/nginx/enable-api-query.sh
set -euo pipefail

SITE="${1:-/etc/nginx/sites-available/default}"
if [[ ! -f "$SITE" ]]; then
  echo "Site conf not found: $SITE"
  exit 1
fi

if grep -q 'location /api/query/' "$SITE"; then
  echo "Already has /api/query/ — skip insert."
else
  BACKUP="${SITE}.bak.apiquery.$(date +%Y%m%d%H%M%S)"
  cp -a "$SITE" "$BACKUP"
  echo "Backup -> $BACKUP"

  python3 - "$SITE" <<'PY'
import sys
path = sys.argv[1]
block = """
    # Same as /rpc/ but a path Chrome adblockers are less likely to filter
    location /api/query/ {
        proxy_pass http://127.0.0.1:3100/rpc/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;

        sub_filter_types application/json text/plain text/html;
        sub_filter_once off;
        sub_filter 'https://cbu01.alicdn.com/' 'https://$host/img-proxy/cbu01/';
        sub_filter 'https://cbu02.alicdn.com/' 'https://$host/img-proxy/cbu02/';
        sub_filter 'http://cbu01.alicdn.com/' 'https://$host/img-proxy/cbu01/';
        sub_filter 'http://cbu02.alicdn.com/' 'https://$host/img-proxy/cbu02/';
        sub_filter 'https://gw.alicdn.com/' 'https://$host/img-proxy/gw/';
        proxy_set_header Accept-Encoding "";
    }

"""
text = open(path, encoding='utf-8').read()
needle = '    location /rpc/'
idx = text.find(needle)
if idx < 0:
    needle = 'location /rpc/'
    idx = text.find(needle)
    if idx < 0:
        raise SystemExit('Could not find location /rpc/ to insert before')
text = text[:idx] + block + text[idx:]
open(path, 'w', encoding='utf-8').write(text)
print('Inserted /api/query/ location')
PY
fi

nginx -t
systemctl reload nginx
echo "OK. Verify:"
echo "  curl -sI https://sourcingjewelry.com/api/query/ | head -15"
