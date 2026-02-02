# DigitalJamath

![Version](https://img.shields.io/badge/version-2.0.1--alpha-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://github.com/digitaljamath/digitaljamath/actions/workflows/build-and-push.yml/badge.svg)

**DigitalJamath** is an open-source, production-grade SaaS ERP for Indian Masjids, Jamaths, and Welfare organizations. It provides a robust multi-tenant architecture to handle census data, financial management (Baitul Maal), welfare distribution, and community engagement.

<p align="center">
  <img src="frontend/public/logo.png" alt="DigitalJamath Logo" width="200"/>
</p>

---

## 🎉 What's New in v2.1.0

### 📱 Mobile-First Member Portal
- **Redesigned UI** - 420px mobile-first layout with digital ID card
- **Consistent App Bar** - 56px sticky header across all portal pages
- **Enhanced UX** - Smooth micro-interactions and card-based layouts
- **Receipt Vault** - Mobile-optimized receipt viewing with one-tap PDF download

### 🔧 Authentication Fixes
- Unified JWT token handling (`access_token`) across all portal pages
- Fixed receipt filtering to use correct household association
- Added "Add Family Member" feature to portal

### 🌐 SEO & AI Discoverability
- Added `llms.txt` for AI crawlers (GPTBot, Claude, etc.)
- Added `robots.txt` with proper crawler guidance

### 🤖 Basira AI RBAC
- **Dynamic role-based access** - AI only shows data user has permission to see
- **Prompt injection protection** - Regex-based guards against manipulation
- **Pyramid principle** - Concise answers first, details only when asked
- **Date/time context** - AI knows current date and user identity

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Digital Census** | Manage household and member profiles with socio-economic data |
| **Baitul Maal** | Track Zakat, Sadaqah, and operational funds with strict fund isolation |
| **Multi-Tenant** | Each Masjid gets isolated database schema |
| **Member Portal** | Mobile-first self-service portal with OTP login and digital ID card |
| **Service Requests** | Members request certificates (Nikah, Death, NOC) online |
| **Announcements** | Community notifications and event announcements |
| **Basira AI Guide** | RBAC-secured AI assistant with role-based data access and prompt injection protection |
| **Telegram Bot** | Notifications, reminders, and member linking |
| **PDF Receipts** | 80G-compliant receipt generation with tax details |
| **Staff Management** | Role-based access control with full audit logging |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, Django 5.0, Django REST Framework |
| **Multi-Tenancy** | django-tenants (PostgreSQL Schema Isolation) |
| **Database** | PostgreSQL 16+ |
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions → GitHub Container Registry |
| **Email** | Brevo SMTP |
| **AI** | OpenRouter (Gemini/Llama) |
| **Messaging** | Telegram Bot API |

---

## 🚀 Installation Options

DigitalJamath supports two installation modes:

### Option 1: Single-Tenant (Self-Hosted)
**Best for:** Individual masjids who want a simple setup without subdomains.

- ✅ One masjid, one domain (e.g., `masjid.org`)
- ✅ No subdomain configuration needed
- ✅ Simpler DNS setup
- ✅ Full feature access

### Option 2: Multi-Tenant (SaaS)
**Best for:** Organizations managing multiple masjids or running a hosted service.

- ✅ Multiple masjids with subdomains (e.g., `demo.digitaljamath.com`)
- ✅ Isolated database schemas per tenant
- ✅ Central administration
- ✅ Scalable architecture

---

## 📦 Quick Start

### Interactive Setup (Recommended)

```bash
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath
./setup.sh  # Follow prompts
```

The `setup.sh` script will guide you through:
1. **Environment Mode**: Development (local) or Production (Docker)
2. **Tenant Mode**: Single-Tenant or Multi-Tenant
3. **Database Setup**: Migrations and initial tenant creation
4. **Admin User**: Create your first superuser
5. **Chart of Accounts**: Seed standard ledger accounts

### Manual Development Setup

```bash
# Clone repository
git clone https://github.com/digitaljamath/digitaljamath.git
cd digitaljamath

# Backend setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
python manage.py migrate
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Access: http://localhost:5173 (frontend) | http://localhost:8000 (backend)

### Local Development with Nginx (Multi-Tenant Subdomains)

For testing multi-tenant subdomain routing locally (e.g., `demo.localhost`), use the local nginx config:

**Prerequisites:**
- Install nginx: `brew install nginx` (macOS) or `apt install nginx` (Linux)

**1. Start all services (3 terminals):**

```bash
# Terminal 1 - Django backend
cd digitaljamath
source venv/bin/activate
python manage.py runserver

# Terminal 2 - Vite frontend
cd digitaljamath/frontend
npm run dev

# Terminal 3 - Nginx proxy
cd digitaljamath
nginx -c $(pwd)/nginx/nginx.local.conf
```

**2. Access URLs:**

| URL | What it serves |
|-----|----------------|
| http://localhost | Landing page (static HTML) |
| http://demo.localhost | React app (tenant workspace) |
| http://anyname.localhost | React app (any subdomain works) |
| http://localhost/api/ | Django API |
| http://localhost/admin/ | Django Admin |

**3. Stop nginx when done:**

```bash
nginx -s stop
```

> **Note:** The `nginx.local.conf` proxies requests to `localhost:5173` (Vite) and `localhost:8000` (Django). Make sure both dev servers are running before starting nginx.

### Production Docker Setup

```bash
# Configure environment
cp .env.example .env
nano .env  # Set DATABASE_PASSWORD, DOMAIN_NAME, etc.

# Start with Docker
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate_schemas --shared

# Create your tenant (see Tenant Setup below)
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `your-random-string` |
| `DEBUG` | Debug mode (False for production) | `False` |
| `DOMAIN_NAME` | Base domain | `digitaljamath.com` |
| `DATABASE_PASSWORD` | PostgreSQL password | `StrongPassword123` |

### Optional Services

| Variable | Description | Required For |
|----------|-------------|--------------|
| `BREVO_SMTP_KEY` | Email SMTP key | Password reset, notifications |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Member login, reminders |
| `TELEGRAM_BOT_USERNAME` | Bot username | Telegram linking |
| `OPENROUTER_API_KEY` | AI API key | Basira AI features |


> ⚠️ Never commit `.env` to version control!

---

## 🏠 Tenant Setup

### Single-Tenant Mode (One Masjid)

```bash
# Create your masjid (use your MAIN domain, not subdomain)
python manage.py shell -c "
from apps.shared.models import Client, Domain
tenant = Client(schema_name='mymasjid', name='My Masjid', on_trial=False)
tenant.save()
Domain.objects.create(domain='masjid.org', tenant=tenant, is_primary=True)
"

# Create admin user
python manage.py tenant_command createsuperuser --schema=mymasjid

# Seed Chart of Accounts
python manage.py tenant_command seed_ledger --schema=mymasjid
```

### Multi-Tenant Mode (Multiple Masjids)

```bash
# Create public tenant (main site)
python manage.py create_tenant --schema_name=public --domain_domain=digitaljamath.com --client_name="Digital Ummah"

# Create first masjid
python manage.py create_tenant --schema_name=demo --domain_domain=demo.digitaljamath.com --client_name="Demo Masjid"

# Setup admin and data
python manage.py tenant_command createsuperuser --schema=demo
python manage.py tenant_command seed_ledger --schema=demo
```

---

## 📋 setup.sh Features

The interactive installer handles everything:

| Step | What It Does |
|------|--------------|
| 1. Environment Mode | Choose Development or Production (Docker) |
| 2. Tenant Mode | Choose Single-Tenant or Multi-Tenant |
| 3. Environment Config | Creates `.env` from template if missing |
| 4. Dependencies | Installs Python and Node.js packages |
| 5. Database Migrations | Runs Django migrations |
| 6. Public Tenant | Creates base tenant for routing |
| 7. Your Masjid | Creates your masjid (Single-Tenant) or offers Demo setup (Multi-Tenant) |
| 8. Chart of Accounts | Seeds standard accounting ledgers |

---

## 🔄 Deployment Scripts

| Script | Purpose |
|--------|---------|
| `setup.sh` | Full installation (wipes data if not careful - use only for fresh install) |
| `deploy.sh` | **Safe Update** - Pulls code, rebuilds containers, runs migrations (No data loss) |
| `scripts/bump_version.sh` | Updates version across all files |
| `scripts/populate_demo_data.py` | Populates sample data for testing |

---

## 🛡️ Safe Update Process
**Never run `setup.sh` on a production server that already has data!** 

To update your production server safely (e.g., after pushing changes to GitHub):
```bash
cd ~/workspace/digitaljamath
./deploy.sh
```
This script will:
1. Pull the latest code (`git pull`)
2. Rebuild containers (`docker-compose build`)
3. Run migrations (`migrate_schemas`)
4. Restart services
**It will NOT interfere with your database or delete any tenant data.**

---

## 🤝 Contributing

We welcome contributions!

**Looking for:**
- Django Developers (backend features)
- React Developers (frontend polish)
- Testers (bug hunting and QA)
- Shariah Analysts (financial logic verification)

**How to contribute:**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push and open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| **Website** | [digitaljamath.com](https://digitaljamath.com) |
| **Live Demo** | [demo.digitaljamath.com](https://demo.digitaljamath.com) |
| **Documentation** | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **GitHub** | [github.com/digitaljamath/digitaljamath](https://github.com/digitaljamath/digitaljamath) |

---

## 💡 Demo Access

| Portal | Credentials |
|--------|-------------|
| **Admin Dashboard** | `demo@digitaljamath.com` / `password123` |
| **Member Portal** | Phone: `+919876543210`, OTP: `123456` |

> Note: Demo OTP `123456` only works for the demo phone number.
