"""
Digital Jamath Cloud — 3-month (90-day) free pilot.

Public path: try Demo Jamath → show interest for onboarding.
Pilots are activated by the team (no instant multi-tenant provision yet).
Pricing after pilot is tiered by household count.
"""

from __future__ import annotations

import re
import secrets
import string

from digital_jamath.compat import frappe, _
from frappe.utils import add_days, get_url, getdate, now_datetime, today

TRIAL_DAYS_DEFAULT = 90  # 3-month free pilot

# Household = primary (head) member + family members. Billing unit for Cloud tiers.
DEFAULT_HOUSEHOLD_TIERS = [
    {
        "id": "small",
        "name": "Small",
        "max_households": 150,
        "monthly_price": 999,
        "label": "Up to 150 households",
        "best_for": "Neighbourhood masjids & small jamaths",
    },
    {
        "id": "growth",
        "name": "Growth",
        "max_households": 400,
        "monthly_price": 1999,
        "label": "151–400 households",
        "best_for": "Growing jamaths with active Chanda",
    },
    {
        "id": "community",
        "name": "Community",
        "max_households": 800,
        "monthly_price": 3499,
        "label": "401–800 households",
        "best_for": "Large committees & multi-zone jamaths",
    },
    {
        "id": "ummah",
        "name": "Ummah",
        "max_households": None,
        "monthly_price": None,
        "label": "800+ households",
        "best_for": "Federations & city-scale orgs — custom quote",
    },
]

WRITE_LOCK_SKIP_DOCTYPES = {
    "Jamath Cloud Trial",
    "Error Log",
    "Activity Log",
    "Version",
    "Comment",
    "File",
    "User",
    "Session Default Settings",
}


def get_trial_days() -> int:
    try:
        days = int(frappe.conf.get("trial_days") or TRIAL_DAYS_DEFAULT)
    except (TypeError, ValueError):
        days = TRIAL_DAYS_DEFAULT
    return max(1, min(days, 180))


def get_household_tiers() -> list[dict]:
    """Allow site_config override: cloud_household_tiers as JSON list."""
    custom = frappe.conf.get("cloud_household_tiers")
    if isinstance(custom, list) and custom:
        return custom
    return list(DEFAULT_HOUSEHOLD_TIERS)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return (slug or "jamath")[:40]


def _unique_slug(base: str) -> str:
    slug = _slugify(base)
    if not frappe.db.exists("Jamath Cloud Trial", {"slug": slug}):
        return slug
    for i in range(2, 100):
        candidate = f"{slug}-{i}"
        if not frappe.db.exists("Jamath Cloud Trial", {"slug": candidate}):
            return candidate
    return f"{slug}-{secrets.token_hex(3)}"


def _temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _rate_limit(email: str):
    key = f"cloud_trial_rate:{email.lower()}"
    count = frappe.cache().get_value(key) or 0
    if int(count) >= 3:
        frappe.throw(_("Too many trial requests for this email. Please contact salam@digitaljamath.com."))
    frappe.cache().set_value(key, int(count) + 1, expires_in_sec=86400)


@frappe.whitelist(allow_guest=True)
def get_cloud_pricing() -> dict:
    """Public pricing + pilot + demo copy for Astro /cloud."""
    from digital_jamath.cloud.demo_jamath import get_demo_credentials

    tiers = get_household_tiers()
    small = next((t for t in tiers if t.get("id") == "small"), tiers[0])
    starter = int(small.get("monthly_price") or frappe.conf.get("cloud_monthly_price_inr") or 999)
    trial_days = get_trial_days()
    months = max(1, round(trial_days / 30))
    return {
        "trial_days": trial_days,
        "pilot_months": months,
        "pilot_label": f"{months}-month free pilot",
        "no_credit_card": True,
        "currency": "INR",
        "billing_unit": "household",
        "billing_unit_note": (
            "A household is one primary member (head of family) plus their family members. "
            "Cloud plans are priced by household count — not by every individual alone."
        ),
        "monthly_price": starter,
        "monthly_label": f"₹{starter} / month",
        "starter_tier": small.get("name") or "Small",
        "tiers": [
            {
                **t,
                "monthly_label": (
                    f"₹{int(t['monthly_price'])} / month"
                    if t.get("monthly_price") is not None
                    else "Custom"
                ),
            }
            for t in tiers
        ],
        "includes": [
            "Dedicated Jamath workspace (census, Baitul Maal, tickets, portal)",
            "Household census with primary member as the contact point",
            "TLS hosting, backups, and updates",
            "Member portal for households",
            "WhatsApp notifications to primary members (roadmap)",
            "Export & leave for self-host anytime",
        ],
        "whatsapp": {
            "status": "planned",
            "summary": (
                "Reach the primary member of each household with receipts, reminders, "
                "and announcements. Official WhatsApp Business (WABA) number onboarding comes next."
            ),
        },
        "after_trial": (
            f"First {months} months free — create your jamath workspace instantly. No credit card. "
            f"After the pilot, pick a household tier (from ₹{starter}/mo) — or self-host Community Edition free."
        ),
        "onboarding_mode": "self_serve",
        "signup_cta": "Start free 3-month pilot",
        "demo": get_demo_credentials(),
    }


