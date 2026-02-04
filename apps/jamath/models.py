from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal

# ============================================================================
# HOUSEHOLD & MEMBER MODELS
# ============================================================================

class Household(models.Model):
    class EconomicStatus(models.TextChoices):
        ZAKAT_ELIGIBLE = 'ZAKAT_ELIGIBLE', 'Zakat Eligible'
        AAM = 'AAM', 'Aam / Sahib-e-Nisab'

    class HousingStatus(models.TextChoices):
        OWN = 'OWN', 'Own House'
        RENTED = 'RENTED', 'Rented'
        FAMILY = 'FAMILY', 'Family Property'

    address = models.TextField()
    economic_status = models.CharField(max_length=20, choices=EconomicStatus.choices, default=EconomicStatus.AAM)
    housing_status = models.CharField(max_length=20, choices=HousingStatus.choices, default=HousingStatus.OWN)
    zakat_score = models.IntegerField(default=0, help_text="AI Calculated score 0-100")
    
    # Membership Identity
    membership_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Jamath Membership ID (e.g., JM-001)")
    phone_number = models.CharField(max_length=15, null=True, blank=True, unique=True, help_text="Primary contact for OTP login")
    is_verified = models.BooleanField(default=False, help_text="Admin-verified household")
    
    custom_data = models.JSONField(default=dict, blank=True, help_text="Ad-hoc fields like Village, Blood Group")
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"Household {self.membership_id or self.id} - {self.economic_status}"

    def save(self, *args, **kwargs):
        # Auto-generate membership_id if not set
        if not self.membership_id:
            self.membership_id = self._generate_membership_id()
        super().save(*args, **kwargs)

    def _generate_membership_id(self):
        """Generate a unique membership ID with configurable prefix."""
        try:
            config = MembershipConfig.objects.filter(is_active=True).first()
            prefix = config.membership_id_prefix if config else 'JM-'
        except:
            prefix = 'JM-'
        
        # Find the highest existing number with this prefix
        from django.db.models import Max
        from django.db.models.functions import Cast, Replace, Substr
        
        # Get all IDs with this prefix and find max number
        existing = Household.objects.filter(
            membership_id__startswith=prefix
        ).values_list('membership_id', flat=True)
        
        max_num = 0
        for mid in existing:
            try:
                num_part = mid.replace(prefix, '')
                num = int(num_part)
                if num > max_num:
                    max_num = num
            except (ValueError, AttributeError):
                continue
        
        # Generate new ID with zero-padding
        new_num = max_num + 1
        return f"{prefix}{new_num:03d}"

    @property
    def member_count(self):
        return self.members.count()

    @property
    def is_membership_active(self):
        """Check if household has an active subscription."""
        return self.subscriptions.filter(status='ACTIVE', end_date__gte=timezone.now().date()).exists()




class Member(models.Model):
    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'

    class MaritalStatus(models.TextChoices):
        SINGLE = 'SINGLE', 'Single'
        MARRIED = 'MARRIED', 'Married'
        WIDOWED = 'WIDOWED', 'Widowed'
        DIVORCED = 'DIVORCED', 'Divorced'

    class Relationship(models.TextChoices):
        SELF = 'SELF', 'Self (Head)'
        SPOUSE = 'SPOUSE', 'Spouse'
        SON = 'SON', 'Son'
        DAUGHTER = 'DAUGHTER', 'Daughter'
        PARENT = 'PARENT', 'Parent'
        SIBLING = 'SIBLING', 'Sibling'
        OTHER = 'OTHER', 'Other'
    
    household = models.ForeignKey(Household, related_name='members', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    is_head_of_family = models.BooleanField(default=False)
    relationship_to_head = models.CharField(max_length=20, choices=Relationship.choices, default=Relationship.SELF)
    
    # Demographics
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE)
    marital_status = models.CharField(max_length=15, choices=MaritalStatus.choices, default=MaritalStatus.SINGLE)
    
    # Socio-Economic Data
    profession = models.CharField(max_length=100, null=True, blank=True)
    education = models.CharField(max_length=100, null=True, blank=True, help_text="e.g., 10th Pass, Graduate, Hafiz")
    skills = models.CharField(max_length=255, null=True, blank=True, help_text="Comma-separated skills")
    is_employed = models.BooleanField(default=False)
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Special Needs
    requirements = models.TextField(null=True, blank=True, help_text="e.g., Needs Dialysis Support, Wheelchair")
    
    # Approval Workflow
    is_alive = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=True, help_text="False = Pending admin approval")
    custom_data = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.full_name} ({'Head' if self.is_head_of_family else 'Member'})"


