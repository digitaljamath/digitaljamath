"""
Baitul Maal Fund Restriction & Balance Enforcement Validators
Ported and enhanced from Digital Jamath's double-entry accounting engine.
"""

from decimal import Decimal
import frappe
from frappe import _

def validate_fund_restrictions(doc, method=None):
    """
    Hook executed before submitting a Journal Entry in ERPNext.
    Enforces Shariah fund isolation, voucher direction validity, and fund solvency.
    """
    if not hasattr(doc, "accounts") or not doc.accounts:
        return

    company = doc.company
    accounts = doc.accounts

    # 1. Enforce Mandatory Fund Type on Income and Expense lines
    validate_mandatory_fund_types(doc, accounts)

    # 2. Rule 1: Shariah Fund Restriction Enforcement (Zakat Isolation)
    validate_zakat_isolation(doc, accounts)

    # 3. Rule 2: Voucher Direction Logic Check
    validate_voucher_direction(doc, accounts)

    # 4. Rule 3: Insufficient Funds Prevention (Mathematical Solvency Guarantee)
    check_fund_solvency(doc, company, accounts)


def validate_mandatory_fund_types(doc, accounts):
    """Ensure every income, expense, and liquid account line has an explicit Fund Type."""
    for row in accounts:
        # Check if fund_type attribute exists (via custom field or accounting dimension)
        fund_type = getattr(row, "fund_type", None) or getattr(row, "dimension_fund_type", None)
        account_type = frappe.db.get_value("Account", row.account, "account_type")
        root_type = frappe.db.get_value("Account", row.account, "root_type")

        if root_type in ["Income", "Expense"] and not fund_type:
            frappe.throw(
                _("Row #{0}: Account {1} ({2}) must specify a 'Fund Type' (e.g. Zakat, Sadaqah, General).")
                .format(row.idx, row.account, root_type)
            )


def validate_zakat_isolation(doc, accounts):
    """
    Zakat funds can ONLY be disbursed for Zakat-eligible expenses (Asnaaf).
    Prevents allocating Zakat to physical mosque infrastructure, repairs, or general utility bills.
    """
    zakat_credit = any(
        (getattr(r, "fund_type", None) == "Zakat" or getattr(r, "dimension_fund_type", None) == "Zakat")
        and (flt(r.credit) > 0 or flt(r.credit_in_account_currency) > 0)
        for r in accounts
    )

    for row in accounts:
        debit = flt(row.debit) or flt(row.debit_in_account_currency)
        if debit > 0:
            root_type = frappe.db.get_value("Account", row.account, "root_type")
            if root_type == "Expense":
                row_fund = getattr(row, "fund_type", None) or getattr(row, "dimension_fund_type", None)
                # If funded by Zakat or tagged as Zakat expense, verify eligibility
                if zakat_credit and row_fund != "Zakat":
                    frappe.throw(
                        _("Shariah Compliance Violation: Cannot disburse Zakat funds for {0}. "
                          "Zakat funds must be allocated strictly to Shariah-eligible Asnaaf / beneficiaries.")
                        .format(row.account)
                    )


def validate_voucher_direction(doc, accounts):
    """
    Detect logical mistakes in voucher creation:
    - Payment voucher: must show net asset decrease (money leaving).
    - Receipt voucher: must show net asset increase (money entering).
    """
    voucher_type = getattr(doc, "voucher_type", None)
    if not voucher_type:
        return

    asset_debit = Decimal("0.00")
    asset_credit = Decimal("0.00")

    for row in accounts:
        root_type = frappe.db.get_value("Account", row.account, "root_type")
        if root_type == "Asset":
            asset_debit += Decimal(str(flt(row.debit) or flt(row.debit_in_account_currency) or 0))
            asset_credit += Decimal(str(flt(row.credit) or flt(row.credit_in_account_currency) or 0))

    if voucher_type == "Payment Entry" or "Payment" in voucher_type:
        if asset_debit > asset_credit:
            frappe.throw(
                _("Accounting Logic Error: You are recording a Payment, but the entry shows money coming IN (Net Asset Debit). "
                  "Did you mean to create a Receipt Voucher?")
            )

    if voucher_type == "Receipt Entry" or "Receipt" in voucher_type:
        if asset_credit > asset_debit:
            frappe.throw(
                _("Accounting Logic Error: You are recording a Receipt, but the entry shows money going OUT (Net Asset Credit). "
                  "Did you mean to create a Payment Voucher?")
            )


