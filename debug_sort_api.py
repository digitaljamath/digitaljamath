
import os
import django
import sys
from django.db import connection

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context

def debug_api_call():
    with schema_context('demo'):
        client = APIClient()
        User = get_user_model()
        # Get any active user, preferably admin
        user = User.objects.filter(is_superuser=True).first() or User.objects.first()
        
        if not user:
            print("No user found to authenticate with.")
            return

        print(f"Authenticating as: {user.email}")
        client.force_authenticate(user=user)
        
        date_str = '2026-02-11'
        
        print("\n--- 1. Testing Default (Newest) ---")
        response = client.get(f'/api/ledger/reports/day-book/?date={date_str}&sort=newest')
        
        # ... processing response inside context ...
    
        if response.status_code == 200:
            data = response.json()
            entries = data.get('entries', [])
            if entries:
                print(f"Count: {len(entries)}")
                print("First 3 Vouchers:", [e['voucher_number'] for e in entries[:3]])
            else:
                print("No entries found.")
        else:
            print(f"Error {response.status_code}: {response.content}")

        print("\n--- 2. Testing Oldest ---")
        response = client.get(f'/api/ledger/reports/day-book/?date={date_str}&sort=oldest')

        if response.status_code == 200:
            data = response.json()
            entries = data.get('entries', [])
            if entries:
                print(f"Count: {len(entries)}")
                print("First 3 Vouchers:", [e['voucher_number'] for e in entries[:3]])
                
                ids = [e['id'] for e in entries]
                is_asc = all(ids[i] <= ids[i+1] for i in range(len(ids)-1))
                is_desc = all(ids[i] >= ids[i+1] for i in range(len(ids)-1))
                
                if is_asc: print("=> Order is ASCENDING (Oldest First)")
                elif is_desc: print("=> Order is DESCENDING (Newest First)")
                else: print("=> Order is MIXED")
                
            else:
                print("No entries found.")
        else:
            print(f"Error {response.status_code}: {response.content}")

if __name__ == '__main__':
    debug_api_call()
