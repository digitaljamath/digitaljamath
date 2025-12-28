from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

class FundCategory(models.Model):
    class Type(models.TextChoices):
        RESTRICTED = 'RESTRICTED', _('Restricted (Zakat, Sadaqah)')
        OPERATIONAL = 'OPERATIONAL', _('Operational (General Fund)')

    class Source(models.TextChoices):
        LOCAL = 'LOCAL', _('Local')
        FCRA = 'FCRA', _('FCRA (Foreign Contribution)')

    name = models.CharField(max_length=100)
    fund_type = models.CharField(max_length=20, choices=Type.choices, default=Type.OPERATIONAL)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.LOCAL)
    
    def __str__(self):
        return f"{self.name} ({self.get_fund_type_display()} - {self.source})"

class Budget(models.Model):
    category_name = models.CharField(max_length=100)
    limit = models.DecimalField(max_digits=12, decimal_places=2)
    current_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.category_name} - Limit: {self.limit}"

class Transaction(models.Model):
    fund_category = models.ForeignKey(FundCategory, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField(auto_now_add=True)
    is_expense = models.BooleanField(default=True) # True for Expense, False for Income
    
    # Link to Jamath (Optional, for fees/donations)
    linked_household = models.ForeignKey('jamath.Household', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    
    # 80G Compliance
    donor_pan = models.CharField(max_length=10, blank=True, null=True, help_text="Mandatory for donations > 2000")

    # Soft Delete
    is_active = models.BooleanField(default=True)

    # Basira AI Audit
    class AuditStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Audit')
        CLEAN = 'CLEAN', _('Clean')
        SUSPICIOUS = 'SUSPICIOUS', _('Suspicious')
        ERROR = 'ERROR', _('Audit Error')

    audit_status = models.CharField(max_length=20, choices=AuditStatus.choices, default=AuditStatus.PENDING)
    audit_notes = models.TextField(blank=True, null=True, help_text="AI Analysis Reasoning")

    def clean(self):
        from .services import FinanceService
        FinanceService.validate_transaction(self)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Soft delete
        self.is_active = False
        self.save()

class Asset(models.Model):
    name = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
