#!/usr/bin/env bash
# Block mainland China (CN) access via Nginx GeoIP.
# Run on the server as root / sudo.
set -euo pipefail

echo "==> Install GeoIP module + database"
apt-get update -y
apt-get install -y geoip-database libnginx-mod-http-geoip || apt-get install -y nginx-module-geoip geoip-database

GEO_DAT=""
for p in \
  /usr/share/GeoIP/GeoIP.dat \
  /usr/share/GeoIP/GeoLiteCountry.dat \
  /var/lib/GeoIP/GeoIP.dat
do
  if [[ -f "$p" ]]; then GEO_DAT="$p"; break; fi
done

if [[ -z "$GEO_DAT" ]]; then
  echo "GeoIP.dat not found. Install geoip-database or place GeoIP.dat under /usr/share/GeoIP/"
  exit 1
fi
echo "Using GeoIP DB: $GEO_DAT"

echo "==> Write /etc/nginx/conf.d/00-geoip-cn-block.conf"
cat > /etc/nginx/conf.d/00-geoip-cn-block.conf <<EOF
# Loaded in http{} context via conf.d
geoip_country $GEO_DAT;

# 1 = deny mainland China
map \$geoip_country_code \$deny_mainland_cn {
    default 0;
    CN      1;
}
EOF

SITE_SRC="$(cd "$(dirname "$0")" && pwd)/sourcingjewelry.com.conf"
if [[ -f "$SITE_SRC" ]]; then
  cp -a /etc/nginx/sites-available/default "/etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)" || true
  cp -f "$SITE_SRC" /etc/nginx/sites-available/default
  ln -sfn /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
fi

# Ensure module is loaded (Debian/Ubuntu package usually drops a conf into modules-enabled)
if [[ -d /etc/nginx/modules-enabled ]] && ! ls /etc/nginx/modules-enabled/*geoip* >/dev/null 2>&1; then
  echo "WARNING: geoip module may not be enabled under /etc/nginx/modules-enabled"
fi

nginx -t
systemctl reload nginx

echo "OK: mainland China (CN) clients should receive HTTP 403."
echo "Test from overseas / VPN: curl -I https://sourcingjewelry.com/"
echo "To temporarily allow your IP while in China, add: allow YOUR.IP.HERE; before deny logic in the site config."
