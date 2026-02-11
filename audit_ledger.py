
import os
import django
from decimal import Decimal
from django.core.exceptions import ValidationError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry, JournalItem, Ledger
from django.db import connection, transaction

def run_audit():
    connection.set_schema('demo')
    print("=== STARTING CA AUDIT ===")

    # 1. Setup Accounts
    cash = Ledger.objects.get(code='1001') # Asset
    bank = Ledger.objects.get(code='1002') # Asset
    
    gen_income = Ledger.objects.get(code='3001') # Income (General)
    zakat_income = Ledger.objects.get(code='3002') # Income (Zakat)
    
    gen_expense = Ledger.objects.get(code='4001') # Expense (General)
    zakat_expense = Ledger.objects.get(code='4006') # Expense (Zakat)

    print(f"Audit Date: {django.utils.timezone.now().date()}")

    # Scenario A: Standard Receipt (Correct)
    print("\n[TEST A] Standard Receipt (Income: 5000)")
    try:
        with transaction.atomic():
            je = JournalEntry.objects.create(
                voucher_type='RECEIPT',
                date='2026-03-01',
                narration='Audit Test: Gen Donation'
            )
            # Dr Cash, Cr Income
            JournalItem.objects.create(journal_entry=je, ledger=cash, debit_amount=5000)
            JournalItem.objects.create(journal_entry=je, ledger=gen_income, credit_amount=5000)
            je.clean() # Run validation
            print("  -> PASSED: Entry Recorded.")
    except Exception as e:
        print(f"  -> FAILED: {e}")

    # Scenario B: "User Error" Payment (Debiting Asset in Payment)
    # The user previously did: Debit Bank 10k, Credit Expense 10k.
    # We want to see if the system ALLOWS this illogical entry.
    print("\n[TEST B] User Error: 'Reverse' Payment (Dr Bank, Cr Expense)")
    try:
        with transaction.atomic():
            je = JournalEntry.objects.create(
                voucher_type='PAYMENT',
                date='2026-03-02',
                narration='Audit Test: Bad Payment'
            )
            # Dr Bank (Wrong for payment usually), Cr Expense (Wrong, negative expense)
            JournalItem.objects.create(journal_entry=je, ledger=bank, debit_amount=1000)
            JournalItem.objects.create(journal_entry=je, ledger=gen_expense, credit_amount=1000)
            
            je.clean() 
            print("  -> WARNING: System ACCEPTED this illogical entry. Needs Validation Rule.")
    except ValidationError as e:
        print(f"  -> PASSED: System Blocked it: {e}")
    except Exception as e:
        print(f"  -> FAILED with error: {e}")

    # Scenario C: Fund Violation (Using Zakat to pay General Expense)
    print("\n[TEST C] Fund Violation: Pay General Bill using Zakat Fund")
    try:
        with transaction.atomic():
            je = JournalEntry.objects.create(
                voucher_type='PAYMENT',
                date='2026-03-03',
                narration='Audit Test: Zakat Misuse'
            )
            # Dr General Expense (General Fund), Cr Zakat Cash (Zakat Fund) assuming we have a Zakat Cash account
            # NOTE: In our current setup, we might verify if Zakat Cash exists.
            zakat_cash = Ledger.objects.filter(fund_type='ZAKAT', account_type='ASSET').first()
            
            if not zakat_cash:
                print("  -> SKIPPED: No specific Zakat Asset account found to test mixing.")
            else:
                JournalItem.objects.create(journal_entry=je, ledger=gen_expense, debit_amount=500)
                JournalItem.objects.create(journal_entry=je, ledger=zakat_cash, credit_amount=500)
                je.clean()
                print("  -> FAILURE: System allowed mixing Zakat Asset for General Expense!")
    except ValidationError as e:
        print(f"  -> PASSED: System Blocked it request: {e}")


if __name__ == '__main__':
    run_audit()
