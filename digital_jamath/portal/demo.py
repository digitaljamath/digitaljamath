"""Seed a staging demo household for portal smoke tests (phone 9876543210)."""

from digital_jamath.compat import frappe

DEMO_PHONE = "9876543210"
DEMO_MEMBERSHIP_ID = "JM-DEMO"


def ensure_demo_household() -> str | None:
    """Create or refresh the demo household used by staging OTP. Returns household name."""
    if not frappe.db.table_exists("Jamath Household"):
        return None

    existing = frappe.db.get_value(
        "Jamath Household",
        {"phone_number": ["like", f"%{DEMO_PHONE}%"]},
        "name",
    )
    if existing:
        return existing

    if frappe.db.exists("Jamath Household", {"membership_id": DEMO_MEMBERSHIP_ID}):
        return frappe.db.get_value("Jamath Household", {"membership_id": DEMO_MEMBERSHIP_ID}, "name")

    doc = frappe.get_doc(
        {
            "doctype": "Jamath Household",
            "membership_id": DEMO_MEMBERSHIP_ID,
            "phone_number": DEMO_PHONE,
            "is_verified": 1,
            "company": "Demo Jamath" if frappe.db.exists("Company", "Demo Jamath") else None,
            "address": "Demo Mohalla — Digital Jamath staging",
            "monthly_income": 45000,
            "members": [
                {
                    "full_name": "Yusuf Demo",
                    "relationship_to_head": "Self",
                    "is_head_of_family": 1,
                    "gender": "Male",
                    "profession": "Software Consultant",
                },
                {
                    "full_name": "Zainab Demo",
                    "relationship_to_head": "Spouse",
                    "gender": "Female",
                    "profession": "School Teacher",
                },
                {
                    "full_name": "Ibrahim Demo",
                    "relationship_to_head": "Son",
                    "gender": "Male",
                    "profession": "Student",
                },
                {
                    "full_name": "Maryam Demo",
                    "relationship_to_head": "Daughter",
                    "gender": "Female",
                    "profession": "Student",
                },
            ],
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    ensure_demo_announcement()
    return doc.name


def ensure_demo_announcement() -> None:
    if not frappe.db.table_exists("Jamath Announcement"):
        return
    if frappe.db.exists("Jamath Announcement", {"title": "Ramadan Iftar volunteers needed"}):
        return
    frappe.get_doc(
        {
            "doctype": "Jamath Announcement",
            "title": "Ramadan Iftar volunteers needed",
            "status": "Published",
            "is_public": 1,
            "is_fundraiser": 1,
            "fundraising_target": 50000,
            "amount_raised": 12500,
            "published_at": frappe.utils.now(),
            "content": "<p>Help with iftar packing and distribution this weekend. Sign up from the member portal.</p>",
        }
    ).insert(ignore_permissions=True)
    frappe.db.commit()
