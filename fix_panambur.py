import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from apps.shared.models import Client, Domain

def fix_panambur():
    try:
        # Check for capitalized entry
        client = Client.objects.filter(schema_name='Panambur').first()
        if client:
            print(f"Found capitalized client: {client.schema_name}")
            
            # Fix Schema Name
            # Note: Renaming schema in postgres requires SQL usually, but let's try model save first
            # Actually, django-tenants might not rename the physical schema just by changing the model field.
            # But for lookup, it matters.
            # However, physical schema "Panambur" might exist.
            # Postgres schemas ARE case sensitive if quoted.
            
            # Let's Checking if physical schema exists?
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'Panambur';")
                exists_cap = cursor.fetchone()
                cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'panambur';")
                exists_lower = cursor.fetchone()
                
                print(f"Physical Schema 'Panambur' exists: {exists_cap}")
                print(f"Physical Schema 'panambur' exists: {exists_lower}")

            # Fix Domain
            # Domain is just a string lookup
            domain = Domain.objects.filter(domain='Panambur.localhost').first()
            if domain:
                print(f"Found capitalized domain: {domain.domain}")
                domain.domain = 'panambur.localhost'
                domain.save()
                print("Fixed domain to 'panambur.localhost'")
                
            # If Client schema_name is used for routing, it must match.
            # If we change client.schema_name to 'panambur', django-tenants will look for schema 'panambur'.
            # We might need to rename the physical schema too if it was created capitalized.
            
            if exists_cap and not exists_lower:
                print("Renaming physical schema...")
                with connection.cursor() as cursor:
                    cursor.execute('ALTER SCHEMA "Panambur" RENAME TO "panambur"')
            
            client.schema_name = 'panambur'
            client.save()
            print("Fixed client schema_name to 'panambur'")
            
        else:
            print("No 'Panambur' client found (maybe already fixed?)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix_panambur()
