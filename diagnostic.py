import os
import sys
import django

# Setup Django
sys.path.insert(0, '/Users/hayeef/.gemini/antigravity/scratch/digitaljamath')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.jamath.models import Masjid
from django.db import connection

results = []
results.append(f"Current DATABASE: {connection.settings_dict['NAME']}")

masjids = Masjid.objects.all()
results.append(f"Total Masjids found: {masjids.count()}")

for m in masjids:
    results.append(f"ID: {m.id}, Name: {m.name}, Schema: {m.schema_name}")

with open('/Users/hayeef/.gemini/antigravity/scratch/digitaljamath/diagnostic.txt', 'w') as f:
    f.write('\n'.join(results))
