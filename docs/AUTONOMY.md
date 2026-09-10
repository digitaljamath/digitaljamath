# Self-running organisation (autonomy)

DigitalJamath aims to fund its own Cloud infrastructure and AI usage from subscriptions while keeping Community Edition free.

## Revenue

- Cloud subscriptions (hosting + SMS + support)
- Optional paid support retainers
- Optional project sponsorship (sadaqah for the software project — not Zakat unless a scholar-approved path exists)

## Cost sinks (auto-pay)

- VPS (`dj-server` and successors)
- LLM API (Basira + ops agents)
- Domains, email, SMS gateway

## Agent roles (`scripts/agents/`)

| Agent | Job |
|-------|-----|
| `onboarding` | Draft welcome emails; checklist after site provision |
| `support` | Triage GitHub issues / inbound mail drafts |
| `billing` | Renewal reminders and failed-payment dunning drafts |
| `finance` | Monthly runway: revenue − costs → public transparency snippet |
| `content` | Release-note drafts for Astro / GitHub |

Agents are **assistive** until Cloud MVP billing is live. They must not spend money without a human-approved budget cap.

## Phases

1. Manual Cloud MVP (provision script + Razorpay/Stripe)
2. Agent-assisted ops
3. Closed-loop treasury + public runway page
4. Auto-scale add-ons (WhatsApp, metered Basira)

## Open-source guarantee

`digital_jamath`, Astro marketing, and the Next portal stay MIT. Control-plane secrets and private agent prompts may remain ops-only. Self-hosters never pay.
