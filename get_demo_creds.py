import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from django.contrib.auth import get_user_model

def reset_demo_creds():
    try:
        with schema_context('demo'):
            User = get_user_model()
            # Try to find an existing superuser or admin
            admin = User.objects.filter(is_superuser=True).first()
            
            if not admin:
                print("No admin found. Creating one...")
                email = "admin@demo.com"
                username = "admin"
                admin = User.objects.create_superuser(username=username, email=email, password="password123")
            else:
                # Force update email and password
                admin.email = "admin@demo.com"
                admin.set_password("password123")
                admin.save()
                
            print("-" * 30)
            print(f"Tenant: demo")
            print(f"URL:    http://demo.localhost:5173/auth/signin")
            print(f"Email:  {admin.email}")
            print(f"Pass:   password123")
            print("-" * 30)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_demo_creds()
