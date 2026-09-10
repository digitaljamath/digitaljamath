"""
ETL Data Migration Tool: Django PostgreSQL -> Digital Jamath (Frappe / ERPNext)
Implements the Opening Balance approach (Pitfall 7 mitigation) to preserve financial integrity.
"""

import json
import os
import sys
from decimal import Decimal
from datetime import datetime

def convert_households(django_households_data):
    """
    Transforms Django Household & Member models into Frappe Jamath Household format.
    """
    frappe_households = []

    for hh in django_households_data:
        members_data = []
        for m in hh.get("members", []):
            members_data.append({
                "doctype": "Jamath Member",
                "full_name": m.get("full_name", ""),
                "relationship_to_head": m.get("relationship_to_head", "Self"),
                "is_head_of_family": 1 if m.get("is_head_of_family") else 0,
                "gender": m.get("gender", "Male").capitalize(),
                "dob": str(m.get("dob", "")),
                "marital_status": m.get("marital_status", "Single").capitalize(),
                "profession": m.get("profession", ""),
                "education": m.get("education", ""),
                "is_employed": 1 if m.get("is_employed") else 0,
                "monthly_income": float(m.get("monthly_income") or 0.0),
                "skills": m.get("skills", ""),
                "requirements": m.get("requirements", ""),
                "is_alive": 1 if m.get("is_alive", True) else 0
            })

        # Calculate Zakat score
        monthly_income = float(hh.get("monthly_income") or 0.0)
        has_critical_illness = 1 if hh.get("has_critical_illness") else 0
        is_widow = 1 if hh.get("is_widow_household") else 0
        housing = hh.get("housing_status", "Own House")

        score = 0
        if 0 < monthly_income < 5000:
            score += 50
        elif 5000 <= monthly_income < 10000:
            score += 30
        elif monthly_income == 0:
            score += 60

        if has_critical_illness:
            score += 30
        if is_widow:
            score += 20
        if housing == "Rented":
            score += 10

        zakat_score = min(score, 100)
        economic_status = "Zakat Eligible" if zakat_score >= 80 else "Aam / Sahib-e-Nisab"

        frappe_doc = {
            "doctype": "Jamath Household",
            "membership_id": hh.get("membership_id", ""),
            "phone_number": hh.get("phone_number", ""),
            "address": hh.get("address", ""),
            "housing_status": housing,
            "monthly_income": monthly_income,
            "has_critical_illness": has_critical_illness,
            "is_widow_household": is_widow,
            "zakat_score": zakat_score,
            "economic_status": economic_status,
            "is_verified": 1 if hh.get("is_verified") else 0,
            "members": members_data
        }
        frappe_households.append(frappe_doc)

    return frappe_households


def generate_opening_journal_entry(company, closing_balances, posting_date=None):
    """
    Creates an Opening Balance Journal Entry in ERPNext from closing balances.
    Prevents replaying historical transactions while guaranteeing Trial Balance parity.
    """
    if not posting_date:
        posting_date = datetime.now().strftime("%Y-%m-%d")

    accounts = []
    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")

    for acc_name, balance in closing_balances.items():
        bal = Decimal(str(balance))
        if bal > 0:
            accounts.append({
                "account": acc_name,
                "debit_in_account_currency": float(bal),
                "user_remark": "Opening Balance from Django migration"
            })
            total_debit += bal
        elif bal < 0:
            accounts.append({
                "account": acc_name,
                "credit_in_account_currency": float(abs(bal)),
                "user_remark": "Opening Balance from Django migration"
            })
            total_credit += abs(bal)

    # Balance with Temporary Opening / Corpus if variance exists
    if total_debit != total_credit:
        diff = total_debit - total_credit
        if diff > 0:
            accounts.append({
                "account": "Temporary Opening - DJ",
                "credit_in_account_currency": float(diff),
                "user_remark": "Balancing entry for migration opening corpus"
            })
        else:
            accounts.append({
                "account": "Temporary Opening - DJ",
                "debit_in_account_currency": float(abs(diff)),
                "user_remark": "Balancing entry for migration opening corpus"
            })

    return {
        "doctype": "Journal Entry",
        "company": company,
        "posting_date": posting_date,
        "voucher_type": "Opening Entry",
        "is_opening": "Yes",
        "user_remark": "Historical opening balance migrated from Digital Jamath Django v2.1",
        "accounts": accounts
    }


def main():
    print("=== Digital Jamath Django -> Frappe Migration Helper ===")
    print("Run this tool with a Django export JSON to produce Frappe-importable fixtures.")

if __name__ == "__main__":
    main()
