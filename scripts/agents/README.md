# Ops agents

Runnable drafts under `scripts/agents/*.sh`. They write markdown to `scripts/agents/out/` for human review — they do not send email or charge cards.

| Script | Purpose |
|--------|---------|
| `onboarding.sh` | Welcome email after `provision_site.sh` |
| `support.sh` | Triage checklist |
| `billing.sh` | Renewal / dunning draft |
| `finance_runway.sh` | Monthly runway numbers for Astro `/runway` |
| `content.sh` | Release notes draft |

See [docs/AUTONOMY.md](../../docs/AUTONOMY.md).
