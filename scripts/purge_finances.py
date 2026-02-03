import os
import sys
import django
from django.conf import settings

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from apps.jamath.models import Ledger, JournalEntry, JournalItem
from django_tenants.utils import schema_context

def purge_finances():
    with schema_context('panambur'):
        print("Starting Finance Purge for Panambur...")
        
        # Identify vouchers to KEEP
        keep_vouchers = ['RCP-2026-001', 'RCP-2026-002', 'RCP-2026-003']
        
        # Delete all others
        to_delete = JournalEntry.objects.exclude(voucher_number__in=keep_vouchers)
        count = to_delete.count()
        to_delete.delete()
        
        print(f"Deleted {count} vouchers.")
        
        # Final Verification
        remaining = JournalEntry.objects.all().order_by('voucher_number')
        print("Remaining Vouchers:")
        total = 0
        for v in remaining:
            print(f" - {v.voucher_number}: {v.total_amount}")
            total += v.total_amount
        
        print(f"Total Remaining Income: {total}")
        
        # Reset Ledger balances if needed (though they should be dynamic)
        # 1001 should now be 3600
        cash = Ledger.objects.get(code='1001')
        print(f"Final 1001 Balance: {cash.balance}")
        print("Done.")

if __name__ == '__main__':
    purge_finances()