# ============================================================================
# MEMBERSHIP & SUBSCRIPTION MODELS
# ============================================================================

class MembershipConfig(models.Model):
    """Tenant-level configuration for membership fees and cycles."""
    class Cycle(models.TextChoices):
        ANNUAL = 'ANNUAL', 'Annual'
        BI_YEARLY = 'BI_YEARLY', 'Bi-Yearly (6 months)'
        MONTHLY = 'MONTHLY', 'Monthly'

    cycle = models.CharField(max_length=20, choices=Cycle.choices, default=Cycle.ANNUAL)
    minimum_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1200.00'))
    currency = models.CharField(max_length=5, default='INR')
    
    # Payment Gateway Configuration (Tenant Specific)
    class GatewayProvider(models.TextChoices):
        RAZORPAY = 'RAZORPAY', 'Razorpay'
        CASHFREE = 'CASHFREE', 'Cashfree Payments'
        NONE = 'NONE', 'None'

    payment_gateway_provider = models.CharField(max_length=20, choices=GatewayProvider.choices, default=GatewayProvider.NONE)
    
    # Razorpay Keys
    razorpay_key_id = models.CharField(max_length=50, blank=True, default='')
    razorpay_key_secret = models.CharField(max_length=50, blank=True, default='')
    
    cashfree_app_id = models.CharField(max_length=100, blank=True, default='')
    cashfree_secret_key = models.CharField(max_length=100, blank=True, default='')
    
    # Organization Details for Receipts (80G)
    organization_name = models.CharField(max_length=200, default='Digital Jamath', help_text="Legal Name for Receipts")
    organization_address = models.TextField(blank=True, help_text="Registered Address")
    organization_pan = models.CharField(max_length=20, blank=True, help_text="Organization PAN")
    registration_number_80g = models.CharField(max_length=100, blank=True, help_text="80G Registration Number")
    
    # ID Prefix Configuration
    membership_id_prefix = models.CharField(max_length=10, default='JM-', help_text="Prefix for auto-generated membership IDs")
    
    # Terminology Configuration (localization aliases)
    household_label = models.CharField(max_length=50, default='Gharane', help_text="Display label for households (e.g., Gharane, Families, Khandan)")
    member_label = models.CharField(max_length=50, default='Afrad', help_text="Display label for members (e.g., Afrad, Members)")
    masjid_name = models.CharField(max_length=100, default='', blank=True, help_text="Display name for the masjid")
    
    # Telegram Notification Settings
    telegram_enabled = models.BooleanField(default=True, help_text="Enable Telegram notifications")
    telegram_auto_reminders = models.BooleanField(default=False, help_text="Automatically send payment reminders (via cron)")
    telegram_notify_profile_updates = models.BooleanField(default=True, help_text="Notify members when their profile is updated")
    telegram_notify_announcements = models.BooleanField(default=False, help_text="Auto-broadcast announcements when published")
    
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Membership Configuration"

    def __str__(self):
        return f"{self.cycle} - Min Fee: {self.currency} {self.minimum_fee}"





class Subscription(models.Model):
    """Tracks a household's membership status for a given period."""
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PENDING = 'PENDING', 'Pending (Partial Payment)'
        EXPIRED = 'EXPIRED', 'Expired'

    household = models.ForeignKey(Household, related_name='subscriptions', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    minimum_required = models.DecimalField(max_digits=10, decimal_places=2, help_text="Copied from config at creation")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.household.membership_id} - {self.status} ({self.start_date} to {self.end_date})"

    def update_status(self):
        """Recalculate status based on amount paid."""
        if self.amount_paid >= self.minimum_required:
            self.status = self.Status.ACTIVE
        elif self.end_date < timezone.now().date():
            self.status = self.Status.EXPIRED
        else:
            self.status = self.Status.PENDING
        self.save()


