import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import get_tenant_model

def count_tenants():
    Tenant = get_tenant_model()
    tenants = Tenant.objects.all()
    print(f"Total Tenants: {tenants.count()}")
    print("-" * 20)
    for t in tenants:
        print(f"- {t.schema_name} (Domain: {t.domains.first().domain if t.domains.exists() else 'No Domain'})")

if __name__ == "__main__":
    count_tenants()
