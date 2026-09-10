# DigitalJamath Community Edition — Deployment

Frappe Framework 15 + ERPNext 15 + custom app `digital_jamath`.

> **Legacy Django deploy is retired.** Do not use `docker-compose.prod.yml` under `legacy_django/` or `./setup.sh` for new installs. Frozen snapshot: `legacy_django/`, tag `v2.1.0-django-legacy`.

## Domains

| Host | Serves |
|------|--------|
| `digitaljamath.com` | Astro marketing site |
| `app.digitaljamath.com` | Frappe / ERPNext Desk |
| `portal.digitaljamath.com` or `/portal` | Next.js member portal |

Cloudflare DNS → origin; SSL Full (strict) when origin certs exist.

## Prerequisites

- Docker + Docker Compose
- 2+ GB RAM recommended
- Open ports: `8000` (Frappe), optionally `80`/`443` via host nginx

## 1. Configure

```bash
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath
git checkout dev
cp .env.example .env
```

Set at least:

```env
SITE_NAME=app.digitaljamath.com
MYSQL_ROOT_PASSWORD=...
ADMIN_PASSWORD=...
```

## 2. Start stack

```bash
docker compose up -d
bash scripts/frappe_bootstrap.sh
```

Bootstrap will:

1. Wait for MariaDB
2. `bench new-site` (if missing)
3. Install `erpnext` + `digital_jamath`
4. Seed Fund Types via `after_install`

## 3. Masjid chart of accounts

```bash
docker compose exec backend bench --site "$SITE_NAME" \
  execute digital_jamath.scripts.seed_coa.run
```

Or from host:

```bash
bash scripts/seed_masjid_coa.sh
```

## 4. Nginx (host) sketch for `app.`

```nginx
server {
  server_name app.digitaljamath.com;
  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 5. Member portal

Point Next.js `NEXT_PUBLIC_FRAPPE_URL` at this site (see `digitaljamath-website`). Portal OTP methods:

- `/api/method/digital_jamath.portal.auth.send_otp`
- `/api/method/digital_jamath.portal.auth.verify_otp`

## 6. Cloud (multi-tenant)

One **Frappe site per jamath**. Provision helper:

```bash
bash scripts/cloud/provision_site.sh jamath-slug admin@example.com
```

Billing hooks: `scripts/cloud/billing_stub.md`.

## 7. Staging cutover from legacy Django (dj-server)

1. `pg_dump` → `~/backups/django-legacy-YYYYMMDD/`
2. Stop legacy web/frontend containers (keep Postgres volumes)
3. Pull `dev`, `docker compose up -d`, run bootstrap
4. Repoint `app.digitaljamath.com` upstream to `:8000`

## Maintenance

```bash
docker compose logs -f backend
docker compose exec backend bench --site "$SITE_NAME" migrate
docker compose pull && docker compose up -d
```

## Security notes

- Never commit real `.env` passwords
- Rotate `ADMIN_PASSWORD` and MariaDB root after first login
- Staging OTP SMS is stubbed; wire a provider before production Cloud
