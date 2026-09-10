import frappe
from frappe import _


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login?redirect-to=/jamath_setup"
        raise frappe.Redirect

    context.no_cache = 1
    context.jamath_name = frappe.form_dict.get("jamath") or ""
    context.country = frappe.form_dict.get("country") or "India"
    from digital_jamath.onboarding import COUNTRY_DEFAULTS, is_setup_complete

    context.countries = sorted(COUNTRY_DEFAULTS.keys())
    context.setup_complete = is_setup_complete()
    context.brand = "Digital Jamath"
