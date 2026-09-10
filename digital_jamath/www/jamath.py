import os

import frappe

no_cache = 1


def get_context(context):
	"""Serve the committee React SPA shell with CSRF for Frappe session POSTs."""
	index_path = frappe.get_app_path("digital_jamath", "public", "committee", "index.html")
	if not os.path.exists(index_path):
		frappe.throw(
			frappe._(
				"Committee UI is not built. Run "
				"<code>cd committee-ui && npm install && npm run build</code>."
			),
			title="Digital Jamath UI not built",
		)

	with open(index_path, encoding="utf-8") as f:
		html = f.read()

	csrf = frappe.sessions.get_csrf_token()
	boot = f'<script>window.csrf_token = "{csrf}";</script>'
	html = html.replace("</head>", boot + "</head>", 1)

	context.spa_html = html
	context.no_cache = 1
	# Keep website chrome off the SPA shell (full HTML document).
	context.no_header = 1
	context.no_sidebar = 1
	context.no_breadcrumbs = 1
	return context
