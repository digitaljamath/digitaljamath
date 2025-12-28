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
    
    # ID Prefix Configuration
    membership_id_prefix = models.CharField(max_length=10, default='JM-', help_text="Prefix for auto-generated membership IDs")
    
    # Terminology Configuration (localization aliases)
    household_label = models.CharField(max_length=50, default='Gharane', help_text="Display label for households (e.g., Gharane, Families, Khandan)")
    member_label = models.CharField(max_length=50, default='Afrad', help_text="Display label for members (e.g., Afrad, Members)")
    masjid_name = models.CharField(max_length=100, default='', blank=True, help_text="Display name for the masjid")
    
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
    pdf_url = models.URLField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Receipt {self.receipt_number} - ₹{self.amount}"


# ============================================================================
# COMMUNICATION & SERVICE MODELS
# ============================================================================

class Announcement(models.Model):
    """Bulletin Board for Jamath announcements."""
    title = models.CharField(max_length=200)
    content = models.TextField()
    published_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

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
    description = models.TextField(null=True, blank=True, help_text="Additional details")
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
