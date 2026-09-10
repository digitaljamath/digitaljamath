# Digital Jamath — product features

What the software does, who it is for, and where each feature lives.

**Stack of record:** Frappe 15 + ERPNext 15 + custom app `digital_jamath`  
**Stable line:** [v0.1.0](https://github.com/digitaljamath/digitaljamath/releases/tag/v0.1.0)

---

## Surfaces (where users work)

| Surface | URL | Audience | Tech |
|---------|-----|----------|------|
| **Marketing** | [digitaljamath.com](https://digitaljamath.com) | Prospects | Astro |
| **Committee console** | [app…/jamath](https://app.digitaljamath.com/jamath) | Trustees, clerks, treasurers | React SPA (Kamra-style) on Frappe |
| **Advanced Desk** | [app…/app](https://app.digitaljamath.com/app) | Accountants, admins | Native Frappe/ERPNext Desk |
| **Member portal** | […/portal](https://digitaljamath.com/portal/login) | Households | Next.js + OTP APIs |
| **Cloud signup** | […/cloud](https://digitaljamath.com/cloud) | New jamaths | Astro form → provision API |

**Modes in committee console**

- **Simple** — jamath workflows only (census, funds, tickets, welfare).
- **Advanced** — same console + Chart of Accounts / full Desk escape hatch.

Demo Desk: `demo@digitaljamath.com` / `Experience@DJ1`  
Demo portal: phone `9876543210`, OTP `123456` (demo resets nightly IST).

---

## 1. Census (community registry)

**Purpose:** Know who belongs to the jamath — households, family members, membership IDs.

| Feature | Detail |
|---------|--------|
| **Households** | One record per family unit; membership ID (e.g. `JM-001`); primary phone for portal OTP |
| **Members (family card)** | Child table on the household: name, relation to head, gender, occupation, income flags |
| **Membership / subscription** | `Jamath Membership` for dues / subscription tracking |
| **Zakat eligibility signals** | Economic status, zakat score, widow / illness flags (read-only helpers for welfare) |
| **Company (jamath) scope** | Multi-jamath Cloud: households linked to ERPNext **Company** |

**DocTypes:** `Jamath Household`, `Jamath Member` (child), `Jamath Membership`  
**UI:** Committee → Community · Desk workspace **Digital Jamath** · Portal family view

---

## 2. Baitul Maal (Shariah-aware funds)

**Purpose:** Keep sacred and general money apart; block wrong fund use on submit.

| Feature | Detail |
|---------|--------|
| **Fund types** | Master list (Zakat, Sadaqah, Construction, General, …) with restricted vs unrestricted |
| **Zakat isolation** | `is_zakat` + validators on Journal Entry / Payment Entry — no silent leakage |
| **Collections & payments** | ERPNext **Payment Entry** / **Journal Entry** with fund dimension |
| **Quick entry** | `baitul_maal.quick_entry.record_quick_entry` for fast Chanda / Zakat receive (Desk / API) |
| **Chart of Accounts** | Masjid-oriented COA seed (`scripts/seed_masjid_coa.sh`); full COA in Advanced Desk |
| **Digital receipts** | Member-facing receipt list via portal API |

**DocTypes:** `Fund Type` (+ ERPNext JE / PE / Account / Company)  
**Validators:** `digital_jamath.baitul_maal.validators`  
**UI:** Committee → Baitul Maal · Desk accounting · Portal receipts

---

## 3. Welfare & grants

**Purpose:** Private intake for Zakat / aid with status and audit trail.

| Feature | Detail |
|---------|--------|
| **Grant applications** | Applicant household, amount requested, status (Applied → Disbursed) |
| **Scoring helpers** | Pulls household economic status / zakat score |
| **Cross-mosque dedup** | Flags / notes to reduce double claims (`welfare/dedup.py`) |

**DocType:** `Jamath Grant Application`  
**UI:** Committee → Welfare · Desk · (intake may later deepen on portal)

---

## 4. Services & tickets

**Purpose:** Track member requests: Nikah nama, death certificate, NOC, character certificate, other.

| Feature | Detail |
|---------|--------|
| **Service requests** | Linked to household; type, status, assignee, notes |
| **Portal submit** | Members open tickets without Desk access |
| **Committee queue** | List and update status in console / Desk |

**DocType:** `Jamath Service Request`  
**APIs:** `portal.api.submit_service_request`, `get_my_service_requests`  
**UI:** Committee → Services · Portal services

---

## 5. Announcements

**Purpose:** Broadcast jamath notices; optional public vs internal.

| Feature | Detail |
|---------|--------|
| **Announcements** | Title, body, visibility |
| **Portal feed** | `get_announcements` for member home |

**DocType:** `Jamath Announcement`

---

## 6. Staff & volunteers

**Purpose:** Lightweight people ops without full HRMS.

| Feature | Detail |
|---------|--------|
| **Staff directory** | Imam, muezzin, clerk, etc. — salary, fund, ID last-4, PF/ESI flags |
| **Salary postings** | Demo / ops seed posts monthly JE tagged for salaries |
| **Volunteers** | Interest capture from portal; causes list |

**DocTypes:** `Jamath Staff`, `Jamath Volunteer`  
**Non-goal (near term):** Full ERPNext HRMS (Attendance, Salary Slip structures)

---

## 7. Compliance checklist

**Purpose:** Track filings and governance items the committee must not forget.

| Feature | Detail |
|---------|--------|
| **Compliance items** | Registration, 80G, Form 10BD, PF, ESI, FCRA N/A, banking, privacy, … |
| **India locale pack** | 80G-style / Form 10BD CSV orientation (see product locale notes) |

**DocType:** `Jamath Compliance Item`  
**UI:** Committee → Welfare / Compliance · Desk hub

---

## 8. Member portal

**Purpose:** Households self-serve without Desk accounts.

| Feature | Detail |
|---------|--------|
| **OTP login** | Phone matched to household census; SMS stub / magic OTP on demo |
| **Tenant login** | `/portal/j/[slug]/login` for Cloud jamaths |
| **Family profile** | View household + members |
| **Receipts** | List linked payment/receipt history |
| **Service requests** | Create and track tickets |
| **Volunteer interest** | Express interest in causes |
| **Announcements** | Read jamath notices |

**APIs:** `digital_jamath.portal.auth.*`, `digital_jamath.portal.api.*`  
**App:** sibling repo `digitaljamath-website`  
**Auth model:** portal session (not Desk User for members)

---

## 9. Committee console (Ops UI)

**Purpose:** Default day-to-day UI so trustees are not forced through ERPNext Desk chrome.

| Feature | Detail |
|---------|--------|
| **App shell** | Sidebar apps: Home, Community, Baitul Maal, Services, Welfare, Settings |
| **Simple / Advanced** | Toggle; Advanced unlocks Desk-oriented links |
| **Session auth** | Same Desk login (`/api/method/login`) + CSRF from www page |
| **Lists** | Households, fund types, payments, tickets, grants via `frappe.client.get_list` |
| **404** | Branded simple page (no stock Frappe cartoon) |

**Code:** `committee-ui/` → build to `digital_jamath/public/committee/`  
**Serve:** `www/jamath.py` + `website_route_rules` → `/jamath`  
**Pattern:** Same as [Kamra PMS](https://kamrapms.com) SPA-on-Frappe  
**See also:** [committee-ui/README.md](../committee-ui/README.md), [OPS_APP_PLAN.md](OPS_APP_PLAN.md)

---

## 10. Advanced Desk & branding

**Purpose:** Full ERPNext when needed; jamath-first branding always.

| Feature | Detail |
|---------|--------|
| **Digital Jamath workspace** | Hub shortcuts; ERP workspaces hidden for day-to-day noise reduction |
| **Default landing** | System users can prefer Digital Jamath workspace / `/jamath` |
| **Brand assets** | Open-D logo, favicon, login lockup, forest green primary |
| **Theme-safe CSS** | Branding does not force light-mode breakage on Desk dark theme |

**Code:** `branding.py`, `public/css/branding.css`, `public/js/branding.js`, `workspace_setup.py`

---

## 11. Cloud (multi-jamath hosting)

**Purpose:** Self-serve pilot without forcing every jamath to self-host.

| Feature | Detail |
|---------|--------|
| **Start trial** | `start_cloud_trial` — company, trustee user, starter household, registry |
| **Tenant resolve** | `resolve_tenant(slug)` for portal/desk links |
| **Trial guard** | Write guards / expiry jobs for trial tenants |
| **Demo jamath reset** | Nightly demo data refresh |
| **CE vs Cloud** | Same software; Cloud bills hosting (household tier after pilot) |

**DocType:** `Jamath Cloud Trial`  
**Module:** `digital_jamath.cloud`  
**Signup:** marketing `/cloud` form

---

## 12. Basira (optional AI guide)

**Purpose:** Contextual Q&A for committee users (bring-your-own key when self-hosting).

| Feature | Detail |
|---------|--------|
| **Ask Basira** | Whitelisted `basira.api.ask_basira` |
| **Sanitized input** | Prompt hygiene before model call |

**Module:** `Basira` — optional; not required for core trust workflows.

---

## 13. Platform & ops features

| Feature | Detail |
|---------|--------|
| **Community Edition** | Docker Compose + bootstrap scripts; MIT app |
| **COA seed** | Masjid chart of accounts helper |
| **Materialize assets** | Copy app public assets for host nginx `/assets` |
| **Website 404** | Override `www/404.html` — simple typography |
| **Lead routing** | See [LEAD_ROUTING.md](LEAD_ROUTING.md) |
| **Licensing** | See [LICENSING.md](LICENSING.md) |

---

## Feature ↔ DocType map

| DocType | Module | Primary users |
|---------|--------|---------------|
| Jamath Household | Census | Committee, portal |
| Jamath Member | Census (child) | Committee, portal |
| Jamath Membership | Census | Committee |
| Fund Type | Baitul Maal | Treasurer |
| Payment Entry / Journal Entry | ERPNext + validators | Treasurer |
| Jamath Grant Application | Welfare | Welfare desk |
| Jamath Service Request | Welfare | Clerk, members |
| Jamath Announcement | Welfare | Committee, members |
| Jamath Staff | Welfare | Admin |
| Jamath Volunteer | Welfare | Committee, members |
| Jamath Compliance Item | Welfare | Admin / CA |
| Jamath Cloud Trial | Cloud | Platform |

---

## What we deliberately do *not* do (near term)

- Rebuild double-entry or Fund Type isolation inside the SPA — ERPNext remains ledger of record  
- Full HRMS replacement  
- Lock features behind Cloud paywalls (Cloud = hosting)  
- Ornamental religious iconography in the product mark  

---

## Related docs

- [Documentation index](README.md)  
- [Architecture](ARCHITECTURE.md)  
- [Ops / Advanced plan](OPS_APP_PLAN.md)  
- [Deployment](../DEPLOYMENT.md)  
- [Main README](../README.md)
