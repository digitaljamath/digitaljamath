import frappe
from frappe import _

DEFAULT_FUND_TYPES = [
    {
        "name": "Zakat",
        "fund_name": "Zakat (Restricted)",
        "fund_category": "Restricted",
        "is_zakat": 1,
        "description": "Mandatory Shariah alms strictly restricted to eligible asnaaf",
    },
    {
        "name": "Sadaqah",
        "fund_name": "Sadaqah (Restricted)",
        "fund_category": "Restricted",
        "is_zakat": 0,
        "description": "Voluntary charity for welfare and needy causes",
    },
    {
        "name": "Lillah",
        "fund_name": "Lillah (Restricted welfare)",
        "fund_category": "Restricted",
        "is_zakat": 0,
        "description": "Fi sabeelillah / general welfare collections kept distinct from Zakat",
    },
    {
        "name": "Chanda",
        "fund_name": "Chanda / Membership (Unrestricted)",
        "fund_category": "Unrestricted",
        "is_zakat": 0,
        "description": "Recurring household subscriptions for jamath operations",
    },
    {
        "name": "Construction",
        "fund_name": "Construction (Restricted)",
        "fund_category": "Restricted",
        "is_zakat": 0,
        "description": "Restricted capital donations for masjid building and renovation",
    },
    {
        "name": "Waqf",
        "fund_name": "Waqf / Endowment (Restricted)",
        "fund_category": "Restricted",
        "is_zakat": 0,
        "description": "Endowment corpus and waqf asset funding — not for general ops",
    },
    {
        "name": "General",
        "fund_name": "General & Operations (Unrestricted)",
        "fund_category": "Unrestricted",
        "is_zakat": 0,
        "description": "Unrestricted operational funds for utilities, maintenance, and salaries",
    },
]

def after_install():
    """Executed after digital_jamath app is installed on a site."""
    create_default_fund_types()
    setup_accounting_dimension()
    from digital_jamath.branding import (
        apply_website_settings,
        apply_navbar_settings,
        apply_system_settings,
    )
    apply_website_settings()
    apply_navbar_settings()
    apply_system_settings()
    from digital_jamath.onboarding import bootstrap_demo_jamath_if_needed
    bootstrap_demo_jamath_if_needed()
    from digital_jamath.workspace_setup import simplify_desk_for_jamath
    simplify_desk_for_jamath()
    from digital_jamath.portal.demo import ensure_demo_household
    ensure_demo_household()
    from digital_jamath.cloud.demo_jamath import ensure_demo_jamath
    ensure_demo_jamath()

def after_migrate():
    """Executed after running bench migrate."""
    create_default_fund_types()
    setup_accounting_dimension()
    from digital_jamath.branding import (
        apply_website_settings,
        apply_navbar_settings,
        apply_system_settings,
    )
    apply_website_settings()
    apply_navbar_settings()
    apply_system_settings()
    from digital_jamath.onboarding import bootstrap_demo_jamath_if_needed
    bootstrap_demo_jamath_if_needed()
    from digital_jamath.workspace_setup import simplify_desk_for_jamath
    simplify_desk_for_jamath()
    from digital_jamath.portal.demo import ensure_demo_household
    ensure_demo_household()
    from digital_jamath.cloud.demo_jamath import ensure_demo_jamath
    ensure_demo_jamath()

def create_default_fund_types():
    """Seed default Shariah Fund Types if they do not exist."""
    if not frappe.db.table_exists("Fund Type"):
        return

    for item in DEFAULT_FUND_TYPES:
        if not frappe.db.exists("Fund Type", item["name"]):
            doc = frappe.get_doc({
                "doctype": "Fund Type",
                "fund_type": item["name"],
                "fund_name": item["fund_name"],
                "fund_category": item["fund_category"],
                "is_zakat": item["is_zakat"],
                "description": item["description"],
                "is_active": 1
            })
            doc.insert(ignore_permissions=True)

def setup_accounting_dimension():
    """Register 'Fund Type' as an official ERPNext Accounting Dimension."""
    if not frappe.db.table_exists("Accounting Dimension"):
        return

    if not frappe.db.exists("Accounting Dimension", {"document_type": "Fund Type"}):
        dimension = frappe.get_doc({
            "doctype": "Accounting Dimension",
            "document_type": "Fund Type",
            "label": "Fund Type",
            "dimension_defaults": [
                {
                    "company": frappe.defaults.get_user_default("Company"),
                    "default_dimension": "General"
                }
            ] if frappe.defaults.get_user_default("Company") else []
        })
        dimension.insert(ignore_permissions=True)
    else:
        dimension = frappe.get_doc("Accounting Dimension", {"document_type": "Fund Type"})

    # Ensure custom fields exist on Journal Entry Account / GL Entry / etc.
    try:
        from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import (
            make_dimension_in_accounting_doctypes,
        )

        make_dimension_in_accounting_doctypes(dimension)
    except Exception:
        frappe.log_error(title="setup_accounting_dimension fields")