def _lead_recipients() -> list[str]:
    recipients = frappe.conf.get("cloud_lead_recipients")
    if isinstance(recipients, str):
        recipients = [r.strip() for r in recipients.split(",") if r.strip()]
    if not isinstance(recipients, list) or not recipients:
        recipients = ["salam@digitaljamath.com"]
    return recipients


def _notify_ops_interest(
    *,
    trial_name: str,
    jamath_name: str,
    email: str,
    phone: str | None,
    country: str,
    household_estimate: str | None,
    message: str | None,
) -> None:
    """Desk ToDo + optional webhook + email so leads are never silent."""
    summary = (
        f"Cloud pilot interest: {jamath_name}\n"
        f"Email: {email}\n"
        f"Phone: {phone or '-'}\n"
        f"Country: {country or 'India'}\n"
        f"Households: {household_estimate or '-'}\n"
        f"Notes: {message or '-'}\n"
        f"Ref: {trial_name}\n"
        f"Desk: Jamath Cloud Trial"
    )

    try:
        todo = frappe.get_doc(
            {
                "doctype": "ToDo",
                "description": summary,
                "priority": "High",
                "status": "Open",
                "allocated_to": "Administrator",
                "reference_type": "Jamath Cloud Trial",
                "reference_name": trial_name,
            }
        )
        todo.insert(ignore_permissions=True)
    except Exception:
        frappe.log_error(title="pilot interest todo")

    webhook = frappe.conf.get("cloud_lead_webhook")
    if webhook:
        try:
            import json
            from urllib import request as urlrequest

            payload = json.dumps(
                {
                    "event": "cloud_pilot_interest",
                    "trial_id": trial_name,
                    "jamath_name": jamath_name,
                    "email": email,
                    "phone": phone,
                    "country": country,
                    "household_estimate": household_estimate,
                    "message": message,
                }
            ).encode()
            req = urlrequest.Request(
                webhook,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urlrequest.urlopen(req, timeout=6)
        except Exception:
            frappe.log_error(title="pilot interest webhook")

    try:
        if frappe.db.get_value("Email Account", {"default_outgoing": 1, "enable_outgoing": 1}, "name"):
            frappe.sendmail(
                recipients=_lead_recipients(),
                subject=_("Cloud pilot interest: {0}").format(jamath_name),
                message=_(
                    "<p>New pilot interest</p><ul>"
                    "<li>Jamath: {0}</li><li>Email: {1}</li><li>Phone: {2}</li>"
                    "<li>Country: {3}</li><li>Households: {4}</li><li>Notes: {5}</li>"
                    "<li>Ref: {6}</li></ul>"
                ).format(
                    jamath_name,
                    email,
                    phone or "-",
                    country or "India",
                    household_estimate or "-",
                    message or "-",
                    trial_name,
                ),
                delayed=True,
                retry=0,
            )
    except Exception:
        frappe.log_error(title="pilot interest notify")


@frappe.whitelist(allow_guest=True)
def register_pilot_interest(
    jamath_name: str,
    email: str,
    country: str = "India",
    phone: str | None = None,
    contact_name: str | None = None,
    household_estimate: str | None = None,
    message: str | None = None,
) -> dict:
    """
    Masjid/Jamath shows interest for the 3-month free Cloud pilot.
    Does not provision Desk access yet — team follows up to onboard.
    """
    jamath_name = (jamath_name or "").strip()
    email = (email or "").strip().lower()
    phone = (phone or "").strip() or None
    contact_name = (contact_name or "").strip() or None
    household_estimate = (household_estimate or "").strip() or None
    message = (message or "").strip() or None

    if not jamath_name or len(jamath_name) < 3:
        frappe.throw(_("Please enter your Masjid / Jamath name."))
    if not email or "@" not in email:
        frappe.throw(_("Please enter a valid email."))

    _rate_limit(email)

    existing = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"email": email, "status": ["in", ["Interest", "Queued", "Trial", "Active"]]},
        fields=["name", "status", "jamath_name"],
        limit=1,
    )
    if existing:
        row = existing[0]
        return {
            "success": True,
            "already_registered": True,
            "interest_id": row.name,
            "status": row.status,
            "jamath_name": row.jamath_name,
            "trial_days": get_trial_days(),
            "demo": get_cloud_pricing().get("demo"),
            "message": _(
                "We already have your interest for {0}. Try the Demo Jamath meanwhile. We will reach out."
            ).format(row.jamath_name),
        }

    slug = _unique_slug(jamath_name)
    note_bits = ["Interest via /cloud — 3-month free pilot"]
    if household_estimate:
        note_bits.append(f"Households≈{household_estimate}")
    if contact_name:
        note_bits.append(f"Contact: {contact_name}")
    if message:
        note_bits.append(message)

    trial = frappe.get_doc(
        {
            "doctype": "Jamath Cloud Trial",
            "jamath_name": jamath_name,
            "slug": slug,
            "email": email,
            "phone": phone,
            "country": country or "India",
            "status": "Interest",
            "notes": " · ".join(note_bits),
        }
    )
    trial.insert(ignore_permissions=True)
    frappe.db.commit()

    _notify_ops_interest(
        trial_name=trial.name,
        jamath_name=jamath_name,
        email=email,
        phone=phone,
        country=country or "India",
        household_estimate=household_estimate,
        message=message,
    )
    frappe.db.commit()

    return {
        "success": True,
        "already_registered": False,
        "interest_id": trial.name,
        "status": "Interest",
        "jamath_name": jamath_name,
        "trial_days": get_trial_days(),
        "pilot_label": get_cloud_pricing()["pilot_label"],
        "demo": get_cloud_pricing()["demo"],
        "message": _(
            "Thanks. We recorded your interest for a {0}. "
            "Explore Demo Jamath while we prepare onboarding. No credit card required."
        ).format(get_cloud_pricing()["pilot_label"]),
    }


