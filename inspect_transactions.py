
import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import JournalEntry, JournalItem

def inspect_transactions():
    schema = 'panambur' # Target tenant
    print(f"--- Inspecting Transactions for: {schema} ---")
    
    with schema_context(schema):
        entries = JournalEntry.objects.all().order_by('-created_at')[:10]
        
        for je in entries:
            print(f"\nID: {je.id} | Voucher: {je.voucher_number} | Type: {je.voucher_type} | Date: {je.date}")
            print(f"Narration: {je.narration}")
            for item in je.items.all():
                print(f"  - {item.ledger.name} ({item.ledger.code}) | Dr: {item.debit_amount} | Cr: {item.credit_amount} | Type: {item.ledger.account_type}")

if __name__ == '__main__':
    inspect_transactions()
