
import os
import django
import sys
from django.db import connection

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import Ledger

def data_fix():
    connection.set_schema('demo')
    print("=== ENSURING MISCELLANEOUS ACCOUNT (4010) EXISTS ===")
    
    # Check parent
    try:
        parent = Ledger.objects.get(code='4000') # Expenses Parent
    except Ledger.DoesNotExist:
        print("Parent Account 4000 (Expenses) not found! Critical error.")
        return

    obj, created = Ledger.objects.get_or_create(
        code='4010',
        defaults={
            'name': 'Miscellaneous',
            'account_type': 'EXPENSE',
            'fund_type': 'GENERAL', # General Unrestricted
            'parent': parent,
            'is_system': True
        }
    )
    
    if created:
        print("✅ Created Account 4010 - Miscellaneous")
    else:
        print("✅ Account 4010 - Miscellaneous already exists")

if __name__ == '__main__':
    data_fix()
