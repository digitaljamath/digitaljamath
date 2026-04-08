# DigitalJamath

![Version](https://img.shields.io/badge/version-2.0.1--alpha-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://github.com/digitaljamath/digitaljamath/actions/workflows/build-and-push.yml/badge.svg)

**DigitalJamath** is an open-source, production-grade SaaS ERP for Indian Masjids, Jamaths, and Welfare organizations. It operates as a single unified platform with three main options (Login as Mosque, Register as Mosque, Login as User) to handle census data, financial management (Baitul Maal), welfare distribution, and community engagement. Mosques can register and manage their own users centrally.

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
| **Unified Platform** | One website where Mosques register and manage their own users centrally |
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
| **Architecture** | Single Unified Database Platform (No Multi-Tenancy) |
| **Database** | PostgreSQL 16+ |
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions → GitHub Container Registry |
| **Email** | Brevo SMTP |
| **AI** | OpenRouter (Gemini/Llama) |
| **Messaging** | Telegram Bot API |

---

## 🚀 Unified Platform

DigitalJamath operates as a single unified platform on one website.

### Three Main Options
1. **Login as Mosque**
2. **Register as Mosque**
3. **Login as User**

After a Mosque registers, it can create and manage its own users. Those users log in through the "Login as User" option, functioning similarly to a tenant system but without actually implementing multi-tenancy.

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
2. **Platform Mode**: Unified Platform initialization
3. **Database Setup**: Migrations and initial Mosque setup
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

### Local Development with Nginx (Unified Platform)

For testing unified local routing, use the local nginx config:

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
nginx -p $(pwd) -c nginx/nginx.local.conf
```

**2. Access URLs:**

| URL | What it serves |
|-----|----------------|
| http://localhost | Main website (Login/Register Mosque, Login User) |
| http://localhost/portal | React app (Mosque/User workspace) |
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
docker-compose exec web python manage.py migrate

# Create your initial Mosque (see Platform Setup below)
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

## 🏠 Platform Setup

### Unified Platform Operations

```bash
# Create a Mosque account
python manage.py create_mosque --name="Demo Masjid" --email="demo@masjid.org"

# Setup admin and data for a generic user
python manage.py createsuperuser
python manage.py seed_ledger --mosque="Demo Masjid"
```

---

## 📋 setup.sh Features

The interactive installer handles everything:

| Step | What It Does |
|------|--------------|
| 1. Environment Mode | Choose Development or Production (Docker) |
| 2. Platform Mode | Initializes unified platform mode |
| 3. Environment Config | Creates `.env` from template if missing |
| 4. Dependencies | Installs Python and Node.js packages |
| 5. Database Migrations | Runs Django migrations |
| 6. Base Setup | Sets up unified database |
| 7. Your Masjid | Registers the first initial Mosque |
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
3. Run migrations (`migrate`)
4. Restart services
**It will NOT interfere with your database or delete any platform data.**

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
