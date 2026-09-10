#!/usr/bin/env bash
# Bootstrap Frappe site + install ERPNext + digital_jamath
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
fi

SITE_NAME="${SITE_NAME:-app.digitaljamath.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-digitaljamath_admin}"
BACKEND="${BACKEND_SERVICE:-backend}"

echo "==> Waiting for MariaDB..."
for i in $(seq 1 60); do
  if docker compose exec -T mariadb healthcheck.sh --connect --innodb_initialized 2>/dev/null; then
    break
  fi
  sleep 2
  if [[ $i -eq 60 ]]; then
    echo "MariaDB not ready" >&2
    exit 1
  fi
done

echo "==> Ensuring digital_jamath is on the bench apps path..."
docker compose exec -T "$BACKEND" bash -lc '
  if [[ ! -e /home/frappe/frappe-bench/apps/digital_jamath/setup.py ]] && [[ ! -e /home/frappe/frappe-bench/apps/digital_jamath/pyproject.toml ]]; then
    echo "digital_jamath mount missing" >&2
    exit 1
  fi
  cd /home/frappe/frappe-bench
  if ! bench --site all list-apps 2>/dev/null | head -1 >/dev/null; then
    true
  fi
'

SITE_EXISTS=$(docker compose exec -T "$BACKEND" bash -lc "ls sites/${SITE_NAME}/site_config.json 2>/dev/null && echo yes || echo no" | tr -d '\r')

if [[ "$SITE_EXISTS" != *"yes"* ]]; then
  echo "==> Creating site ${SITE_NAME}..."
  docker compose exec -T "$BACKEND" bash -lc "
    cd /home/frappe/frappe-bench
    bench new-site '${SITE_NAME}' \
      --mariadb-root-password '${MYSQL_ROOT_PASSWORD}' \
      --admin-password '${ADMIN_PASSWORD}' \
      --no-mariadb-socket \
      --install-app erpnext
  "
else
  echo "==> Site ${SITE_NAME} already exists"
fi

echo "==> Installing digital_jamath..."
docker compose exec -T "$BACKEND" bash -lc "
  cd /home/frappe/frappe-bench
  echo /home/frappe/frappe-bench/apps > env/lib/python3.11/site-packages/dj_apps.pth
  printf 'frappe\nerpnext\ndigital_jamath\n' > sites/apps.txt
  if [[ ! -f sites/${SITE_NAME}/site_config.json ]]; then
    bench new-site '${SITE_NAME}' \
      --db-host mariadb \
      --db-port 3306 \
      --db-root-password '${MYSQL_ROOT_PASSWORD}' \
      --admin-password '${ADMIN_PASSWORD}' \
      --no-mariadb-socket \
      --set-default \
      --install-app erpnext
  fi
  python3 - <<'PY'
import json
p='sites/${SITE_NAME}/site_config.json'
cfg=json.load(open(p))
cfg['db_host']='mariadb'
cfg['db_port']=3306
json.dump(cfg, open(p,'w'), indent=1)
PY
  bench --site '${SITE_NAME}' install-app digital_jamath || bench --site '${SITE_NAME}' migrate
  bench use '${SITE_NAME}'
"

echo "==> Bootstrap complete for ${SITE_NAME}"
echo "    Desk: http://127.0.0.1:8000 (Host: ${SITE_NAME})"
