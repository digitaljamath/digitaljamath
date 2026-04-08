from celery import shared_task
from django.contrib.auth.models import User
from .models import Mosque
from django.db import transaction
import os
import logging
from .email_service import EmailService
from django.core.management import call_command
import traceback
from django.conf import settings

logger = logging.getLogger(__name__)

# Default roles for "standard" setup
STANDARD_ROLES = [
    {
        'name': 'Admin',
        'description': 'Full access to all features',
        'permissions': {
            'jamath': 'admin',
            'census': 'admin',
            'finance': 'admin',
            'welfare': 'admin',
            'settings': 'admin',
            'announcements': 'admin',
            'users': 'admin'
        }
    },
    {
        'name': 'Secretary',
        'description': 'Manages census, communications, and reports',
        'permissions': {
            'jamath': 'admin',
            'census': 'admin',
            'finance': 'view',
            'welfare': 'view',
            'settings': 'view',
            'announcements': 'admin',
            'users': 'view'
        }
    },
]

def seed_standard_roles(mosque):
    """Seed default staff roles for a new Mosque."""
    from apps.jamath.models import StaffRole
    
    admin_role = None
    for role_data in STANDARD_ROLES:
        role, _ = StaffRole.objects.get_or_create(
            mosque=mosque,
            name=role_data['name'],
            defaults={
                'description': role_data['description'],
                'permissions': role_data['permissions']
            }
        )
        if role.name == 'Admin':
            admin_role = role
            
    logger.info(f"Seeded {len(STANDARD_ROLES)} standard roles for {mosque.name}")
    return admin_role


@shared_task
def create_tenant_task(tenant_data):
    """
    Async task to create a Mosque and its admin user on the unified platform.
    """
    name = tenant_data.get('name')
    email = tenant_data.get('owner_email') or tenant_data.get('email')
    password = tenant_data.pop('password', 'password123')
    
    # Clean up obsolete tenant data
    tenant_data.pop('domain_part', None)
    tenant_data.pop('schema_name', None)
    tenant_data.pop('email', None)
    setup_type = tenant_data.pop('setup_type', 'STANDARD')
    
    logger.info(f"Starting Mosque creation for {name}")
    
    try:
        with transaction.atomic():
            # 1. Create Mosque
            mosque = Mosque.objects.create(**tenant_data)
            logger.info(f"Mosque {mosque.name} created.")
            
            # 2. Create Admin User
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    'email': email,
                    'is_staff': True,
                    'is_superuser': False # Only global system admins should be superusers now
                }
            )
            if created:
                user.set_password(password)
                user.save()
            logger.info("Admin user created/retrieved.")

            # 3. Setup: Seed Chart of Accounts 
            try:
                # Seed Chart of Accounts requires the mosque argument now
                call_command('seed_ledger', mosque=mosque.id)
                logger.info("Chart of Accounts seeded.")
            except Exception as ledger_error:
                logger.warning(f"Failed to seed ledger (non-fatal): {ledger_error}")

            # 4. Standard Roles and Staff Membership
            if setup_type == 'STANDARD':
                logger.info("Running standard setup (roles)...")
                try:
                    admin_role = seed_standard_roles(mosque)
                    from apps.jamath.models import StaffMember
                    StaffMember.objects.get_or_create(
                        user=user,
                        mosque=mosque,
                        defaults={
                            'role': admin_role,
                            'designation': 'Administrator'
                        }
                    )
                    logger.info("Standard roles seeded and user assigned to Admin role.")
                except Exception as role_error:
                    logger.warning(f"Failed to seed roles (non-fatal): {role_error}")

        # 5. Send Workspace Ready Email
        base_url = "http://localhost:5173" if settings.DEBUG else "https://digitaljamath.com"
        login_url = f"{base_url}/auth/masjid/login"
        
        try:
            EmailService.send_email(
                subject=f"Your Mosque Platform for {mosque.name} is Ready",
                html_content=f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to DigitalJamath</h2>
                    <p>Assalamu Alaikum,</p>
                    <p>Your platform for <strong>{mosque.name}</strong> has been successfully created.</p>
                    <p style="margin: 20px 0;">
                        <a href="{login_url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Login to Dashboard
                        </a>
                    </p>
                </div>
                """,
                recipient_list=[email]
            )
            logger.info("Platform ready email sent.")
            
        except Exception as email_error:
            logger.error(f"Failed to send email: {email_error}")
        
        return {
            'login_url': login_url,
            'tenant_url': base_url,
            'tenant_name': mosque.name
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Mosque creation failed: {error_msg}")
        logger.error(traceback.format_exc())
        
        try:
            if email:
                EmailService.send_email(
                    subject="Mosque Creation Failed",
                    html_content=f"<p>Sorry, creation of platform for {name or 'your masjid'} failed. Error: {error_msg}</p><p>Please contact support.</p>",
                    recipient_list=[email]
                )
        except Exception as email_err:
            logger.error(f"Failed to send failure email: {email_err}")
        
        raise e