@frappe.whitelist(allow_guest=True)
def start_cloud_trial(
    jamath_name: str,
    email: str,
    country: str = "India",
    phone: str | None = None,
    contact_name: str | None = None,
    household_estimate: str | None = None,
    message: str | None = None,
) -> dict:
    """Self-serve Cloud pilot — provision Jamath workspace + 90-day trial."""
    from digital_jamath.cloud.provision import start_cloud_trial as _provision

    return _provision(
        jamath_name=jamath_name,
        email=email,
        country=country,
        phone=phone,
        contact_name=contact_name,
        household_estimate=household_estimate,
        message=message,
    )


@frappe.whitelist(allow_guest=True)
def resolve_tenant(slug: str) -> dict:
    from digital_jamath.cloud.provision import resolve_tenant as _resolve

    return _resolve(slug)



def _ensure_trial_user(email: str, full_name: str, password: str, company_name: str) -> str:
    if frappe.db.exists("User", email):
        user = frappe.get_doc("User", email)
        user.new_password = password
        if "Accounts Manager" not in [r.role for r in user.roles]:
            user.append("roles", {"role": "Accounts Manager"})
        if "Accounts User" not in [r.role for r in user.roles]:
            user.append("roles", {"role": "Accounts User"})
        user.flags.ignore_permissions = True
        user.save()
    else:
        roles = [{"role": "Accounts Manager"}, {"role": "Accounts User"}]
        if frappe.db.exists("Role", "Desk User"):
            roles.append({"role": "Desk User"})
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": (full_name or "Jamath Admin")[:140],
                "send_welcome_email": 0,
                "user_type": "System User",
                "new_password": password,
                "roles": roles,
            }
        )
        user.insert(ignore_permissions=True)

    # Restrict to this Jamath company where possible
    if not frappe.db.exists("User Permission", {"user": email, "allow": "Company", "for_value": company_name}):
        frappe.get_doc(
            {
                "doctype": "User Permission",
                "user": email,
                "allow": "Company",
                "for_value": company_name,
                "apply_to_all_doctypes": 1,
            }
        ).insert(ignore_permissions=True)

    try:
        frappe.defaults.set_user_default("company", company_name, email)
    except Exception:
        pass
    return email

