# Contributing to Digital Jamath

Thank you for helping jamaths run membership, Baitul Maal, and member services with a clear audit trail.

We review pull requests on a best-effort basis, usually within a few days. Prefer small PRs.

## Ways to help

| Track | Repo / path | Skills |
|-------|-------------|--------|
| **Frappe app** | this repo → `digital_jamath/` | Python, Frappe/ERPNext DocTypes, permissions |
| **Committee console** | this repo → `committee-ui/` | React, TypeScript, Vite |
| **Member portal** | [digitaljamath-website](https://github.com/digitaljamath/digitaljamath-website) | Next.js |
| **Marketing** | [digitaljamath-astro](https://github.com/digitaljamath/digitaljamath-astro) | Astro, copy, SEO |
| **Docs & i18n** | `docs/`, UI strings | Writing, Urdu / Malayalam / Arabic / Tamil |
| **Domain review** | issues labeled `help wanted` | Shariah, 80G / Form 10BD, jamath ops |

`legacy_django/` is a frozen snapshot. Do not send PRs against it.

## Before you code

1. Read [docs/FEATURES.md](docs/FEATURES.md) for what the product does.
2. Pick a [good first issue](https://github.com/digitaljamath/digitaljamath/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or open a Discussion if you are unsure.
3. Comment on the issue so we know you are on it.

## Local setup (Community Edition)

```bash
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath
git checkout dev
cp .env.example .env
docker compose up -d
bash scripts/frappe_bootstrap.sh
bash scripts/seed_masjid_coa.sh
```

Desk runs at http://localhost:8000 (port mapped in `docker-compose.yml`). Full notes: [DEPLOYMENT.md](DEPLOYMENT.md).

### Committee console (`/jamath`)

```bash
cd committee-ui
npm install
npm run build   # output lands in digital_jamath/public/committee
```

For day-to-day UI work, see [committee-ui/README.md](committee-ui/README.md).

## Try the live demos (no install)

| Surface | URL | Sign in |
|---------|-----|---------|
| Committee Desk | [app.digitaljamath.com/login](https://app.digitaljamath.com/login) | `demo@digitaljamath.com` / `Experience@DJ1` |
| Member portal | [digitaljamath.com/portal/login](https://digitaljamath.com/portal/login) | phone `9876543210`, OTP `123456` |

Demo data resets every night (IST).

## Pull request checklist

- Branch from **`dev`**. Open PRs against **`dev`**, not `main`.
- Keep the change focused (one job per PR).
- Do not commit secrets, `.env`, or production dumps.
- Match existing style: Inter / system UI for product screens, no ornamental religious motifs in the mark.
- Website and README copy: no em dashes or en dashes; prefer concrete product nouns.
- Update docs if you change behaviour committees rely on.

### Tiny first PR (if you want a dry run)

Fix a typo in `README.md` or `docs/`, improve an alt text string, or tighten a badge link. That is enough to learn the fork → branch → PR flow.

## Issue labels we use

| Label | Meaning |
|-------|---------|
| `good first issue` | Scoped for newcomers |
| `help wanted` | We want outside help |
| `bug` | Broken behaviour |
| `enhancement` | New or improved behaviour |
| `documentation` | Docs only |

## Conduct and contact

- [Code of Conduct](CODE_OF_CONDUCT.md)
- Questions: [GitHub Discussions](https://github.com/digitaljamath/digitaljamath/discussions) or **salam@digitaljamath.com**

Built with care for the Ummah.
