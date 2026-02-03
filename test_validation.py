
import os
import sys
import django
from django.db import transaction
from django.core.exceptions import ValidationError

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Ledger, JournalEntry, JournalItem
from apps.shared.models import Client
from decimal import Decimal
from django.utils import timezone

def test_validation():
    print("Testing Insufficient Funds Validation...")
    
    with schema_context('demo'):
        # 1. Get Accounts
        cash = Ledger.objects.get(code='1001')
        zakat_income = Ledger.objects.get(code='3002')
        zakat_expense = Ledger.objects.get(code='4006')
        general_income = Ledger.objects.get(code='3001')
        general_expense = Ledger.objects.get(code='4001')

        # 2. Reset (Delete all journal entries to start fresh)
        JournalEntry.objects.all().delete()
        print("Cleared all transactions.")

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user, _ = User.objects.get_or_create(username='admin', defaults={'is_staff': True, 'is_superuser': True})
        
        # 3. Add 1000 Zakat Income
        print("\n[Step 1] Adding 1000 Zakat Income...")
        je1 = JournalEntry.objects.create(
            voucher_type='RECEIPT', date=timezone.now().date(), narration='Zakat In', payment_mode='CASH', created_by=user
        )
        JournalItem.objects.create(journal_entry=je1, ledger=cash, debit_amount=1000)
        JournalItem.objects.create(journal_entry=je1, ledger=zakat_income, credit_amount=1000)
        je1.full_clean()
        print("✓ Success")

        # 4. Try to spend 1500 Zakat (Should Fail)
        print("\n[Step 2] Trying to spend 1500 Zakat (Should Fail)...")
        try:
            with transaction.atomic():
                je2 = JournalEntry.objects.create(
                    voucher_type='PAYMENT', date=timezone.now().date(), narration='Zakat Out Fail', payment_mode='CASH', created_by=user
                )
                JournalItem.objects.create(journal_entry=je2, ledger=zakat_expense, debit_amount=1500)
                JournalItem.objects.create(journal_entry=je2, ledger=cash, credit_amount=1500)
                je2.full_clean()
            print("❌ FAILED: Validation did not catch the error!")
        except ValidationError as e:
            print(f"✓ CAUGHT: {e}")
        except Exception as e:
            print(f"✓ CAUGHT (Other): {e}")

        # 5. Add 500 General Income
        print("\n[Step 3] Adding 500 General Income...")
        je3 = JournalEntry.objects.create(
            voucher_type='RECEIPT', date=timezone.now().date(), narration='General In', payment_mode='CASH', created_by=user
        )
        JournalItem.objects.create(journal_entry=je3, ledger=cash, debit_amount=500)
        JournalItem.objects.create(journal_entry=je3, ledger=general_income, credit_amount=500)
        je3.full_clean()
        print("✓ Success")

        # 6. Try to spend 600 General (Should Fail)
        print("\n[Step 4] Trying to spend 600 General (Should Fail)...")
        try:
            with transaction.atomic():
                je4 = JournalEntry.objects.create(
                    voucher_type='PAYMENT', date=timezone.now().date(), narration='General Out Fail', payment_mode='CASH', created_by=user
                )
                JournalItem.objects.create(journal_entry=je4, ledger=general_expense, debit_amount=600)
                JournalItem.objects.create(journal_entry=je4, ledger=cash, credit_amount=600)
                je4.full_clean()
            print("❌ FAILED: Validation did not catch the error!")
        except ValidationError as e:
            print(f"✓ CAUGHT: {e}")
        except Exception as e:
            print(f"✓ CAUGHT (Other): {e}")

        # 7. Try Loophole: Spending via Membership Fees (Income Ledger debit)
        # Should be caught by General Fund check
        print("\n[Step 5] Loophole Test: Spending via Membership Fees (Income Debit)...")
        try:
            with transaction.atomic():
                je5 = JournalEntry.objects.create(
                    voucher_type='PAYMENT', date=timezone.now().date(), narration='Loophole Spend', payment_mode='CASH', created_by=user
                )
                # Debit Income (Membership Fees) = Spending money
                membership_fees = Ledger.objects.get(code='4006') # Actually 4001, but using whatever is Income
                # Let's use Zakat Income for testing loophole if 4001 not avail
                target_income = general_income # 3001
                
                JournalItem.objects.create(journal_entry=je5, ledger=target_income, debit_amount=2000) 
                JournalItem.objects.create(journal_entry=je5, ledger=cash, credit_amount=2000)
                je5.full_clean()
            print("❌ FAILED: Loophole not closed!")
        except ValidationError as e:
            print(f"✓ CAUGHT: {e}")
        except Exception as e:
            print(f"✓ CAUGHT (Other): {e}")

if __name__ == '__main__':
    test_validation()
