#!/usr/bin/env bash
# Provision one Frappe site per jamath (Cloud tenancy).
# Usage: bash scripts/cloud/provision_site.sh <slug> <admin-email> [admin-password]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
[[ -f .env ]] && set -a && source .env && set +a

SLUG="${1:?slug required e.g. panambur}"
EMAIL="${2:?admin email required}"
PASS="${3:-${ADMIN_PASSWORD:-changeme}}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-digitaljamath_admin}"
SITE_NAME="${SLUG}.digitaljamath.com"

echo "==> Provisioning Cloud site ${SITE_NAME} for ${EMAIL}"

docker compose exec -T backend bash -lc "
  cd /home/frappe/frappe-bench
  if [[ -f sites/${SITE_NAME}/site_config.json ]]; then
    echo 'Site already exists'
    exit 0
  fi
  bench new-site '${SITE_NAME}' \
    --mariadb-root-password '${MYSQL_ROOT_PASSWORD}' \
    --admin-password '${PASS}' \
    --no-mariadb-socket \
    --install-app erpnext
  echo digital_jamath >> sites/apps.txt 2>/dev/null || true
  bench --site '${SITE_NAME}' install-app digital_jamath || bench --site '${SITE_NAME}' migrate
"

# Record tenant map for portal routing
mkdir -p scripts/cloud/tenants
echo "{\"slug\":\"${SLUG}\",\"site\":\"${SITE_NAME}\",\"email\":\"${EMAIL}\",\"created\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  > "scripts/cloud/tenants/${SLUG}.json"

echo "==> Done. Map portal host ${SLUG} → site ${SITE_NAME}"
echo "    Admin: Administrator / (password you set)"
echo "    Notify: ${EMAIL}"
