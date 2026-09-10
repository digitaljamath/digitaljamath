"""Apply Digital Jamath Desk/login branding and report status."""
from digital_jamath.compat import frappe
from digital_jamath.branding import (
    apply_navbar_settings,
    apply_system_settings,
    apply_website_settings,
)


def run():
    apply_website_settings()
    apply_navbar_settings()
    apply_system_settings()
    frappe.clear_cache()

    from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

    return {
        "navbar_app_logo": frappe.db.get_single_value("Navbar Settings", "app_logo"),
        "ws_app_logo": frappe.db.get_single_value("Website Settings", "app_logo"),
        "ws_favicon": frappe.db.get_single_value("Website Settings", "favicon"),
        "ws_splash": frappe.db.get_single_value("Website Settings", "splash_image"),
        "ws_app_name": frappe.db.get_single_value("Website Settings", "app_name"),
        "resolved_app_logo": get_app_logo(),
    }