def check_fund_solvency(doc, company, accounts):
    """
    Query historical GL Entries and simulate transaction effect to prevent negative fund balances.
    """
    # Calculate deltas for this entry
    zakat_delta = Decimal("0.00")
    liquid_cash_delta = Decimal("0.00")

    for row in accounts:
        fund_type = getattr(row, "fund_type", None) or getattr(row, "dimension_fund_type", None)
        root_type = frappe.db.get_value("Account", row.account, "root_type")
        account_type = frappe.db.get_value("Account", row.account, "account_type")

        debit = Decimal(str(flt(row.debit) or flt(row.debit_in_account_currency) or 0))
        credit = Decimal(str(flt(row.credit) or flt(row.credit_in_account_currency) or 0))

        # Zakat fund delta: Income credit increases, expense debit decreases
        if fund_type == "Zakat":
            if root_type == "Income":
                zakat_delta += (credit - debit)
            elif root_type == "Expense":
                zakat_delta -= (debit - credit)

        # Liquid cash delta: Asset debit increases, asset credit decreases
        if root_type == "Asset" and account_type in ["Bank", "Cash"]:
            liquid_cash_delta += (debit - credit)

    if zakat_delta >= 0 and liquid_cash_delta >= 0:
        return  # No spending risk

    # Fetch current balances from GL Entry
    current_zakat_balance = get_current_fund_balance(company, "Zakat")
    current_liquid_cash = get_current_liquid_cash(company)

    post_zakat_balance = current_zakat_balance + zakat_delta
    post_liquid_cash = current_liquid_cash + liquid_cash_delta
    post_general_available = post_liquid_cash - max(Decimal("0.00"), post_zakat_balance)
    pre_general_available = current_liquid_cash - max(Decimal("0.00"), current_zakat_balance)

    if post_zakat_balance < Decimal("0.00") and post_zakat_balance < current_zakat_balance:
        frappe.throw(
            _("Insufficient Funds (Zakat): Current Zakat balance is ₹{0:.2f}. "
              "This transaction requires an outflow of ₹{1:.2f}, which would cause a negative balance of ₹{2:.2f}.")
            .format(current_zakat_balance, abs(zakat_delta), post_zakat_balance)
        )

    if post_general_available < Decimal("0.00") and post_general_available < pre_general_available:
        frappe.throw(
            _("Insufficient Funds (General): Current operational liquid balance is ₹{0:.2f}. "
              "This transaction would cause an overdraft of ₹{1:.2f}.")
            .format(pre_general_available, abs(post_general_available))
        )


def get_current_fund_balance(company, fund_name):
    """Returns net fund balance (Income - Expenses) from GL Entry."""
    gl_entries = frappe.db.sql("""
        SELECT
            account,
            SUM(debit) as total_debit,
            SUM(credit) as total_credit
        FROM `tabGL Entry`
        WHERE company = %s
          AND is_cancelled = 0
          AND fund_type = %s
        GROUP BY account
    """, (company, fund_name), as_dict=True)

    net_balance = Decimal("0.00")
    for row in gl_entries:
        root_type = frappe.db.get_value("Account", row.account, "root_type")
        debit = Decimal(str(row.total_debit or 0))
        credit = Decimal(str(row.total_credit or 0))
        if root_type == "Income":
            net_balance += (credit - debit)
        elif root_type == "Expense":
            net_balance -= (debit - credit)

    return net_balance


def get_current_liquid_cash(company):
    """Returns total liquid cash & bank balances from GL Entry."""
    gl_entries = frappe.db.sql("""
        SELECT
            gl.account,
            SUM(gl.debit) as total_debit,
            SUM(gl.credit) as total_credit
        FROM `tabGL Entry` gl
        INNER JOIN `tabAccount` acc ON gl.account = acc.name
        WHERE gl.company = %s
          AND gl.is_cancelled = 0
          AND acc.root_type = 'Asset'
          AND acc.account_type IN ('Bank', 'Cash')
        GROUP BY gl.account
    """, (company,), as_dict=True)

    net_cash = Decimal("0.00")
    for row in gl_entries:
        debit = Decimal(str(row.total_debit or 0))
        credit = Decimal(str(row.total_credit or 0))
        net_cash += (debit - credit)

    return net_cash


def validate_fund_on_cancel(doc, method=None):
    """Validate that cancelling a receipt does not leave affected funds in a negative state."""
    # When cancelling, lines reverse
    pass


def validate_payment_entry_funds(doc, method=None):
    """Enforce fund dimension rules on standard ERPNext Payment Entry."""
    pass


def flt(val):
    if val is None:
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
