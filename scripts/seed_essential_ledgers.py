import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Masjid, Ledger

# Get the demo tenant
demo = Masjid.objects.filter(schema_name='demo').first()

if not demo:
    print("Demo tenant not found!")
    exit(1)

print(f"Seeding ledgers for: {demo.name} (schema: {demo.schema_name})")

with schema_context(demo.schema_name):
    # Check if ledgers already exist
    existing_count = Ledger.objects.count()
    print(f"Existing ledgers: {existing_count}")
    
    if existing_count > 0:
        print("Ledgers already exist. Checking for missing ones...")
        
        # Check for critical ledgers
        critical_codes = ['1001', '3001', '3002', '4001', '4006']
        for code in critical_codes:
            ledger = Ledger.objects.filter(code=code).first()
            if ledger:
                print(f"✓ {code}: {ledger.name}")
            else:
                print(f"✗ {code}: MISSING")
    
    # If no ledgers, seed them
    if existing_count == 0:
        print("No ledgers found. Creating default Chart of Accounts...")
        
        AT = Ledger.AccountType
        FT = Ledger.FundType
        
        ledgers_to_create = [
            # Assets
            {'code': '1001', 'name': 'Cash in Hand', 'type': AT.ASSET, 'fund': None},
            {'code': '1002', 'name': 'Bank Account - Primary', 'type': AT.ASSET, 'fund': None},
            
            # Income
            {'code': '3001', 'name': 'Donation - General', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '3002', 'name': 'Donation - Zakat', 'type': AT.INCOME, 'fund': FT.RESTRICTED_ZAKAT},
            {'code': '3005', 'name': 'Membership Fees', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
            
            # Expenses
            {'code': '4001', 'name': 'Electricity', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4002', 'name': 'Water & Sewage', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4003', 'name': 'Repairs & Maintenance', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4006', 'name': 'Zakat Distribution', 'type': AT.EXPENSE, 'fund': FT.RESTRICTED_ZAKAT},
        ]
        
        for ledger_data in ledgers_to_create:
            ledger = Ledger.objects.create(
                code=ledger_data['code'],
                name=ledger_data['name'],
                account_type=ledger_data['type'],
                fund_type=ledger_data['fund']
            )
            print(f"Created: {ledger.code} - {ledger.name}")
        
        print(f"\n✓ Successfully created {len(ledgers_to_create)} ledgers!")
    else:
        print("\nNote: To avoid duplicates, not creating new ledgers.")
        print("If you're missing specific ledgers, please add them manually or delete all and re-run this script.")

print("\nDone!")
