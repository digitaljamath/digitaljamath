import os
import django

# Setup Django FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

import json
from django_tenants.utils import schema_context
from rest_framework.test import APIClient
from apps.jamath.models import Household, Announcement
from django.contrib.auth import get_user_model
from django_tenants.utils import get_tenant_model

User = get_user_model()
Tenant = get_tenant_model()

def run_test():
    # 1. Get Tenant and Domain
    try:
        tenant = Tenant.objects.get(schema_name='panambur')
        domain = tenant.domains.first().domain
        print(f"Tenant: {tenant.schema_name}, Domain: {domain}")
    except Exception as e:
        print(f"Tenant not found: {e}")
        return

    # 2. Get User and Household INSIDE schema context
    with schema_context(tenant.schema_name):
        user = User.objects.filter(is_superuser=True).first()
        household = Household.objects.first()
        
        if not user or not household:
            print("Missing user or household in tenant.")
            return

        print(f"Testing with User: {user.email}, Household: {household.id}")

        # 3. Simulate API Call with Host Header
        client = APIClient()
        client.force_authenticate(user=user)
        
        # Test MESSAGE type
        print("\nTesting 'MESSAGE' type...")
        response = client.post(
            '/api/jamath/reminders/send/',
            {
                'household_id': household.id,
                'type': 'MESSAGE',
                'message': 'Test message from repro script'
            },
            format='json',
            HTTP_HOST=domain
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.content.decode('utf-8')}")
        
if __name__ == "__main__":
    run_test()
