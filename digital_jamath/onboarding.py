"""
Jamath-first onboarding — replace ERPNext "Company" setup wizard.

ERPNext still stores a Company row (required for accounting). We label it Jamath
in our UI and choose currency / timezone / COA from country.
"""

from __future__ import annotations

from digital_jamath.compat import frappe, _

# Smart defaults by country (extend as we grow locales)
COUNTRY_DEFAULTS = {
    "India": {
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 4,  # April
        "use_masjid_coa": True,
    },
    "Bangladesh": {
        "currency": "BDT",
        "timezone": "Asia/Dhaka",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 7,
        "use_masjid_coa": True,
    },
    "United Arab Emirates": {
        "currency": "AED",
        "timezone": "Asia/Dubai",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 1,
        "use_masjid_coa": True,
    },
    "Saudi Arabia": {
        "currency": "SAR",
        "timezone": "Asia/Riyadh",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 1,
        "use_masjid_coa": True,
    },
    "United Kingdom": {
        "currency": "GBP",
        "timezone": "Europe/London",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 4,
        "use_masjid_coa": True,
    },
    "United States": {
        "currency": "USD",
        "timezone": "America/New_York",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 1,
        "use_masjid_coa": True,
    },
    "Malaysia": {
        "currency": "MYR",
        "timezone": "Asia/Kuala_Lumpur",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 1,
        "use_masjid_coa": True,
    },
    "Singapore": {
        "currency": "SGD",
        "timezone": "Asia/Singapore",
        "language": "English",
        "chart_of_accounts": "Standard",
        "fy_start_month": 1,
        "use_masjid_coa": True,
    },
}


def get_country_defaults(country: str) -> dict:
    return dict(COUNTRY_DEFAULTS.get(country) or COUNTRY_DEFAULTS["India"])


def _abbr(name: str) -> str:
    parts = [p for p in (name or "DJ").split() if p]
    if len(parts) == 1:
        return parts[0][:3].upper()
    return "".join(p[0] for p in parts[:3]).upper()


def _fy_dates(fy_start_month: int) -> tuple[str, str]:
    from frappe.utils import getdate, add_years, add_days, today

    today_d = getdate(today())
    year = today_d.year
    start = getdate(f"{year}-{fy_start_month:02d}-01")
    if today_d < start:
        start = getdate(f"{year - 1}-{fy_start_month:02d}-01")
    end = add_days(add_years(start, 1), -1)
    return str(start), str(end)


def is_setup_complete() -> bool:
    try:
        if hasattr(frappe, "is_setup_complete"):
            return bool(frappe.is_setup_complete())
    except Exception:
        pass
    return bool(frappe.db.get_single_value("System Settings", "setup_complete"))


@frappe.whitelist(allow_guest=True)
def get_onboarding_options() -> dict:
    """Countries + copy for the simple public signup UI."""
    return {
        "brand": "Digital Jamath",
        "steps": [
            {"id": "jamath", "title": "Your Jamath", "hint": "Masjid / Jamath / Trust name"},
            {"id": "country", "title": "Country", "hint": "Sets currency, calendar, and chart defaults"},
            {"id": "admin", "title": "Admin", "hint": "Email for the first trustee login"},
        ],
        "countries": sorted(COUNTRY_DEFAULTS.keys()),
        "defaults": {c: get_country_defaults(c) for c in COUNTRY_DEFAULTS},
        "setup_complete": is_setup_complete(),
        "signup_mode": "same_site",  # Cloud multi-site comes later via provision_site.sh
    }


