#!/usr/bin/env bash
# Cloud control plane entry — provision + onboarding draft
# Usage: bash scripts/cloud/signup_provision.sh <slug> <email> [password]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
SLUG="${1:?}"
EMAIL="${2:?}"
PASS="${3:-}"
bash scripts/cloud/provision_site.sh "$SLUG" "$EMAIL" ${PASS:+"$PASS"}
bash scripts/agents/onboarding.sh "$SLUG" "$EMAIL"
echo "Tenant map: scripts/cloud/tenants/${SLUG}.json"
echo "Next: wire Razorpay/Stripe webhook to call this script on payment.captured"
