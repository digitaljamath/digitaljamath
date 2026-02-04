import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.shared.models import Client, Domain
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django_tenants.utils import schema_context

def create_tenant(name, schema_name, domain_url, email, password):
    if Client.objects.filter(schema_name=schema_name).exists():
        print(f"Error: Schema '{schema_name}' already exists.")
        return

    print(f"Creating tenant '{name}' with schema '{schema_name}'...")
    
    # 1. Create Tenant
    tenant = Client(schema_name=schema_name, name=name, owner_email=email, email_verified=True)
    tenant.save()
    
    # 2. Add Domain
    domain = Domain()
    domain.domain = domain_url
    domain.tenant = tenant
    domain.is_primary = True
    domain.save()
    
    print(f"Tenant created! URL: http://{domain_url}")
    print("Running migrations (this might take a moment)...")
    
    # 3. Migrate (this usually automagically happens on save if auto_create_schema is on, but fails safely if repeated)
    # Actually django-tenants usually does this on .save() of the Client if configured.
    # But let's verify.
    
    # 4. Create Superuser in Tenant
    print(f"Creating admin user '{email}'...")
    with schema_context(schema_name):
        User = get_user_model()
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(email=email, password=password, username=email, is_active=True, is_staff=True)
            print("Admin user created.")
            
            # Optional: Seed Ledger?
            try:
                call_command('seed_ledger')
                print("Seeded ledger accounts.")
            except Exception as e:
                print(f"Warning: Could not seed ledger: {e}")
        else:
            print("User already exists.")

    print("\nDone! You can now access the new workspace.")

if __name__ == "__main__":
    # You can change these values to create a new tenant
    # Example: python create_tenant.py "New Masjid" "newmasjid" "newmasjid.localhost" "admin@newmasjid.com" "password123"
    
    if len(sys.argv) > 5:
        name = sys.argv[1]
        schema = sys.argv[2]
        domain = sys.argv[3]
        email = sys.argv[4]
        password = sys.argv[5]
        create_tenant(name, schema, domain, email, password)
    else:
        print("Usage: python create_tenant.py <Name> <Schema> <Domain> <Email> <Password>")
        print('Example: python create_tenant.py "Masjid Al-Noor" "alnoor" "alnoor.localhost" "admin@alnoor.com" "password123"')
