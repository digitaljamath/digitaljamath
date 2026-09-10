# Committee console (shadcn / Kamra-style SPA)

Primary UX for jamath trustees — React + Tailwind + shadcn-style components —
mounted on Frappe at **`/jamath`**. ERPNext Desk stays available as **Advanced**.

## Architecture (same pattern as Kamra PMS)

| Layer | Role |
|-------|------|
| `committee-ui/` | Vite + React SPA |
| `digital_jamath/www/jamath.*` | Serves built `index.html` + CSRF |
| `digital_jamath/public/committee/` | Build output (`/assets/digital_jamath/committee/`) |
| Frappe `/api/method/*` | Auth + data (session cookie) |
| `/app` | Advanced · full ERPNext Desk |

## Modes

- **Simple** — Home, Community, Baitul Maal, Services, Welfare, Settings
- **Advanced** — same nav + Chart of Accounts links + “Open Desk”

## Develop

```bash
cd committee-ui
npm install
DJ_API_TARGET=http://127.0.0.1:8000 npm run dev
# open http://127.0.0.1:5174/  (basename is / in dev)
```

## Build into the Frappe app

```bash
cd committee-ui && npm install && npm run build
# Deploy digital_jamath/ (includes public/committee), then clear-cache / restart
```

## Next slices

1. In-console create/edit forms (not only Desk links)
2. Quick-receive Chanda / Zakat flow
3. Role-gated nav (Accounts vs Trustee)
4. Command palette (⌘K) like Kamra
