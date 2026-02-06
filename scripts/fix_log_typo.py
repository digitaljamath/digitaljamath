import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import ActivityLog
from django_tenants.utils import schema_context

def fix_typo():
    with schema_context('panambur'):
        # Find logs with typo
        logs = ActivityLog.objects.filter(details__startswith='Recieved Payment')
        
        count = 0
        for log in logs:
            log.details = log.details.replace('Recieved', 'Received')
            log.save()
            count += 1
        
        print(f"Fixed typo in {count} logs.")

if __name__ == '__main__':
    fix_typo()
