#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
[[ -f .env ]] && set -a && source .env && set +a
SITE_NAME="${SITE_NAME:-app.digitaljamath.com}"
docker compose exec -T backend bench --site "$SITE_NAME" \
  execute digital_jamath.baitul_maal.coa_template.apply_masjid_coa
echo "Masjid COA seed requested for ${SITE_NAME}"
