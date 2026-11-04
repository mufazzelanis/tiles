#!/usr/bin/env bash
# Deploy to the cPanel host (Namecheap, Passenger + Node.js 22):  bash scripts/deploy.sh
#
# Builds locally (the shared host has too little memory to build), uploads the build,
# installs dependencies on the server only when package-lock.json changed, then restarts.
# Never touches the live database, the server's .env or uploaded media (data/).
set -euo pipefail

HOST="udhbdtpa@104.207.79.166"
PORT=21098
KEY="$HOME/.ssh/udh_deploy"
APP="udh-app"
DOMAIN="udhbd.com"
SSH=(ssh -i "$KEY" -p "$PORT" -o IdentitiesOnly=yes -o BatchMode=yes "$HOST")

cd "$(dirname "$0")/.."

echo "› Building…"
# static pages (sitemap, robots, share previews) bake the site address in at build time
SITE_URL="https://$DOMAIN" npm run build

echo "› Packaging…"
PKG="$(mktemp -d)/release.tgz"
tar -czf "$PKG" --exclude=.next/dev --exclude=.next/cache .next public package.json package-lock.json next.config.mjs server.js

echo "› Uploading ($(du -h "$PKG" | cut -f1))…"
scp -i "$KEY" -P "$PORT" -o IdentitiesOnly=yes -o BatchMode=yes "$PKG" "$HOST:$APP/tmp/release.tgz"
rm -f "$PKG"

echo "› Installing on the server…"
"${SSH[@]}" "set -e
  cd ~/$APP
  old_lock=\$(md5sum package-lock.json 2>/dev/null | cut -d' ' -f1 || true)
  rm -rf .next.prev && mv .next .next.prev
  tar -xzf tmp/release.tgz && rm tmp/release.tgz
  if [ \"\$old_lock\" != \"\$(md5sum package-lock.json | cut -d' ' -f1)\" ]; then
    echo '  dependencies changed — installing (a few minutes)…'
    cloudlinux-selector install-modules --json --interpreter nodejs --app-root $APP >/dev/null 2>&1 || true
  fi
  : > stderr.log
  cloudlinux-selector restart --json --interpreter nodejs --app-root $APP >/dev/null
  rm -rf .next.prev"

echo "› Checking the live site…"
sleep 3
code=$(curl -sk --resolve "$DOMAIN:443:${HOST#*@}" -o /dev/null -w '%{http_code}' "https://$DOMAIN/" -m 90 || true)
errors=$("${SSH[@]}" "cat ~/$APP/stderr.log")
if [ "$code" = 200 ] && [ -z "$errors" ]; then
  echo "✓ Deployed — https://$DOMAIN is up."
else
  echo "✗ Home page returned $code"
  [ -n "$errors" ] && echo "Server log:" && echo "$errors" | tail -20
  exit 1
fi
