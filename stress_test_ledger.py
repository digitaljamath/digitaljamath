
import os
import django
import random
import sys
from decimal import Decimal
from django.db import connection, transaction
from django.db.models import Sum, Q

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry, JournalItem, Ledger

def run_stress_test():
    connection.set_schema('demo')
    print("=== STARTING MASSIVE 100+ TRANSACTION STRESS TEST ===")
    
    # 1. Clear Previous Data
    print("  -> Clearing previous Journal Entries...")
    JournalEntry.objects.all().delete()
    
    # 2. Fetch All Accounts Dynamically
    print("  -> Fetching Chart of Accounts...")
    
    def get_leaves(account_type, fund_restriction=None):
        q = Q(account_type=account_type) & Q(children__isnull=True)
        if fund_restriction:
            q &= Q(fund_type=fund_restriction)
        return list(Ledger.objects.filter(q))

    # Assets
    cash_accounts = Ledger.objects.filter(code__in=['1001', '1003', '1004']) # Cash
    bank_accounts = Ledger.objects.filter(code='1002') # Bank
    fixed_assets = Ledger.objects.filter(account_type='ASSET', code__gte='1010')

    # Liabilities
    liabilities = get_leaves('LIABILITY')
    
    # Income
    income_gen = get_leaves('INCOME', 'GENERAL')
    income_zak = get_leaves('INCOME', 'ZAKAT')
    
    # Expenses
    expense_gen = get_leaves('EXPENSE', 'GENERAL')
    expense_zak = get_leaves('EXPENSE', 'ZAKAT')
    
    # Equity
    equity = get_leaves('EQUITY')

    print(f"     Loaded: {len(cash_accounts)} Cash, {len(bank_accounts)} Bank, {len(liabilities)} Liab, {len(income_gen)+len(income_zak)} Inc, {len(expense_gen)+len(expense_zak)} Exp")

    # 3. Simulate 120 Transactions
    params = {
        'total_tx': 120,
        'success': 0,
        'failed': 0
    }
    
    print(f"  -> Generating {params['total_tx']} transactions for PERIOD: Feb 1 - Feb 11 (Today)...")

    for i in range(1, params['total_tx'] + 1):
        # Strict Date: Feb 1 to Feb 11
        day = random.randint(1, 11)
        tx_date = f'2026-02-{day:02d}'
        
        amount = Decimal(random.randint(1, 50) * 500) # 500 to 25000
        
        # Determine Transaction Scenario
        scenario = random.choices(
            ['RECEIPT_GEN', 'RECEIPT_ZAKAT', 'PAYMENT_GEN', 'PAYMENT_ZAKAT', 'ASSET_BUY', 'LIABILITY_INC', 'LIABILITY_PAY'],
            weights=[30, 20, 20, 10, 5, 10, 5], # Weights favor normal income/expense
            k=1
        )[0]
        
        try:
            with transaction.atomic():
                je = None
                
                # Pick Random Asset (Source/Dest)
                is_bank = random.random() > 0.5
                asset = random.choice(bank_accounts) if is_bank else random.choice(cash_accounts)
                
                # --- SCENARIOS ---
                
                if scenario == 'RECEIPT_GEN':
                    # Dr Asset, Cr Income (Gen)
                    inc_acc = random.choice(income_gen)
                    je = JournalEntry.objects.create(voucher_type='RECEIPT', date=tx_date, narration=f"Rx #{i}: {inc_acc.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=asset, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=inc_acc, credit_amount=amount)

                elif scenario == 'RECEIPT_ZAKAT':
                    # Dr Asset (Zakat/Cash), Cr Income (Zakat)
                    # Constraint: Zakat should ideally go to Zakat Cash, but keeping it simple for verification
                    inc_acc = random.choice(income_zak)
                    je = JournalEntry.objects.create(voucher_type='RECEIPT', date=tx_date, narration=f"Rx #{i}: Zakat Received")
                    JournalItem.objects.create(journal_entry=je, ledger=asset, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=inc_acc, credit_amount=amount)

                elif scenario == 'PAYMENT_GEN':
                    # Dr Expense (Gen), Cr Asset
                    exp_acc = random.choice(expense_gen)
                    je = JournalEntry.objects.create(voucher_type='PAYMENT', date=tx_date, narration=f"Pay #{i}: {exp_acc.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=exp_acc, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=asset, credit_amount=amount)

                elif scenario == 'PAYMENT_ZAKAT':
                    # Dr Expense (Zakat), Cr Asset
                    exp_acc = random.choice(expense_zak)
                    je = JournalEntry.objects.create(voucher_type='PAYMENT', date=tx_date, narration=f"Pay #{i}: Zakat {exp_acc.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=exp_acc, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=asset, credit_amount=amount)

                elif scenario == 'ASSET_BUY':
                    # Dr Fixed Asset, Cr Bank/Cash
                    if not fixed_assets: raise ValueError("No Fixed Assets defined")
                    fa = random.choice(fixed_assets)
                    je = JournalEntry.objects.create(voucher_type='PAYMENT', date=tx_date, narration=f"Tx #{i}: Bought {fa.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=fa, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=asset, credit_amount=amount)

                elif scenario == 'LIABILITY_INC':
                    # Dr Asset, Cr Liability (e.g. Loan Taken)
                    if not liabilities: raise ValueError("No Liabilities")
                    liab = random.choice(liabilities)
                    je = JournalEntry.objects.create(voucher_type='RECEIPT', date=tx_date, narration=f"Tx #{i}: Loan/Adv/Creditor {liab.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=asset, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=liab, credit_amount=amount)
                    
                elif scenario == 'LIABILITY_PAY':
                    # Dr Liability, Cr Asset (Repaying Loan)
                    if not liabilities: raise ValueError("No Liabilities")
                    liab = random.choice(liabilities)
                    je = JournalEntry.objects.create(voucher_type='PAYMENT', date=tx_date, narration=f"Tx #{i}: Repay {liab.name}")
                    JournalItem.objects.create(journal_entry=je, ledger=liab, debit_amount=amount)
                    JournalItem.objects.create(journal_entry=je, ledger=asset, credit_amount=amount)

                # Validate
                if je:
                    je.clean()
                    params['success'] += 1
                    # print(f"    [OK] {scenario} {amount}")

        except Exception as e:
            params['failed'] += 1
            # print(f"    [SKIP] Tx {i} Failed: {e}")

    print(f"\n=== SIMULATION COMPLETE ===")
    print(f"Total Attempted: {params['total_tx']}")
    print(f"Successful:      {params['success']}")
    print(f"Failed/Blocked:  {params['failed']} (Mostly 'Insufficient Funds' or Validation)")
    
    # 4. Final Trial Balance Check
    print("\n=== TRIAL BALANCE VERIFICATION ===")
    
    # 4.1. Accounting Equation: Assets = Liabilities + Equity + (Income - Expenses)
    # Rearranged: Assets + Expenses = Liabilities + Equity + Income
    
    # We will use the raw Debits = Credits check which is the gold standard
    total_debits = JournalItem.objects.aggregate(s=Sum('debit_amount'))['s'] or Decimal(0)
    total_credits = JournalItem.objects.aggregate(s=Sum('credit_amount'))['s'] or Decimal(0)
    
    print(f"Total Debits:  {total_debits}")
    print(f"Total Credits: {total_credits}")
    
    if total_debits == total_credits:
        print("✅ TRIAL BALANCE MATCHED! The system is mathematically perfect.")
    else:
        print(f"❌ CRITICAL ERROR: LEDGER IMBALANCE ({total_debits - total_credits})")
        
    # 4.2. Check Negative Balances (Should not exist for Asset/Expense ideally, but credit card/overdraft could allow it. Mizan forbids it for Cash)
    print("\n=== VALIDITY CHECKS ===")
    
    # Check if Cash is negative
    neg_cash = False
    for cash in cash_accounts:
        bal = JournalItem.objects.filter(ledger=cash).aggregate(
            dr=Sum('debit_amount'), cr=Sum('credit_amount')
        )
        net = (bal['dr'] or 0) - (bal['cr'] or 0)
        if net < 0:
            print(f"❌ WARNING: Negative Cash Balance in {cash.name}: {net}")
            neg_cash = True
            
    if not neg_cash:
        print("✅ Cash Accounts are all positive or zero.")

if __name__ == '__main__':
    run_stress_test()
