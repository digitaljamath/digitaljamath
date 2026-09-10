app_name = "digital_jamath"
app_title = "Digital Jamath"
app_publisher = "Digital Jamath"
app_description = "Open-source community trust, census, and Baitul Maal accounting platform for Masjids, Jamaths & Muslim welfare organisations"
app_email = "salam@digitaljamath.com"
app_license = "mit"
# Primary product surface = committee SPA (Kamra-style). Desk remains Advanced mode.
app_home = "/jamath"
app_logo_url = "/assets/digital_jamath/images/logo-mark.png?v=20260910i"

# Branding (Desk + website / login)
app_include_css = ["/assets/digital_jamath/css/branding.css?v=20260910i"]
app_include_js = ["/assets/digital_jamath/js/branding.js?v=20260910i"]
web_include_css = ["/assets/digital_jamath/css/branding.css?v=20260910i"]
web_include_js = ["/assets/digital_jamath/js/branding.js?v=20260910i"]

website_context = {
    "favicon": "/assets/digital_jamath/images/favicon.ico?v=20260910i",
    "splash_image": "/assets/digital_jamath/images/logo-lockup.png?v=20260910i",
    "app_name": "Digital Jamath",
}

update_website_context = "digital_jamath.branding.update_website_context"
extend_bootinfo = "digital_jamath.branding.extend_bootinfo"

# Committee console SPA (Vite/React/shadcn) — primary UX on top of ERPNext
add_to_apps_screen = [
    {
        "name": "digital_jamath",
        "logo": "/assets/digital_jamath/images/logo-mark.png",
        "title": "Digital Jamath",
        "route": "/jamath",
    }
]

website_route_rules = [
    {"from_route": "/jamath/<path:app_path>", "to_route": "jamath"},
]

# Full HTML SPA shell — do not wrap in website chrome.
base_template_map = {
    r"^jamath(/.*)?$": "templates/spa_shell.html",
}

website_redirects = [
    {"source": r"/committee$", "target": "/jamath"},
    {"source": r"/committee/(.*)", "target": r"/jamath/\1"},
]

# Document Events
# ---------------

doc_events = {
    "*": {
        "before_insert": "digital_jamath.cloud.trial.trial_write_guard",
        "before_save": "digital_jamath.cloud.trial.trial_write_guard",
        "on_trash": "digital_jamath.cloud.trial.trial_write_guard",
    },
    "Journal Entry": {
        "before_submit": "digital_jamath.baitul_maal.validators.validate_fund_restrictions",
        "on_cancel": "digital_jamath.baitul_maal.validators.validate_fund_on_cancel"
    },
    "Payment Entry": {
        "before_submit": "digital_jamath.baitul_maal.validators.validate_payment_entry_funds",
        "on_cancel": "digital_jamath.baitul_maal.validators.validate_fund_on_cancel"
    },
}

scheduler_events = {
    "daily": [
        "digital_jamath.cloud.trial.expire_due_trials",
        "digital_jamath.cloud.demo_jamath.reset_demo_jamath",
    ]
}

# Setup & Migrations
# ------------------
after_install = "digital_jamath.setup.after_install"
after_migrate = "digital_jamath.setup.after_migrate"

# Fixtures (Custom fields exported with app)
fixtures = [
    {
        "dt": "Custom Field",
        "filters": [
            ["dt", "in", ["Journal Entry", "Journal Entry Account", "Payment Entry", "Account", "Company"]]
        ]
    }
]
