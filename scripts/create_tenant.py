import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_mizan.settings")
django.setup()

from apps.shared.models import Client, Domain

def create_public_tenant():
    tenant = None
    if Client.objects.filter(schema_name='public').exists():
        print("Public tenant already exists.")
        tenant = Client.objects.get(schema_name='public')
    else:
        print("Creating Public Tenant...")
        tenant = Client(schema_name='public', name='System Admin')
        tenant.save()

        domain = Domain()
        domain.domain = 'localhost' # or your production domain
        domain.tenant = tenant
        domain.is_primary = True
        domain.save()
        print("Public Tenant and Domain (localhost) created.")
    
    # Add 127.0.0.1 alias if missing
    if not Domain.objects.filter(domain='127.0.0.1').exists():
        print("Adding 127.0.0.1 alias...")
        domain_ip = Domain()
        domain_ip.domain = '127.0.0.1'
        domain_ip.tenant = tenant
        domain_ip.is_primary = False
        domain_ip.save()
        
    print("Public Tenant configuration complete (Domains: localhost, 127.0.0.1).")

if __name__ == "__main__":
    create_public_tenant()
