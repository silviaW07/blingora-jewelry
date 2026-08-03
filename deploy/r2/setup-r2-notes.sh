#!/usr/bin/env bash
# Optional Phase B: mirror alicdn images into Cloudflare R2 for overseas CDN.
# Prerequisites:
#   1. Cloudflare account → R2 → Create bucket (e.g. sourcingjewelry-img)
#   2. Enable public access OR custom domain: img.sourcingjewelry.com → R2
#   3. Create R2 API token with Object Read & Write
#   4. Install: npm i -g wrangler   OR use AWS CLI with R2 endpoint
#
# Env:
#   export CLOUDFLARE_ACCOUNT_ID=...
#   export R2_BUCKET=sourcingjewelry-img
#   export AWS_ACCESS_KEY_ID=...      # R2 token
#   export AWS_SECRET_ACCESS_KEY=...
#   export R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
#
# Example upload one object (key mirrors img-proxy path):
#   KEY="cbu01/img/ibank/O1CN01xxx.jpg_400x400q80.jpg"
#   curl -fsSL "https://cbu01.alicdn.com/img/ibank/O1CN01xxx.jpg_400x400q80.jpg" -o /tmp/img.jpg
#   aws s3 cp /tmp/img.jpg "s3://${R2_BUCKET}/${KEY}" --endpoint-url "$R2_ENDPOINT"
#
# Then set on the app server .env:
#   NEXT_PUBLIC_IMAGE_CDN_BASE=https://img.sourcingjewelry.com
#
# Frontend toProxiedImageUrl will prefer CDN when that env is set (see code).

set -euo pipefail
echo "See comments in this script for R2 setup. Phase A (img-proxy + size) does not need R2."
echo "After R2 public domain works, set NEXT_PUBLIC_IMAGE_CDN_BASE and rebuild next."
