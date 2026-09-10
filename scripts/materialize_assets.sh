#!/usr/bin/env bash
# Materialize sites/assets (Frappe uses symlinks into the image; host nginx cannot follow them).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T backend bash -lc '
set -e
cd /home/frappe/frappe-bench/sites/assets
for app in frappe erpnext; do
  if [[ -L "$app" || -d "$app" ]]; then
    rm -rf "${app}.real"
    cp -a "/home/frappe/frappe-bench/apps/${app}/${app}/public" "${app}.real"
    rm -rf "$app"
    mv "${app}.real" "$app"
  fi
done
# optional digital_jamath public if present
if [[ -d /home/frappe/frappe-bench/apps/digital_jamath/digital_jamath/public ]]; then
  rm -rf digital_jamath
  cp -a /home/frappe/frappe-bench/apps/digital_jamath/digital_jamath/public digital_jamath
elif [[ -d /home/frappe/frappe-bench/apps/digital_jamath/public ]]; then
  rm -rf digital_jamath
  cp -a /home/frappe/frappe-bench/apps/digital_jamath/public digital_jamath
fi
ls -la
'
echo "Assets materialized under sites volume"
