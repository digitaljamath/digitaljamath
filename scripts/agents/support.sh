#!/usr/bin/env bash
# Agent: support — triage stub for GitHub issues / inbox
set -euo pipefail
mkdir -p scripts/agents/out
OUT="scripts/agents/out/support-triage-$(date +%Y%m%d).md"
cat > "$OUT" <<'EOF'
# Support triage draft

1. Label inbound issues: bug / docs / shariah-question / cloud-ops
2. good first issue → community contributors
3. Cloud outages → page on-call; CE self-host → docs link only
4. Never invent fatwa answers — escalate Shariah questions to scholars

Human approval required before sending replies.
EOF
echo "Wrote $OUT"
