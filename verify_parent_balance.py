
import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import Ledger
from django.db import connection

def verify_aggregation():
    connection.set_schema('demo')
    
    try:
        parent = Ledger.objects.get(code='4000') # Expenses
    except Ledger.DoesNotExist:
        print("Expense Account 4000 not found.")
        return

    print(f"Parent: {parent.name} ({parent.code})")
    
    children = parent.children.filter(is_active=True)
    total_child_balance = Decimal('0.00')
    
    print("\n--- Child Balances ---")
    for child in children:
        bal = child.balance
        if bal != 0:
            print(f"{child.code} {child.name}: {bal}")
        total_child_balance += bal
        
    print(f"\nSum of Children: {total_child_balance}")
    
    # Parent Balance (Should match sum of children if parent has no direct txns)
    parent_balance = parent.balance
    print(f"Parent Balance Property: {parent_balance}")
    
    if parent_balance == total_child_balance:
        print("\n✅ SUCCESS: Parent Balance matches Sum of Children")
    else:
        print(f"\n❌ FAILURE: Mismatch! Difference: {parent_balance - total_child_balance}")
        # Note: If parent has direct transactions, this might differ. 
        # But 4000 is usually a folder.
        direct_txns = parent.journal_items.exists()
        if direct_txns:
            print("  (Parent has direct transactions, so mismatch is expected/valid if logic is Own + Children)")

if __name__ == '__main__':
    verify_aggregation()
