"""
Phone Number + OTP Authentication Service for Member Portal
Enables passwordless, mobile-first login for community members.
"""

import random
import re

from digital_jamath.compat import frappe, _
from digital_jamath.portal.demo import DEMO_PHONE, ensure_demo_household
from digital_jamath.portal.session import (
    SESSION_EXPIRY_SECONDS,
    clear_portal_session,
    create_portal_session,
)

CACHE_EXPIRY_SECONDS = 300  # 5 minutes


def normalize_phone(phone: str) -> str:
    """Normalizes phone number to standard 10-digit format."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) > 10:
        return digits[-10:]
    return digits


def _company_for_slug(jamath_slug: str | None) -> str | None:
    slug = (jamath_slug or "").strip().lower()
    if not slug or slug in ("demo", "app", "www"):
        return "Demo Jamath" if frappe.db.exists("Company", "Demo Jamath") else None
    try:
        from digital_jamath.cloud.provision import load_tenant

        tenant = load_tenant(slug)
        return (tenant or {}).get("company")
    except Exception:
        return None


def _find_household(clean_phone: str, company: str | None):
    filters: dict = {"phone_number": ["like", f"%{clean_phone}%"]}
    if company and frappe.db.has_column("Jamath Household", "company"):
        filters["company"] = company
    return frappe.db.get_value(
        "Jamath Household",
        filters,
        [
            "name",
            "membership_id",
            "economic_status",
            "zakat_score",
            "address",
            "is_verified",
            "phone_number",
            "company",
        ]
        if frappe.db.has_column("Jamath Household", "company")
        else [
            "name",
            "membership_id",
            "economic_status",
            "zakat_score",
            "address",
            "is_verified",
            "phone_number",
        ],
        as_dict=True,
    )


@frappe.whitelist(allow_guest=True)
def send_otp(phone_number: str, jamath_slug: str | None = None) -> dict:
    """
    Generate and dispatch a 6-digit OTP to the registered household phone number.
    """
    clean_phone = normalize_phone(phone_number)
    if not clean_phone or len(clean_phone) != 10:
        frappe.throw(_("Please enter a valid 10-digit mobile number."))

    company = _company_for_slug(jamath_slug)

    if clean_phone == DEMO_PHONE and (not jamath_slug or jamath_slug in ("demo", "")):
        ensure_demo_household()
        company = "Demo Jamath"

    household = _find_household(clean_phone, company)

    if not household and clean_phone != DEMO_PHONE:
        frappe.throw(
            _("Mobile number not found in Jamath census. Please contact your Masjid office to register.")
        )

    if clean_phone == DEMO_PHONE and (not jamath_slug or jamath_slug in ("demo", "")):
        otp = "123456"
    else:
        otp = f"{random.randint(100000, 999999)}"

    cache_key = f"otp:{company or 'default'}:{clean_phone}"
    frappe.cache().set_value(cache_key, otp, expires_in_sec=CACHE_EXPIRY_SECONDS)
    # Backward-compatible key for demo
    if clean_phone == DEMO_PHONE:
        frappe.cache().set_value(f"otp:{clean_phone}", otp, expires_in_sec=CACHE_EXPIRY_SECONDS)

    dispatch_sms(clean_phone, otp)

    return {
        "success": True,
        "message": _("OTP has been sent to your registered mobile number."),
        "phone": f"+91******{clean_phone[-4:]}",
        "expires_in": CACHE_EXPIRY_SECONDS,
        "jamath_slug": jamath_slug or "demo",
        "company": company,
    }


@frappe.whitelist(allow_guest=True)
def verify_otp(phone_number: str, otp: str, jamath_slug: str | None = None) -> dict:
    """
    Verifies the submitted OTP, provisions portal session, and returns household context.
    """
    clean_phone = normalize_phone(phone_number)
    submitted_otp = str(otp).strip()
    company = _company_for_slug(jamath_slug)

    if clean_phone == DEMO_PHONE and (not jamath_slug or jamath_slug in ("demo", "")):
        company = "Demo Jamath"

    cache_key = f"otp:{company or 'default'}:{clean_phone}"
    stored_otp = frappe.cache().get_value(cache_key) or frappe.cache().get_value(f"otp:{clean_phone}")

    if clean_phone == DEMO_PHONE and submitted_otp == "123456" and (
        not jamath_slug or jamath_slug in ("demo", "")
    ):
        stored_otp = "123456"
        ensure_demo_household()

    if not stored_otp or stored_otp != submitted_otp:
        frappe.throw(_("Invalid or expired OTP. Please request a new code."))

    frappe.cache().delete_value(cache_key)
    frappe.cache().delete_value(f"otp:{clean_phone}")

    household = _find_household(clean_phone, company)
    if not household:
        frappe.throw(_("Household not found."))

    subscription = frappe.db.get_value(
        "Jamath Membership",
        {"household": household.name, "status": "Active"},
        ["name", "cycle", "start_date", "end_date", "amount_paid"],
        as_dict=True,
    )

    members = frappe.get_all(
        "Jamath Member",
        filters={"parent": household.name},
        fields=[
            "name",
            "full_name",
            "relationship_to_head",
            "is_head_of_family",
            "gender",
            "profession",
            "dob",
        ],
    )

    user_email = f"member_{clean_phone}@digitaljamath.local"
    ensure_portal_user(user_email, clean_phone, household.name)

    slug = (jamath_slug or "demo").strip().lower() or "demo"
    token = create_portal_session(
        clean_phone,
        household.name,
        household.membership_id,
        jamath_slug=slug,
        company=getattr(household, "company", None) or company,
    )

    return {
        "success": True,
        "token": token,
        "expires_in": SESSION_EXPIRY_SECONDS,
        "household": household,
        "subscription": subscription,
        "members": members,
        "jamath_slug": slug,
        "company": getattr(household, "company", None) or company,
    }


@frappe.whitelist(allow_guest=True)
def logout() -> dict:
    clear_portal_session()
    return {"success": True}


def dispatch_sms(phone: str, otp: str):
    """Placeholder for SMS / WhatsApp gateway provider."""
    _ = (phone, otp)


def ensure_portal_user(email: str, phone: str, household_id: str):
    """Ensures a corresponding lightweight Frappe User exists for portal session."""
    if not frappe.db.exists("User", email):
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": f"Member {phone[-4:]}",
                "phone": phone,
                "send_welcome_email": 0,
                "roles": [{"role": "All"}],
            }
        )
        user.insert(ignore_permissions=True)
    frappe.cache().set_value(f"portal_user_household:{email}", household_id, expires_in_sec=SESSION_EXPIRY_SECONDS)
