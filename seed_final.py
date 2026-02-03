import os
import sys
import django

# Setup Django
BASE_DIR = '/Users/hayeef/.gemini/antigravity/scratch/digitaljamath'
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Masjid, Ledger
from django.db import connection

LOG_FILE = os.path.join(BASE_DIR, 'seed_final_report.txt')

def log(msg):
    print(msg)
    with open(LOG_FILE, 'a') as f:
        f.write(msg + '\n')

if os.path.exists(LOG_FILE):
    os.remove(LOG_FILE)

log("--- LEDGER SEED REPORT ---")
log(f"Current Schema: {connection.schema_name}")

try:
    demo = Masjid.objects.get(schema_name='demo')
    log(f"Found Demo Tenant: {demo.name}")
except Exception as e:
    log(f"ERROR finding demo tenant: {str(e)}")
    sys.exit(1)

log("\nEntering demo schema context...")
with schema_context('demo'):
    log(f"Switched to Schema: {connection.schema_name}")
    
    # Check if table exists
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT to_regclass('jamath_ledger')")
        table_exists = cursor.fetchone()[0]
        log(f"Table jamath_ledger exists: {table_exists is not None}")
    
    if table_exists:
        AT = Ledger.AccountType
        FT = Ledger.FundType
        
        seeds = [
            ('1001', 'Cash in Hand', AT.ASSET, None),
            ('3001', 'Donation - General', AT.INCOME, FT.UNRESTRICTED_GENERAL),
            ('3002', 'Donation - Zakat', AT.INCOME, FT.RESTRICTED_ZAKAT),
            ('4001', 'Electricity', AT.EXPENSE, FT.UNRESTRICTED_GENERAL),
            ('4006', 'Zakat Distribution', AT.EXPENSE, FT.RESTRICTED_ZAKAT),
        ]
        
        for code, name, atype, ftype in seeds:
            obj, created = Ledger.objects.get_or_create(
                code=code,
                defaults={'name': name, 'account_type': atype, 'fund_type': ftype, 'is_system': True}
            )
            log(f"{'CREATED' if created else 'EXISTS '}: {code} - {name}")
            
        final_count = Ledger.objects.count()
        log(f"\nTotal ledgers in demo: {final_count}")
    else:
        log("ERROR: Table jamath_ledger not found in demo schema!")

log("\n--- END OF REPORT ---")
