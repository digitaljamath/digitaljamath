from django.db import models
from apps.shared.models import MosqueScoped

class Volunteer(MosqueScoped):
    # Link to Member potentially? For now standalone or linking to Member by ID if needed.
    # Assuming integration with Member later.
    full_name = models.CharField(max_length=200)
    skills = models.JSONField(default=list, help_text="List of skills e.g. ['Medical', 'Driving']")
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name

class GrantApplication(MosqueScoped):
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        SCORING = 'SCORING', 'Scoring'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        DISBURSED = 'DISBURSED', 'Disbursed'

    applicant_name = models.CharField(max_length=200) # Or ForeignKey to Member
    description = models.TextField()
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    score = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Grant {self.id} - {self.status}"
