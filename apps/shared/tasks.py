from celery import shared_task
from django_tenants.utils import schema_context
from django.contrib.auth.models import User
from .models import Client, Domain
from django.db import transaction
import os
import logging
from .email_service import EmailService
from django.core.management import call_command
import traceback

logger = logging.getLogger(__name__)

# Default roles for "standard" setup
STANDARD_ROLES = [
    {
        'name': 'Admin',
        'description': 'Full access to all features',
        'permissions': {
            'census': 'admin',
            'finance': 'admin',
            'welfare': 'admin',
            'settings': 'admin'
        }
    },
    {
        'name': 'Secretary',
        'description': 'Manages census, communications, and reports',
        'permissions': {
            'census': 'admin',
            'finance': 'view',
            'welfare': 'view',
            'settings': 'view'
        }
    },
    {
        'name': 'Treasurer',
        'description': 'Full access to finance and accounting',
        'permissions': {
            'census': 'view',
            'finance': 'admin',
            'welfare': 'view',
            'settings': 'none'
        }
    },
    {
        'name': 'Accountant',
        'description': 'Can create and edit financial transactions',
        'permissions': {
            'census': 'none',
            'finance': 'edit',
            'welfare': 'none',
            'settings': 'none'
        }
    },
    {
        'name': 'Welfare Coordinator',
        'description': 'Manages welfare applications and beneficiaries',
        'permissions': {
            'census': 'view',
            'finance': 'none',
            'welfare': 'admin',
            'settings': 'none'
        }
    },
]


def seed_standard_roles(schema_name):
    """Seed default staff roles for a new tenant."""
    from apps.jamath.models import StaffRole
    
    with schema_context(schema_name):
        for role_data in STANDARD_ROLES:
            StaffRole.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'description': role_data['description'],
                    'permissions': role_data['permissions']
                }
            )
        logger.info(f"Seeded {len(STANDARD_ROLES)} standard roles for {schema_name}")


@shared_task
def create_tenant_task(tenant_data):
    """
    Async task to create a tenant, domain, and admin user.
    """
    # Extract values early so we have them for error emails
    schema_name = tenant_data.get('schema_name')
    name = tenant_data.get('name')
    email = tenant_data.get('email')
    
    logger.info(f"Starting tenant creation for {schema_name}")
    
    try:
        domain_part = tenant_data.pop('domain_part')
        email = tenant_data.pop('email')
        password = tenant_data.pop('password')
        setup_type = tenant_data.get('setup_type', 'STANDARD')
        
        # Remove these from tenant_data - they're not model fields
        tenant_data.pop('owner_email', None)
        
        # 1. Create Tenant (triggers schema creation and migrations)
        tenant = Client.objects.create(**tenant_data)
        logger.info(f"Tenant {tenant.schema_name} created.")
        
        # 2. Create Domain
        base_domain = os.environ.get('DOMAIN_NAME', 'localhost')
        full_domain = f"{domain_part}.{base_domain}"
        
        Domain.objects.create(
            domain=full_domain,
            tenant=tenant,
            is_primary=True
        )
        logger.info(f"Domain {full_domain} created.")
        
        # 3. Create Admin User
        with schema_context(tenant.schema_name):
            User.objects.create_user(
                username=email,
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True
            )
        logger.info("Admin user created.")

        # 4. Setup: Seed Chart of Accounts (Required for System)
        try:
            # Seed Chart of Accounts for ALL tenants
            with schema_context(tenant.schema_name):
                call_command('seed_ledger')
            logger.info("Chart of Accounts seeded.")
        except Exception as ledger_error:
            logger.warning(f"Failed to seed ledger (non-fatal): {ledger_error}")

        # 5. Standard Roles (Only for Standard Setup)
        if setup_type == 'STANDARD':
            logger.info("Running standard setup (roles)...")
            
            
            try:
                # Seed Standard Roles
                seed_standard_roles(tenant.schema_name)
                logger.info("Standard roles seeded.")
            except Exception as role_error:
                logger.warning(f"Failed to seed roles (non-fatal): {role_error}")

        # 5. Send Workspace Ready Email
        try:
            full_url = f"http://{full_domain}/auth/login"
            
            EmailService.send_email(
                subject=f"Your Workspace for {tenant.name} is Ready",
                html_content=f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to DigitalJamath</h2>
                    <p>Assalamu Alaikum,</p>
                    <p>Your workspace <strong>{tenant.name}</strong> has been successfully created.</p>
                    {"<p>We've set up the <strong>Standard</strong> Chart of Accounts and Roles for you.</p>" if setup_type == 'standard' else ""}
                    <p style="margin: 20px 0;">
                        <a href="{full_url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Login to Dashboard
                        </a>
                    </p>
                    <p>You can also access it directly at: <br> <a href="{full_url}">{full_url}</a></p>
                </div>
                """,
                recipient_list=[email]
            )
            logger.info("Workspace ready email sent.")
            
        except Exception as email_error:
            logger.error(f"Failed to send email: {email_error}")
        
        # Return result for polling endpoint - use landing page URL (not admin login)
        return {
            'login_url': f"http://{full_domain}/",  # Landing page, not admin login
            'tenant_url': f"http://{full_domain}/",
            'tenant_name': tenant.name
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Tenant creation failed: {error_msg}")
        logger.error(traceback.format_exc())
        
        try:
            if email:
                EmailService.send_email(
                    subject="Workspace Creation Failed",
                    html_content=f"<p>Sorry, creation of workspace for {name or 'your masjid'} failed. Error: {error_msg}</p><p>Please contact support.</p>",
                    recipient_list=[email]
                )
        except Exception as email_err:
            logger.error(f"Failed to send failure email: {email_err}")
        
        raise e
