from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from typing import Optional, List
from .models import Transaction, FundCategory

class FinanceService:
    @staticmethod
    def validate_transaction(
        transaction: Transaction,
        fund_category: Optional[FundCategory] = None,
        is_expense: Optional[bool] = None,
        description: Optional[str] = None,
        amount: Optional[Decimal] = None
    ) -> None:
        """
        Validates transaction rules.
        Use arguments if validating before model creation/update, or pass fully formed transaction.
        """
        # If we are validating an instance, use its values if arguments are missing
        fund_cat = fund_category or transaction.fund_category
        is_exp = is_expense if is_expense is not None else transaction.is_expense
        desc = description or transaction.description
        amt = amount or transaction.amount

        # 1. Fund Mixing Prevention
        if is_exp and fund_cat.fund_type == FundCategory.Type.RESTRICTED:
            forbidden_keywords = ['bill', 'salary', 'maintenance', 'electricity', 'rent']
            if desc and any(word in desc.lower() for word in forbidden_keywords):
                raise ValidationError(_("Compliance Error: Restricted Funds (Zakat/Sadaqah) cannot be used for Operational Expenses."))

        # 2. 80G Compliance
        if not is_exp and amt and amt > 2000 and not transaction.donor_pan:
             # Note: We need donor_pan passed in if it's not on the transaction object yet
             # This assumes transaction object has it, or we check it elsewhere.
             # Ideally validation should take DTOs.
             if not transaction.donor_pan: # Check instance
                 raise ValidationError(_("80G Compliance Error: PAN number is mandatory for donations exceeding ₹2,000."))
