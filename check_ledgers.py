import os
import sys
import django
from django.db import connection

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Ledger
from apps.shared.models import Client

def check_ledgers():
    tenants = Client.objects.all()
    print(f"Found {tenants.count()} tenants.")

    for tenant in tenants:
        print(f"\n--- Checking Schema: {tenant.schema_name} ({tenant.name}) ---")
        with schema_context(tenant.schema_name):
            ledgers = Ledger.objects.filter(code__in=['3002', '4006'])
            if not ledgers.exists():
                print(f"  [ERROR] Zakat Ledgers MISSING in {tenant.schema_name}")
            else:
                for l in ledgers:
                    print(f"  [OK] Found {l.code} - {l.name} (Active: {l.is_active}, Fund: {l.fund_type}, Type: {l.account_type})")

if __name__ == '__main__':
    check_ledgers()
