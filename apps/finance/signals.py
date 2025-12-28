from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import connection
from apps.finance.models import Transaction, FundCategory
from apps.basira.tasks import perform_audit_task

@receiver(post_save, sender=Transaction)
def trigger_ai_audit(sender, instance, created, **kwargs):
    """
    Trigger the Basira AI Audit task when a new Transaction is created.
    """
    if created:
        # Get current schema name to pass to Celery
        schema_name = connection.schema_name
        
        # We only audit Operational/Restricted fund usage if enabled.
        # For now, audit EVERYTHING except maybe strictly internal transfers if any.
        
        # Delay the task
        perform_audit_task.delay(instance.id, schema_name)
