import os
import sys
import django
from django.db.models import Q

# We don't need setup() if running via manage.py shell, but good for standalone
# sys.path.append(os.getcwd())
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
# django.setup()

from apps.jamath.models import JournalEntry
from apps.shared.models import Client
from django_tenants.utils import schema_context

def run():
    print("Starting multi-tenant cleanup...")
    
    clients = Client.objects.exclude(schema_name='public')
    
    for client in clients:
        print(f"\n--- Processing Tenant: {client.name} ({client.schema_name}) ---")
        
        with schema_context(client.schema_name):
            # 1. Identify Activation / Membership Entries
            activation_entries = JournalEntry.objects.filter(
                Q(items__ledger__name__icontains="Membership") | 
                Q(items__ledger__code="4001") | 
                Q(narration__icontains="activation") |
                Q(narration__icontains="membership")
            ).distinct()
            
            activation_ids = set(activation_entries.values_list('id', flat=True))
            
            print(f"Found {len(activation_ids)} Activation/Membership entries to KEEP.")
            
            # 2. Identify All Other Entries to DELETE
            to_delete = JournalEntry.objects.exclude(id__in=activation_ids)
            
            count = to_delete.count()
            if count == 0:
                print("No transactions to delete.")
                continue

            print(f"Found {count} other transactions to DELETE.")
            
            # Hard delete
            deleted_count, _ = to_delete.delete()
            print(f"Deleted {deleted_count} records.")

    print("\nGlobal cleanup complete.")

if __name__ == "__main__":
    run()
