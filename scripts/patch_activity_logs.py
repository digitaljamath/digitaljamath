import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import ActivityLog, JournalEntry
from django_tenants.utils import schema_context

def patch_logs():
    with schema_context('panambur'):
        # Find logs with generic message
        logs = ActivityLog.objects.filter(
            model_name='Journal Entry', 
            details='Created new entry'
        )
        print(f"Found {logs.count()} generic logs to update.")
        
        count = 0
        for log in logs:
            if log.object_id:
                try:
                    # Find the actual Journal Entry
                    entry = JournalEntry.objects.get(id=log.object_id)
                    
                    new_detail = "Created Journal Entry"
                    if entry.voucher_type == 'RECEIPT':
                         new_detail = f"Recieved Payment ({entry.narration})"
                    elif entry.voucher_type == 'PAYMENT':
                         new_detail = f"Made Payment ({entry.narration})"
                    
                    log.details = new_detail
                    log.save()
                    print(f"Updated Log {log.id}: {new_detail}")
                    count += 1
                except JournalEntry.DoesNotExist:
                    print(f"Entry {log.object_id} not found.")
        
        print(f"Successfully patched {count} logs.")

if __name__ == '__main__':
    patch_logs()
