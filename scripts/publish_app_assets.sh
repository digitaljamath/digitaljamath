#!/usr/bin/env bash
# Copy digital_jamath public assets into the Frappe assets volume (symlinks break host nginx).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T backend bash -lc '
set -e
SRC=/home/frappe/frappe-bench/apps/digital_jamath/public
DEST=/home/frappe/frappe-bench/sites/assets/digital_jamath
if [[ ! -d "$SRC" ]]; then
  # package layout without nested public at app root
  SRC=/home/frappe/frappe-bench/apps/digital_jamath/digital_jamath/public
fi
mkdir -p "$DEST"
rm -rf "$DEST"/*
cp -a "$SRC/." "$DEST/"
# ensure CSS/JS/images readable
find "$DEST" -type f -exec chmod 644 {} \;
ls -laR "$DEST" | head -40
'
echo "digital_jamath assets published"
