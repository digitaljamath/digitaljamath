from celery import shared_task
from django_tenants.utils import schema_context
from apps.finance.models import Transaction
from apps.basira.services import audit_transaction
import asyncio

@shared_task
def perform_audit_task(transaction_id, schema_name):
    """
    Async task to audit a transaction using Basira AI.
    Switch schema context to ensure we are accessing the correct tenant's data.
    """
    print(f"Starting Audit for Transaction {transaction_id} in schema {schema_name}")
    
    with schema_context(schema_name):
        try:
            transaction = Transaction.objects.get(id=transaction_id)
            
            # Prepare data for AI
            tx_data = {
                "id": transaction.id,
                "amount": float(transaction.amount),
                "description": transaction.description,
                "fund_category": transaction.fund_category.name,
                "is_expense": transaction.is_expense
            }
            
            # Call Async Service (Sync wrapper needed for Celery)
            # Since Celery is sync by default, we run the async function via asyncio.run
            audit_result = asyncio.run(audit_transaction(tx_data))
            
            # Update Transaction
            if audit_result.is_suspicious:
                transaction.audit_status = Transaction.AuditStatus.SUSPICIOUS
            else:
                transaction.audit_status = Transaction.AuditStatus.CLEAN
            
            transaction.audit_notes = f"[{audit_result.risk_level}] {audit_result.reason}"
            if audit_result.suggested_action:
                 transaction.audit_notes += f" Action: {audit_result.suggested_action}"
                 
            transaction.save(update_fields=['audit_status', 'audit_notes'])
            print(f"Audit Complete: {transaction.audit_status}")
            
        except Transaction.DoesNotExist:
            print(f"Transaction {transaction_id} not found.")
        except Exception as e:
            print(f"Audit Task Failed: {e}")
            # Optionally set status to ERROR
            try:
                transaction = Transaction.objects.get(id=transaction_id)
                transaction.audit_status = Transaction.AuditStatus.ERROR
                transaction.audit_notes = str(e)
                transaction.save(update_fields=['audit_status', 'audit_notes'])
            except:
                pass
