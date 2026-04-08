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

# 2. Select Tenant Mode
echo ""
echo "Select Tenant Mode:"
echo "  1) Multi-Tenant (SaaS - multiple masjids with subdomains)"
echo "  2) Single-Tenant (Self-Hosted - one masjid, simple setup)"
read -p "Enter choice [1]: " TENANT_MODE
TENANT_MODE=${TENANT_MODE:-1}

# If single-tenant, get masjid details
if [[ "$TENANT_MODE" == "2" ]]; then
    echo ""
    echo "📋 Single Masjid Setup"
    read -p "Enter your Masjid name: " MASJID_NAME
    MASJID_NAME=${MASJID_NAME:-"My Masjid"}
    
    read -p "Enter your domain (e.g., masjid.org or localhost): " MASJID_DOMAIN
    MASJID_DOMAIN=${MASJID_DOMAIN:-"localhost"}
    
    # Create a schema-safe name from masjid name
    SCHEMA_NAME=$(echo "$MASJID_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -cd '[:alnum:]_')
    SCHEMA_NAME=${SCHEMA_NAME:-"mymasjid"}
    
    echo "✅ Will create: $MASJID_NAME at $MASJID_DOMAIN (schema: $SCHEMA_NAME)"
fi

# 3. Check Prerequisites
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

# 4. Environment Config
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
    
    # 5. Python Environment
    echo "[3/8] Setting up Python environment..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "Created virtual environment."
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    echo "✅ Python dependencies installed."

    # 6. Frontend Setup
    echo "[4/8] Installing Frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ F    # 7. Database Migrations
    echo "[5/8] Running Database Migrations..."
    python manage.py makemigrations
    python manage.py migrate_schemas --shared
    echo "✅ Migrations applied."

    # 8. Public Tenant Setup
    echo "[6/8] Verifying Public Tenant..."
    python manage.py shell < scripts/create_tenant.py

    # 9. Superuser Setup
    echo "[7/8] Superuser Setup..."
    python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(is_superuser=True).exists():
    print('⚠️ No superuser found. Please create one now:')
else:
    print('✅ Superuser exists.')
"

    # 10. Tenant Setup based on mode
    if [[ "$TENANT_MODE" == "2" ]]; then
        # Single-Tenant: Create the user's masjid
        echo "[8/8] Creating Your Masjid..."
        python manage.py shell -c "
from apps.shared.models import Client, Domain

# Check if tenant already exists
if not Client.objects.filter(schema_name='$SCHEMA_NAME').exists():
    tenant = Client(
        schema_name='$SCHEMA_NAME',
        name='$MASJID_NAME',
        on_trial=False,
    )
    tenant.save()
    Domain.objects.create(domain='$MASJID_DOMAIN', tenant=tenant, is_primary=True)
    print('✅ Created masjid: $MASJID_NAME')
else:
    print('✅ Masjid already exists: $MASJID_NAME')
"
        # Seed Chart of Accounts
        echo "🏦 Seeding Chart of Accounts..."
        python manage.py tenant_command seed_ledger --schema=$SCHEMA_NAME
        
        # Create superuser for the tenant
        echo "👤 Create admin user for your masjid:"
        python manage.py tenant_command createsuperuser --schema=$SCHEMA_NAME
        
        echo "✅ Single Masjid Setup Complete!"
    else
        # Multi-Tenant: Offer demo setup
        echo "=============================================="
        read -p "❓ Do you want to set up a DEMO Tenant? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            python manage.py setup_demo
            echo "🏦 Seeding Chart of Accounts..."
            python manage.py seed_ledger
            echo "✅ Demo Setup Complete (with Chart of Accounts)."
        fi
    fi

    echo "=============================================="
    echo "🎉 Development Setup Complete!"
    echo "To run:"
    echo "  1. python manage.py runserver"
    echo "  2. cd frontend && npm run dev"
    echo ""
    if [[ "$TENANT_MODE" == "2" ]]; then
        echo "🏠 Access your masjid at: http://$MASJID_DOMAIN:8000"
    else
        echo "💡 Tip: If accounting dropdowns are empty, run:"
        echo "   python manage.py seed_ledger"
    fi
re empty, run:"
        echo "   python manage.py seed_ledger"
    fi

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
    
    # Tenant Setup based on mode
    if [[ "$TENANT_MODE" == "2" ]]; then
        # Single-Tenant: Create the user's masjid
        echo "[8/8] Creating Your Masjid..."
        docker-compose exec web python manage.py shell -c "
from apps.shared.models import Client, Domain

if not Client.objects.filter(schema_name='$SCHEMA_NAME').exists():
    tenant = Client(
        schema_name='$SCHEMA_NAME',
        name='$MASJID_NAME',
        on_trial=False,
    )
    tenant.save()
    Domain.objects.create(domain='$MASJID_DOMAIN', tenant=tenant, is_primary=True)
    print('✅ Created masjid: $MASJID_NAME')
else:
    print('✅ Masjid already exists: $MASJID_NAME')
"
        # Seed Chart of Accounts
        echo "🏦 Seeding Chart of Accounts..."
        docker-compose exec web python manage.py tenant_command seed_ledger --schema=$SCHEMA_NAME
        
        # Create superuser for the tenant
        echo "👤 Create admin user for your masjid:"
        docker-compose exec -it web python manage.py tenant_command createsuperuser --schema=$SCHEMA_NAME
        
        echo "✅ Single Masjid Setup Complete!"
    else
        # Multi-Tenant: Offer demo setup
        echo "=============================================="
        read -p "❓ Do you want to set up a DEMO Tenant with dummy data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🚀 Setting up Demo Tenant (in container)..."
            docker-compose exec web python manage.py setup_demo
            echo "🏦 Seeding Chart of Accounts..."
            docker-compose exec web python manage.py tenant_command seed_ledger --schema=jama_blr
            echo "✅ Demo Setup Complete (with Chart of Accounts)."
        fi
    fi
    
    echo "=============================================="
    echo "🎉 Production Setup Complete!"
    echo ""
    if [[ "$TENANT_MODE" == "2" ]]; then
        echo "🏠 Single Masjid Mode - Your app is running!"
        echo "   Access: https://$MASJID_DOMAIN"
        echo ""
        echo "   No subdomains needed - just use your main domain!"
    else
        echo "Your app is running! Next steps:"
        echo "  1. CRITICAL: Configure 'DOMAIN_NAME' in .env (e.g., example.com)"
        echo "  2. Set up DNS (see DEPLOYMENT.md)"
        echo "  3. Visit https://your-domain.com"
        echo ""
        echo "Demo Login: demo / demo123"
    fi
    echo ""
    echo "💡 Tip: For new tenants, seed the Chart of Accounts:"
    echo "   docker exec -it digitaljamath_web python manage.py tenant_command seed_ledger --schema=<schema_name>"
fi

