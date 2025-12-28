"""
Utility functions for shared app.
Uses EmailService for sending emails via Brevo SMTP.
"""
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .email_service import EmailService


def send_verification_email(client):
    """
    Sends a verification email to the client's owner_email.
    """
    token = client.verification_token
    # In production, this URL should be dynamic based on the actual domain
    # For localhost dev, we assume port 3000
    verification_url = f"http://localhost:3000/auth/verify-email?token={token}"
    
    return EmailService.send_email_verification(
        email=client.owner_email,
        verification_url=verification_url,
        masjid_name=client.name
    )


def send_password_reset_email(user, domain):
    """
    Sends a password reset link to the user.
    """
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Construct URL pointing to the tenant's frontend
    reset_url = f"http://{domain}:3000/auth/reset-password?uid={uid}&token={token}"
    
    user_name = user.first_name if user.first_name else user.username
    
    return EmailService.send_password_reset(
        email=user.email,
        reset_url=reset_url,
        user_name=user_name
    )


def send_bulk_payment_reminders(households, masjid_name, payment_base_url):
    """
    Send payment reminders to multiple households.
    Returns dict with success/failed counts.
    """
    results = {'success': 0, 'failed': 0}
    
    for household in households:
        # Get head of family email or phone
        head = household.members.filter(is_head_of_family=True).first()
        if not head:
            continue
            
        # For now, we don't have email on members, so skip
        # In future: if head.email:
        #     EmailService.send_payment_reminder(...)
        pass
    
    return results
