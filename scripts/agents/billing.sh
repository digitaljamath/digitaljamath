#!/usr/bin/env bash
# Agent: billing — renewal / dunning draft
set -euo pipefail
SLUG="${1:-example}"
mkdir -p scripts/agents/out
OUT="scripts/agents/out/billing-${SLUG}.md"
cat > "$OUT" <<EOF
# Billing draft — ${SLUG}

Subject: Digital Jamath Cloud renewal reminder

Assalamu alaikum,

Your Cloud subscription for ${SLUG} renews soon. Software stays free;
this invoice covers hosting, backups, and SMS.

Pay: (checkout link)
Self-host instead: https://digitaljamath.com/self-host/

Was-salam
EOF
echo "Wrote $OUT"