class Receipt(models.Model):
    """Payment record with fee/donation breakdown."""
    subscription = models.ForeignKey(Subscription, related_name='receipts', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    membership_portion = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount towards membership fee")
    donation_portion = models.DecimalField(max_digits=10, decimal_places=2, help_text="Voluntary extra as Sadaqah")
    payment_date = models.DateTimeField(auto_now_add=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    donor_pan = models.CharField(max_length=15, blank=True, null=True, help_text="For 80G Compliance")
    pdf_url = models.URLField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Receipt {self.receipt_number} - ₹{self.amount}"


# ============================================================================
# COMMUNICATION & SERVICE MODELS
# ============================================================================

class Announcement(models.Model):
    """Bulletin Board for Jamath announcements."""
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'

    title = models.CharField(max_length=200)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PUBLISHED)
    published_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    target_household = models.ForeignKey('Household', on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements', help_text="If set, this announcement is visible ONLY to this household.")

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title


class ServiceRequest(models.Model):
    """Document/Service requests from households."""
    class RequestType(models.TextChoices):
        NIKAAH_NAMA = 'NIKAAH_NAMA', 'Nikaah Nama'
        DEATH_CERT = 'DEATH_CERT', 'Death Certificate'
        NOC = 'NOC', 'Mahal Transfer NOC'
        CHARACTER_CERT = 'CHARACTER_CERT', 'Character Certificate'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    household = models.ForeignKey(Household, related_name='service_requests', on_delete=models.CASCADE)
    request_type = models.CharField(max_length=30, choices=RequestType.choices)
    description = models.TextField(null=True, blank=True, help_text="Detailed description of the request")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.get_request_type_display()} - {self.household.membership_id}"


# ============================================================================
# SURVEY MODELS (Existing)
# ============================================================================

class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    schema = models.JSONField(default=list, help_text="Form Builder Schema")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class SurveyResponse(models.Model):
    survey = models.ForeignKey(Survey, related_name='responses', on_delete=models.PROTECT)
    household = models.ForeignKey(Household, related_name='survey_responses', on_delete=models.CASCADE)
    auditor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audited_surveys')
    answers = models.JSONField(default=dict)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.survey.title} - {self.household.id}"


# ============================================================================
# MIZAN LEDGER - DOUBLE-ENTRY ACCOUNTING SYSTEM
# ============================================================================

class Ledger(models.Model):
    """Chart of Accounts - the foundation of the double-entry system."""
    class AccountType(models.TextChoices):
        ASSET = 'ASSET', 'Asset'
        LIABILITY = 'LIABILITY', 'Liability'
        INCOME = 'INCOME', 'Income'
        EXPENSE = 'EXPENSE', 'Expense'
        EQUITY = 'EQUITY', 'Equity/Corpus'

    class FundType(models.TextChoices):
        RESTRICTED_ZAKAT = 'ZAKAT', 'Restricted - Zakat'
        RESTRICTED_SADAQAH = 'SADAQAH', 'Restricted - Sadaqah'
        RESTRICTED_CONSTRUCTION = 'CONSTRUCTION', 'Restricted - Construction'
        UNRESTRICTED_GENERAL = 'GENERAL', 'Unrestricted - General'

    code = models.CharField(max_length=20, unique=True, help_text="e.g., 1001, 2001")
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=AccountType.choices)
    fund_type = models.CharField(max_length=20, choices=FundType.choices, null=True, blank=True,
                                  help_text="Required for Income/Expense accounts")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_system = models.BooleanField(default=False, help_text="System accounts cannot be deleted")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['code']
        verbose_name = "Ledger Account"
        verbose_name_plural = "Chart of Accounts"

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def balance(self):
        """Calculate current balance based on all journal items."""
        from django.db.models import Sum
        items = self.journal_items.aggregate(
            total_debit=Sum('debit_amount'),
            total_credit=Sum('credit_amount')
        )
        debit = items['total_debit'] or Decimal('0.00')
        credit = items['total_credit'] or Decimal('0.00')
        
        # Assets & Expenses have debit balances; Liabilities, Income, Equity have credit balances
        if self.account_type in [self.AccountType.ASSET, self.AccountType.EXPENSE]:
            return debit - credit
        return credit - debit


