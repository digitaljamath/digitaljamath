
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import JournalEntry, JournalItem, Ledger
from django.db.models import Sum
from datetime import date

def run():
    print("Checking expenses for 'panambur' tenant...")
    with schema_context('panambur'):
        today = date.today()
        start_of_month = today.replace(day=1)
        print(f"Date Range: {start_of_month} to {today}")
        
        # 1. Check all items for this month
        items = JournalItem.objects.filter(
            journal_entry__date__gte=start_of_month,
            journal_entry__date__lte=today
        ).select_related('journal_entry', 'ledger')
        
        print(f"Total Items found: {items.count()}")
        print("-" * 80)
        print(f"{'Date':<12} | {'Voucher':<15} | {'Type':<8} | {'Ledger':<20} | {'AcctType':<10} | {'Fund':<8} | {'Dr':<10} | {'Cr':<10}")
        print("-" * 80)
        
        for item in items:
            print(f"{str(item.journal_entry.date):<12} | "
                  f"{item.journal_entry.voucher_number:<15} | "
                  f"{item.journal_entry.voucher_type:<8} | "
                  f"{item.ledger.name[:20]:<20} | "
                  f"{item.ledger.account_type:<10} | "
                  f"{str(item.ledger.fund_type):<8} | "
                  f"{item.debit_amount:<10} | "
                  f"{item.credit_amount:<10}")

        # 2. Check Expense Aggregation
        print("-" * 80)
        expense_items = items.filter(ledger__account_type='EXPENSE')
        print(f"Expense Items: {expense_items.count()}")
        
        gen_expenses = expense_items.exclude(ledger__fund_type='ZAKAT')
        print(f"General Expense Items: {gen_expenses.count()}")
        
        total = gen_expenses.aggregate(t=Sum('debit_amount'))['t']
        print(f"Aggregated General Expense Total: {total}")

if __name__ == "__main__":
    run()
