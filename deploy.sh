#!/bin/bash
# DigitalJamath Safe Deployment Script
# Usage: ./deploy.sh
# This script updates the application safely without wiping data.

set -e

echo "🚀 Starting Safe Deployment..."
echo "📅 Date: $(date)"

# 1. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Rebuild Containers (Safe - preserves volumes)
echo "🐳 Rebuilding containers..."
docker-compose up -d --build

# 3. Wait for DB
echo "⏳ Waiting for database..."
sleep 5

# 4. Run Migrations (Safe - schema updates only)
echo "🔄 Running database migrations..."
docker-compose exec -T web python manage.py migrate_schemas --shared

# 5. Collect Static Files
echo "🎨 Collecting static files..."
docker-compose exec -T web python manage.py collectstatic --noinput

# 6. Restart Services (Clear cache)
echo "♻️  Restarting services..."
docker-compose restart web worker

echo "✅ Deployment Complete! Your data is safe."