class Supplier(models.Model):
    """Vendor/Supplier Master for expense tracking."""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=15, blank=True, help_text="GST Identification Number")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class JournalEntry(models.Model):
    """Parent transaction record - Receipt, Payment, or Journal Voucher."""
    class VoucherType(models.TextChoices):
        RECEIPT = 'RECEIPT', 'Receipt Voucher'
        PAYMENT = 'PAYMENT', 'Payment Voucher'
        JOURNAL = 'JOURNAL', 'Journal Entry'

    class PaymentMode(models.TextChoices):
        CASH = 'CASH', 'Cash'
        NEFT = 'NEFT', 'Bank Transfer (NEFT/IMPS)'
        UPI = 'UPI', 'UPI'
        CHEQUE = 'CHEQUE', 'Cheque'

    voucher_number = models.CharField(max_length=50, unique=True, help_text="e.g., RCP-2025-001")
    voucher_type = models.CharField(max_length=20, choices=VoucherType.choices)
    date = models.DateField()
    narration = models.TextField(help_text="Description of the transaction")

    # Receipt Voucher Fields (Donor Info)
    donor = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='donations', help_text="For Receipt vouchers")
    donor_name_manual = models.CharField(max_length=200, blank=True, help_text="For guest donors")
    donor_pan = models.CharField(max_length=10, blank=True, help_text="Required for amounts > ₹2000")
    donor_intent = models.TextField(blank=True, help_text="Specific direction like 'For buying fans only'")

    # Payment Voucher Fields (Vendor Info)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='payments', help_text="For Payment vouchers")
    vendor_invoice_no = models.CharField(max_length=50, blank=True)
    vendor_invoice_date = models.DateField(null=True, blank=True)
    proof_document = models.FileField(upload_to='vouchers/proofs/', null=True, blank=True,
                                       help_text="Required for amounts > ₹500")

    # Payment Mode
    payment_mode = models.CharField(max_length=20, choices=PaymentMode.choices, default=PaymentMode.CASH)

    # Audit & Lock
    is_finalized = models.BooleanField(default=False, help_text="Locked entries cannot be modified")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                    related_name='journal_entries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = "Journal Entry"
        verbose_name_plural = "Journal Entries"

    def __str__(self):
        return f"{self.voucher_number} - {self.get_voucher_type_display()}"

    @property
    def total_amount(self):
        """Total transaction amount (sum of debits or credits)."""
        from django.db.models import Sum
        return self.items.aggregate(total=Sum('debit_amount'))['total'] or Decimal('0.00')

    def clean(self):
        """Validate double-entry balance and fund restrictions."""
        from django.core.exceptions import ValidationError
        
        # Skip validation if no items yet (during creation)
        if not self.pk:
            return
            
        items = self.items.all()
        if not items.exists():
            return

        total_debit = sum(item.debit_amount for item in items)
        total_credit = sum(item.credit_amount for item in items)

        # Rule 1: Debits must equal Credits
        if total_debit != total_credit:
            raise ValidationError(f"Debits (₹{total_debit}) must equal Credits (₹{total_credit})")

        # Rule 2: Fund Restriction Enforcement
        for item in items:
            if item.debit_amount > 0 and item.ledger.account_type == Ledger.AccountType.EXPENSE:
                # This is an expense - check if funded by restricted fund
                credit_items = [i for i in items if i.credit_amount > 0]
                for credit_item in credit_items:
                    source_fund = credit_item.ledger.fund_type
                    expense_fund = item.ledger.fund_type
                    
                    # Zakat funds can only be used for Zakat expenses
                    if source_fund == Ledger.FundType.RESTRICTED_ZAKAT:
                        if expense_fund != Ledger.FundType.RESTRICTED_ZAKAT:
                            raise ValidationError(
                                f"Compliance Violation: Cannot use Zakat funds for {item.ledger.name}. "
                                "Zakat funds can only be used for Zakat-eligible expenses."
                            )
        
        # Rule 3: Insufficient Funds Validation
        self.check_sufficient_funds(items)

    def check_sufficient_funds(self, items):
        """Ensure we have enough money in the respective fund before spending."""
        from django.db.models import Sum, Q
        from django.core.exceptions import ValidationError
        
        # We need to check if we are booking an Expense.
        expense_items = [i for i in items if i.debit_amount > 0 and i.ledger.account_type == Ledger.AccountType.EXPENSE]

        # Helper to get balance excluding current transaction
        def get_balance(filters, exclude_entry=None):
            queryset = JournalItem.objects.filter(**filters)
            if exclude_entry:
                queryset = queryset.exclude(journal_entry=exclude_entry)
            
            credits = queryset.aggregate(sum=Sum('credit_amount'))['sum'] or Decimal('0.00')
            debits = queryset.aggregate(sum=Sum('debit_amount'))['sum'] or Decimal('0.00')
            return credits, debits

        # 1. Calculate Pre-Transaction Zakat Balance
        # Income (Credit) - Expense (Debit)
        z_inc_c, z_inc_d = get_balance({
            'ledger__fund_type': Ledger.FundType.RESTRICTED_ZAKAT,
            'ledger__account_type': Ledger.AccountType.INCOME
        }, exclude_entry=self)
        
        z_exp_c, z_exp_d = get_balance({
            'ledger__fund_type': Ledger.FundType.RESTRICTED_ZAKAT,
            'ledger__account_type': Ledger.AccountType.EXPENSE
        }, exclude_entry=self)

        pre_zakat_balance = (z_inc_c - z_inc_d) - (z_exp_d - z_exp_c) 
        # Note: Income is Credit normal (Cr - Dr). Expense is Debit normal (Dr - Cr).
        # Balance = Net Income - Net Expense.
        # Logic: Zakat Fund = (All Zakat Income Credits) - (All Zakat Expense Debits)
        # Simplified: (z_inc_c) - (z_exp_d) usually, but covering reversals too.
        
        pre_zakat_balance = (z_inc_c - z_inc_d) + (z_exp_c - z_exp_d) 
        # Wait. 
        # Income Ledger: Credit increases balance.
        # Expense Ledger: Debit increases "Expense", reducing Fund.
        # Fund Balance = (Income Credit - Income Debit) - (Expense Debit - Expense Credit)
        #              = z_inc_c - z_inc_d - z_exp_d + z_exp_c. Correct.

        # 2. Calculate Pre-Transaction Liquid Cash
        # Using code__startswith='100' to capture 1001, 1002, 1003 etc.
        cash_c, cash_d = get_balance({
            'ledger__account_type': Ledger.AccountType.ASSET,
            'ledger__code__startswith': '100' 
        }, exclude_entry=self)
        
        # Cash is Asset (Debit normal). Balance = Debit - Credit.
        pre_liquid_cash = cash_d - cash_c
        pre_general_available = pre_liquid_cash - pre_zakat_balance

        # 3. Calculate Deltas from Current Items
        current_zakat_delta = Decimal('0.00')
        current_cash_delta = Decimal('0.00')

        for item in items:
            # Zakat Delta
            if item.ledger.fund_type == Ledger.FundType.RESTRICTED_ZAKAT:
                if item.ledger.account_type == Ledger.AccountType.INCOME:
                    current_zakat_delta += (item.credit_amount - item.debit_amount)
                elif item.ledger.account_type == Ledger.AccountType.EXPENSE:
                    current_zakat_delta -= (item.debit_amount - item.credit_amount)
            
            # Cash Delta (Liquid Assets)
            if item.ledger.account_type == Ledger.AccountType.ASSET and item.ledger.code.startswith('100'):
                current_cash_delta += (item.debit_amount - item.credit_amount)

        # 4. Final Balances
        post_zakat_balance = pre_zakat_balance + current_zakat_delta
        post_liquid_cash = pre_liquid_cash + current_cash_delta
        post_general_available = post_liquid_cash - post_zakat_balance

        # 5. Check Constraints
        # Rule: You cannot make the balance negative. 
        # If it is already negative, you cannot make it WORSE (lower).
        
        if post_zakat_balance < 0 and post_zakat_balance < pre_zakat_balance:
             raise ValidationError("Insufficient Funds")

        if post_general_available < 0 and post_general_available < pre_general_available:
             raise ValidationError("Insufficient Funds")


    def save(self, *args, **kwargs):
        # Auto-generate voucher number if not set
        if not self.voucher_number:
            self.voucher_number = self._generate_voucher_number()
        super().save(*args, **kwargs)

    def _generate_voucher_number(self):
        """Generate unique voucher number like RCP-2025-001."""
        import datetime
        prefix_map = {
            self.VoucherType.RECEIPT: 'RCP',
            self.VoucherType.PAYMENT: 'PAY',
            self.VoucherType.JOURNAL: 'JRN',
        }
        prefix = prefix_map.get(self.voucher_type, 'TXN')
        year = datetime.date.today().year

        # Find max number for this type/year
        existing = JournalEntry.objects.filter(
            voucher_number__startswith=f"{prefix}-{year}-"
        ).values_list('voucher_number', flat=True)

        max_num = 0
        for vn in existing:
            try:
                num = int(vn.split('-')[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue

        return f"{prefix}-{year}-{max_num + 1:03d}"


class JournalItem(models.Model):
    """Individual line item in a journal entry (debit or credit line)."""
    journal_entry = models.ForeignKey(JournalEntry, related_name='items', on_delete=models.CASCADE)
    ledger = models.ForeignKey(Ledger, on_delete=models.PROTECT, related_name='journal_items')
    debit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    credit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    particulars = models.CharField(max_length=200, blank=True, help_text="Additional line description")

    class Meta:
        ordering = ['id']

    def __str__(self):
        if self.debit_amount > 0:
            return f"Dr. {self.ledger.name}: ₹{self.debit_amount}"
        return f"Cr. {self.ledger.name}: ₹{self.credit_amount}"

    def clean(self):
        """Validate that only one of debit/credit is set."""
        from django.core.exceptions import ValidationError
        if self.debit_amount > 0 and self.credit_amount > 0:
            raise ValidationError("A line item cannot have both debit and credit amounts.")
        if self.debit_amount == 0 and self.credit_amount == 0:
            raise ValidationError("Either debit or credit amount must be specified.")


# ============================================================================
# RBAC & STAFF MANAGEMENT
# ============================================================================

class StaffRole(models.Model):
    """Dynamic roles for staff/zimmedars with permission policies."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict, help_text="Module-level permissions, e.g., {'finance': 'admin'}")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class StaffMember(models.Model):
    """Assigns a user to a specific role within the tenant."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_roles')
    role = models.ForeignKey(StaffRole, on_delete=models.PROTECT, related_name='members')
    designation = models.CharField(max_length=100, help_text="Official title, e.g. 'General Secretary'")
    is_active = models.BooleanField(default=True)
    joined_at = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.username} - {self.designation}"


# ============================================================================
# TELEGRAM INTEGRATION
# ============================================================================

class TelegramLink(models.Model):
    """Links a phone number to a Telegram chat_id for OTP delivery."""
    phone_number = models.CharField(max_length=20, unique=True, primary_key=True)
    chat_id = models.CharField(max_length=50)
    linked_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Telegram Link"
        verbose_name_plural = "Telegram Links"

    def __str__(self):
        return f"{self.phone_number} → {self.chat_id}"
