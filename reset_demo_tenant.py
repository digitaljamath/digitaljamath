import os
import django
from django.conf import settings
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from apps.shared.models import Client, Domain
from django.contrib.auth.models import User
from django_tenants.utils import schema_context
from apps.shared.tasks import seed_standard_roles

def reset_demo():
    print("--- STARTING TENANT RESET ---")
    
    # 1. DELETE EXISTING TENANTS (Except Public)
    clients = Client.objects.all()
    for client in clients:
        if client.schema_name == 'public':
            print(f"Skipping Public Tenant: {client.name}")
            continue
        
        print(f"Deleting Tenant: {client.name} ({client.schema_name})...")
        # Ensure we delete the associated domain first if needed, but cascade usually handles it.
        # But strictly speaking, Client.delete() cascading drops the schema.
        try:
            client.delete(keep_parents=False) # forceful delete
            print(f"Deleted {client.schema_name}")
        except Exception as e:
            print(f"Error deleting {client.schema_name}: {e}")

    # 2. CREATE NEW DEMO TENANT
    print("\n--- CREATING NEW DEMO TENANT ---")
    demo_schema = 'demo'
    demo_domain = 'demo.localhost' # or demo.digitaljamath.com depending on env
    
    # Manually drop the schema to be absolutely sure
    from django.db import connection
    with connection.cursor() as cursor:
        print(f"Dropping schema {demo_schema} if exists...")
        cursor.execute(f"DROP SCHEMA IF EXISTS {demo_schema} CASCADE")

    # Check if exists (shouldn't)
    if Client.objects.filter(schema_name=demo_schema).exists():
        print("Demo tenant still exists? Deleting again...")
        Client.objects.filter(schema_name=demo_schema).delete()

    # Create Client
    demo_client = Client.objects.create(
        schema_name=demo_schema,
        name='Demo Jamath',
        owner_email='demo@digitaljamath.com', # Use a standard email
        allow_manual_ledger=True # Enable Manual Ledger for Demo
    )
    print("Created Demo Client")

    # Create Domain
    Domain.objects.create(
        domain=demo_domain,
        tenant=demo_client,
        is_primary=True
    )
    print(f"Created Domain: {demo_domain}")

    # 3. CREATE USERS & SEED DATA
    with schema_context(demo_schema):
        # Create Admin User
        admin_email = 'demo_admin@example.com'
        admin_password = 'Password123!' 
        
        user = User.objects.create_user(
            username=admin_email,
            email=admin_email,
            password=admin_password,
            is_staff=True,
            is_superuser=True
        )
        print(f"Created Admin User: {admin_email}")

        # Seed Ledger
        print("Seeding Ledger...")
        call_command('seed_ledger')

        # Seed Standard Roles
        print("Seeding Roles...")
        seed_standard_roles(demo_schema)

    print("\n--- DONE ---")
    print(f"Demo Tenant URL: http://{demo_domain}:8000")
    print(f"Admin Email: {admin_email}")
    print(f"Admin Password: {admin_password}")

if __name__ == "__main__":
    reset_demo()
