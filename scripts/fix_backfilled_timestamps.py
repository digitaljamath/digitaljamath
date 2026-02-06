import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import ActivityLog, JournalEntry
from django_tenants.utils import schema_context

def fix_log_timestamps():
    with schema_context('panambur'):
        # Get all Journal Entry logs
        logs = ActivityLog.objects.filter(model_name='Journal Entry')
        print(f"Checking {logs.count()} logs...")
        
        fixed_count = 0
        for log in logs:
            if log.object_id:
                try:
                    je = JournalEntry.objects.get(id=log.object_id)
                    
                    # Check if timestamp mismatch > 1 second
                    time_diff = abs((log.timestamp - je.created_at).total_seconds())
                    
                    if time_diff > 5: # 5 seconds tolerance
                        print(f"Log {log.id}: Time {log.timestamp} != Entry {je.created_at}")
                        
                        # Direct UPDATE to bypass auto_now_add
                        ActivityLog.objects.filter(id=log.id).update(timestamp=je.created_at)
                        fixed_count += 1
                        
                except JournalEntry.DoesNotExist:
                    pass
        
        print(f"Fixed timestamps for {fixed_count} logs.")

if __name__ == '__main__':
    fix_log_timestamps()
