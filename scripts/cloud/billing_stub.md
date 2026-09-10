# Cloud billing

## Intent

Cloud customers pay for **hosting + backups + SMS + support**, not for the Community Edition software.

## Trial-first (live)

1. Astro `/cloud` → `digital_jamath.cloud.trial.start_cloud_trial`
2. **14-day free trial · no credit card**
3. Creates Jamath (Company) + admin user + `Jamath Cloud Trial` row
4. Desk shows days-remaining banner; after `trial_end` status → Expired and writes are soft-locked
5. Convert to paid (manual invoice / Razorpay / Stripe) → set status `Active`

Config (site_config / `.env`):

- `trial_days=14`
- `cloud_monthly_price_inr=999`

## Providers (paid convert — next)

Set in `.env`:

- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (India)
- `STRIPE_SECRET_KEY` (global)
- `CLOUD_PROVISION_ENABLED=0` (1 = dedicated site via `provision_site.sh`)

## Dedicated site cutover

When ready: `scripts/cloud/provision_site.sh <slug> <email>` then move trial status to Active on the new site.
