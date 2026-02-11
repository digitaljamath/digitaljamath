
import os
import django
import sys
from decimal import Decimal
from django.db import connection
from django.db.models import Sum

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalItem, Ledger

def explain_balance():
    connection.set_schema('demo')
    print("=== BREAKDOWN OF ASSETS ===")
    
    # Get all asset ledgers with non-zero balance
    assets = Ledger.objects.filter(account_type='ASSET')
    
    total_assets = Decimal(0)
    general_cash = Decimal(0)
    zakat_cash = Decimal(0)
    fixed_assets = Decimal(0)
    
    print(f"{'Account':<30} | {'Fund Type':<15} | {'Balance':<15}")
    print("-" * 65)
    
    for asset in assets:
        bal = JournalItem.objects.filter(ledger=asset).aggregate(
            dr=Sum('debit_amount'), cr=Sum('credit_amount')
        )
        net = (bal['dr'] or 0) - (bal['cr'] or 0)
        
        if net != 0:
            print(f"{asset.name:<30} | {str(asset.fund_type):<15} | {net:<15}")
            total_assets += net
            
            if asset.fund_type == 'ZAKAT':
                zakat_cash += net
            elif asset.code.startswith('101'): # Fixed Assets usually 1010
                fixed_assets += net
            else:
                general_cash += net

    print("-" * 65)
    print(f"TOTAL ASSETS:       {total_assets}")
    print(f"General Cash/Bank:  {general_cash}")
    print(f"Zakat (Restricted): {zakat_cash}")
    print(f"Fixed Assets:       {fixed_assets}")
    
    print("\n=== POSSIBLE DASHBOARD 'AVAILABLE' ===")
    print(f"General Only:       {general_cash}")
    print(f"General + Bank:     {general_cash} (Assuming all non-zakat/non-fixed is here)")
    print(f"All Cash (No Fixed):{general_cash + zakat_cash}")
    
    print("\n=== SURPLUS BREAKDOWN ===")
    
    # 1. Zakat Surplus
    z_inc = JournalItem.objects.filter(ledger__fund_type='ZAKAT', ledger__account_type='INCOME').aggregate(s=Sum('credit_amount'))['s'] or Decimal(0)
    z_exp = JournalItem.objects.filter(ledger__fund_type='ZAKAT', ledger__account_type='EXPENSE').aggregate(s=Sum('debit_amount'))['s'] or Decimal(0)
    z_surplus = z_inc - z_exp
    
    # 2. General Surplus
    g_inc = JournalItem.objects.filter(ledger__account_type='INCOME').exclude(ledger__fund_type='ZAKAT').aggregate(s=Sum('credit_amount'))['s'] or Decimal(0)
    g_exp = JournalItem.objects.filter(ledger__account_type='EXPENSE').exclude(ledger__fund_type='ZAKAT').aggregate(s=Sum('debit_amount'))['s'] or Decimal(0)
    g_surplus = g_inc - g_exp
    
    print(f"Zakat Surplus:   {z_surplus}")
    print(f"General Surplus: {g_surplus}")
    
    # 3. Reconciliation
    print("\n=== CASH FLOW RECONCILIATION ===")
    
    # Financing Activities (Liabilities)
    # Net Credit to Liability is Cash Inflow (Loan Taken)
    # Net Debit to Liability is Cash Outflow (Loan Repaid)
    liab_flow = JournalItem.objects.filter(ledger__account_type='LIABILITY').aggregate(
        cr=Sum('credit_amount'), dr=Sum('debit_amount')
    )
    net_financing = (liab_flow['cr'] or 0) - (liab_flow['dr'] or 0)
    
    # Investing Activities (Fixed Asset Purchase)
    # Net Debit to Asset (excluding Cash/Bank) is Purchase (Outflow)
    invest_flow = JournalItem.objects.filter(ledger__account_type='ASSET').exclude(
        ledger__code__in=['1001', '1002', '1003', '1004'] # Assuming Cash/Bank
    ).aggregate(
        dr=Sum('debit_amount'), cr=Sum('credit_amount')
    )
    net_investing = (invest_flow['dr'] or 0) - (invest_flow['cr'] or 0) # Cash Outflow is positive here for calc
    
    print(f"Net Income (All): {z_surplus + g_surplus}")
    print(f"Loans Taken (Cash In): +{net_financing}")
    print(f"Asset Purchase (Cash Out): -{net_investing}")
    
    calc_cash = (z_surplus + g_surplus) + net_financing - net_investing
    print(f"Calculated Cash Balance: {calc_cash}")
    print(f"Actual Total Assets (Cash+Bank+Fixed): {total_assets}")
    
    # Note: Fixed Asset is included in Total Assets but excluded from "Available Balance" normally.
    # If we want "Available Balance" (Liquid Cash Only):
    liquid_cash = total_assets - fixed_assets # 643k - 29k = 614k
    
    # Reconciling Liquid Cash (Available Balance)
    # Liquid Cash = Income + Loans - Asset Purchase - Expenses
    # But wait, Asset Purchase is just transfer from Valid Cash to Fixed Asset.
    # So Liquid Cash = (Income - Expense) + (Loans) - (Fixed Asset Purchase).
    calc_liquid = (z_surplus + g_surplus) + net_financing - fixed_assets
    print(f"Reconciled Available Balance (Liquid): {calc_liquid}")

if __name__ == '__main__':
    explain_balance()

