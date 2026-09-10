# Architecture — Community Edition & Cloud

## Surfaces

| Surface | Tech | URL |
|---------|------|-----|
| Marketing | Astro | `digitaljamath.com` |
| Desk / accounting | Frappe + ERPNext + `digital_jamath` | `app.digitaljamath.com` |
| Member portal | Next.js | `portal.digitaljamath.com` or path `/portal` |

## Tenancy

- **Community Edition (self-host):** one Frappe site, one jamath database.
- **Cloud:** one Frappe site per jamath on a shared or dedicated bench. Isolation for Zakat and finance is site-level, not Postgres schema-per-tenant (legacy Django).

## Data flow

1. Trustee uses Desk quick entry → Journal/Payment Entry → Shariah validators in `digital_jamath.baitul_maal.validators`.
2. Member uses Next portal → `digital_jamath.portal.*` whitelisted methods on their site.
3. Cloud signup → control plane (`scripts/cloud/provision_site.sh`) → `bench new-site` + `install-app digital_jamath`.

## Legacy

Django + React SPA + `django-tenants` schemas are frozen under `legacy_django/` (tag `v2.1.0-django-legacy`).
