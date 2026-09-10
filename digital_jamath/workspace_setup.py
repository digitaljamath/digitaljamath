"""
Simplify Desk for masjid trustees: Digital Jamath home, hide ERP noise.

Navigation rules (Frappe 15):
- Keep a public hub workspace (Digital Jamath) and do not hide Home by unpublishing it.
- Hide ERP noise with is_hidden=1 only (keep public=1) so Desk sidebar machinery stays intact.
- Logo /app resolves via User.default_workspace → Digital Jamath.
"""

from digital_jamath.compat import frappe

# ERP noise — hide from sidebar, but keep public so Desk boot stays healthy.
# Never put "Home" or "Digital Jamath" here.
HIDE_WORKSPACES = [
    "Welcome Workspace",
    "Manufacturing",
    "CRM",
    "Selling",
    "Buying",
    "Stock",
    "Quality",
    "Projects",
    "Support",
    "Assets",
    "ERPNext Integrations",
    "ERPNext Settings",
    "Build",
    "Website",
    "Integrations",
    "Tools",
    "Quality Management",
    "Loan Management",
    "Telephony",
    "Subcontracting",
    "Bulk Transaction",
    "Receivables",
    "Payables",
]

DJ_WORKSPACE = "Digital Jamath"


def simplify_desk_for_jamath():
    """Idempotent: call from after_install / after_migrate / bench execute."""
    _disable_erpnext_onboarding()
    _hide_noisy_workspaces()
    _restore_home_workspace()
    _ensure_digital_jamath_workspace()
    _set_home_to_jamath_workspace()
    frappe.clear_cache()


def _disable_erpnext_onboarding():
    try:
        frappe.db.set_single_value("System Settings", "enable_onboarding", 0)
    except Exception:
        pass

    if frappe.db.exists("DocType", "Module Onboarding"):
        for name in frappe.get_all("Module Onboarding", pluck="name"):
            try:
                frappe.db.set_value("Module Onboarding", name, "is_complete", 1)
            except Exception:
                pass

    if frappe.db.exists("DocType", "Onboarding Step"):
        frappe.db.sql("update `tabOnboarding Step` set is_complete = 1")

    frappe.db.commit()


def _hide_noisy_workspaces():
    for name in HIDE_WORKSPACES:
        if frappe.db.exists("Workspace", name):
            frappe.db.set_value("Workspace", name, "is_hidden", 1)
            # Keep public=1 — unpublishing broke logo/sidebar escape hatches
            frappe.db.set_value("Workspace", name, "public", 1)

    for name in frappe.get_all("Workspace", filters={"title": ["like", "%Welcome%"]}, pluck="name"):
        frappe.db.set_value("Workspace", name, "is_hidden", 1)
        frappe.db.set_value("Workspace", name, "public", 1)

    frappe.db.commit()


def _restore_home_workspace():
    """Ensure Home remains a usable Desk hub (logo /app fallback)."""
    if not frappe.db.exists("Workspace", "Home"):
        return
    frappe.db.set_value("Workspace", "Home", "is_hidden", 0)
    frappe.db.set_value("Workspace", "Home", "public", 1)
    # Sit Home after Digital Jamath in the sidebar
    try:
        frappe.db.set_value("Workspace", "Home", "sequence_id", 1.0)
    except Exception:
        pass
    frappe.db.commit()


