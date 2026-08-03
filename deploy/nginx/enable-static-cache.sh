#!/usr/bin/env bash
# Patch live nginx: long-cache /_next/static without rewriting the whole site conf.
# Run: sudo bash deploy/nginx/enable-static-cache.sh
set -euo pipefail

SITE="${1:-/etc/nginx/sites-available/default}"
if [[ ! -f "$SITE" ]]; then
  echo "Site conf not found: $SITE"
  exit 1
fi

if grep -q 'location /_next/static/' "$SITE"; then
  echo "Already has /_next/static/ cache block — skip insert."
else
  BACKUP="${SITE}.bak.staticcache.$(date +%Y%m%d%H%M%S)"
  cp -a "$SITE" "$BACKUP"
  echo "Backup -> $BACKUP"

  # Insert before the final "location / {" that proxies to Next
  python3 - "$SITE" <<'PY'
import sys
path = sys.argv[1]
block = """
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
    }

"""
text = open(path, encoding='utf-8').read()
needle = '    location / {\n        proxy_pass http://127.0.0.1:3000;'
idx = text.rfind(needle)
if idx < 0:
    # try without exact spacing
    needle2 = 'location / {\n        proxy_pass http://127.0.0.1:3000;'
    idx = text.rfind(needle2)
    if idx < 0:
        raise SystemExit('Could not find Next location / block to insert before')
    text = text[:idx] + block + text[idx:]
else:
    text = text[:idx] + block + text[idx:]
open(path, 'w', encoding='utf-8').write(text)
print('Inserted /_next/static/ cache location')
PY
fi

nginx -t
systemctl reload nginx
echo "OK. Verify:"
echo "  curl -sI https://sourcingjewelry.com/_next/static/ | head -15"
