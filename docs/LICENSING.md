# Licenses in the Digital Jamath stack

Not legal advice. Summary for product copy and contributors.

| Layer | Project | License |
|-------|---------|---------|
| Framework | Frappe | **MIT** |
| ERP | ERPNext | **GPL-3.0** |
| Our CE app | `digital_jamath` | **MIT** (current) |
| Marketing site | `digitaljamath-astro` | same as CE / site policy |
| Member portal | `digitaljamath-website` | private app; not the CE license surface |

## MIT vs AGPL vs GPL-3 for *our* app

- **MIT (keep):** Matches Frappe Framework. Easy for jamaths and contributors. Common for custom Frappe apps. Be honest that ERPNext in the stack is GPL-3.
- **GPL-3:** Closest match to ERPNext if you want one copyleft story for the whole bench. Stronger “share alike” than MIT.
- **AGPL:** What newer Frappe products (CRM, Helpdesk) use. Forces open source for modified network/SaaS offerings. **Heavier than we need** for a jamath CE whose Cloud is already the same open CE hosted as a service. Prefer **not** AGPL unless you specifically want SaaS copyleft.

**Recommendation:** Keep **MIT** for `digital_jamath`. Do **not** switch to AGPL. Optionally move to **GPL-3** later only if counsel says ERPNext coupling requires it; many Frappe apps stay MIT while depending on ERPNext.

Website should say: Community Edition is MIT; runs on Frappe (MIT) + ERPNext (GPL-3).
