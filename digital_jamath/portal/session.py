"""Portal session tokens for the Next.js member portal (passwordless OTP)."""

from digital_jamath.compat import frappe, _

SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days


def create_portal_session(
    phone: str,
    household_id: str,
    membership_id: str | None = None,
    *,
    jamath_slug: str | None = None,
    company: str | None = None,
) -> str:
    import secrets

    token = secrets.token_urlsafe(32)
    frappe.cache().set_value(
        f"portal_session:{token}",
        {
            "phone": phone,
            "household_id": household_id,
            "membership_id": membership_id,
            "jamath_slug": jamath_slug,
            "company": company,
        },
        expires_in_sec=SESSION_EXPIRY_SECONDS,
    )
    return token


def _token_from_request() -> str | None:
    return (frappe.form_dict.get("portal_token") or "").strip() or (
        frappe.get_request_header("X-Portal-Token") or ""
    ).strip() or None


def get_portal_session(token: str | None = None) -> dict | None:
    token = token or _token_from_request()
    if not token:
        return None
    data = frappe.cache().get_value(f"portal_session:{token}")
    return data if isinstance(data, dict) else None


def require_portal_session(household_id: str | None = None) -> dict:
    session = get_portal_session()
    if not session:
        frappe.throw(_("Please sign in to the member portal."), frappe.AuthenticationError)
    if household_id and session.get("household_id") != household_id:
        frappe.throw(_("Session does not match this household."), frappe.PermissionError)
    return session


def clear_portal_session(token: str | None = None) -> None:
    token = token or _token_from_request()
    if token:
        frappe.cache().delete_value(f"portal_session:{token}")
