> [!WARNING]
> **This is the frozen `legacy` branch: the retired Django + React (django-tenants) Digital Jamath.**
> It is kept for reference and data migration only. It receives no fixes, and pull requests against it are closed.
> Active development is the Frappe/ERPNext app on [`main`](https://github.com/digitaljamath/digitaljamath/tree/main) / [`dev`](https://github.com/digitaljamath/digitaljamath/tree/dev).
> To move data from here to the new app, use `scripts/migrate_django_to_frappe.py` on `main`.
> Final release tag: `v2.1.0-django-legacy`.

<p align="center">
  <img src="frontend/public/logo.png" alt="DigitalJamath" width="180" />
</p>

<h1 align="center">DigitalJamath</h1>

<p align="center">
  <strong>Free, open-source community-trust software for Indian Masjids, Jamaths, and welfare organisations.</strong><br />
  Census, Baitul Maal, welfare grants, member portal, and an AI guide — on one unified platform.
</p>

<p align="center">
  <a href="https://github.com/digitaljamath/digitaljamath/blob/main/LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-green" /></a>
  <a href="https://github.com/digitaljamath/digitaljamath/actions/workflows/build-and-push.yml"><img alt="Build" src="https://github.com/digitaljamath/digitaljamath/actions/workflows/build-and-push.yml/badge.svg" /></a>
  <img alt="Version" src="https://img.shields.io/badge/version-2.1.0-blue" />
  <a href="https://digitaljamath.com">🌐 digitaljamath.com</a>
  ·
  <a href="https://app.digitaljamath.com">▶ Live demo</a>
</p>

---

## السلام عليكم — welcome 👋

Most masjids in India still run on paper registers, WhatsApp groups, and a treasurer's notebook. **DigitalJamath** is the open-source platform that brings the whole community trust online — the donations *and* the people receiving help — without locking your data inside someone else's cloud.

We built this because:

- 🕌 **Mosques deserve software made for them** — not generic CRMs or accounting tools that don't understand Zakat, Asnaaf, Waqf, or the May 31 Form 10BD deadline.
- 🤲 **Both sides matter** — every other platform tracks donors. We also track Zakat-eligible households, welfare grants, and beneficiary impact.
- 🔓 **Your data is yours** — self-hostable, MIT-licensed, no vendor lock-in. Run it on a ₹500/month VPS or use the hosted version at [digitaljamath.com](https://digitaljamath.com).
- 🌍 **Built in the open by the community** — every line of code is on GitHub. PRs welcome. Questions welcome. Just-a-trustee-with-an-idea? Welcome.

> **Not just donation software — community-trust software.**

---

## ✨ What's inside

| | Feature | What it does |
|---|---------|--------------|
| 🏠 | **Digital Census** | Households + members, socio-economic data, auto Zakat-eligibility scoring |
| 💰 | **Baitul Maal** | Real double-entry ledger for Zakat / Sadaqah / operational funds with strict isolation |
| 🧾 | **80G-compliant Receipts** | Auto-generated PDFs with PAN, donor details, and tax-claim-ready formatting |
| 🤝 | **Welfare Grants** | Beneficiary applications, approval workflow, recurring stipend tracking |
| 📱 | **Member Portal** | Mobile-first OTP login, digital ID card, receipt vault, family management |
| 📣 | **Announcements** | Community notifications, events, RSVPs |
| 📋 | **Service Requests** | Nikah, Death, NOC certificates with online intake |
| 🤖 | **Basira AI Guide** | RBAC-secured assistant with prompt-injection protection |
| 💬 | **Telegram Bot** | Reminders, receipts, notifications, member linking |
| 🏛️ | **Staff & Audit** | Role-based access, full activity log, configurable permissions |

---

## 🚀 Try it

**Hosted demo (no install)** — [app.digitaljamath.com](https://app.digitaljamath.com)

| Portal | Credentials |
|--------|-------------|
| Admin Dashboard | `demo@digitaljamath.com` / `password123` |
| Member Portal | Phone `+919876543210`, OTP `123456` |

> Self-hosting? Seed the same demo masjid + data with one command after install:
> `docker compose exec web python manage.py setup_demo`

**Run it yourself** — clone, run one command, you're online:

```bash
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath
./setup.sh
```

The interactive installer handles env config, dependencies, migrations, your first Mosque, and a seeded chart of accounts. Pick *Development* for local hacking or *Production* for Docker.

Manual setup, Nginx config, and a full deployment walkthrough live in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🛠 Built with

Python 3.11+ · Django 5 · Django REST Framework · React 19 · Vite · TypeScript · Tailwind · Shadcn UI · PostgreSQL 16 · Docker · GitHub Actions · OpenRouter (Gemini / Llama) · Brevo SMTP · Telegram Bot API · Razorpay

The marketing site (the welcoming homepage at [digitaljamath.com](https://digitaljamath.com)) is a separate Next.js app and lives at [digitaljamath/digitaljamath-website](https://github.com/digitaljamath/digitaljamath-website).

---

## 🗺️ Roadmap

We're focused on three things competitors structurally can't copy:

1. **🇮🇳 Compliance Copilot** — one-click Form 10BD CSV export, auto-issued Form 10BE certificates for donors, T-30/T-15/T-7 reminders before May 31, penalty-exposure calculator. Trustees feel this pain every year — we're going to fix it.
2. **🪪 Public Trust Page** — a live, cryptographically-verifiable "₹X in, ₹Y out, Z families helped" dashboard for every mosque. Donor confidence is the #1 fundraising barrier; this is the answer.
3. **🤝 Cross-Mosque Welfare Registry** — privacy-preserving check that prevents the same household from claiming aid from multiple mosques. Only possible because we went unified-DB.

Beyond those: Madrassah module · Qabristan management · Imam payroll · Mahalla circles · WhatsApp-native receipts. Pitch your idea in an issue or PR — the roadmap is community-driven.

---

## 🤲 Get involved

You don't have to be a 10x engineer to help. We need:

- **🐍 Django developers** — backend features, performance, API polish
- **⚛️ React developers** — frontend craft, animations, accessibility
- **🧪 Testers** — bug hunting, QA, edge cases
- **📖 Shariah scholars** — verifying our Zakat/Asnaaf/Waqf logic is sound
- **🌐 Translators** — Tamil, Urdu, Malayalam, Hindi, Bangla, Arabic
- **✍️ Writers** — docs, tutorials, mosque success stories
- **🕌 Trustees + Imams** — tell us what's missing; you know best

**How:**
1. Fork the repo
2. Branch off main: `git checkout -b feat/your-amazing-thing`
3. Commit, push, open a PR
4. We'll review with kindness — `barakallahu feekum` for every contribution.

First-time contributor? Look for the [`good first issue`](https://github.com/digitaljamath/digitaljamath/labels/good%20first%20issue) label, or just open an issue saying hi.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the longer version.

---

## 🙏 With gratitude

DigitalJamath exists because of every trustee who shared their workflow, every developer who sent a PR at 2am, every imam who patiently explained how the Asnaaf categories actually work, and every donor who trusted us to build their receipt right.

A heartfelt **JazakAllah Khair** to everyone who has shaped this project. Your name belongs on this list — open an issue and we'll add you.

---

## 📜 License

MIT. Use it, fork it, host it, sell support around it — just keep the license notice. See [LICENSE](LICENSE).

## 🔗 Links

- 🌐 Website — [digitaljamath.com](https://digitaljamath.com)
- ▶ Demo — [app.digitaljamath.com](https://app.digitaljamath.com)
- 📦 Marketing site repo — [digitaljamath-website](https://github.com/digitaljamath/digitaljamath-website)
- 📘 Deployment guide — [DEPLOYMENT.md](DEPLOYMENT.md)
- 🤝 Contributing guide — [CONTRIBUTING.md](CONTRIBUTING.md)
- 🐛 Issues — [github.com/digitaljamath/digitaljamath/issues](https://github.com/digitaljamath/digitaljamath/issues)

---

<p align="center">
  <em>Built with care for the Ummah.</em><br />
  <em>اللهم بارك</em>
</p>
