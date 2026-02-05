"""
Telegram OTP Service for Member Portal Authentication.

For demo tenants: Uses mock OTP (123456)
For production tenants: Sends real OTP via Telegram Bot
"""
import httpx
from django.conf import settings
from django.db import connection
import logging

logger = logging.getLogger(__name__)


def is_demo_tenant() -> bool:
    """Check if the current tenant is the demo tenant."""
    return connection.schema_name == 'demo' or connection.schema_name.startswith('demo') or settings.DEBUG


def get_telegram_chat_id(phone: str) -> str | None:
    """
    Look up Telegram chat_id for a phone number.
    Members must have linked their Telegram account first.
    """
    from apps.jamath.models import TelegramLink
    
    try:
        link = TelegramLink.objects.get(phone_number=phone)
        return link.chat_id
    except TelegramLink.DoesNotExist:
        return None


def send_telegram_message(chat_id: str, message: str) -> bool:
    """Send a message via Telegram Bot API."""
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    
    if not bot_token:
        logger.error("TELEGRAM_BOT_TOKEN not configured")
        return False
    
    try:
        response = httpx.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            },
            timeout=10.0
        )
        return response.is_success
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")
        return False


def send_otp_via_telegram(phone: str, otp: str) -> dict:
    """
    Send OTP to a phone number via Telegram.
    
    Returns:
        dict with 'success' and optionally 'error' message
    """
    # Demo tenant: Don't actually send, just log
    if is_demo_tenant():
        logger.info(f"[DEMO] OTP for {phone}: {otp}")
        return {'success': True, 'demo': True}
    
    # Get Telegram chat_id
    chat_id = get_telegram_chat_id(phone)
    
    if not chat_id:
        return {
            'success': False,
            'error': 'Telegram not linked. Please link your Telegram first.'
        }
    
    # Format OTP message
    message = f"""🔐 <b>DigitalJamath OTP</b>

Your one-time password is: <code>{otp}</code>

Valid for 5 minutes. Do not share this code with anyone."""
    
    # Send via Telegram
    if send_telegram_message(chat_id, message):
        return {'success': True}
    else:
        return {
            'success': False,
            'error': 'Failed to send OTP. Please try again.'
        }


def generate_telegram_link_url(phone: str) -> str:
    """Generate a deep link for user to link their Telegram."""
    bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'DigitalJamathBot')
    # Encode phone for deep link (remove +)
    phone_clean = phone.replace('+', '')
    return f"https://t.me/{bot_username}?start=link_{phone_clean}"


def broadcast_announcement(title: str, content: str) -> dict:
    """
    Broadcast an announcement to all linked Telegram users in the current tenant.
    
    Returns:
        dict with 'sent' count and 'failed' count
    """
    from apps.jamath.models import TelegramLink
    
    message = f"""📢 <b>{title}</b>

{content}

— DigitalJamath"""
    
    links = TelegramLink.objects.filter(is_verified=True)
    sent = 0
    failed = 0
    
    for link in links:
        if send_telegram_message(link.chat_id, message):
            sent += 1
        else:
            failed += 1
    
    logger.info(f"Broadcast announcement: {sent} sent, {failed} failed")
    return {'sent': sent, 'failed': failed}


def send_payment_reminder(phone: str, household_name: str, amount_due: float, portal_url: str = None) -> bool:
    """
    Send a payment reminder to a specific household via Telegram.
    
    Returns:
        True if sent successfully, False otherwise
    """
    chat_id = get_telegram_chat_id(phone)
    
    if not chat_id:
        logger.warning(f"Cannot send reminder to {phone}: Telegram not linked")
        return False
    
    portal_link = portal_url or "https://portal.digitaljamath.com"
    
    message = f"""💰 <b>Payment Reminder</b>

Assalamu Alaikum {household_name},

Your membership contribution of <b>₹{amount_due:,.0f}</b> is due.

Please visit the member portal to make your payment:
{portal_link}

Jazakallah Khair
— Your Jamath Committee"""
    
    return send_telegram_message(chat_id, message)


def send_bulk_payment_reminders(portal_url: str = None) -> dict:
    """
    Send payment reminders to all households with pending membership.
    
    Returns:
        dict with 'sent' count and 'failed' count
    """
    from apps.jamath.models import Household, MembershipConfig, TelegramLink
    
    config = MembershipConfig.objects.filter(is_active=True).first()
    minimum_fee = float(config.minimum_fee) if config else 1200.0
    
    # Get households without active membership that have linked Telegram
    households = Household.objects.filter(is_membership_active=False)
    
    sent = 0
    failed = 0
    skipped = 0
    
    for household in households:
        if not household.phone_number:
            skipped += 1
            continue
            
        # Check if Telegram is linked
        if not TelegramLink.objects.filter(phone_number=household.phone_number, is_verified=True).exists():
            skipped += 1
            continue
        
        head = household.members.filter(is_head_of_family=True).first()
        head_name = head.full_name if head else "Member"
        
        if send_payment_reminder(household.phone_number, head_name, minimum_fee, portal_url):
            sent += 1
        else:
            failed += 1
    
    logger.info(f"Bulk reminders: {sent} sent, {failed} failed, {skipped} skipped (no Telegram)")
    return {'sent': sent, 'failed': failed, 'skipped': skipped}


def send_profile_update_notification(phone: str, member_name: str, changes: str = None) -> bool:
    """
    Send notification when a member's profile is updated.
    
    Args:
        phone: Household phone number
        member_name: Name of the member whose profile was updated
        changes: Optional description of what changed
    
    Returns:
        True if sent successfully
    """
    # Check if notifications are enabled
    from apps.jamath.models import MembershipConfig
    config = MembershipConfig.objects.filter(is_active=True).first()
    if not config or not config.telegram_enabled or not config.telegram_notify_profile_updates:
        return False
    
    chat_id = get_telegram_chat_id(phone)
    if not chat_id:
        return False
    
    message = f"""📝 <b>Profile Update</b>

The profile of <b>{member_name}</b> has been updated by the Jamath office.

{f"Changes: {changes}" if changes else ""}

If you have any questions, please contact your Jamath administrator.

— DigitalJamath"""
    
    return send_telegram_message(chat_id, message)


def send_individual_reminder(household_id: int, portal_url: str = None) -> dict:
    """
    Send payment reminder to a specific household.
    
    Returns:
        dict with 'success' and optional 'error' message
    """
    from apps.jamath.models import Household, MembershipConfig, TelegramLink
    
    # Check if enabled
    config = MembershipConfig.objects.filter(is_active=True).first()
    if not config or not config.telegram_enabled:
        return {'success': False, 'error': 'Telegram notifications are disabled'}
    
    try:
        household = Household.objects.get(id=household_id)
    except Household.DoesNotExist:
        return {'success': False, 'error': 'Household not found'}
    
    if not household.phone_number:
        return {'success': False, 'error': 'No phone number on file'}
    
    # Check if Telegram linked
    if not TelegramLink.objects.filter(phone_number=household.phone_number, is_verified=True).exists():
        if is_demo_tenant():
            return {'success': True, 'demo': True, 'message': 'Simulated reminder (Demo)'}
        return {'success': False, 'error': 'Telegram not linked for this household'}
    
    head = household.members.filter(is_head_of_family=True).first()
    head_name = head.full_name if head else "Member"
    minimum_fee = float(config.minimum_fee) if config else 1200.0
    
    if send_payment_reminder(household.phone_number, head_name, minimum_fee, portal_url):
        return {'success': True}
    else:
        return {'success': False, 'error': 'Failed to send message'}