def _write_tenant_stub(slug: str, email: str, company: str, trial_id: str, trial_end):
    """Best-effort local tenant map (host scripts/cloud/tenants)."""
    import json
    from pathlib import Path

    try:
        root = Path(frappe.get_app_path("digital_jamath")).parents[1]
        tenants = root / "scripts" / "cloud" / "tenants"
        tenants.mkdir(parents=True, exist_ok=True)
        payload = {
            "slug": slug,
            "email": email,
            "company": company,
            "trial_id": trial_id,
            "status": "trial",
            "trial_ends": str(trial_end),
            "site": frappe.local.site,
            "created": now_datetime().isoformat(),
        }
        (tenants / f"{slug}.json").write_text(json.dumps(payload, indent=2))
    except Exception:
        pass


@frappe.whitelist(allow_guest=True)
def get_trial_status(email: str | None = None) -> dict:
    """Status for banner / convert CTA."""
    email = (email or frappe.session.user or "").strip().lower()
    if not email or email in ("guest", "administrator"):
        # Administrator: show aggregate or none
        if frappe.session.user == "Administrator":
            return {"status": "admin", "locked": False}
        return {"status": "none", "locked": False}

    rows = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"email": email},
        fields=["name", "status", "trial_end", "trial_start", "jamath_name", "company"],
        order_by="creation desc",
        limit=1,
    )
    if not rows:
        return {"status": "none", "locked": False}

    row = rows[0]
    _refresh_status(row.name, row.status, row.trial_end)
    row = frappe.get_doc("Jamath Cloud Trial", row.name)
    days = 0
    if row.trial_end:
        days = max(0, (getdate(row.trial_end) - getdate(today())).days)
    locked = row.status == "Expired"
    return {
        "status": row.status,
        "trial_id": row.name,
        "jamath_name": row.jamath_name,
        "company": row.company,
        "trial_end": str(row.trial_end) if row.trial_end else None,
        "days_remaining": days,
        "locked": locked,
        "pricing": get_cloud_pricing(),
    }


def _refresh_status(name: str, status: str, trial_end):
    if status == "Trial" and trial_end and getdate(trial_end) < getdate(today()):
        frappe.db.set_value("Jamath Cloud Trial", name, "status", "Expired")
        frappe.db.commit()


def expire_due_trials():
    """Daily job: mark past-due trials Expired."""
    if not frappe.db.table_exists("Jamath Cloud Trial"):
        return
    due = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"status": "Trial", "trial_end": ["<", today()]},
        pluck="name",
    )
    for name in due:
        frappe.db.set_value("Jamath Cloud Trial", name, "status", "Expired")
    if due:
        frappe.db.commit()


def trial_write_guard(doc, method=None):
    """Soft-lock writes when the signed-in user's trial has expired."""
    user = frappe.session.user
    if user in ("Administrator", "Guest", "demo@digitaljamath.com"):
        return
    if getattr(frappe.flags, "dj_ignore_trial_lock", False):
        return
    if doc.doctype in WRITE_LOCK_SKIP_DOCTYPES:
        return

    status = get_trial_status(user)
    if status.get("locked"):
        days = get_trial_days()
        frappe.throw(
            _(
                "Your {0}-day free pilot has ended. Subscribe to Digital Jamath Cloud to continue — "
                "no data is deleted. Email salam@digitaljamath.com or visit digitaljamath.com/cloud"
            ).format(days)
        )


def inject_trial_bootinfo(bootinfo):
    try:
        if frappe.session.user and frappe.session.user != "Guest":
            bootinfo["dj_cloud_trial"] = get_trial_status(frappe.session.user)
    except Exception:
        bootinfo["dj_cloud_trial"] = {"status": "none", "locked": False}
