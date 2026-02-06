import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import ActivityLog, JournalEntry
from django_tenants.utils import schema_context

def patch_all_history():
    with schema_context('panambur'):
        # Get all Journal Entries
        entries = JournalEntry.objects.all()
        print(f"Checking {entries.count()} financial records...")
        
        created_count = 0
        updated_count = 0
        
        for entry in entries:
            # Determine correct detail string
            new_detail = "Created Journal Entry"
            if entry.voucher_type == 'RECEIPT':
                 new_detail = f"Received Payment ({entry.narration})"
            elif entry.voucher_type == 'PAYMENT':
                 new_detail = f"Made Payment ({entry.narration})"
            
            # Check if log exists
            logs = ActivityLog.objects.filter(model_name='Journal Entry', object_id=str(entry.id))
            
            if logs.exists():
                # Update existing logs if description doesn't match
                for log in logs:
                    if log.details != new_detail:
                        log.details = new_detail
                        log.save()
                        updated_count += 1
                        print(f"[UPDATE] {entry.voucher_number}: {new_detail}")
            else:
                # Create missing log IF valid creator exists
                if entry.created_by:
                    ActivityLog.objects.create(
                        user=entry.created_by,
                        action='CREATE',
                        module='finance',
                        model_name='Journal Entry',
                        object_id=str(entry.id),
                        details=new_detail,
                        timestamp=entry.created_at # Attempt to backdate? Model uses auto_now_add=True
                    )
                    created_count += 1
                    print(f"[create] {entry.voucher_number}: {new_detail}")
        
        print(f"Finished. Created: {created_count}, Updated: {updated_count}")

if __name__ == '__main__':
    patch_all_history()
