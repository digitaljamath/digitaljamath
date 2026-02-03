
import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Ledger
from apps.shared.models import Client

def check_ledger_types():
    tenants = Client.objects.all()
    print(f"Found {tenants.count()} tenants.")

    for tenant in tenants:
        print(f"\n--- Checking Schema: {tenant.schema_name} ({tenant.name}) ---")
        with schema_context(tenant.schema_name):
            ledgers = Ledger.objects.filter(account_type=Ledger.AccountType.ASSET)
            for l in ledgers:
                print(f"  Code: {l.code} | Name: {l.name:<25} | Funds: {l.fund_type or 'General'}")

if __name__ == '__main__':
    check_ledger_types()