def _ensure_digital_jamath_workspace():
    name = DJ_WORKSPACE
    shortcuts = [
        _shortcut("Jamath Household", "Households", "users"),
        _shortcut("Jamath Member", "Members", "user"),
        _shortcut("Fund Type", "Fund Types", "money-coins-1"),
        _shortcut("Journal Entry", "Ledger entries", "accounting"),
        _shortcut("Payment Entry", "Payments / collections", "income"),
        _shortcut("Jamath Staff", "Staff & salary", "hr"),
        _shortcut("Jamath Compliance Item", "Compliance", "list"),
        _shortcut("Jamath Grant Application", "Zakat grants", "quality"),
        _shortcut("Jamath Service Request", "Service tickets", "support"),
        _shortcut("Jamath Announcement", "Announcements", "megaphone"),
    ]
    shortcuts = [s for s in shortcuts if frappe.db.exists("DocType", s["link_to"])]

    links = [
        _link_card("Community", [
            ("Jamath Household", "Households"),
            ("Jamath Member", "Members"),
            ("Jamath Membership", "Subscriptions"),
            ("Jamath Staff", "Staff & payroll"),
        ]),
        _link_card("Baitul Maal", [
            ("Fund Type", "Fund Types"),
            ("Journal Entry", "Journal Entry"),
            ("Payment Entry", "Payment Entry"),
            ("Account", "Chart of Accounts"),
            ("Company", "Jamath (Company)"),
            ("Jamath Grant Application", "Zakat / welfare grants"),
        ]),
        _link_card("Welfare & services", [
            ("Jamath Service Request", "Service tickets"),
            ("Jamath Grant Application", "Grant applications"),
            ("Jamath Announcement", "Announcements"),
            ("Jamath Volunteer", "Volunteers"),
            ("Jamath Compliance Item", "Compliance checklist"),
        ]),
    ]

    cleaned_links = []
    for card in links:
        deps = []
        for row in card.get("links") or []:
            if row.get("type") == "Link" and not frappe.db.exists("DocType", row.get("link_to")):
                continue
            deps.append(row)
        if any(r.get("type") == "Link" for r in deps):
            card["links"] = deps
            cleaned_links.append(card)

    content = [
        {
            "id": "dj_header",
            "type": "header",
            "data": {"text": '<span class="h4">Digital Jamath</span>', "col": 12},
        },
        {"id": "dj_spacer", "type": "spacer", "data": {"col": 12}},
        {
            "id": "dj_shortcuts",
            "type": "shortcut",
            "data": {"col": 12, "shortcuts": [{"label": s["label"]} for s in shortcuts]},
        },
        {"id": "dj_spacer2", "type": "spacer", "data": {"col": 12}},
    ]
    for card in cleaned_links:
        label = next((r["label"] for r in card["links"] if r.get("type") == "Card Break"), None)
        if label:
            content.append({
                "id": f"dj_card_{frappe.scrub(label)}",
                "type": "card",
                "data": {"col": 4, "card_name": label},
            })

    flat_links = [row for card in cleaned_links for row in card["links"]]

    if frappe.db.exists("Workspace", name):
        ws = frappe.get_doc("Workspace", name)
        ws.shortcuts = []
        ws.links = []
        for s in shortcuts:
            ws.append("shortcuts", s)
        for row in flat_links:
            ws.append("links", row)
        ws.content = frappe.as_json(content)
        ws.public = 1
        ws.is_hidden = 0
        ws.title = DJ_WORKSPACE
        ws.icon = "organization"
        ws.sequence_id = 0.1
        # Hub workspace — no single module, so breadcrumbs from any DJ DocType can return here
        ws.module = ""
        ws.flags.ignore_permissions = True
        ws.flags.ignore_links = True
        ws.save()
    else:
        ws = frappe.get_doc({
            "doctype": "Workspace",
            "name": name,
            "title": DJ_WORKSPACE,
            "label": name,
            "public": 1,
            "is_hidden": 0,
            "icon": "organization",
            "module": "",
            "sequence_id": 0.1,
            "content": frappe.as_json(content),
            "shortcuts": shortcuts,
            "links": flat_links,
        })
        ws.flags.ignore_permissions = True
        ws.flags.ignore_links = True
        ws.insert()

    frappe.db.commit()


def _shortcut(doctype: str, label: str, icon: str) -> dict:
    return {
        "type": "DocType",
        "link_to": doctype,
        "label": label,
        "icon": icon,
        "doc_view": "List",
        "color": "Blue",
    }


def _link_card(card_label: str, items: list) -> dict:
    rows = [{"type": "Card Break", "label": card_label}]
    for doctype, label in items:
        rows.append({
            "type": "Link",
            "label": label,
            "link_type": "DocType",
            "link_to": doctype,
            "onboard": 0,
        })
    return {"links": rows}


def _set_home_to_jamath_workspace():
    # Correct Frappe boot value — "workspace" (not a Workspace title)
    frappe.db.set_default("desktop:home_page", "workspace")

    try:
        frappe.db.set_single_value("System Settings", "default_app", "digital_jamath")
    except Exception:
        pass

    # Pin active users to Digital Jamath so /app and logo land on the hub
    if frappe.db.exists("Workspace", DJ_WORKSPACE):
        for user in frappe.get_all(
            "User",
            filters={"enabled": 1, "user_type": "System User"},
            pluck="name",
        ):
            try:
                frappe.db.set_value("User", user, "default_workspace", DJ_WORKSPACE)
            except Exception:
                pass

    frappe.db.commit()
