#!/bin/bash
# Reset DigitalJamath Demo Tenant
# This script re-runs migrations and re-seeds the demo data.
# Suggested Cron Job: 0 0 * * * /path/to/scripts/reset_demo.sh

echo "Starting Daily Demo Reset: $(date)"

# Get the script directory to find the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Run migrations (in case there are schema changes)
docker-compose exec -T web python manage.py migrate

# Re-run setup_demo (this updates existing data and ensures credentials match)
docker-compose exec -T web python manage.py setup_demo

# Run rich data population
docker-compose exec -T web python scripts/populate_demo_data.py

echo "Demo Reset Complete: $(date)"
