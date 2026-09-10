from digital_jamath.compat import frappe
from digital_jamath.baitul_maal.quick_entry import record_quick_entry


def run():
    frappe.flags.dj_ignore_trial_lock = True
    before = frappe.db.count("GL Entry", {"company": "Demo Jamath", "is_cancelled": 0})
    try:
        res = record_quick_entry(
            voucher_type="Receipt",
            amount=1111,
            fund_type="Zakat",
            mode_of_payment="Bank",
            party_name="Diag",
            notes="[DEMO-SEED] diag zakat",
            company="Demo Jamath",
        )
    except Exception as e:
        return {"error": str(e)}
    after = frappe.db.count("GL Entry", {"company": "Demo Jamath", "is_cancelled": 0})
    gl = frappe.get_all(
        "GL Entry",
        filters={"voucher_no": res["voucher_name"]},
        fields=["account", "fund_type", "debit", "credit", "is_cancelled"],
    )
    je = frappe.get_doc("Journal Entry", res["voucher_name"])
    return {
        "res": res,
        "before": before,
        "after": after,
        "je_docstatus": je.docstatus,
        "gl": gl,
        "accounts": [
            {"account": a.account, "fund_type": a.fund_type, "debit": a.debit, "credit": a.credit}
            for a in je.accounts
        ],
    }
