#!/usr/bin/env bash
# Agent: finance — monthly runway snippet for Astro /runway
set -euo pipefail
mkdir -p scripts/agents/out
OUT="scripts/agents/out/runway-$(date +%Y%m).md"
REVENUE_INR="${CLOUD_REVENUE_INR:-0}"
COST_INR="${OPS_COST_INR:-0}"
RESERVE=$((REVENUE_INR - COST_INR))
cat > "$OUT" <<EOF
# Runway $(date +%Y-%m)

| | INR |
|--|--:|
| Cloud revenue (month) | ${REVENUE_INR} |
| Ops costs (VPS+LLM+SMS+domains) | ${COST_INR} |
| Net | ${RESERVE} |

Status: Building Community Edition + Cloud pilot.
Update Astro \`src/pages/runway.astro\` after human review.
EOF
echo "Wrote $OUT"
