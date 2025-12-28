#!/bin/bash
set -e

# DigitalJamath Setup Script
# Handles dependencies, migrations, and initial tenant setup.

echo "=============================================="
echo "   🌙 DigitalJamath - One Click Installer     "
echo "=============================================="

# 1. Select Mode
echo "Select Installation Environment:"
echo "  1) Development (Localhost, Standard Django Runserver)"
echo "  2) Production (Docker, Gunicorn)"
read -p "Enter choice [1]: " INSTALL_MODE
INSTALL_MODE=${INSTALL_MODE:-1}

# 2. Check Prerequisites
echo "[1/8] Checking prerequisites..."
if [[ "$INSTALL_MODE" == "2" ]]; then
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Required for Production setup."
        exit 1
    fi
    echo "✅ Docker found."
else
    if ! command -v python3 &> /dev/null; then echo "❌ Python3 missing"; exit 1; fi
    if ! command -v node &> /dev/null; then echo "❌ Node.js missing"; exit 1; fi
    if ! command -v npm &> /dev/null; then echo "❌ npm missing"; exit 1; fi
    echo "✅ Dev tools found."
fi

# 3. Environment Config
echo "[2/8] Setting up Environment..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env. PLEASE EDIT IT with your credentials!"
    else
        echo "❌ .env.example missing! Please create .env manually."
        exit 1
    fi
else 
    echo "✅ .env file exists."
fi

if [[ "$INSTALL_MODE" == "1" ]]; then
    # DEVELOPMENT SETUP
    # =================
    
    # 4. Python Environment
    echo "[3/8] Setting up Python environment..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "Created virtual environment."
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    echo "✅ Python dependencies installed."

    # 5. Frontend Setup
    echo "[4/8] Installing Frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed."

    # 6. Database Migrations
    echo "[5/8] Running Database Migrations..."
    python manage.py makemigrations
    python manage.py migrate_schemas --shared
    echo "✅ Migrations applied."

    # 7. Public Tenant Setup
    echo "[6/8] Verifying Public Tenant..."
    python manage.py shell < scripts/create_tenant.py

    # 8. Superuser Setup
    echo "[7/8] Superuser Setup..."
    python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(is_superuser=True).exists():
    print('⚠️ No superuser found. Please create one now:')
else:
    print('✅ Superuser exists.')
"

    # 9. Demo Data
    echo "=============================================="
    read -p "❓ Do you want to set up a DEMO Tenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python manage.py setup_demo
        echo "✅ Demo Setup Complete."
    fi

    echo "=============================================="
    echo "🎉 Development Setup Complete!"
    echo "To run:"
    echo "  1. python manage.py runserver"
    echo "  2. cd frontend && npm run dev"

else
    # PRODUCTION SETUP (Docker)
    # =========================
    
    echo "[3/8] Building Docker Containers..."
    docker-compose up --build -d
    
    echo "[4/8] Waiting for Database..."
    sleep 5
    
    echo "[5/8] Running Migrations (in container)..."
    docker-compose exec web python manage.py migrate_schemas --shared
    
    echo "[6/8] Creating Public Tenant (in container)..."
    docker-compose exec web python scripts/create_tenant.py
    
    echo "[7/8] Collecting Static Files..."
    docker-compose exec web python manage.py collectstatic --noinput
    
    echo "=============================================="
    echo "🎉 Production Setup Complete!"
    echo "App running at http://localhost:8000"
fi

