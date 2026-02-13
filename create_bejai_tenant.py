import os
import django
import sys

# Setup Django environment
sys.path.append('/Users/hassanhayeef/Desktop/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.shared.models import Client, Domain
from django_tenants.utils import schema_context
from django.contrib.auth.models import User
from django.db import transaction

def create_tenant():
    schema_name = 'bejai'
    domain_url = 'bejai.localhost'
    email = 'admin@bejai.com'
    password = 'demo123'

    print(f"Creating tenant '{schema_name}'...")

    if Client.objects.filter(schema_name=schema_name).exists():
        print(f"Tenant '{schema_name}' already exists.")
        tenant = Client.objects.get(schema_name=schema_name)
    else:
        tenant = Client.objects.create(
            schema_name=schema_name,
            name='Bejai Jamath',
            owner_email=email,
            email_verified=True
        )
        print(f"Tenant '{schema_name}' created.")

    # Create Domain
    if not Domain.objects.filter(domain=domain_url).exists():
        Domain.objects.create(
            domain=domain_url,
            tenant=tenant,
            is_primary=True
        )
        print(f"Domain '{domain_url}' created.")
    else:
        print(f"Domain '{domain_url}' already exists.")

    # Create Admin User
    print("Creating admin user...")
    with schema_context(schema_name):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email=email,
                password=password
            )
            print(f"Superuser 'admin' created with password '{password}'")
        else:
            print("Superuser 'admin' already exists.")

        # Seed initial data (optional but good)
        from django.core.management import call_command
        try:
            print("Seeding ledger...")
            call_command('seed_ledger')
        except Exception as e:
            print(f"Ledger seeding skipped: {e}")

        try:
            from apps.shared.tasks import seed_standard_roles
            print("Seeding roles...")
            seed_standard_roles(schema_name)
        except Exception as e:
            print(f"Role seeding skipped: {e}")

    print("Done.")

if __name__ == '__main__':
    create_tenant()
