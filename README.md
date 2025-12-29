# DigitalJamath

![Version](https://img.shields.io/badge/version-1.0.1--alpha-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**DigitalJamath** is an open-source, production-grade SaaS ERP for Indian Masjids, Jamaths, and Welfare organizations. It provides a robust multi-tenant architecture to handle census data, financial management (Baitul Maal), welfare distribution, and community engagement.

<p align="center">
  <img src="frontend/public/logo.png" alt="DigitalJamath Logo" width="200" onerror="this.style.display='none'"/>
</p>

---

## 🚀 Key Features

- **Digital Census (Jamath Directory)**: Manage detailed household and member profiles.
- **Baitul Maal (Finance)**: Track donations, subscriptions, and expenses with transparency.
- **Multi-Tenant Architecture**: Every Masjid gets its own isolated database schema and subdomain (e.g., `demo.digitaljamath.com`).
- **Welfare (Khidmat)**: Manage grant applications, workflows, and beneficiary tracking.
- **Basira AI Guide**: AI-powered assistant for navigating the platform.
- **Surveys (Tahqeeq)**: Create and distribute community surveys.
- **Member Portal**: Self-service portal for members to view receipts, announcements, and submit requests.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, Django 5.0, Django REST Framework |
| **Multi-Tenancy** | django-tenants (Schema Isolation) |
| **Database** | PostgreSQL 16+ |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Reverse Proxy** | Nginx |
| **Containerization** | Docker + Docker Compose |
| **Email** | Brevo SMTP |
| **AI** | OpenRouter (Gemini/Llama) |

---

## 💻 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4GB | 8GB |
| Storage | 20GB SSD | 50GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

**Prerequisites:**
- Docker & Docker Compose (Production)
- Python 3.11+ / Node.js 20+ (Development)
- PostgreSQL 16+

---

## 🚀 Quick Start

### One-Click Installer

```bash
git clone https://github.com/azzaxp/digitaljamath.git
cd digitaljamath
./setup.sh
```

**Choose your mode:**
- **Option 1: Development** - Local Python venv + npm dev server
- **Option 2: Production** - Full Docker stack (Django + Nginx + Postgres + Redis)

### Manual Commands

**Development:**
```bash
# Terminal 1 (Backend)
source venv/bin/activate
python manage.py runserver

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

**Production:**
```bash
docker-compose up -d
```

---

## 📋 Post-Installation Setup

After the initial installation, you **MUST** run these commands to fully configure the application.

### 1. Seed the Chart of Accounts (Required for Finance Module)

The Mizan Ledger (double-entry accounting) requires a Chart of Accounts to be seeded before you can create any financial entries.

**Development:**
```bash
python manage.py seed_ledger
```

**Docker (Production):**
```bash
# For multi-tenant setup, run for each tenant schema:
docker exec -it digitaljamath_web python manage.py tenant_command seed_ledger --schema=<your_schema_name>

# Example:
docker exec -it digitaljamath_web python manage.py tenant_command seed_ledger --schema=jama_blr
```

> ⚠️ **Without this step, the accounting voucher dropdowns will be empty and entries won't save!**

### 2. Create a Superuser (Admin Access)

**Development:**
```bash
python manage.py createsuperuser
```

**Docker:**
```bash
docker exec -it digitaljamath_web python manage.py createsuperuser
```

### 3. Populate Demo Data (Optional)

To test the platform with sample households, members, and transactions:

```bash
# Development
python manage.py shell < scripts/populate_demo_data.py

# Docker
docker exec -it digitaljamath_web python manage.py shell < scripts/populate_demo_data.py
```

### 4. List Existing Tenants

To check which tenant schemas exist:

```bash
# Docker
docker exec -it digitaljamath_web python manage.py list_tenants

# Or directly from PostgreSQL
docker exec -it digitaljamath_db psql -U postgres -d digitaljamath_db -c "SELECT schema_name FROM public.shared_tenant;"
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret (random string) | `abc123xyz...` |
| `DEBUG` | Debug mode (False for prod) | `False` |
| `DOMAIN_NAME` | Your domain | `digitaljamath.com` |
| `ALLOWED_HOSTS` | Allowed hosts | `.digitaljamath.com` |
| `DATABASE_PASSWORD` | Postgres password | `YourStrongPassword` |
| `BREVO_SMTP_KEY` | Email API key | `xkeysib-...` |

> ⚠️ **Never commit `.env` to version control!**

---

## 📦 Multi-Tenancy

DigitalJamath uses **PostgreSQL Schema Isolation**:
- **Public Schema**: Tenant registry (`Client`, `Domain`)
- **Tenant Schemas**: Each Masjid has its own isolated tables

**Create a new tenant:**
1. Login to Django Admin (`/admin`)
2. Go to **Clients** → **Add Client**
3. Set schema name and domain (e.g., `newmasjid.digitaljamath.com`)
4. Migrations run automatically!

---

## 🤝 Contributing

We welcome contributions! Looking for:
- **Django Developers** - Backend features
- **Next.js Developers** - Frontend polish
- **Testers** - Bug hunting and QA
- **Shariah Analysts** - Financial logic verification

**Steps:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push and open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Live Demo**: [demo.digitaljamath.com](https://demo.digitaljamath.com)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **GitHub**: [github.com/azzaxp/digitaljamath](https://github.com/azzaxp/digitaljamath)
