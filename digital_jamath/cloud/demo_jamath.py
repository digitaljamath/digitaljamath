"""
Public Demo Jamath — realistic dummy data that resets every night.

Desk login: demo@digitaljamath.com / Experience@DJ1
Member portal: phone 9876543210 · OTP 123456
"""

from __future__ import annotations

from digital_jamath.compat import frappe, _
from frappe.utils import add_days, now_datetime, today

DEMO_COMPANY = "Demo Jamath"
DEMO_USER = "demo@digitaljamath.com"
DEMO_PASSWORD = "Experience@DJ1"
DEMO_ABBR = "DEMO"
MEMBERSHIP_PREFIX = "DEMO-"


def get_demo_credentials() -> dict:
    return {
        "company": DEMO_COMPANY,
        "desk_url": "/login",
        "email": DEMO_USER,
        "password": DEMO_PASSWORD,
        "portal_phone": "9876543210",
        "portal_otp": "123456",
        "portal_url": "https://digitaljamath.com/portal/login",
        "reset_note": "Demo data resets every night around midnight (IST).",
        "message": _("Explore a sample jamath. Changes are wiped nightly."),
    }


@frappe.whitelist(allow_guest=True)
def public_demo_credentials() -> dict:
    ensure_demo_jamath()
    return get_demo_credentials()


def ensure_demo_jamath():
    """Idempotent: company + user + seed if empty."""
    _ensure_company()
    _ensure_demo_user()
    if not frappe.db.exists("Jamath Household", {"membership_id": f"{MEMBERSHIP_PREFIX}001"}):
        seed_demo_data()
    else:
        # Backfill Baitul Maal if households exist but finance seed is missing
        hh_ids = frappe.get_all(
            "Jamath Household",
            filters={"membership_id": ["like", f"{MEMBERSHIP_PREFIX}%"]},
            pluck="name",
        )
        _seed_baitul_maal(hh_ids)
        frappe.db.commit()


def reset_demo_jamath():
    """Nightly job: wipe demo-tagged records and reseed."""
    if not frappe.db.exists("Company", DEMO_COMPANY):
        _ensure_company()

    frappe.flags.dj_ignore_trial_lock = True
    try:
        _wipe_demo_data()
        seed_demo_data()
        _ensure_demo_user()
        frappe.db.commit()
    finally:
        frappe.flags.dj_ignore_trial_lock = False


def _ensure_company():
    from digital_jamath.onboarding import get_country_defaults, _manual_create_company

    if frappe.db.exists("Company", DEMO_COMPANY):
        return
    defaults = get_country_defaults("India")
    _manual_create_company(DEMO_COMPANY, DEMO_ABBR, "India", defaults)
    try:
        from digital_jamath.baitul_maal.coa_template import apply_masjid_coa

        apply_masjid_coa(DEMO_COMPANY)
    except Exception:
        frappe.log_error(title="demo jamath COA")


def _ensure_demo_user():
    roles = [{"role": "Accounts Manager"}, {"role": "Accounts User"}]
    if frappe.db.exists("Role", "System Manager"):
        # Demo needs to browse Desk freely within this sandbox company
        roles.append({"role": "System Manager"})

    if frappe.db.exists("User", DEMO_USER):
        user = frappe.get_doc("User", DEMO_USER)
        user.enabled = 1
        user.new_password = DEMO_PASSWORD
        existing = {r.role for r in user.roles}
        for r in roles:
            if r["role"] not in existing:
                user.append("roles", r)
        user.flags.ignore_permissions = True
        user.save()
    else:
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": DEMO_USER,
                "first_name": "Demo",
                "last_name": "Trustee",
                "send_welcome_email": 0,
                "user_type": "System User",
                "new_password": DEMO_PASSWORD,
                "roles": roles,
            }
        )
        user.insert(ignore_permissions=True)

    if not frappe.db.exists(
        "User Permission", {"user": DEMO_USER, "allow": "Company", "for_value": DEMO_COMPANY}
    ):
        frappe.get_doc(
            {
                "doctype": "User Permission",
                "user": DEMO_USER,
                "allow": "Company",
                "for_value": DEMO_COMPANY,
                "apply_to_all_doctypes": 1,
            }
        ).insert(ignore_permissions=True)

    try:
        frappe.defaults.set_user_default("company", DEMO_COMPANY, DEMO_USER)
    except Exception:
        pass


