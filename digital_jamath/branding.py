"""
White-label Digital Jamath — Desk login, navbar, favicon, apps chrome.
"""

from digital_jamath.compat import frappe

# Cache-bust so browsers pick up new brand assets
V = "20260910f"

# Public asset paths (no query) — used in Website / Navbar Attach fields
LOGO_ICON_PATH = "/assets/digital_jamath/images/logo.svg"
LOGO_ICON_PNG_PATH = "/assets/digital_jamath/images/logo-mark.png"
LOGO_LOCKUP_PATH = "/assets/digital_jamath/images/logo-lockup.svg"
LOGO_LOGIN_PATH = "/assets/digital_jamath/images/logo-lockup.png"
FAVICON_PATH = "/assets/digital_jamath/images/favicon.svg"
FAVICON_ICO_PATH = "/assets/digital_jamath/images/favicon.ico"
FAVICON_PNG_PATH = "/assets/digital_jamath/images/icon-32.png"
APPLE_TOUCH_PATH = "/assets/digital_jamath/images/apple-touch-icon.png"

# Cache-busted URLs for hooks / boot / JS
LOGO_ICON = f"{LOGO_ICON_PATH}?v={V}"
LOGO_ICON_PNG = f"{LOGO_ICON_PNG_PATH}?v={V}"
LOGO_LOCKUP = f"{LOGO_LOCKUP_PATH}?v={V}"
LOGO_LOGIN = f"{LOGO_LOGIN_PATH}?v={V}"
FAVICON = f"{FAVICON_PATH}?v={V}"
FAVICON_ICO = f"{FAVICON_ICO_PATH}?v={V}"
FAVICON_PNG = f"{FAVICON_PNG_PATH}?v={V}"
APPLE_TOUCH = f"{APPLE_TOUCH_PATH}?v={V}"

BRAND = "Digital Jamath"


def extend_bootinfo(bootinfo):
    """Desk boot payload: product name, logos, Cloud trial status."""
    bootinfo["app_name"] = BRAND
    bootinfo["sysdefaults"] = bootinfo.get("sysdefaults") or {}
    bootinfo["sysdefaults"]["app_name"] = BRAND
    bootinfo["splash_image"] = LOGO_LOCKUP
    # Prefer PNG mark for Desk navbar reliability
    bootinfo["app_logo_url"] = LOGO_ICON_PNG
    # Soften apps / about chrome
    bootinfo["dj_brand"] = {
        "name": BRAND,
        "logo": LOGO_ICON_PNG,
        "lockup": LOGO_LOGIN,
        "favicon": FAVICON_ICO,
    }
    try:
        from digital_jamath.cloud.trial import inject_trial_bootinfo

        inject_trial_bootinfo(bootinfo)
    except Exception:
        bootinfo["dj_cloud_trial"] = {"status": "none", "locked": False}


def update_website_context(context):
    """Login / website templates — force DJ brand every request."""
    context.update(
        {
            "app_name": BRAND,
            "app_title": BRAND,
            "brand_html": BRAND,
            "favicon": FAVICON_ICO,
            "splash_image": LOGO_LOGIN,
            "banner_image": LOGO_LOGIN,
            "app_logo": LOGO_LOGIN,
        }
    )


def apply_website_settings():
    """Persist Website Settings so login/favicon/splash are Digital Jamath."""
    if not frappe.db.exists("DocType", "Website Settings"):
        return

    ws = frappe.get_single("Website Settings")
    ws.app_name = BRAND
    ws.brand_html = f'<img src="{LOGO_LOGIN_PATH}" alt="{BRAND}" style="max-height:36px">'
    ws.copyright = BRAND
    ws.footer_powered = ""
    ws.hide_footer_signup = 1
    # Attach Image fields — clean public asset paths (no ?v=)
    for field, value in (
        ("app_logo", LOGO_LOGIN_PATH),
        ("splash_image", LOGO_LOGIN_PATH),
        ("banner_image", LOGO_LOGIN_PATH),
        ("favicon", FAVICON_ICO_PATH),
        ("footer_logo", LOGO_ICON_PNG_PATH),
    ):
        if hasattr(ws, field):
            setattr(ws, field, value)
    ws.flags.ignore_permissions = True
    ws.flags.ignore_mandatory = True
    ws.save()
    frappe.db.commit()


def apply_navbar_settings():
    """Desk navbar Application Logo + strip Frappe/ERPNext help links."""
    if not frappe.db.exists("DocType", "Navbar Settings"):
        return

    try:
        nav = frappe.get_single("Navbar Settings")
        if getattr(nav, "help_dropdown", None):
            keep = []
            for row in nav.help_dropdown:
                label = (row.label or "").lower()
                url = (getattr(row, "url", None) or "").lower()
                if any(
                    x in label or x in url
                    for x in ("frappe", "erpnext", "discuss.erpnext", "docs.erpnext", "frappeframework")
                ):
                    # Hide instead of delete (standard items can't be removed)
                    if getattr(row, "is_standard", 0):
                        row.hidden = 1
                        keep.append(row)
                    continue
                keep.append(row)
            nav.set("help_dropdown", keep)
        # PNG mark reads clearly in the small navbar slot
        nav.app_logo = LOGO_ICON_PNG_PATH
        nav.flags.ignore_permissions = True
        nav.save()
        frappe.db.commit()
    except Exception:
        frappe.log_error(title="Digital Jamath navbar branding")
        # Fallback: write field directly if full save fails
        try:
            frappe.db.set_single_value("Navbar Settings", "app_logo", LOGO_ICON_PNG_PATH)
            frappe.db.commit()
        except Exception:
            pass


def apply_system_settings():
    """Set System Settings app name / default app when fields exist."""
    if not frappe.db.exists("DocType", "System Settings"):
        return
    try:
        ss = frappe.get_single("System Settings")
        if hasattr(ss, "app_name"):
            ss.app_name = BRAND
        if hasattr(ss, "default_app"):
            ss.default_app = "digital_jamath"
        ss.flags.ignore_permissions = True
        ss.save()
        frappe.db.commit()
    except Exception:
        frappe.log_error(title="Digital Jamath system settings branding")
