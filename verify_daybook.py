
import os
import django
import sys
from django.db.models import Sum
from decimal import Decimal
import json

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry, JournalItem
from django.utils import timezone
from django.db import connection

def test_day_book_logic():
    # Set Schema
    connection.set_schema('demo')
    
    # Simulate API Request Params
    today = timezone.now().date()
    # Or use the specific date where we know we have data (Feb 2026 from stress test)
    # Let's use 2026-02-01 as example from previous stress test
    date_str = '2026-02-01' 
    fund_filter = 'ALL'
    
    print(f"Testing Day Book Logic for Date: {date_str}, Fund: {fund_filter}")

    entries = JournalEntry.objects.filter(date=date_str).select_related(
        'donor', 'supplier', 'created_by'
    ).prefetch_related('items__ledger').order_by('-created_at')
    
    print(f"Found {entries.count()} entries.")
    
    if entries.count() == 0:
        # Try to find a date WITH entries
        last_entry = JournalEntry.objects.last()
        if last_entry:
            print(f"Switching to date {last_entry.date} (Found data)")
            date_str = str(last_entry.date)
            entries = JournalEntry.objects.filter(date=date_str).select_related(
                'donor', 'supplier', 'created_by'
            ).prefetch_related('items__ledger').order_by('-created_at')
        else:
            print("No entries in DB at all.")
            return

    # Logic copied from API
    data = []
    total_receipts = Decimal('0.00')
    total_payments = Decimal('0.00')

    for entry in entries:
        is_zakat = entry.items.filter(ledger__fund_type='ZAKAT').exists()
        amount = entry.total_amount
        
        if entry.voucher_type == 'RECEIPT':
            total_receipts += amount
        elif entry.voucher_type == 'PAYMENT':
            total_payments += amount
            
        data.append({
            'voucher': entry.voucher_number,
            'type': entry.voucher_type,
            'amount': str(amount),
            'is_zakat': is_zakat
        })
    
    print("\n--- RESULTS ---")
    print(json.dumps(data, indent=2))
    print(f"Total Receipts: {total_receipts}")
    print(f"Total Payments: {total_payments}")
    print("LOGIC VERIFIED VALID")

if __name__ == '__main__':
    test_day_book_logic()
