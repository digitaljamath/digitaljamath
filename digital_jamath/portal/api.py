"""
REST API Endpoints consumed by Next.js Member Portal
"""

from digital_jamath.compat import frappe, _
from digital_jamath.portal.session import require_portal_session

REQUEST_TYPE_ALIASES = {
    "Nikaah Nama Certificate": "Nikaah Nama",
    "Nikaah Nama": "Nikaah Nama",
    "Death Certificate": "Death Certificate",
    "Mahal Transfer NOC": "Mahal Transfer NOC",
    "Character Certificate": "Character Certificate",
    "Other": "Other",
}


def _normalize_request_type(request_type: str) -> str:
    cleaned = (request_type or "").strip()
    return REQUEST_TYPE_ALIASES.get(cleaned, cleaned if cleaned in REQUEST_TYPE_ALIASES.values() else "Other")


@frappe.whitelist(allow_guest=True)
def get_household_profile(household_id: str | None = None) -> dict:
    """Fetch complete household details and family tree for the signed-in session."""
    session = require_portal_session(household_id)
    hid = session["household_id"]

    doc = frappe.get_doc("Jamath Household", hid)
    subscription = frappe.get_all(
        "Jamath Membership",
        filters={"household": hid},
        fields=["name", "cycle", "status", "start_date", "end_date", "minimum_required", "amount_paid"],
        order_by="creation desc",
        limit=1,
    )
    members = frappe.get_all(
        "Jamath Member",
        filters={"parent": hid},
        fields=[
            "name",
            "full_name",
            "relationship_to_head",
            "is_head_of_family",
            "gender",
            "profession",
            "dob",
            "education",
        ],
    )

    return {
        "household": doc.as_dict(),
        "members": members,
        "active_subscription": subscription[0] if subscription else None,
    }


@frappe.whitelist(allow_guest=True)
def get_member_receipts(household_id: str | None = None) -> list:
    """Fetch payment receipts linked to this household."""
    session = require_portal_session(household_id)
    hid = session["household_id"]

    return frappe.get_all(
        "Journal Entry",
        filters={"user_remark": ["like", f"%{hid}%"], "docstatus": 1},
        fields=["name", "posting_date", "total_debit", "total_credit", "user_remark", "mode_of_payment"],
        order_by="posting_date desc",
        limit=100,
    )


@frappe.whitelist(allow_guest=True)
def submit_service_request(
    household_id: str | None = None,
    request_type: str = "Other",
    description: str = "",
) -> dict:
    """Submit a new service or certificate request."""
    session = require_portal_session(household_id)
    hid = session["household_id"]
    normalized = _normalize_request_type(request_type)

    if not (description or "").strip():
        frappe.throw(_("Please describe your request."))

    sr = frappe.get_doc(
        {
            "doctype": "Jamath Service Request",
            "household": hid,
            "request_type": normalized,
            "description": description.strip(),
            "status": "Pending",
        }
    )
    sr.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "success": True,
        "request_id": sr.name,
        "status": sr.status,
        "request_type": sr.request_type,
    }


@frappe.whitelist(allow_guest=True)
def get_my_service_requests(household_id: str | None = None) -> list:
    """List service requests for the signed-in household."""
    session = require_portal_session(household_id)
    hid = session["household_id"]

    return frappe.get_all(
        "Jamath Service Request",
        filters={"household": hid},
        fields=["name", "request_type", "status", "description", "creation", "modified"],
        order_by="creation desc",
        limit=50,
    )


@frappe.whitelist(allow_guest=True)
def express_volunteer_interest(
    announcement: str | None = None,
    skills: str = "",
    notes: str = "",
) -> dict:
    """Register interest as a volunteer (uses household head name / phone from session)."""
    session = require_portal_session()
    hid = session["household_id"]
    phone = session.get("phone") or ""

    head = frappe.db.get_value(
        "Jamath Member",
        {"parent": hid, "is_head_of_family": 1},
        ["full_name"],
        as_dict=True,
    )
    full_name = (head and head.full_name) or f"Member {phone[-4:]}" if phone else "Member"

    note_bits = []
    if announcement:
        note_bits.append(f"Cause: {announcement}")
    if notes:
        note_bits.append(notes.strip())

    vol = frappe.get_doc(
        {
            "doctype": "Jamath Volunteer",
            "full_name": full_name,
            "phone_number": phone or "0000000000",
            "is_available": 1,
            "skills": skills or "",
            "notes": " | ".join(note_bits) if note_bits else "Registered via member portal",
        }
    )
    vol.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"success": True, "volunteer_id": vol.name}


@frappe.whitelist(allow_guest=True)
def get_volunteer_causes() -> dict:
    """Active fundraising causes for the member portal (public)."""
    announcements = []
    if frappe.db.table_exists("Jamath Announcement"):
        announcements = frappe.get_all(
            "Jamath Announcement",
            filters={"status": "Published"},
            fields=[
                "name",
                "title",
                "content",
                "published_at",
                "is_fundraiser",
                "fundraising_target",
                "amount_raised",
            ],
            order_by="published_at desc",
            limit=50,
        )

    volunteers = []
    if frappe.db.table_exists("Jamath Volunteer"):
        volunteers = frappe.get_all(
            "Jamath Volunteer",
            filters={"is_available": 1},
            fields=["name", "full_name", "skills", "is_available", "notes"],
            limit=50,
        )

    return {"causes": announcements, "volunteer_roles": volunteers}


@frappe.whitelist(allow_guest=True)
def get_announcements(is_public_only: bool = True) -> list:
    """Fetch active community announcements and fundraising campaigns."""
    if not frappe.db.table_exists("Jamath Announcement"):
        return []

    filters = {"status": "Published"}
    if is_public_only:
        filters["is_public"] = 1

    return frappe.get_all(
        "Jamath Announcement",
        filters=filters,
        fields=[
            "name",
            "title",
            "content",
            "published_at",
            "is_fundraiser",
            "fundraising_target",
            "amount_raised",
        ],
        order_by="published_at desc",
    )
