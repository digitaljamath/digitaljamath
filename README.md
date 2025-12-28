# DigitalJamath

![Version](https://img.shields.io/badge/version-0.8.0--alpha-blue)

**DigitalJamath** is an open-source, production-grade SaaS ERP for Indian Masjids, designed with strict compliance and community trust in mind.

## Tech Stack
- **Backend**: Django 5.x, DRF
- **Multi-Tenancy**: django-tenants (Schema Isolation)
- **Database**: PostgreSQL 16+
- **Task Queue**: Celery + Redis
- **AI**: OpenRouter (Google Gemini / Llama 3)

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 16+
# DigitalJamath - Digital Ummah Ecosystem / Digital Jamath Portal

<p align="center">
  <img src="frontend/public/logo.png" alt="DigitalJamath Logo" width="200" onerror="this.style.display='none'"/>
</p>

**DigitalJamath** is a comprehensive, open-source platform designed to digitize and manage community operations for Mosques (Masjids), Jamaths, and Welfare organizations. It provides a robust multi-tenant architecture to handle census data, financial management (Baitul Maal), welfare distribution, and community engagement.

Built with **Django (backend)** and **Next.js (frontend)**, it emphasizes data privacy, shariah compliance, and transparency.

---

## 🚀 Key Features

*   **Digital Census (Jamath Directory):** manage detailed household and member profiles.
*   **Baitul Maal (Finance):** Track donations, subscriptions, and expenses with transparency.
*   **Multi-Tenant Architecture:** Every Masjid gets its own isolated database schema and subdomain (e.g., `jamablr.digitaljamath.com`).
*   **Welfare (Khidmat):** Manage grant applications, workflows, and beneficiary tracking.
*   **Basira (AI Audit):** (Upcoming) Intelligent audit guard for financial anomalies.
*   **Surveys (Tahqeeq):** Create and distribute community surveys.
*   **Member Portal:** Self-service portal for members to view receipts, announcements, and update profiles.

---

## 🛠 Tech Stack

### Backend
*   **Language:** Python 3.11+
*   **Framework:** Django 5.0 + Django REST Framework
*   **Multi-Tenancy:** `django-tenants` (Schema-based isolation)
*   **Database:** PostgreSQL 15+
*   **Authentication:** JWT (Simple JWT) + Session Auth via `django-cors-headers`
*   **Email:** SMTP (Support for Brevo, SendGrid, etc.)

### Frontend
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **Library:** React 19

---

## 💻 System Requirements

To run DigitalJamath effectively, we recommend the following minimum specifications:

*   **CPU:** 2 vCPUs (Recommended: 4 vCPUs for production)
*   **RAM:** 4GB (Recommended: 8GB)
*   **Storage:** 20GB SSD
*   **OS:** Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows (WSL2)

**Prerequisites:**
*   Docker & Docker Compose (Recommended for easy setup)
*   Python 3.11+
*   Node.js 20+ (LTS)
*   PostgreSQL 16+

---

## 🚀 Quick Start Guide

## 🚀 Quick Start Guide

### One-Click Installer (Recommended)

We provide a unified setup script for both **Development** and **Production** environments.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/azzaxp/digitaljamath.git
    cd digitaljamath
    ```

2.  **Run the Setup Script:**
    ```bash
    ./setup.sh
    ```

3.  **Choose your mode:**
    *   **Option 1: Development**: Sets up a local Python virtual environment, installs npm packages, runs migrations, and prepares the app for `runserver`.
    *   **Option 2: Production**: Uses Docker to build the entire stack (Django + Postgres + Redis) and sets up a production-ready Gunicorn server.

### Manual Start (After Setup)

**Development:**
*   Backend: `python manage.py runserver`
*   Frontend: `cd frontend && npm run dev`

**Production:**
*   `docker-compose up -d`

---

## ⚙️ Configuration (.env)

The `.env` file controls your environment. Key variables include:

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Toggle debug mode (False for prod) | `True` |
| `SECRET_KEY` | Django secret key | *random* |
| `DATABASE_URL` | Postgres connection string | `postgres://...` |
| `BREVO_EMAIL_USER` | Brevo Login Email | - |
| `BREVO_SMTP_KEY` | Brevo SMTP Key (v3) | - |
| `DEFAULT_FROM_EMAIL` | Sender email (must be verified in Cloudflare DNS for Brevo) | `noreply@digitaljamath.com` |

**Security Note:** Never commit your `.env` file to version control.

---

## 📦 Multi-Tenancy Explanation

DigitalJamath uses **Schema Isolation**.
*   **Public Schema:** Stores tenant info (`Client`) and domain mapping (`Domain`).
*   **Tenant Schemas:** Each Masjid gets a schema (e.g., `jama-blr`) containing its own `users`, `households`, `transactions` tables.

**To create a new tenant (Masjid):**
1.  Log in to the Django Admin (`/admin`) on the public domain.
2.  Go to **Clients** -> **Add Client**.
3.  Enter schema name (user-friendly, no spaces) and domain (e.g., `masjid1.localhost`).
4.  Save. This automatically triggers migrations for the new schema.

---

## 🤝 Contributing

We welcome contributions! We are specifically looking for:
- **Django Developers**: To build the compliance engine.
- **Next.js Wizards**: To craft accessible interfaces.
- **Reviewers & Testers**: To hunt bugs, verify releases, and ensure stability.
- **Shariah Analysts**: To verify financial logic.

Please follow these steps:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch.
5.  Open a Pull Request.

**License:** MIT License


## Key Modules
- **Finance**: Strict fund isolation (Restricted vs Operational).
- **Jamath**: Household and Member census.
- **Welfare**: Grant application workflow.
- **Basira (AI)**: Automated transaction auditing for compliance.
