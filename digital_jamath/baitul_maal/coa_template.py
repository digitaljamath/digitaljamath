"""
Masjid & Jamath Chart of Accounts Template for Indian Non-Profits
"""

MASJID_CHART_OF_ACCOUNTS = {
    "Application of Funds (Assets)": {
        "Current Assets": {
            "Bank Accounts": {
                "Bank Account (Primary)": {
                    "account_type": "Bank",
                    "account_number": "1001"
                },
                "UPI Online Collections": {
                    "account_type": "Bank",
                    "account_number": "1002"
                }
            },
            "Cash in Hand": {
                "Jumaah Cash Box": {
                    "account_type": "Cash",
                    "account_number": "1010"
                },
                "Petty Cash (Office)": {
                    "account_type": "Cash",
                    "account_number": "1011"
                }
            },
            "Investments": {
                "Fixed Deposits": {
                    "account_number": "1020"
                }
            }
        },
        "Fixed Assets": {
            "Masjid Land & Building (Waqf)": {
                "account_number": "1501"
            },
            "Sound System & Electrical Equipment": {
                "account_number": "1502"
            }
        }
    },
    "Source of Funds (Liabilities)": {
        "Current Liabilities": {
            "Advance Subscriptions": {
                "account_number": "2001"
            },
            "Payables & Vendor Dues": {
                "account_type": "Payable",
                "account_number": "2002"
            }
        },
        "Capital / Equity": {
            "Trust Endowment & Corpus": {
                "account_type": "Equity",
                "account_number": "3001"
            }
        }
    },
    "Income": {
        "Direct Income (Collections)": {
            "Membership Subscriptions (Chanda)": {
                "account_number": "4001"
            },
            "General Donations (Sadaqah / Lillah)": {
                "account_number": "4002"
            },
            "Zakat Fund Collections (Restricted)": {
                "account_number": "4003"
            },
            "Construction & Renovation Fund": {
                "account_number": "4004"
            },
            "Waqf Endowment Contributions": {
                "account_number": "4006"
            },
            "Service & Certificate Fees": {
                "account_number": "4005"
            }
        }
    },
    "Expenses": {
        "Welfare & Shariah Distributions": {
            "Zakat Direct Disbursement (Eligible Asnaaf)": {
                "account_number": "5001"
            },
            "Sadaqah & Lillah Welfare Aid": {
                "account_number": "5005"
            },
            "Medical & Dialysis Assistance": {
                "account_number": "5002"
            },
            "Ration & Food Aid Distribution": {
                "account_number": "5003"
            },
            "Education & Madrassah Grants": {
                "account_number": "5004"
            }
        },
        "Capital & Waqf Outlay": {
            "Construction & Renovation Expense": {
                "account_number": "5201"
            },
            "Waqf Asset Maintenance": {
                "account_number": "5202"
            }
        },
        "Masjid Maintenance & Operations": {
            "Imam & Muezzin Salaries": {
                "account_number": "5101"
            },
            "Electricity & Power Charges": {
                "account_number": "5102"
            },
            "Water & Sanitation Maintenance": {
                "account_number": "5103"
            },
            "Masjid Cleaning & Consumables": {
                "account_number": "5104"
            },
            "Office, Audit & Bank Charges": {
                "account_number": "5105"
            }
        }
    }
}


def apply_masjid_coa(company: str | None = None) -> dict:
    """
    Ensure a Company exists and create missing accounts from MASJID_CHART_OF_ACCOUNTS.
    Safe to re-run; skips accounts that already exist by account_name.
    """
    from digital_jamath.compat import frappe

    company = company or frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        if not frappe.db.exists("Company", "Demo Masjid Trust"):
            doc = frappe.get_doc({
                "doctype": "Company",
                "company_name": "Demo Masjid Trust",
                "abbr": "DMT",
                "default_currency": "INR",
                "country": "India",
            })
            doc.insert(ignore_permissions=True)
            frappe.db.commit()
        company = "Demo Masjid Trust"

    created = []

    def walk(node: dict, parent: str | None = None):
        for name, meta in node.items():
            if not isinstance(meta, dict):
                continue
            is_group = any(isinstance(v, dict) and "account_number" not in v for k, v in meta.items() if k not in ("account_type", "account_number"))
            # leaf if has account_number or account_type and no nested dict children with names
            children = {k: v for k, v in meta.items() if isinstance(v, dict)}
            leaf = "account_number" in meta or ("account_type" in meta and not children)
            if children and not leaf:
                if not frappe.db.exists("Account", {"account_name": name, "company": company}):
                    frappe.get_doc({
                        "doctype": "Account",
                        "account_name": name,
                        "is_group": 1,
                        "company": company,
                        "parent_account": parent,
                    }).insert(ignore_permissions=True, ignore_mandatory=True)
                    created.append(name)
                parent_name = frappe.db.get_value("Account", {"account_name": name, "company": company}, "name")
                walk(children, parent_name)
            else:
                if frappe.db.exists("Account", {"account_name": name, "company": company}):
                    continue
                frappe.get_doc({
                    "doctype": "Account",
                    "account_name": name,
                    "is_group": 0,
                    "company": company,
                    "parent_account": parent,
                    "account_type": meta.get("account_type"),
                    "account_number": meta.get("account_number"),
                }).insert(ignore_permissions=True, ignore_mandatory=True)
                created.append(name)

    # ERPNext expects root groups; walk top-level as groups under company roots when possible
    for root_name, subtree in MASJID_CHART_OF_ACCOUNTS.items():
        root = frappe.db.get_value("Account", {"account_name": root_name, "company": company}, "name")
        if not root:
            # attach under first matching root type if present
            root = frappe.db.get_value("Account", {"company": company, "parent_account": ["in", ["", None]]}, "name")
        walk(subtree if isinstance(subtree, dict) else {}, root)

    frappe.db.commit()
    return {"company": company, "created": created}
