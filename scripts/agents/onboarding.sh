#!/usr/bin/env bash
# Agent: onboarding — draft welcome email after Cloud provision
# Usage: bash scripts/agents/onboarding.sh <slug> <email>
set -euo pipefail
SLUG="${1:?slug}"
EMAIL="${2:?email}"
SITE="${SLUG}.digitaljamath.com"
OUT="scripts/agents/out/onboarding-${SLUG}.md"
mkdir -p scripts/agents/out
cat > "$OUT" <<EOF
# Onboarding draft — ${SLUG}

To: ${EMAIL}
Subject: Your Digital Jamath Cloud site is ready

Assalamu alaikum,

Your jamath site is live:

- Desk: https://${SITE}
- Member portal: point NEXT_PUBLIC_FRAPPE_URL at https://${SITE}

Community Edition remains free to self-host anytime:
https://github.com/digitaljamath/digitaljamath

Was-salam,
Digital Jamath Cloud
EOF
echo "Wrote $OUT"
