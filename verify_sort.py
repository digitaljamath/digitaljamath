
import os
import django
import sys
import json
from django.db import connection

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry
from apps.jamath.api import JournalEntryViewSet 
# Note: We can't easily call the viewset method directly without a request object.
# But we can replicate the logic to see if "order_by" works.

def test_sort_logic():
    connection.set_schema('demo')
    
    # Use a date with multiple entries
    date_str = '2026-02-11' 
    
    print(f"--- Testing Sort Logic for {date_str} ---")

    # 1. Newest First (Default)
    entries_newest = JournalEntry.objects.filter(date=date_str).order_by('-created_at')
    print(f"\n[Newest First] Top 3:")
    for e in entries_newest[:3]:
        print(f"  {e.voucher_number} at {e.created_at.strftime('%H:%M:%S')}")
        
    # 2. Oldest First
    entries_oldest = JournalEntry.objects.filter(date=date_str).order_by('created_at')
    print(f"\n[Oldest First] Top 3:")
    for e in entries_oldest[:3]:
        print(f"  {e.voucher_number} at {e.created_at.strftime('%H:%M:%S')}")

    # Check if they are actually different
    if entries_newest.count() > 1:
        first_new = entries_newest.first().id
        first_old = entries_oldest.first().id
        
        if first_new != first_old:
            print("\n✅ SUCCESS: Sorting changes the order.")
        else:
            print("\n❌ FAILURE: Order did not change! (Timestamps might be identical?)")
            # Debug timestamps
            print("  Newest First ID:", first_new, "Time:", entries_newest.first().created_at)
            print("  Oldest First ID:", first_old, "Time:", entries_oldest.first().created_at)

if __name__ == '__main__':
    test_sort_logic()
