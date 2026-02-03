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
from decimal import Decimal
from django.utils import timezone

def fix_data():
    with schema_context('panambur'):
        print("Starting Data Fix for Panambur...")
        
        # 1. Create Electricity Expense Ledger
        elec_ledger, created = Ledger.objects.get_or_create(
            code='5001',
            defaults={
                'name': 'Electricity Charges',
                'account_type': 'EXPENSE',
                'is_active': True,
                'is_system': True
            }
        )
        if created:
            print(f"Created Ledger: {elec_ledger}")
        else:
            print(f"Found Ledger: {elec_ledger}")

        bank_ledger = Ledger.objects.get(code='1001')

        # 2. Find and Delete Bad Vouchers
        bad_vouchers = JournalEntry.objects.filter(voucher_number__in=['PAY-2026-001', 'PAY-2026-002'])
        deleted_count = bad_vouchers.count()
        bad_vouchers.delete()
        print(f"Deleted {deleted_count} bad vouchers.")

        # 3. Create Correct Vouchers
        # Payment 1
        v1 = JournalEntry.objects.create(
            voucher_number='PAY-2026-001',
            voucher_type='PAYMENT',
            date=timezone.now().date(),
            narration='Paid Electrician 1000 (Fixed)',
            payment_mode='CASH'
        )
        JournalItem.objects.create(journal_entry=v1, ledger=elec_ledger, debit_amount=1000, credit_amount=0)
        JournalItem.objects.create(journal_entry=v1, ledger=bank_ledger, debit_amount=0, credit_amount=1000)
        
        # Payment 2
        v2 = JournalEntry.objects.create(
            voucher_number='PAY-2026-002',
            voucher_type='PAYMENT',
            date=timezone.now().date(),
            narration='Paid Electrician 1000 (Fixed) 2',
            payment_mode='CASH'
        )
        JournalItem.objects.create(journal_entry=v2, ledger=elec_ledger, debit_amount=1000, credit_amount=0)
        JournalItem.objects.create(journal_entry=v2, ledger=bank_ledger, debit_amount=0, credit_amount=1000)

        print("Created 2 Correct Payment Vouchers.")
        print("Done.")

if __name__ == '__main__':
    fix_data()
