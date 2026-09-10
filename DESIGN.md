# Digital Jamath — App (Desk) Design

**Version:** 4.2.0  
**Surface:** Frappe 15 + ERPNext 15 (`digital_jamath`)  
**Brand:** [`../logo/BRAND_GUIDELINES.md`](../logo/BRAND_GUIDELINES.md)  
**Web/portal:** [`../digitaljamath-website/DESIGN.md`](../digitaljamath-website/DESIGN.md)

---

## 0. Readability (non-negotiable)

Mutawallis and CAs use this UI under stress. **Low contrast is a product bug.**

### Contrast

| Element | Spec |
|---------|------|
| Body / list text | Near-black on white (`#0F172A` / `#071A14` on `#FFFFFF`) — not grey-on-grey |
| Labels | ≥ 14px, weight ≥ 500, color ≥ `#334155` |
| Primary button | White on `#0F5132` |
| Links | `#0F5132` or darker; underline on focus |
| Error / Shariah lock | Red `#DC2626` **plus** clear sentence — never color alone |
| Fund chips | Accent + **text label** (Zakat / Sadaqah / …) |

### Banned

- Light grey helper text as the only instruction  
- Disabled-looking primary actions  
- Tiny 11px tables without zoom affordance on mobile Quick Entry  

### Density vs readability

Desk may be dense, but:

- Quick Entry controls ≥ 40px touch height on phone  
- Modal titles ≥ 18px  
- Line length for lock messages: short paragraphs, not truncated toast-only  

---

## 1. Product framing

**Community-trust software:** census, Shariah-isolated Baitul Maal, 80G / Form 10BD, welfare & tickets, optional Basira.

Feel: **serious ledger and registry** — calm emerald, clear type — not consumer fintech.

### Hills

1. Treasurer — entry &lt; 60s; zero Zakat leakage  
2. Donor & CA — 80G + Form 10BD without drama  
3. Beneficiary — private intake; dignity  

---

## 2. Tokens

```css
:root {
  --dj-ink: #071A14;
  --dj-forest: #0B3D2E;
  --dj-primary: #0F5132;
  --dj-primary-hover: #0A3A25;
  --dj-primary-container: #D1E7DD;
  --dj-on-primary: #FFFFFF;
  --dj-leaf: #146047;
  --dj-gold: #B8892F;
  --dj-paper: #F8FAFC;
  --dj-surface: #FFFFFF;
  --dj-outline: #CBD5E1;
  --dj-slate: #1E293B;
  --dj-muted: #334155;
  --dj-error: #DC2626;

  --fund-zakat-accent: #D97706;
  --fund-zakat-container: #FEF3C7;
  --fund-sadaqah-accent: #059669;
  --fund-sadaqah-container: #D1FAE5;
  --fund-general-accent: #2563EB;
  --fund-general-container: #DBEAFE;
  --fund-waqf-accent: #7C3AED;
  --fund-waqf-container: #EDE9FE;
}
```

**Type:** Figtree / Frappe sans for Desk. Fraunces only on splash. Urdu: Noto Nastaliq. Arabic: Amiri.

Wire via `public/css/branding.css` — primary buttons, focus rings, login card.

---

## 3. Logo & chrome

| Place | Use |
|-------|-----|
| Navbar | Open-D icon |
| Login / about | Lockup |
| Prints | Forest or mono lockup |

White-label: strip Frappe/ERPNext “Powered by” and onboarding chrome.

---

## 4. Desk UX

1. Notebook clarity — short labels, large primary actions  
2. Visible Shariah locks — plain-language banner  
3. Fund color **+** name  
4. Dignity — no public beneficiary lists  
5. Auditability — submitted vouchers read as final  
6. Mobile Quick Entry for Friday collections  

### Elevation

- Canvas `#F8FAFC`  
- Cards white + 1px `#E2E8F0`  
- Avoid heavy glassmorphism on accounting grids  

---

## 5. Checklist before release

- [ ] Primary actions white-on-`#0F5132`  
- [ ] Lock / error text readable (not toast-only grey)  
- [ ] Fund tags labeled  
- [ ] Login shows Digital Jamath branding + readable form labels  
- [ ] `bench clear-cache` after branding CSS changes  
