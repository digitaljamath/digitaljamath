#!/usr/bin/env bash
# Materialize sites/assets (Frappe image uses app public trees; host nginx cannot follow image paths).
# Always copies when source exists — recovers empty/partial assets volumes after restarts.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T backend bash -lc '
set -e
cd /home/frappe/frappe-bench/sites/assets
for app in frappe erpnext; do
  src="/home/frappe/frappe-bench/apps/${app}/${app}/public"
  if [[ ! -d "$src" ]]; then
    echo "skip $app (missing $src)" >&2
    continue
  fi
  echo "==> materialize $app"
  rm -rf "${app}.real" "$app"
  cp -a "$src" "${app}.real"
  mv "${app}.real" "$app"
  du -sh "$app"
done
# digital_jamath public (bind-mounted app)
if [[ -d /home/frappe/frappe-bench/apps/digital_jamath/digital_jamath/public ]]; then
  rm -rf digital_jamath
  cp -a /home/frappe/frappe-bench/apps/digital_jamath/digital_jamath/public digital_jamath
elif [[ -d /home/frappe/frappe-bench/apps/digital_jamath/public ]]; then
  rm -rf digital_jamath
  cp -a /home/frappe/frappe-bench/apps/digital_jamath/public digital_jamath
fi
du -sh digital_jamath 2>/dev/null || true
ls -la
test -f frappe/dist/css/login.bundle.*.css && echo LOGIN_CSS_OK || echo LOGIN_CSS_MISSING >&2
'
echo "Assets materialized under sites/assets volume"
