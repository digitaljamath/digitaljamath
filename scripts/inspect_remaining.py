import os
import sys
import django
from django_tenants.utils import schema_context

from apps.jamath.models import JournalEntry

def run():
    print("Inspecting remaining transactions for 'panambur'...")
    
    with schema_context('panambur'):
        entries = JournalEntry.objects.all()
        print(f"Total Entries: {entries.count()}")
        
        for je in entries:
            # Get split details
            items = je.items.all()
            item_details = []
            for i in items:
                # Assuming 'amount' field and 'type' field (DEBIT/CREDIT)
                # If amount is not there, check model definition again?
                # Based on previous code, amount exists.
                amount = getattr(i, 'amount', 0)
                dr_cr = getattr(i, 'type', 'UNKNOWN')
                ledger_name = i.ledger.name
                item_details.append(f"{ledger_name}: {amount} {dr_cr}")
            
            print(f"\nID: {je.id} | Type: {je.voucher_type} | Date: {je.date}")
            print(f"Narration: {je.narration}")
            print(f"Items: {item_details}")

if __name__ == "__main__":
    run()
