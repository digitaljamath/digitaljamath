import os
import django
import sys

# Setup Django Environment
sys.path.append('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import JournalEntry
from django.contrib.auth import get_user_model

User = get_user_model()

def patch_latest_entry():
    # Find the specific entry from the screenshot
    try:
        # Assuming the voucher number from the screenshot: RCP-2026-011
        # Or just get the latest one
        entry = JournalEntry.objects.filter(voucher_type='RECEIPT').latest('created_at')
        print(f"Found Entry: {entry.voucher_number}")
        print(f"Current Created By: {entry.created_by}")

        if not entry.created_by:
            # Assign to admin/first user
            admin = User.objects.filter(is_superuser=True).first()
            if admin:
                entry.created_by = admin
                entry.save()
                print(f"UPDATED: Assigned {entry.voucher_number} to user {admin.username}")
            else:
                print("No admin user found to assign.")
        else:
            print("Entry already has a creator.")

    except JournalEntry.DoesNotExist:
        print("No Journal Entry found.")

if __name__ == '__main__':
    patch_latest_entry()
