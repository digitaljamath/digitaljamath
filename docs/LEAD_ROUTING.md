# Lead & email routing

## What happens when a lead lands

1. Prospect tries **Demo Jamath** (`/cloud#demo`) or submits **Start free pilot** (`/` or `/cloud#interest-form`).
2. Form POSTs to Frappe: `digital_jamath.cloud.trial.register_pilot_interest`.
3. A **Jamath Cloud Trial** row is created with status `Interest`.
4. Ops is notified via Desk **ToDo**, optional webhook, and email when SMTP is configured.
5. Team onboards manually.

## The only public email

**`salam@digitaljamath.com`** — all queries, pilots, and contact.

Do not publish `info@`, `leads@`, `support@`, or `hello@`.

`demo@digitaljamath.com` is the Demo Desk login only (not an inbox for humans).

```json
{
  "cloud_lead_recipients": ["salam@digitaljamath.com"]
}
```

Confirm Cloudflare Email Routing for `salam@digitaljamath.com`.
