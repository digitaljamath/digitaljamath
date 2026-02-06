import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import ActivityLog, JournalEntry
from django_tenants.utils import schema_context

def patch_log_amounts():
    with schema_context('panambur'):
        # Get all Journal Entry logs
        logs = ActivityLog.objects.filter(model_name='Journal Entry')
        print(f"Checking {logs.count()} logs for amounts...")
        
        updated_count = 0
        
        for log in logs:
            if log.object_id:
                try:
                    entry = JournalEntry.objects.get(id=log.object_id)
                    amount_str = f"₹{entry.total_amount:g}"
                    
                    new_detail = "Created Journal Entry"
                    if entry.voucher_type == 'RECEIPT':
                         new_detail = f"Received Payment of {amount_str} ({entry.narration})"
                    elif entry.voucher_type == 'PAYMENT':
                         new_detail = f"Made Payment of {amount_str} ({entry.narration})"
                    
                    if log.details != new_detail:
                        log.details = new_detail
                        log.save()
                        updated_count += 1
                        print(f"Updated {log.id}: {new_detail}")
                        
                except JournalEntry.DoesNotExist:
                    pass
        
        print(f"Refreshed amounts for {updated_count} logs.")

if __name__ == '__main__':
    patch_log_amounts()
