
from django.test import RequestFactory
from apps.jamath.api import LedgerReportsView
from django.contrib.auth import get_user_model
from django.db import connection

# Set Schema Manually
connection.set_schema('demo')

User = get_user_model()
user = User.objects.filter(is_superuser=True).first()

if not user:
    print("No Superuser found!")
    exit(1)

factory = RequestFactory()
view = LedgerReportsView.as_view()

date_str = '2026-02-11'

print(f"--- Testing Sort Logic for {date_str} via Shell ---")

# 1. Newest First
request = factory.get(f'/api/ledger/reports/day-book/?date={date_str}&sort=newest')
request.user = user
response = view(request, report_type='day-book')

if response.status_code == 200:
    entries = response.data.get('entries', [])
    if entries:
        print(f"[Newest] First: {entries[0]['voucher_number']}")
        print(f"[Newest] Last: {entries[-1]['voucher_number']}")
    else:
        print("[Newest] No entries found.")
else:
    print(f"[Newest] Error: {response.data}")

# 2. Oldest First
request = factory.get(f'/api/ledger/reports/day-book/?date={date_str}&sort=oldest')
request.user = user
response = view(request, report_type='day-book')

if response.status_code == 200:
    entries = response.data.get('entries', [])
    if entries:
        print(f"[Oldest] First: {entries[0]['voucher_number']}")
        print(f"[Oldest] Last: {entries[-1]['voucher_number']}")
    else:
        print("[Oldest] No entries found.")
else:
    print(f"[Oldest] Error: {response.data}")
