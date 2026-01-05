# Deployment Guide (Production)

This guide explains how to deploy **DigitalJamath** to a production server (like Linode, DigitalOcean, or AWS EC2) using Docker.

## 1. Initial Server Setup
*Assumes you have a fresh Ubuntu 22.04 LTS server.*

### Step 1: Install Essentials
SSH into your server and install Git, Docker, and Docker Compose:
```bash
ssh root@<your-server-ip>
sudo apt update
sudo apt install -y git docker.io docker-compose
```

---

## 2. Install Project
Clone the repository and run the setup script:

```bash
# Clone
git clone https://github.com/azzaxp/digitaljamath.git
cd digitaljamath

# Configure
cp .env.example .env
nano .env  # MUST set DOMAIN_NAME and DATABASE_PASSWORD
```

### Option A: Standard Setup (Pre-built Images - Recommended)
This is the fastest way to get core services running.
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option B: Interactive Setup (Legacy)
```bash
./setup.sh
```

---

## 3. Configuration (Critical!)
Edit the `.env` file to match your domain and security settings:

```bash
nano .env
```

Set these values:
```env
# Security
SECRET_KEY=change-this-to-something-secure
DEBUG=False
ALLOWED_HOSTS=.digitaljamath.com  # Start with dot for wildcard support

# Domain
DOMAIN_NAME=digitaljamath.com

# Database (Strong Password)
DATABASE_PASSWORD=YourStrongPasswordHere

# Email (Brevo)
BREVO_EMAIL_USER=your-email
BREVO_SMTP_KEY=your-smtp-key
```

### Apply Changes
If you edit `.env` after running setup, restart containers:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. DNS Configuration (Cloudflare)
Go to your Cloudflare Dashboard -> **DNS** and add these records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `<Your-Server-IP>` | **Proxied** (Orange Cloud) |
| A | `*` | `<Your-Server-IP>` | **Proxied** (Orange Cloud) |
| A | `www` | `<Your-Server-IP>` | **Proxied** (Orange Cloud) |

### SSL/TLS Setting (Important!)
Since our standard Docker setup uses **Nginx on Port 80**, you must set Cloudflare SSL to **Flexible**:

1. Go to **SSL/TLS** -> **Overview**.
2. Set mode to **Flexible** (Not Full/Strict).
   *   *Full/Strict requires installing certs on the server, which is more complex.*

---

## 5. Verification
Wait 1-2 minutes for DNS to propagate.

1. **Frontend**: Visit `https://digitaljamath.com`.
2. **Demo Portal**: Visit `https://demo.digitaljamath.com`.
3. **Admin Panel**: Visit `https://digitaljamath.com/admin/`.

---

## 6. Maintenance Commands

### Create Superuser
```bash
docker-compose exec web python manage.py createsuperuser
```

### View Logs
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f frontend
```

### Safe Update (Recommended)
This script will pull the latest code, rebuild containers, and run migrations **without** deleting your data.
```bash
cd ~/workspace/digitaljamath
./deploy.sh
```

### Automated Updates
This project relies on GitHub Actions. Pushing to `main` will automatically deploy updates to the server safely.

