# Architecture — Community Edition & Cloud

## Surfaces

| Surface | Tech | URL |
|---------|------|-----|
| Marketing | Astro | `digitaljamath.com` |
| **Committee console (Ops)** | React SPA in `committee-ui/` served by Frappe | `app.digitaljamath.com/jamath` |
| **Advanced Desk** | Frappe + ERPNext + `digital_jamath` | `app.digitaljamath.com/app` |
| Member portal | Next.js | `digitaljamath.com/portal` (or dedicated host) |
| Cloud signup | Astro → provision API | `digitaljamath.com/cloud` |

Feature catalogue: **[FEATURES.md](FEATURES.md)**.

## Tenancy

- **Community Edition (self-host):** one Frappe site, one jamath database.
- **Cloud:** same site can host multiple jamaths as ERPNext **Companies**, with trial registry and portal slug login (`/portal/j/{slug}`). Full site-per-jamath remains an option for harder isolation.

## Data flow

1. Trustee uses **committee console** or Desk → Journal/Payment Entry → Shariah validators in `digital_jamath.baitul_maal.validators`.
2. Member uses Next portal → `digital_jamath.portal.*` whitelisted methods (OTP session).
3. Cloud signup → `digital_jamath.cloud.provision.start_cloud_trial` → company + user + starter household.

## Committee SPA mount (Kamra pattern)

```
committee-ui/  (Vite build)
    → digital_jamath/public/committee/
www/jamath.py  injects CSRF, serves index.html
hooks: website_route_rules /jamath/<path> → jamath
```

Desk stays Advanced mode; do not rebuild GL in the SPA.

## Legacy

Django + React SPA + `django-tenants` schemas are frozen under `legacy_django/` (tag `v2.1.0-django-legacy`).
