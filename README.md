# Project Mizan

**Project Mizan** is an open-source, production-grade SaaS ERP for Indian Masjids, designed with strict compliance (FCRA, 80G) and community trust in mind.

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
# Project Mizan - Digital Ummah Ecosystem / Digital Jamath Portal

<p align="center">
  <img src="frontend/public/images/logo.png" alt="Project Mizan Logo" width="200" onerror="this.style.display='none'"/>
</p>

**Project Mizan** is a comprehensive, open-source platform designed to digitize and manage community operations for Mosques (Masjids), Jamaths, and Welfare organizations. It provides a robust multi-tenant architecture to handle census data, financial management (Baitul Maal), welfare distribution, and community engagement.

Built with **Django (backend)** and **Next.js (frontend)**, it emphasizes data privacy, shariah compliance, and transparency.

---

## 🚀 Key Features

*   **Digital Census (Jamath Directory):** manage detailed household and member profiles.
*   **Baitul Maal (Finance):** Track donations, subscriptions, and expenses with transparency.
*   **Multi-Tenant Architecture:** Every Masjid gets its own isolated database schema and subdomain (e.g., `jamablr.mizan.com`).
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
*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI
*   **Icons:** Lucide React
*   **Charts:** Recharts

---

## 💻 System Requirements

To run Project Mizan effectively, we recommend the following minimum specifications:

*   **CPU:** 2 vCPUs (Recommended: 4 vCPUs for production)
*   **RAM:** 4GB (Recommended: 8GB)
*   **Storage:** 20GB SSD
*   **OS:** Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows (WSL2)

**Prerequisites:**
*   Docker & Docker Compose (Recommended for easy setup)
*   Python 3.11+
*   Node.js 18+ (LTS)
*   PostgreSQL 15+

---

## 🚀 Quick Start Guide

### Option 1: Docker (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/project_mizan.git
    cd project_mizan
    ```

2.  **Setup Environment Variables:**
    Copy the example env file:
    ```bash
    cp .env.example .env
    ```
    *Update `.env` with your DB credentials and email settings.*

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *This will spin up the Backend (Django), Frontend (Next.js), and PostgreSQL database.*

4.  **Access the App:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:8000/api`
    *   **Admin Panel:** `http://localhost:8000/admin`

---

### Option 2: Manual Setup

#### 1. Backend Setup (Django)

```bash
# Navigate to project root
cd project_mizan

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup .env
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run Migrations (handling multi-tenancy)
python manage.py migrate_schemas --shared
python manage.py migrate_schemas --tenant

# Create Superuser (for public schema)
python manage.py createsuperuser

# Start Server
python manage.py runserver 0.0.0.0:8000
```

#### 2. Frontend Setup (Next.js)

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
```

---

## ⚙️ Configuration (.env)

The `.env` file controls your environment. Key variables include:

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Toggle debug mode (False for prod) | `True` |
| `SECRET_KEY` | Django secret key | *random* |
| `DATABASE_URL` | Postgres connection string | `postgres://...` |
| `BREVO_SMTP_KEY` | Email provider API Key (Brevo) | - |
| `DEFAULT_FROM_EMAIL` | Sender email address | `noreply@...` |

**Security Note:** Never commit your `.env` file to version control.

---

## 📦 Multi-Tenancy Explanation

Project Mizan uses **Schema Isolation**.
*   **Public Schema:** Stores tenant info (`Client`) and domain mapping (`Domain`).
*   **Tenant Schemas:** Each Masjid gets a schema (e.g., `jama_blr`) containing its own `users`, `households`, `transactions` tables.

**To create a new tenant (Masjid):**
1.  Log in to the Django Admin (`/admin`) on the public domain.
2.  Go to **Clients** -> **Add Client**.
3.  Enter schema name (user-friendly, no spaces) and domain (e.g., `masjid1.localhost`).
4.  Save. This automatically triggers migrations for the new schema.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

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
