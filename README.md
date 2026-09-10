<p align="center">
  <img src="digital_jamath/public/images/logo.svg" alt="Digital Jamath" width="72" />
</p>

<p align="center">
  <strong>digitaljamath</strong><br />
  Open-source software for jamaths and masjids<br />
  Household census · Shariah-isolated Baitul Maal · Member portal · Compliance
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-0B3D2E?style=flat-square" /></a>
  <img alt="Frappe + ERPNext 15" src="https://img.shields.io/badge/stack-Frappe%20%2B%20ERPNext%2015-B18830?style=flat-square" />
  <a href="https://github.com/digitaljamath/digitaljamath/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/digitaljamath/digitaljamath?style=flat-square" /></a>
</p>

<p align="center">
  <a href="https://digitaljamath.com">Website</a>
  ·
  <a href="https://app.digitaljamath.com">Live Desk</a>
  ·
  <a href="https://digitaljamath.com/portal/login">Member portal</a>
  ·
  <a href="DEPLOYMENT.md">Deploy</a>
</p>

---

## Why Digital Jamath

Committees need a shared ledger they can audit — membership, funds, receipts, and member requests — without locking the jamath into proprietary SaaS.

**Digital Jamath Community Edition** is that product: MIT-licensed, built on Frappe + ERPNext 15, free to self-host forever. **Cloud** is optional hosting and onboarding (same software), not a feature gate.

> Not donation SaaS. Community-trust software for the Ummah — global by design, India compliance as a locale pack.

---

## What’s included

| Module | What you get |
|--------|----------------|
| **Census** | Households and members, Zakat-eligibility scoring |
| **Baitul Maal** | Zakat / Sadaqah / Chanda / operations with hard fund isolation |
| **Receipts & compliance** | Digital receipts; India pack for 80G + Form 10BD CSV |
| **Tickets** | Nikah, NOC, certificates — committee inbox for member requests |
| **Member portal** | OTP login, family, donations, service requests |
| **Basira** | Optional AI guide (bring your own key when self-hosting) |

Community Edition is the **full** product. Cloud pays for servers, backups, SMS, and hand-holding.

---

## Try it in 60 seconds

| Surface | How to sign in |
|---------|----------------|
| **Committee Desk** | [app.digitaljamath.com](https://app.digitaljamath.com) → `demo@digitaljamath.com` / `Experience@DJ1` |
| **Member portal** | [digitaljamath.com/portal/login](https://digitaljamath.com/portal/login) → phone `9876543210`, OTP `123456` |

Demo data resets every night (IST). Ready for your jamath? [Show interest](https://digitaljamath.com/cloud#interest-form) for a **3-month free Cloud pilot** (no credit card).

---

## Community Edition vs Cloud

| | **Community Edition** (this repo) | **Digital Jamath Cloud** |
|--|-----------------------------------|--------------------------|
| Price | Free forever | 90-day pilot, then from **₹999/mo** by household |
| Who runs it | You (Docker / your VPS) | We host and onboard |
| Software | Full modules | Same app |
| Data | Yours — export anytime | Yours — leave for CE whenever |
| Billing unit | — | Household = primary + family |

After pilot: Small ₹999 (≤150 households) · Growth ₹1,999 · Community ₹3,499 · Ummah custom.

---

## Quick start (self-host)

```bash
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath
git checkout dev
cp .env.example .env          # SITE_NAME, MYSQL_ROOT_PASSWORD, ADMIN_PASSWORD
docker compose up -d
bash scripts/frappe_bootstrap.sh
```

Open the site from `.env` (default Desk on port `8000`). Fund Types seed on install. Apply the masjid chart of accounts:

```bash
bash scripts/seed_masjid_coa.sh
# or:
docker compose exec backend bench --site "$SITE_NAME" \
  execute digital_jamath.scripts.seed_coa.run
```

Full guide: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## Repository layout

```
digital_jamath/     # Frappe app (source of truth)
docker-compose.yml  # MariaDB + Redis + ERPNext + app
scripts/            # Bootstrap, COA, cloud helpers, ops agents
docs/               # Architecture, autonomy, lead routing
legacy_django/      # Frozen snapshot — do not extend
```

**Sibling repos**

| Repo | Role |
|------|------|
| [digitaljamath-astro](https://github.com/digitaljamath/digitaljamath-astro) | Marketing site → [digitaljamath.com](https://digitaljamath.com) |
| [digitaljamath-website](https://github.com/digitaljamath/digitaljamath-website) | Next.js member portal → `/portal` |

---

## Architecture

- **Self-host:** one bench, one site, `install-app digital_jamath`.
- **Cloud:** one Frappe site per jamath; portal talks to that site’s APIs; Astro handles CE vs Cloud CTAs.

Deeper reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/AUTONOMY.md](docs/AUTONOMY.md)

---

## Roadmap

1. Compliance Copilot (locale packs, deadline reminders)
2. Public Trust Page (transparent in/out for donors)
3. Privacy-preserving cross-mosque welfare registry
4. WhatsApp (WABA) to primary members
5. Cloud multi-tenant provision + billing automation

---

## Contributing

Welcome: Frappe/Python, portal (Next.js), Astro content, Shariah review, and translations (Arabic, Urdu, Bangla, Malayalam, Tamil, Hindi, …). Prefer PRs against `dev`.

`legacy_django/` (tag `v2.1.0-django-legacy`) is **read-only**.

Brand: Open-D mark + lowercase `digitaljamath` — see project brand guidelines when contributing UI.

## License

[MIT](LICENSE) — fork it, self-host it, keep the jamath free.

---

<p align="center"><em>Built with care for the Ummah. اللهم بارك</em></p>
