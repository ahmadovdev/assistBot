#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[deploy] Building application..."
pnpm build

if [[ ! -f dist/main.js ]]; then
  echo "[deploy] dist/main.js was not created; refusing to reload PM2." >&2
  exit 1
fi

echo "[deploy] Reloading PM2 after successful build..."
pm2 reload ecosystem.config.js --update-env

echo "[deploy] Done."
