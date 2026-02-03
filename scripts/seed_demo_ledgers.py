#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Masjid, Ledger

output = []

# Get demo tenant
try:
    tenant = Masjid.objects.get(schema_name='demo')
    output.append(f"✓ Found tenant: {tenant.name} (schema: demo)\n")
except Masjid.DoesNotExist:
    output.append("✗ Demo tenant not found!\n")
    with open('/tmp/seed_ledgers_output.txt', 'w') as f:
        f.write('\n'.join(output))
    sys.exit(1)

# Seed ledgers within the tenant's schema
with schema_context('demo'):
    AT = Ledger.AccountType
    FT = Ledger.FundType
    
    ledgers_data = [
        ('1001', 'Cash in Hand', AT.ASSET, None),
        ('1002', 'Bank Account - Primary', AT.ASSET, None),
        ('3001', 'Donation - General', AT.INCOME, FT.UNRESTRICTED_GENERAL),
        ('3002', 'Donation - Zakat', AT.INCOME, FT.RESTRICTED_ZAKAT),
        ('3005', 'Membership Fees', AT.INCOME, FT.UNRESTRICTED_GENERAL),
        ('4001', 'Electricity', AT.EXPENSE, FT.UNRESTRICTED_GENERAL),
        ('4002', 'Water & Sewage', AT.EXPENSE, FT.UNRESTRICTED_GENERAL),
        ('4003', 'Repairs & Maintenance', AT.EXPENSE, FT.UNRESTRICTED_GENERAL),
        ('4006', 'Zakat Distribution', AT.EXPENSE, FT.RESTRICTED_ZAKAT),
        ('4010', 'Miscellaneous', AT.EXPENSE, FT.UNRESTRICTED_GENERAL),
    ]
    
    output.append("\nSeeding ledgers...\n")
    created_count = 0
    exists_count = 0
    
    for code, name, account_type, fund_type in ledgers_data:
        ledger, created = Ledger.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'account_type': account_type,
                'fund_type': fund_type,
                'is_system': True,
                'balance': 0.00
            }
        )
        if created:
            output.append(f"  ✓ Created: {code} - {name}")
            created_count += 1
        else:
            output.append(f"  - Already exists: {code} - {name}")
            exists_count += 1
    
    #Verify
    total = Ledger.objects.count()
    output.append(f"\n{'='*50}")
    output.append(f"✓ Done! {created_count} created, {exists_count} existed")
    output.append(f"Total ledgers in demo schema: {total}")
    output.append(f"{'='*50}")
    output.append("\nYou can now add Zakat receipts!")

# Write to file
with open('/tmp/seed_ledgers_output.txt', 'w') as f:
    f.write('\n'.join(output))

# Also print to console
for line in output:
    print(line)
