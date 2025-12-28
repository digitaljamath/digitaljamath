from django.test import TestCase
from decimal import Decimal
from django.core.exceptions import ValidationError
from apps.finance.models import FundCategory, Transaction
from apps.finance.services import FinanceService

class FinanceServiceTests(TestCase):
    def setUp(self):
        self.operational_fund = FundCategory(
            name="General Fund",
            fund_type=FundCategory.Type.OPERATIONAL,
            source=FundCategory.Source.LOCAL
        )
        self.restricted_fund = FundCategory(
            name="Zakat Fund",
            fund_type=FundCategory.Type.RESTRICTED,
            source=FundCategory.Source.LOCAL
        )

    def test_restricted_fund_compliance_success(self):
        """Test allowed expense from restricted fund."""
        transaction = Transaction(
            fund_category=self.restricted_fund,
            amount=Decimal("1000.00"),
            description="Medical Aid",
            is_expense=True
        )
        # Should not raise
        FinanceService.validate_transaction(transaction)

    def test_restricted_fund_compliance_failure(self):
        """Test forbidden expense from restricted fund."""
        transaction = Transaction(
            fund_category=self.restricted_fund,
            amount=Decimal("1000.00"),
            description="Office Rent Bill",
            is_expense=True
        )
        with self.assertRaisesMessage(ValidationError, "Restricted Funds"):
            FinanceService.validate_transaction(transaction)

    def test_80g_compliance_success(self):
        """Test donation > 2000 with PAN."""
        transaction = Transaction(
            fund_category=self.operational_fund,
            amount=Decimal("5000.00"),
            description="Big Donation",
            is_expense=False, # Income
            donor_pan="ABCDE1234F"
        )
        FinanceService.validate_transaction(transaction)

    def test_80g_compliance_failure(self):
        """Test donation > 2000 without PAN."""
        transaction = Transaction(
            fund_category=self.operational_fund,
            amount=Decimal("5000.00"),
            description="Big Donation No PAN",
            is_expense=False, # Income
            donor_pan=""
        )
        with self.assertRaisesMessage(ValidationError, "PAN number is mandatory"):
            FinanceService.validate_transaction(transaction)
