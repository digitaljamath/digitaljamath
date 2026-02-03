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
        print("Starting Data Fix for Panambur (Part 2)...")
        
        # 1. Create Maintenance Expense Ledger
        maint_ledger, created = Ledger.objects.get_or_create(
            code='5002',
            defaults={
                'name': 'Maintenance & Repairs',
                'account_type': 'EXPENSE',
                'is_active': True,
                'is_system': True
            }
        )
        print(f"{'Created' if created else 'Found'} Ledger: {maint_ledger}")

        bank_ledger = Ledger.objects.get(code='1001')

        # 2. Find and Delete Bad Vouchers
        bad_vouchers = JournalEntry.objects.filter(voucher_number__in=['PAY-2026-003', 'PAY-2026-004'])
        deleted_count = bad_vouchers.count()
        bad_vouchers.delete()
        print(f"Deleted {deleted_count} bad vouchers.")

        # 3. Create Correct Vouchers
        # PAY-2026-003 (100 for bulb)
        v3 = JournalEntry.objects.create(
            voucher_number='PAY-2026-003',
            voucher_type='PAYMENT',
            date=timezone.now().date(),
            narration='for bulb',
            payment_mode='CASH'
        )
        JournalItem.objects.create(journal_entry=v3, ledger=maint_ledger, debit_amount=100, credit_amount=0)
        JournalItem.objects.create(journal_entry=v3, ledger=bank_ledger, debit_amount=0, credit_amount=100)
        
        # PAY-2026-004 (1000 for wiring)
        v4 = JournalEntry.objects.create(
            voucher_number='PAY-2026-004',
            voucher_type='PAYMENT',
            date=timezone.now().date(),
            narration='For the wiring',
            payment_mode='CASH'
        )
        JournalItem.objects.create(journal_entry=v4, ledger=maint_ledger, debit_amount=1000, credit_amount=0)
        JournalItem.objects.create(journal_entry=v4, ledger=bank_ledger, debit_amount=0, credit_amount=1000)

        print("Created 2 Correct Payment Vouchers (003, 004).")
        
        # FINAL BALANCE CHECK
        l = Ledger.objects.get(code='1001')
        print(f"Final 1001 Balance: {l.balance}")
        print("Done.")

if __name__ == '__main__':
    fix_data()