@frappe.whitelist()
def setup_jamath(
    jamath_name: str,
    country: str = "India",
    admin_email: str | None = None,
    admin_full_name: str | None = None,
) -> dict:
    """
    Simple 1-shot Jamath setup. Maps to ERPNext Company under the hood.
    Call after Administrator login, or from after_install with defaults.
    """
    jamath_name = (jamath_name or "").strip()
    if not jamath_name:
        frappe.throw(_("Please enter your Jamath name."))

    country = country if country in COUNTRY_DEFAULTS else "India"
    defaults = get_country_defaults(country)
    fy_start, fy_end = _fy_dates(defaults["fy_start_month"])
    abbr = _abbr(jamath_name)

    # Prefer ERPNext/Frappe official setup_complete when wizard still open
    if not is_setup_complete():
        args = {
            "language": defaults["language"],
            "country": country,
            "timezone": defaults["timezone"],
            "currency": defaults["currency"],
            "company_name": jamath_name,
            "company_abbr": abbr,
            "chart_of_accounts": defaults.get("chart_of_accounts") or "Standard",
            "fy_start_date": fy_start,
            "fy_end_date": fy_end,
            "enable_telemetry": 0,
            "full_name": admin_full_name or "Jamath Admin",
            "email": admin_email or frappe.session.user,
        }
        try:
            from frappe.desk.page.setup_wizard.setup_wizard import setup_complete

            setup_complete(args)
        except Exception:
            frappe.log_error(title="Jamath setup_complete fallback")
            _manual_create_company(jamath_name, abbr, country, defaults)
            _mark_setup_complete()
    else:
        _ensure_company(jamath_name, abbr, country, defaults)

    if defaults.get("use_masjid_coa"):
        from digital_jamath.baitul_maal.coa_template import apply_masjid_coa

        apply_masjid_coa(jamath_name)

    from digital_jamath.setup import create_default_fund_types, setup_accounting_dimension

    create_default_fund_types()
    setup_accounting_dimension()

    frappe.db.set_default("desktop:home_page", "workspace")
    frappe.clear_cache()

    return {
        "success": True,
        "jamath_name": jamath_name,
        "company": jamath_name,
        "country": country,
        "currency": defaults["currency"],
        "timezone": defaults["timezone"],
        "message": _("Jamath is ready. Welcome to Digital Jamath."),
        "desk_url": "/app",
    }


def bootstrap_demo_jamath_if_needed():
    """
    Called from after_install: finish ERPNext wizard so Administrator is not
    stuck on Company Name — demo jamath can be renamed via setup_jamath.
    """
    if is_setup_complete():
        return
    try:
        setup_jamath(
            jamath_name="Demo Jamath",
            country="India",
            admin_email="Administrator",
            admin_full_name="Administrator",
        )
    except Exception:
        frappe.log_error(title="bootstrap_demo_jamath_if_needed")


def _manual_create_company(name: str, abbr: str, country: str, defaults: dict):
    if frappe.db.exists("Company", name):
        return
    doc = frappe.get_doc(
        {
            "doctype": "Company",
            "company_name": name,
            "abbr": abbr,
            "default_currency": defaults["currency"],
            "country": country,
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.set_value("Global Defaults", None, "default_company", name)
    frappe.db.commit()


def _ensure_company(name: str, abbr: str, country: str, defaults: dict):
    if frappe.db.exists("Company", name):
        frappe.db.set_value("Global Defaults", None, "default_company", name)
        return
    # Rename sole demo company if present
    companies = frappe.get_all("Company", pluck="name")
    if len(companies) == 1 and companies[0] in ("Demo Jamath", "Demo Masjid Trust"):
        old = companies[0]
        frappe.rename_doc("Company", old, name, force=True)
        frappe.db.set_value("Company", name, "abbr", abbr)
        frappe.db.set_value("Company", name, "country", country)
        frappe.db.set_value("Company", name, "default_currency", defaults["currency"])
        frappe.db.set_value("Global Defaults", None, "default_company", name)
        frappe.db.commit()
        return
    _manual_create_company(name, abbr, country, defaults)


def _mark_setup_complete():
    frappe.db.set_single_value("System Settings", "setup_complete", 1)
    try:
        frappe.db.set_single_value("System Settings", "enable_onboarding", 0)
    except Exception:
        pass
    frappe.db.set_default("desktop:home_page", "workspace")
    frappe.db.commit()
