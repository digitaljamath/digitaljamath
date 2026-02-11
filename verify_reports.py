
import os
import django
import sys
from decimal import Decimal
from django.db import connection, transaction
from django.db.models import Sum, Q

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry, JournalItem, Ledger

def verify_reports():
    connection.set_schema('demo')
    print("=== VERIFYING FINANCIAL REPORTS ===")
    
    # 1. Income Statement
    print("  -> Calculating Income Statement...")
    inc = JournalItem.objects.filter(ledger__account_type='INCOME').aggregate(
        cr=Sum('credit_amount'), dr=Sum('debit_amount')
    )
    total_inc = (inc['cr'] or 0) - (inc['dr'] or 0)
    
    exp = JournalItem.objects.filter(ledger__account_type='EXPENSE').aggregate(
        dr=Sum('debit_amount'), cr=Sum('credit_amount')
    )
    total_exp = (exp['dr'] or 0) - (exp['cr'] or 0)
    
    surplus = total_inc - total_exp
    print(f"     Income:  {total_inc}")
    print(f"     Expense: {total_exp}")
    print(f"     Surplus: {surplus}")

    # 2. Balance Sheet
    print("  -> Calculating Balance Sheet...")
    
    assets = JournalItem.objects.filter(ledger__account_type='ASSET').aggregate(
        dr=Sum('debit_amount'), cr=Sum('credit_amount')
    )
    total_assets = (assets['dr'] or 0) - (assets['cr'] or 0)
    
    liabilities = JournalItem.objects.filter(ledger__account_type='LIABILITY').aggregate(
        cr=Sum('credit_amount'), dr=Sum('debit_amount')
    )
    total_liabilities = (liabilities['cr'] or 0) - (liabilities['dr'] or 0)
    
    equity = JournalItem.objects.filter(ledger__account_type='EQUITY').aggregate(
        cr=Sum('credit_amount'), dr=Sum('debit_amount')
    )
    total_equity = (equity['cr'] or 0) - (equity['dr'] or 0)
    
    # 3. Check Accounting Equation
    # Assets = Liabilities + Equity + Surplus
    print(f"     Assets:      {total_assets}")
    print(f"     Liabilities: {total_liabilities}")
    print(f"     Equity:      {total_equity}")
    print(f"     Surplus:     {surplus}")
    
    rhs = total_liabilities + total_equity + surplus
    
    print("-" * 30)
    if total_assets == rhs:
         print("✅ BALANCE SHEET MATCHED! (Assets = Liab + Equity + Surplus)")
    else:
         print(f"❌ BALANCE SHEET MISMATCH ({total_assets - rhs})")

if __name__ == '__main__':
    verify_reports()
