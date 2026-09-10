"""Hard-reset Demo Jamath ledgers and reseed Baitul Maal demo data."""
from digital_jamath.compat import frappe


def run():
    frappe.flags.dj_ignore_trial_lock = True
    company = "Demo Jamath"

    # Cancel submitted JEs cleanly
    for name in frappe.get_all(
        "Journal Entry", filters={"company": company, "docstatus": 1}, pluck="name"
    ):
        try:
            frappe.get_doc("Journal Entry", name).cancel()
        except Exception:
            pass

    frappe.db.commit()

    # Purge JE + child rows + leftover GL for this company
    je_names = frappe.get_all("Journal Entry", filters={"company": company}, pluck="name")
    for name in je_names:
        frappe.db.delete("Journal Entry Account", {"parent": name})
        frappe.db.delete("Journal Entry", {"name": name})
    frappe.db.sql("delete from `tabGL Entry` where company=%s", company)
    frappe.db.commit()

    from digital_jamath.setup import create_default_fund_types, setup_accounting_dimension
    from digital_jamath.baitul_maal.coa_template import apply_masjid_coa

    create_default_fund_types()
    setup_accounting_dimension()
    apply_masjid_coa(company)
    frappe.clear_cache()

    from digital_jamath.cloud.demo_jamath import reset_demo_jamath

    reset_demo_jamath()

    funds = frappe.db.sql(
        """
        select ifnull(fund_type,'NULL') as fund_type, count(*) as c,
               sum(debit) as debit, sum(credit) as credit
        from `tabGL Entry`
        where company=%s and is_cancelled=0
        group by fund_type
        order by fund_type
        """,
        company,
        as_dict=True,
    )
    jes = frappe.db.sql(
        """
        select docstatus, count(*) as c
        from `tabJournal Entry`
        where company=%s and user_remark like %s
        group by docstatus
        """,
        (company, "%[DEMO-SEED]%"),
        as_dict=True,
    )
    staff = (
        frappe.db.count("Jamath Staff", {"notes": ["like", "%[DEMO-SEED]%"]})
        if frappe.db.table_exists("Jamath Staff")
        else 0
    )
    compliance = (
        frappe.db.count("Jamath Compliance Item", {"description": ["like", "%[DEMO-SEED]%"]})
        if frappe.db.table_exists("Jamath Compliance Item")
        else 0
    )
    salaries = frappe.db.count(
        "Journal Entry",
        {"company": company, "user_remark": ["like", "%[DEMO-SEED] Salary%"], "docstatus": 1},
    )
    return {
        "funds": funds,
        "jes": jes,
        "grants": frappe.db.count(
            "Jamath Grant Application", {"description": ["like", "%[DEMO-SEED]%"]}
        ),
        "staff": staff,
        "compliance": compliance,
        "salary_jes": salaries,
        "fund_types": frappe.get_all("Fund Type", pluck="name"),
    }
