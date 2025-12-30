from celery import shared_task
from django_tenants.utils import schema_context
from django.contrib.auth.models import User
from .models import Client, Domain
from django.db import transaction
import os
import logging
from .email_service import EmailService

logger = logging.getLogger(__name__)

@shared_task
def create_tenant_task(tenant_data):
    """
    Async task to create a tenant, domain, and admin user.
    """
    logger.info(f"Starting tenant creation for {tenant_data.get('schema_name')}")
    
    try:
        domain_part = tenant_data.pop('domain_part')
        email = tenant_data.pop('email')
        password = tenant_data.pop('password')
        
        # 1. Create Tenant (triggers schema creation and migrations)
        # We assume validation is done by the caller
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
                username='admin',
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True
            )
        logger.info("Admin user created.")

        # 4. Send Verification Email
        try:
            # Need to re-fetch tenant or just use data, but we need the token (Wait, create triggers token generation usually via signals or default?)
            # shared/models.py isn't visible but based on serializer it has `verification_token`
            verification_url = f"http://{full_domain}/auth/verify-email?token={tenant.verification_token}"
            
            # Use EmailService directly
            EmailService.send_email_verification(
                email=email,
                verification_url=verification_url,
                masjid_name=tenant.name
            )
            logger.info("Verification email sent.")
            
        except Exception as email_error:
            logger.error(f"Failed to send email: {email_error}")

    except Exception as e:
        logger.error(f"Tenant creation failed: {e}")
        # Ideally, we should rollback/delete the half-created tenant if possible,
        # but django-tenants creation is complex.
        # Also, send a failure email to the user?
        try:
            EmailService.send_email(
                subject="Workspace Creation Failed",
                html_content=f"<p>Sorry, creation of workspace for {tenant_data.get('name')} failed. Please contact support.</p>",
                recipient_list=[email]
            )
        except:
            pass
        raise e
