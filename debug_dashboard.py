
import os
import django
import sys
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import Ledger, JournalItem, JournalEntry

def calculate_stats():
    print("\n--- DEBUG DASHBOARD STATS ---")
    
    # 1. Fetch raw items
    items = JournalItem.objects.all()
    print(f"Total Journal Items: {items.count()}")
    
    for item in items:
        print(f"  {item.journal_entry.date} | {item.ledger.name} ({item.ledger.fund_type}) | Dr: {item.debit_amount} | Cr: {item.credit_amount}")

    # 2. Replicate Dashboard Logic
    
    # Liquid Assets
    liquid_assets = JournalItem.objects.filter(
        ledger__account_type='ASSET',
        ledger__code__startswith='100'
    ).aggregate(
        debit=Sum('debit_amount'),
        credit=Sum('credit_amount')
    )
    gross_cash = (liquid_assets['debit'] or Decimal('0')) - (liquid_assets['credit'] or Decimal('0'))
    print(f"\nGross Cash (Assets): {gross_cash}")

    # Zakat Stats
    zakat_stats = JournalItem.objects.filter(
        ledger__fund_type='ZAKAT'
    ).aggregate(
        income=Sum('credit_amount', filter=Q(ledger__account_type='INCOME')),
        equity=Sum('credit_amount', filter=Q(ledger__account_type='EQUITY')),
        expense=Sum('debit_amount', filter=Q(ledger__account_type='EXPENSE'))
    )
    
    z_income = zakat_stats['income'] or Decimal('0')
    z_equity = zakat_stats['equity'] or Decimal('0')
    z_expense = zakat_stats['expense'] or Decimal('0')
    
    zakat_balance = (z_income + z_equity) - z_expense
    print(f"Zakat Calc: ({z_income} + {z_equity}) - {z_expense} = {zakat_balance}")

    # General Available
    general_available = gross_cash - zakat_balance
    print(f"General Available: {gross_cash} - {zakat_balance} = {general_available}")
    
    # Proposed Fix for Deficit
    zakat_reserve = max(Decimal('0'), zakat_balance)
    general_available_fixed = gross_cash - zakat_reserve
    print(f"General Available (Fixed): {gross_cash} - {zakat_reserve} = {general_available_fixed}")

if __name__ == "__main__":
    from django.db import connection
    
    # We need to run this for a specific tenant schema
    # Let's try 'demo' and 'mangalore'
    
    print(">>> CHECKING 'demo' SCHEMA")
    connection.set_schema('demo')
    calculate_stats()
    
    print("\n>>> CHECKING 'mangalore' SCHEMA")
    connection.set_schema('mangalore')
    calculate_stats()