def _wipe_demo_data():
    from digital_jamath.portal.demo import DEMO_PHONE, DEMO_MEMBERSHIP_ID

    # Collect demo households by membership prefix, legacy JM-DEMO, or portal demo phone
    hh_names = set(
        frappe.get_all(
            "Jamath Household",
            filters={"membership_id": ["like", f"{MEMBERSHIP_PREFIX}%"]},
            pluck="name",
        )
    )
    for extra in frappe.get_all(
        "Jamath Household",
        filters={"phone_number": ["like", f"%{DEMO_PHONE}%"]},
        pluck="name",
    ):
        hh_names.add(extra)
    if frappe.db.exists("Jamath Household", {"membership_id": DEMO_MEMBERSHIP_ID}):
        hh_names.add(frappe.db.get_value("Jamath Household", {"membership_id": DEMO_MEMBERSHIP_ID}, "name"))

    hh_names = list(hh_names)

    if hh_names and frappe.db.table_exists("Jamath Service Request"):
        for name in frappe.get_all(
            "Jamath Service Request", filters={"household": ["in", hh_names]}, pluck="name"
        ):
            frappe.delete_doc("Jamath Service Request", name, force=True, ignore_permissions=True)

    if frappe.db.table_exists("Jamath Announcement"):
        for name in frappe.get_all(
            "Jamath Announcement",
            filters={"title": ["like", "[DEMO]%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Announcement", name, force=True, ignore_permissions=True)

    if frappe.db.table_exists("Jamath Volunteer"):
        for name in frappe.get_all(
            "Jamath Volunteer",
            filters={"notes": ["like", "%[DEMO-SEED]%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Volunteer", name, force=True, ignore_permissions=True)
        for name in frappe.get_all(
            "Jamath Volunteer",
            filters={"phone_number": ["like", f"%{DEMO_PHONE}%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Volunteer", name, force=True, ignore_permissions=True)

    if frappe.db.table_exists("Jamath Staff"):
        for name in frappe.get_all(
            "Jamath Staff",
            filters={"notes": ["like", "%[DEMO-SEED]%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Staff", name, force=True, ignore_permissions=True)

    if frappe.db.table_exists("Jamath Compliance Item"):
        for name in frappe.get_all(
            "Jamath Compliance Item",
            filters={"description": ["like", "%[DEMO-SEED]%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Compliance Item", name, force=True, ignore_permissions=True)

    if frappe.db.table_exists("Journal Entry"):
        for row in frappe.get_all(
            "Journal Entry",
            filters={"user_remark": ["like", "%[DEMO-SEED]%"], "company": DEMO_COMPANY},
            fields=["name", "docstatus"],
        ):
            try:
                doc = frappe.get_doc("Journal Entry", row.name)
                if doc.docstatus == 1:
                    doc.cancel()
                frappe.delete_doc("Journal Entry", row.name, force=True, ignore_permissions=True)
            except Exception:
                frappe.db.sql("delete from `tabJournal Entry` where name=%s", row.name)

    if hh_names and frappe.db.table_exists("Jamath Grant Application"):
        for name in frappe.get_all(
            "Jamath Grant Application",
            filters={"applicant_household": ["in", hh_names]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Grant Application", name, force=True, ignore_permissions=True)
        for name in frappe.get_all(
            "Jamath Grant Application",
            filters={"description": ["like", "%[DEMO-SEED]%"]},
            pluck="name",
        ):
            frappe.delete_doc("Jamath Grant Application", name, force=True, ignore_permissions=True)

    for name in hh_names:
        frappe.delete_doc("Jamath Household", name, force=True, ignore_permissions=True)

    frappe.db.commit()


def seed_demo_data():
    """Insert a small but believable jamath snapshot."""
    from digital_jamath.portal.demo import DEMO_PHONE

    families = [
        {
            "membership_id": f"{MEMBERSHIP_PREFIX}001",
            "phone": DEMO_PHONE,
            "address": "12 Palm Grove, Demo Mohalla",
            "income": 45000,
            "members": [
                {"full_name": "Yusuf Demo", "relationship_to_head": "Self", "is_head_of_family": 1, "gender": "Male", "profession": "Software Consultant"},
                {"full_name": "Zainab Demo", "relationship_to_head": "Spouse", "gender": "Female", "profession": "School Teacher"},
                {"full_name": "Ibrahim Demo", "relationship_to_head": "Son", "gender": "Male", "profession": "Student"},
                {"full_name": "Maryam Demo", "relationship_to_head": "Daughter", "gender": "Female", "profession": "Student"},
            ],
        },
        {
            "membership_id": f"{MEMBERSHIP_PREFIX}002",
            "phone": "9876500002",
            "address": "44 Masjid Road, Demo Mohalla",
            "income": 22000,
            "members": [
                {"full_name": "Fatima Begum", "relationship_to_head": "Self", "is_head_of_family": 1, "gender": "Female", "profession": "Tailor"},
                {"full_name": "Ayesha Begum", "relationship_to_head": "Daughter", "gender": "Female", "profession": "Student"},
            ],
        },
        {
            "membership_id": f"{MEMBERSHIP_PREFIX}003",
            "phone": "9876500003",
            "address": "8 Orchard Lane",
            "income": 60000,
            "members": [
                {"full_name": "Imran Khan", "relationship_to_head": "Self", "is_head_of_family": 1, "gender": "Male", "profession": "Trader"},
                {"full_name": "Sara Khan", "relationship_to_head": "Spouse", "gender": "Female", "profession": "Homemaker"},
                {"full_name": "Omar Khan", "relationship_to_head": "Son", "gender": "Male", "profession": "Student"},
            ],
        },
        {
            "membership_id": f"{MEMBERSHIP_PREFIX}004",
            "phone": "9876500004",
            "address": "Near Friday Market",
            "income": 15000,
            "members": [
                {"full_name": "Abdul Rahman", "relationship_to_head": "Self", "is_head_of_family": 1, "gender": "Male", "profession": "Driver"},
                {"full_name": "Hafsa Rahman", "relationship_to_head": "Spouse", "gender": "Female", "profession": "Homemaker"},
            ],
        },
        {
            "membership_id": f"{MEMBERSHIP_PREFIX}005",
            "phone": "9876500005",
            "address": "Staff Quarters Block B",
            "income": 38000,
            "members": [
                {"full_name": "Dr. Sameer Ali", "relationship_to_head": "Self", "is_head_of_family": 1, "gender": "Male", "profession": "Physician"},
                {"full_name": "Nadia Ali", "relationship_to_head": "Spouse", "gender": "Female", "profession": "Nurse"},
            ],
        },
    ]

    household_ids = []
    for fam in families:
        if frappe.db.exists("Jamath Household", {"membership_id": fam["membership_id"]}):
            household_ids.append(
                frappe.db.get_value("Jamath Household", {"membership_id": fam["membership_id"]}, "name")
            )
            continue
        doc = frappe.get_doc(
            {
                "doctype": "Jamath Household",
                "membership_id": fam["membership_id"],
                "phone_number": fam["phone"],
                "is_verified": 1,
                "address": fam["address"],
                "monthly_income": fam["income"],
                "members": fam["members"],
            }
        )
        doc.insert(ignore_permissions=True)
        household_ids.append(doc.name)

    # Announcements / causes
    if frappe.db.table_exists("Jamath Announcement") and not frappe.db.exists(
        "Jamath Announcement", {"title": "[DEMO] Ramadan Iftar packing"}
    ):
        frappe.get_doc(
            {
                "doctype": "Jamath Announcement",
                "title": "[DEMO] Ramadan Iftar packing",
                "status": "Published",
                "is_public": 1,
                "is_fundraiser": 1,
                "fundraising_target": 50000,
                "amount_raised": 18500,
                "published_at": now_datetime(),
                "content": "<p>Volunteer this weekend for iftar packing. Demo seed — resets nightly.</p>",
            }
        ).insert(ignore_permissions=True)

    if frappe.db.table_exists("Jamath Announcement") and not frappe.db.exists(
        "Jamath Announcement", {"title": "[DEMO] Friday khutbah notice"}
    ):
        frappe.get_doc(
            {
                "doctype": "Jamath Announcement",
                "title": "[DEMO] Friday khutbah notice",
                "status": "Published",
                "is_public": 1,
                "is_fundraiser": 0,
                "published_at": now_datetime(),
                "content": "<p>Khutbah after Zuhr. Topic: Trust &amp; Baitul Maal transparency.</p>",
            }
        ).insert(ignore_permissions=True)

    # Service requests
    if household_ids and frappe.db.table_exists("Jamath Service Request"):
        samples = [
            (household_ids[0], "Nikaah Nama", "Need Nikaah Nama copy for DEMO-001 — sample request."),
            (household_ids[1], "Character Certificate", "School admission letter for DEMO-002."),
            (household_ids[2], "Mahal Transfer NOC", "Relocating to another mahal — demo."),
        ]
        for hh, rtype, desc in samples:
            exists = frappe.db.exists(
                "Jamath Service Request",
                {"household": hh, "description": ["like", "%demo%"]},
            )
            if exists:
                continue
            frappe.get_doc(
                {
                    "doctype": "Jamath Service Request",
                    "household": hh,
                    "request_type": rtype,
                    "description": desc,
                    "status": "Pending",
                }
            ).insert(ignore_permissions=True)

    if frappe.db.table_exists("Jamath Volunteer") and not frappe.db.exists(
        "Jamath Volunteer", {"phone_number": DEMO_PHONE, "notes": ["like", "%[DEMO-SEED]%"]}
    ):
        frappe.get_doc(
            {
                "doctype": "Jamath Volunteer",
                "full_name": "Yusuf Demo",
                "phone_number": DEMO_PHONE,
                "is_available": 1,
                "skills": "Logistics, accounts",
                "notes": "[DEMO-SEED] Available weekends",
            }
        ).insert(ignore_permissions=True)

    _seed_baitul_maal(household_ids)
    _seed_staff_and_compliance()
    frappe.db.commit()


def _seed_staff_and_compliance():
    """Jamath employees + org compliance checklist for Demo Jamath."""
    from frappe.utils import add_months, getdate

    if not frappe.db.table_exists("Jamath Staff"):
        return

    staff = [
        {
            "full_name": "Maulana Irfan Ahmed",
            "staff_role": "Imam",
            "phone_number": "9876511001",
            "email": "imam.demo@digitaljamath.com",
            "joining_date": add_months(getdate(today()), -36),
            "monthly_salary": 22000,
            "salary_fund": "Chanda",
            "payment_mode": "Bank",
            "bank_account_last4": "4521",
            "pan": "ABCDE1234F",
            "aadhaar_last4": "8821",
            "pf_applicable": 0,
            "esi_applicable": 0,
            "contract_on_file": 1,
            "police_verification": 1,
            "compliance_notes": "Appointment letter + khutbah roster on file.",
            "notes": "[DEMO-SEED] Full-time Imam",
        },
        {
            "full_name": "Hafiz Bilal Khan",
            "staff_role": "Muezzin",
            "phone_number": "9876511002",
            "email": "muezzin.demo@digitaljamath.com",
            "joining_date": add_months(getdate(today()), -24),
            "monthly_salary": 12000,
            "salary_fund": "Chanda",
            "payment_mode": "UPI",
            "upi_id": "bilal.demo@upi",
            "aadhaar_last4": "4410",
            "pf_applicable": 0,
            "esi_applicable": 0,
            "contract_on_file": 1,
            "police_verification": 1,
            "notes": "[DEMO-SEED] Muezzin + caretaker evenings",
        },
        {
            "full_name": "Sameera Banu",
            "staff_role": "Clerk / Secretary",
            "phone_number": "9876511003",
            "email": "clerk.demo@digitaljamath.com",
            "joining_date": add_months(getdate(today()), -18),
            "monthly_salary": 15000,
            "salary_fund": "General",
            "payment_mode": "Bank",
            "bank_account_last4": "9033",
            "pan": "PQRST5678G",
            "aadhaar_last4": "2209",
            "pf_applicable": 1,
            "esi_applicable": 0,
            "contract_on_file": 1,
            "police_verification": 1,
            "compliance_notes": "PF UAN onboarding in progress.",
            "notes": "[DEMO-SEED] Census + receipts desk",
        },
        {
            "full_name": "Riyaz Accountant",
            "staff_role": "Accountant",
            "phone_number": "9876511004",
            "email": "accounts.demo@digitaljamath.com",
            "joining_date": add_months(getdate(today()), -12),
            "monthly_salary": 18000,
            "salary_fund": "General",
            "payment_mode": "Bank",
            "bank_account_last4": "1177",
            "pan": "UVWXY9012H",
            "aadhaar_last4": "5566",
            "pf_applicable": 1,
            "esi_applicable": 0,
            "contract_on_file": 1,
            "police_verification": 0,
            "compliance_notes": "Handles Form 10BD & Baitul Maal books.",
            "notes": "[DEMO-SEED] Part-time accountant",
        },
        {
            "full_name": "Lakshman Cleaner",
            "staff_role": "Cleaner",
            "phone_number": "9876511005",
            "joining_date": add_months(getdate(today()), -8),
            "monthly_salary": 8000,
            "salary_fund": "Chanda",
            "payment_mode": "Cash",
            "aadhaar_last4": "3344",
            "pf_applicable": 0,
            "esi_applicable": 0,
            "contract_on_file": 1,
            "police_verification": 1,
            "notes": "[DEMO-SEED] Daily cleaning + jumaah setup",
        },
    ]

    for row in staff:
        if frappe.db.exists("Jamath Staff", {"full_name": row["full_name"], "notes": ["like", "%[DEMO-SEED]%"]}):
            continue
        if not frappe.db.exists("Fund Type", row.get("salary_fund") or "Chanda"):
            row["salary_fund"] = "General"
        frappe.get_doc({"doctype": "Jamath Staff", **row, "employment_status": "Active"}).insert(
            ignore_permissions=True
        )

    # Monthly salary payments (tagged) — skip if already present
    from digital_jamath.baitul_maal.quick_entry import record_quick_entry

    for row in staff:
        remark = f"[DEMO-SEED] Salary — {row['full_name']}"
        if frappe.db.exists(
            "Journal Entry",
            {"company": DEMO_COMPANY, "user_remark": ["like", f"%{remark}%"]},
        ):
            continue
        try:
            record_quick_entry(
                voucher_type="Payment",
                amount=row["monthly_salary"],
                fund_type=row.get("salary_fund") or "Chanda",
                mode_of_payment=row.get("payment_mode") or "Bank",
                party_name=row["full_name"],
                notes=remark,
                company=DEMO_COMPANY,
            )
        except Exception:
            frappe.log_error(title=f"demo salary {row['full_name']}")

    if not frappe.db.table_exists("Jamath Compliance Item"):
        return

    items = [
        (
            "Society / Trust registration copy on file",
            "Registration",
            "Done",
            "Clerk / Secretary",
            "Demo Jamath registered society — certificate in vault.",
        ),
        (
            "80G approval / provisional certificate",
            "Tax / 80G",
            "Done",
            "Accountant",
            "Provisional 80G on file for donor receipts.",
        ),
        (
            "Form 10BD annual filing",
            "Tax / 80G",
            "In Progress",
            "Accountant",
            "FY donor dump prepared from Baitul Maal; file before due date.",
        ),
        (
            "PF registration for eligible staff",
            "Labour",
            "In Progress",
            "Clerk / Secretary",
            "Clerk + Accountant marked PF applicable.",
        ),
        (
            "ESI applicability review",
            "Labour",
            "Not Applicable",
            "Accountant",
            "Headcount / wage threshold not met — reviewed quarterly.",
        ),
        (
            "FCRA / foreign contribution policy",
            "FCRA / Foreign",
            "Not Applicable",
            "Accountant",
            "No foreign donations accepted in Demo Jamath.",
        ),
        (
            "Dedicated Baitul Maal bank account",
            "Banking",
            "Done",
            "Accountant",
            "Primary bank + UPI collection accounts mapped in COA.",
        ),
        (
            "Member data privacy & OTP access log",
            "Data privacy",
            "Open",
            "Clerk / Secretary",
            "Portal OTP sessions — retain access log 90 days.",
        ),
    ]
    for title, category, status, owner, desc in items:
        if frappe.db.exists("Jamath Compliance Item", {"title": title}):
            continue
        frappe.get_doc(
            {
                "doctype": "Jamath Compliance Item",
                "title": title,
                "category": category,
                "status": status,
                "owner_role": owner,
                "due_date": add_months(getdate(today()), 1) if status != "Done" else None,
                "description": f"[DEMO-SEED] {desc}",
                "evidence_note": "[DEMO-SEED] Sample evidence note",
            }
        ).insert(ignore_permissions=True)


def _seed_baitul_maal(household_ids: list[str]):
    """Fund Types + COA + sample receipts/disbursements + Zakat grants."""
    from digital_jamath.setup import create_default_fund_types, setup_accounting_dimension
    from digital_jamath.baitul_maal.coa_template import apply_masjid_coa
    from digital_jamath.baitul_maal.quick_entry import record_quick_entry

    create_default_fund_types()
    setup_accounting_dimension()
    try:
        apply_masjid_coa(DEMO_COMPANY)
    except Exception:
        frappe.log_error(title="demo baitul maal COA")

    # Avoid duplicate finance seed on ensure_demo_jamath re-entry
    if frappe.db.exists(
        "Journal Entry",
        {"company": DEMO_COMPANY, "user_remark": ["like", "%[DEMO-SEED]%"]},
    ):
        return

    samples = [
        # Collections (Receipts)
        ("Receipt", 85000, "Zakat", "UPI", "Anonymous donor — Ramadan", "Zakat UPI collections"),
        ("Receipt", 42000, "Zakat", "Bank", "Yusuf Demo household", "Zakat bank transfer DEMO-001"),
        ("Receipt", 18500, "Sadaqah", "Cash", "Jumaah box", "Friday sadaqah cash"),
        ("Receipt", 12000, "Lillah", "UPI", "Well-wisher", "Lillah for ration packs"),
        ("Receipt", 27500, "Chanda", "UPI", "Memberships", "Monthly chanda batch"),
        ("Receipt", 45000, "Chanda", "Bank", "Memberships top-up", "Chanda salary float"),
        ("Receipt", 150000, "Construction", "Bank", "Construction drive", "Masjid wing renovation"),
        ("Receipt", 50000, "Waqf", "Bank", "Endowment gift", "Waqf corpus top-up"),
        ("Receipt", 8000, "General", "Cash", "Certificates", "Service & certificate fees"),
        ("Receipt", 22000, "General", "Bank", "Ops buffer", "General ops float"),
        ("Receipt", 40000, "General", "Bank", "Ops top-up", "Staff salary buffer"),
        # Disbursements (Payments) — Zakat only to Zakat expense
        ("Payment", 25000, "Zakat", "Bank", "Fatima Begum", "Zakat grant — DEMO-002 medical"),
        ("Payment", 15000, "Zakat", "UPI", "Abdul Rahman", "Zakat grant — DEMO-004 school fees"),
        ("Payment", 9000, "Sadaqah", "Cash", "Ration drive", "Sadaqah food packs"),
        ("Payment", 6000, "Lillah", "UPI", "Dialysis aid", "Lillah medical assistance"),
        ("Payment", 5000, "General", "Bank", "BESCOM", "Electricity — demo month"),
        # Staff salaries seeded separately in _seed_staff_and_compliance
        ("Payment", 35000, "Construction", "Bank", "Contractor", "Construction milestone 1"),
    ]

    # Prefer Bank Account (Primary) for bank modes via get_liquid_account
    for voucher_type, amount, fund, mode, party, notes in samples:
        try:
            # Use Journal Entry path with correct voucher types
            record_quick_entry(
                voucher_type=voucher_type,
                amount=amount,
                fund_type=fund,
                mode_of_payment=mode,
                party_name=party,
                notes=f"[DEMO-SEED] {notes}",
                company=DEMO_COMPANY,
            )
        except Exception:
            frappe.log_error(title=f"demo JE {fund} {voucher_type}")

    if household_ids and frappe.db.table_exists("Jamath Grant Application"):
        grants = [
            (1, "Fatima Begum", 25000, "Approved", "Medical assistance — Zakat eligible household."),
            (3, "Abdul Rahman", 15000, "Disbursed", "School fees for children — Zakat."),
            (0, "Yusuf Demo", 5000, "Applied", "Sample non-urgent request (higher income)."),
        ]
        for idx, applicant, amount, status, desc in grants:
            if idx >= len(household_ids):
                continue
            hh = household_ids[idx]
            if frappe.db.exists(
                "Jamath Grant Application",
                {"applicant_household": hh, "description": ["like", "%[DEMO-SEED]%"]},
            ):
                continue
            doc = frappe.get_doc(
                {
                    "doctype": "Jamath Grant Application",
                    "applicant_household": hh,
                    "applicant_name": applicant,
                    "amount_requested": amount,
                    "disbursed_amount": amount if status == "Disbursed" else 0,
                    "status": status,
                    "description": f"[DEMO-SEED] {desc}",
                }
            )
            doc.insert(ignore_permissions=True)
