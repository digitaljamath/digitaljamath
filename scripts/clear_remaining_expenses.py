import os
import sys
import django
from django_tenants.utils import schema_context
from django.db.models import Q

from apps.jamath.models import JournalEntry

def run():
    print("Cleaning up remaining expenses (Payment Vouchers)...")
    
    with schema_context('panambur'):
        # Delete ANY Payment voucher that was accidentally kept
        payments = JournalEntry.objects.filter(voucher_type='PAYMENT')
        count = payments.count()
        
        if count > 0:
            print(f"Found {count} Payment vouchers to delete.")
            for p in payments:
                print(f"  DELETE: {p.id} - {p.narration} ({p.voucher_type})")
            
            payments.delete()
            print("Deletion complete.")
        else:
            print("No Payment vouchers found.")

if __name__ == "__main__":
    run()
