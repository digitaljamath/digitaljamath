"""
Self-serve Cloud pilot provisioning (same-site Company tenancy).

Creates: Company (Jamath) + admin User + Jamath Cloud Trial (90 days)
+ tenant registry for portal routing. Dedicated Frappe sites remain optional
via scripts/cloud/provision_site.sh when CLOUD_MULTI_SITE=1.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from digital_jamath.compat import frappe, _
from frappe.utils import add_days, get_url, today

from digital_jamath.cloud.trial import (
    _ensure_trial_user,
    _rate_limit,
    _temp_password,
    _unique_slug,
    get_cloud_pricing,
    get_trial_days,
)


CONTROL_SITE_URL = "https://app.digitaljamath.com"
PORTAL_BASE = "https://digitaljamath.com/portal"


def _portal_url(slug: str) -> str:
    return f"{PORTAL_BASE}/j/{slug}/login"


def _desk_url() -> str:
    return frappe.conf.get("cloud_desk_url") or f"{CONTROL_SITE_URL}/login"


def write_tenant_registry(slug: str, payload: dict) -> None:
    """Persist tenant map for portal resolve_tenant (file + cache)."""
    frappe.cache().set_value(f"dj_tenant:{slug}", payload, expires_in_sec=86400 * 120)
    try:
        root = Path(frappe.get_app_path("digital_jamath")).parents[1]
        tenants = root / "scripts" / "cloud" / "tenants"
        tenants.mkdir(parents=True, exist_ok=True)
        (tenants / f"{slug}.json").write_text(json.dumps(payload, indent=2, default=str))
    except Exception:
        frappe.log_error(title="write_tenant_registry")


def load_tenant(slug: str) -> dict | None:
    slug = (slug or "").strip().lower()
    if not slug:
        return None
    cached = frappe.cache().get_value(f"dj_tenant:{slug}")
    if isinstance(cached, dict) and cached.get("slug"):
        return cached

    rows = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"slug": slug, "status": ["in", ["Trial", "Active", "Queued"]]},
        fields=[
            "name",
            "slug",
            "jamath_name",
            "company",
            "email",
            "status",
            "trial_end",
            "trial_start",
        ],
        limit=1,
    )
    if not rows:
        # File fallback
        try:
            root = Path(frappe.get_app_path("digital_jamath")).parents[1]
            path = root / "scripts" / "cloud" / "tenants" / f"{slug}.json"
            if path.exists():
                return json.loads(path.read_text())
        except Exception:
            pass
        return None

    row = rows[0]
    payload = {
        "slug": row.slug,
        "jamath_name": row.jamath_name,
        "company": row.company or row.jamath_name,
        "email": row.email,
        "status": row.status,
        "trial_id": row.name,
        "trial_start": str(row.trial_start) if row.trial_start else None,
        "trial_end": str(row.trial_end) if row.trial_end else None,
        "site_url": CONTROL_SITE_URL,
        "desk_url": _desk_url(),
        "portal_url": _portal_url(row.slug),
        "provision_mode": "same_site",
    }
    frappe.cache().set_value(f"dj_tenant:{slug}", payload, expires_in_sec=86400 * 30)
    return payload


def _create_company(jamath_name: str, country: str) -> str:
    from digital_jamath.onboarding import (
        _abbr,
        _ensure_company,
        get_country_defaults,
    )

    defaults = get_country_defaults(country if country else "India")
    name = (jamath_name or "").strip()
    if not name:
        frappe.throw(_("Jamath name is required"))
    if frappe.db.exists("Company", name):
        tip = _unique_slug(name)[:12]
        candidate = f"{name} ({tip})"
        name = candidate if not frappe.db.exists("Company", candidate) else f"{name} {frappe.generate_hash(length=4)}"

    abbr_base = _abbr(name)[:5] or "DJ"
    abbr = abbr_base
    n = 1
    while frappe.db.exists("Company", {"abbr": abbr}):
        abbr = f"{abbr_base}{n}"[:10]
        n += 1

    if not frappe.db.exists("Company", name):
        doc = frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": name,
                "abbr": abbr,
                "default_currency": defaults["currency"],
                "country": country or "India",
            }
        )
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    else:
        _ensure_company(name, abbr, country or "India", defaults)

    try:
        from digital_jamath.baitul_maal.coa_template import apply_masjid_coa

        apply_masjid_coa(name)
    except Exception:
        frappe.log_error(title="pilot apply_masjid_coa")

    from digital_jamath.setup import create_default_fund_types, setup_accounting_dimension

    create_default_fund_types()
    setup_accounting_dimension()
    return name


def _seed_starter_household(company: str, phone: str | None, contact_name: str | None) -> str | None:
    """Optional portal-ready household from signup phone."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)[-10:]
    if len(digits) != 10:
        return None

    filters = {"phone_number": ["like", f"%{digits}%"]}
    if frappe.db.has_column("Jamath Household", "company"):
        filters["company"] = company

    existing = frappe.db.exists("Jamath Household", filters)
    if existing:
        return existing

    head = (contact_name or "Jamath Admin").strip() or "Jamath Admin"
    doc = frappe.get_doc(
        {
            "doctype": "Jamath Household",
            "membership_id": f"PILOT-{digits[-4:]}",
            "phone_number": digits,
            "is_verified": 1,
            "company": company if frappe.db.has_column("Jamath Household", "company") else None,
            "members": [
                {
                    "full_name": head,
                    "relationship_to_head": "Self",
                    "is_head_of_family": 1,
                    "gender": "Male",
                }
            ],
        }
    )
    # Drop company if field missing on insert
    if not frappe.db.has_column("Jamath Household", "company"):
        doc.company = None
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc.name


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
    """
    Self-serve: create Jamath workspace (Company) + admin login + 90-day trial.
    Portal URL is tenant-scoped: /portal/j/{slug}/login
    """
    jamath_name = (jamath_name or "").strip()
    email = (email or "").strip().lower()
    phone = (phone or "").strip() or None
    contact_name = (contact_name or "").strip() or None
    household_estimate = (household_estimate or "").strip() or None
    message = (message or "").strip() or None
    country = (country or "India").strip()

    if not jamath_name or len(jamath_name) < 3:
        frappe.throw(_("Please enter your Masjid / Jamath name."))
    if not email or "@" not in email:
        frappe.throw(_("Please enter a valid email."))

    _rate_limit(email)

    # Already provisioned?
    existing = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"email": email, "status": ["in", ["Trial", "Active", "Queued"]]},
        fields=["name", "status", "jamath_name", "slug", "company", "trial_end"],
        limit=1,
    )
    if existing:
        row = existing[0]
        tenant = load_tenant(row.slug) or {}
        return {
            "success": True,
            "already_registered": True,
            "trial_id": row.name,
            "status": row.status,
            "jamath_name": row.jamath_name,
            "slug": row.slug,
            "company": row.company,
            "desk_url": tenant.get("desk_url") or _desk_url(),
            "portal_url": tenant.get("portal_url") or _portal_url(row.slug),
            "trial_days": get_trial_days(),
            "trial_end": str(row.trial_end) if row.trial_end else None,
            "message": _(
                "Your {0} pilot is already active. Sign in to Desk with {1}."
            ).format(row.jamath_name, email),
            "password": None,
        }

    # Interest-only row for same email → upgrade
    interest = frappe.get_all(
        "Jamath Cloud Trial",
        filters={"email": email, "status": "Interest"},
        fields=["name", "slug", "jamath_name"],
        limit=1,
    )

    slug = interest[0].slug if interest else _unique_slug(jamath_name)
    password = _temp_password(14)
    full_name = contact_name or jamath_name.split()[0]

    frappe.flags.dj_ignore_trial_lock = True
    company = _create_company(jamath_name, country)
    user = _ensure_trial_user(email, full_name, password, company)

    trial_days = get_trial_days()
    trial_start = today()
    trial_end = add_days(trial_start, trial_days)

    note_bits = ["Self-serve Cloud pilot provisioned"]
    if household_estimate:
        note_bits.append(f"Households≈{household_estimate}")
    if message:
        note_bits.append(message)

    if interest:
        trial = frappe.get_doc("Jamath Cloud Trial", interest[0].name)
        trial.jamath_name = jamath_name
        trial.slug = slug
        trial.phone = phone
        trial.country = country
        trial.status = "Trial"
        trial.trial_start = trial_start
        trial.trial_end = trial_end
        trial.company = company
        trial.user = user
        trial.notes = " · ".join(note_bits)
        trial.save(ignore_permissions=True)
    else:
        trial = frappe.get_doc(
            {
                "doctype": "Jamath Cloud Trial",
                "jamath_name": jamath_name,
                "slug": slug,
                "email": email,
                "phone": phone,
                "country": country,
                "status": "Trial",
                "trial_start": trial_start,
                "trial_end": trial_end,
                "company": company,
                "user": user,
                "notes": " · ".join(note_bits),
            }
        )
        trial.insert(ignore_permissions=True)

    household_id = _seed_starter_household(company, phone, contact_name)
    frappe.db.commit()

    payload = {
        "slug": slug,
        "jamath_name": jamath_name,
        "company": company,
        "email": email,
        "status": "Trial",
        "trial_id": trial.name,
        "trial_start": str(trial_start),
        "trial_end": str(trial_end),
        "site_url": CONTROL_SITE_URL,
        "desk_url": _desk_url(),
        "portal_url": _portal_url(slug),
        "provision_mode": "same_site",
        "starter_household": household_id,
    }
    write_tenant_registry(slug, payload)

    try:
        if frappe.db.get_value("Email Account", {"default_outgoing": 1}, "name"):
            frappe.sendmail(
                recipients=[email],
                subject=_("Your Digital Jamath Cloud pilot is ready"),
                message=_(
                    "<p>Assalamu alaikum,</p>"
                    "<p><strong>{0}</strong> is ready for a {1}-day free pilot.</p>"
                    "<ul>"
                    "<li>Desk: <a href=\"{2}\">{2}</a></li>"
                    "<li>Email: {3}</li>"
                    "<li>Temporary password: <code>{4}</code></li>"
                    "<li>Member portal: <a href=\"{5}\">{5}</a></li>"
                    "</ul>"
                    "<p>Change your password after first login. No credit card required.</p>"
                ).format(jamath_name, trial_days, _desk_url(), email, password, _portal_url(slug)),
                delayed=True,
                retry=0,
            )
    except Exception:
        frappe.log_error(title="pilot welcome email")

    return {
        "success": True,
        "already_registered": False,
        "trial_id": trial.name,
        "status": "Trial",
        "jamath_name": jamath_name,
        "slug": slug,
        "company": company,
        "email": email,
        "password": password,
        "desk_url": _desk_url(),
        "portal_url": _portal_url(slug),
        "trial_days": trial_days,
        "trial_end": str(trial_end),
        "starter_household": bool(household_id),
        "pilot_label": get_cloud_pricing()["pilot_label"],
        "message": _(
            "Your jamath workspace is ready. Sign in to Desk with the email and temporary password below. "
            "Member portal: {0}"
        ).format(_portal_url(slug)),
    }


@frappe.whitelist(allow_guest=True)
def resolve_tenant(slug: str) -> dict:
    """Public: map jamath slug → Desk/portal/company for the member portal."""
    slug = (slug or "").strip().lower()
    if not slug or slug in ("demo", "app", "www"):
        from digital_jamath.cloud.demo_jamath import get_demo_credentials

        demo = get_demo_credentials()
        return {
            "slug": "demo",
            "jamath_name": demo.get("company") or "Demo Jamath",
            "company": demo.get("company") or "Demo Jamath",
            "status": "demo",
            "site_url": CONTROL_SITE_URL,
            "desk_url": _desk_url(),
            "portal_url": f"{PORTAL_BASE}/login",
            "provision_mode": "demo",
            "demo": True,
        }

    tenant = load_tenant(slug)
    if not tenant:
        frappe.throw(_("Jamath “{0}” was not found. Check the link from your committee.").format(slug))

    return {**tenant, "demo": False}
