# Legacy Django codebase

Digital Jamath was first built on Django + React (`django-tenants`). That version is **retired**. The product is now the Frappe/ERPNext app in this repository.

## Where it lives

| | |
|---|---|
| Branch | [`legacy`](https://github.com/digitaljamath/digitaljamath/tree/legacy) (locked, read-only) |
| Final release tag | `v2.1.0-django-legacy` |
| Status | Frozen. No fixes, no new features. PRs against it are closed. |

## You do not need it

- `main` and `dev` **do not contain** any legacy code. Cloning or pulling them gives you only the Frappe app.
- You do not need to fetch, check out, or pull the `legacy` branch to contribute, run, or deploy Digital Jamath.
- If you had an older clone with a `legacy_django/` folder, it is gone after you pull. Any leftover `node_modules/` or `dist/` in it is safe to delete.

## Only if you need to look at the old code

```bash
git fetch origin legacy
git worktree add ../digitaljamath-legacy origin/legacy
```

This keeps it in a separate folder, away from your working copy.

## Moving data from the old app

Use `scripts/migrate_django_to_frappe.py` on `main`. It reads a Django JSON export and does not need the legacy code.
