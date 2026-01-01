import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "digitaljamath.settings")
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Household, Member, Survey, SurveyResponse
# from apps.finance.models import FundCategory, Transaction, Budget, Asset
from apps.welfare.models import Volunteer, GrantApplication
from django.contrib.auth import get_user_model
from datetime import date, timedelta
import random
from unittest.mock import patch

def populate(schema_name='demo'):
    print(f"Populating rich data for schema: {schema_name}")
    
    # Mock the Celery task to avoid Redis connection issues
    # with patch('apps.finance.signals.perform_audit_task.delay') as mock_task:
    with schema_context(schema_name):
        User = get_user_model()
        # Ensure admin exists for auditor link
        # Use credentials requested: username='digitaljamath', email='demo@digitaljamath.com'
        admin_user = User.objects.filter(username="digitaljamath").first()
        
        if not admin_user:
             # Try finding by email
             admin_user = User.objects.filter(email="demo@digitaljamath.com").first()

        if not admin_user:
            admin_user = User.objects.create_superuser(
                username="digitaljamath",
                email="demo@digitaljamath.com",
                password="password123"
            )
            print("✅ Created Superuser: digitaljamath / password123")
        else:
            # Ensure password is correct and remove any conflicting 'demo' user
            admin_user.username = "digitaljamath"
            admin_user.email = "demo@digitaljamath.com"
            admin_user.set_password("password123")
            admin_user.save()
            print("✅ Reset Password for: digitaljamath")
            
        # Cleanup logic: remove old 'demo' user if it conflicts or is confusing
        User.objects.filter(username="demo").delete()
        User.objects.filter(username="demo@digitalmasjid.com").delete()

        # 1. Chart of Accounts (Mizan Ledger)
        from django.core.management import call_command
        call_command('seed_ledger')  # Ensure the standard structure exists

        # Fetch Key Ledgers
        from apps.jamath.models import Ledger, JournalEntry, JournalItem, Supplier
        
        # Use '1001' Cash in Hand
        cash_account = Ledger.objects.get(code='1001')
        
        # Income Heads
        general_donation = Ledger.objects.get(code='3001') # General Donation
        zakat_donation = Ledger.objects.get(code='3002')   # Zakat Donation
        
        # Expense Heads
        salary_exp = Ledger.objects.get(code='4004') # Staff Salaries
        elec_exp = Ledger.objects.get(code='4001')   # Electricity
        maint_exp = Ledger.objects.get(code='4003')  # Repairs

        # 2. Households & Members - Indian Muslim Context
        households_data = [
            {
                "address": "No. 45, Tannery Road, Frazer Town", "status": "AAM", "mid": "JM-001",
                "members": [("Ahmed Khan", True, "MALE", "MARRIED", "Business", "Graduate", "Trading, Accounting", 45), ("Fatima Khan", False, "FEMALE", "MARRIED", "Housewife", "12th Pass", "Cooking, Sewing", 40), ("Bilal Khan", False, "MALE", "SINGLE", "Student", "Pursuing Degree", None, 18)]
            },
            {
                "address": "Flat 302, Diamond Appts, Modi Road", "status": "AAM", "mid": "JM-002",
                "members": [("Syed Imran", True, "MALE", "MARRIED", "Software Engineer", "B.Tech", "Python, Cloud", 35), ("Sana Imran", False, "FEMALE", "MARRIED", "Teacher", "M.A.", "Education", 32)]
            },
            {
                "address": "Small Hut, Near Old Masjid, Shivajinagar", "status": "ZAKAT_ELIGIBLE", "mid": "JM-003",
                "members": [("Khatija Bi", True, "FEMALE", "WIDOWED", "Domestic Help", "Illiterate", "Cleaning", 55), ("Ayesha", False, "FEMALE", "SINGLE", "Tailoring", "8th Pass", "Tailoring, Embroidery", 22)]
            },
            {
                "address": "No. 12, 1st Cross, Bamboo Bazaar", "status": "AAM", "mid": "JM-004",
                "members": [("Mohammed Yusuf", True, "MALE", "MARRIED", "Mechanic", "10th Pass", "Auto Repair, Welding", 42), ("Zainab", False, "FEMALE", "MARRIED", "Housewife", "10th Pass", "Cooking", 38), ("Umar", False, "MALE", "SINGLE", "Student", "7th Class", None, 12), ("Ali", False, "MALE", "SINGLE", "Student", "5th Class", None, 10)]
            },
            {
                "address": "No. 88, Pottery Town", "status": "ZAKAT_ELIGIBLE", "mid": "JM-005",
                "members": [("Abdul Rahman", True, "MALE", "MARRIED", "Daily Wage Labor", "Illiterate", "Masonry", 48), ("Noor Jahan", False, "FEMALE", "MARRIED", "Housewife", "Illiterate", None, 45)]
            },
            {
                "address": "Villa 5, High Street, Cooke Town", "status": "AAM", "mid": "JM-006",
                "members": [("Dr. Fareed", True, "MALE", "MARRIED", "Surgeon", "MBBS, MS", "Surgery", 58), ("Dr. Yasmin", False, "FEMALE", "MARRIED", "Gynecologist", "MBBS, MD", "Healthcare", 52)]
            },
            {
                "address": "No. 7, Slum Board Qtrs, DJ Halli", "status": "ZAKAT_ELIGIBLE", "mid": "JM-007",
                "members": [("Salma Banu", True, "FEMALE", "WIDOWED", "Vegetable Vendor", "5th Pass", "Trading", 40)]
            },
            {
                "address": "No. 23, Market Road, City Market", "status": "AAM", "mid": "JM-008",
                "members": [("Ibrahim Sait", True, "MALE", "MARRIED", "Wholesale Trader", "Graduate", "Trading, Negotiation", 50), ("Mariam", False, "FEMALE", "MARRIED", "Housewife", "12th Pass", None, 48)]
            },
            {
                "address": "No. 56, Chandni Chowk Road", "status": "AAM", "mid": "JM-009",
                "members": [("Feroze Ahmed", True, "MALE", "MARRIED", "Auto Driver", "10th Pass", "Driving", 38), ("Shabana", False, "FEMALE", "MARRIED", "Housewife", "8th Pass", "Tailoring", 35)]
            },
            {
                "address": "Penthouse, Prestige Block, Benson Town", "status": "AAM", "mid": "JM-010",
                "members": [("Seth Jamal", True, "MALE", "DIVORCED", "Builder", "Graduate", "Real Estate", 60)]
            },
            {
                "address": "Room 4, Chawl No 3, Goripalya", "status": "ZAKAT_ELIGIBLE", "mid": "JM-011",
                "members": [("Rashid", True, "MALE", "MARRIED", "Carpenter", "7th Pass", "Woodwork", 32), ("Kulsum", False, "FEMALE", "MARRIED", "Housewife", "5th Pass", None, 28), ("Sameer", False, "MALE", "SINGLE", "Toddler", None, None, 3)]
            },
            {
                "address": "No. 101, New Complex, Jayanagar 4th Block", "status": "AAM", "mid": "JM-012",
                "members": [("Zameer Pasha", True, "MALE", "MARRIED", "Real Estate Agent", "Graduate", "Sales, Marketing", 45), ("Nasreen", False, "FEMALE", "MARRIED", "Teacher", "B.Ed", "Education", 40)]
            },
        ]

        households = []
        for hh_data in households_data:
            # Check if exists to prevent duplicates on re-run
            if Household.objects.filter(membership_id=hh_data["mid"]).exists():
                hh = Household.objects.get(membership_id=hh_data["mid"])
                households.append(hh)
                continue

            hh = Household.objects.create(
                address=hh_data["address"],
                economic_status=hh_data["status"],
                zakat_score=random.randint(10, 90) if hh_data["status"] == "ZAKAT_ELIGIBLE" else 0,
                membership_id=hh_data["mid"],
                custom_data={"Mahalla": "Central"}
            )
            households.append(hh)
            
            for name, is_head, gender, marital_status, profession, education, skills, age in hh_data["members"]:
                dob = date.today() - timedelta(days=age*365)
                Member.objects.create(
                    household=hh, 
                    full_name=name, 
                    is_head_of_family=is_head,
                    gender=gender,
                    marital_status=marital_status,
                    profession=profession,
                    education=education,
                    skills=skills,
                    dob=dob,
                    is_alive=True
                )

        print(f"Ensured {len(households)} households exist.")

        # 3. Survey
        survey, _ = Survey.objects.get_or_create(
            title="Ramadan Ration Survey 2024",
            defaults={
                'description': "Survey to identify families needing ration kits",
                'schema': [
                    {"id": "monthly_income", "type": "number", "label": "Monthly Income (₹)"},
                    {"id": "ration_card_type", "type": "text", "label": "Ration Card Type (BPL/APL)"},
                    {"id": "widow_assistance", "type": "boolean", "label": "Needs Widow Pension Assistance?"}
                ]
            }
        )

        # 4. Survey Responses
        response_count = 0
        for hh in households:
            if hh.economic_status == 'ZAKAT_ELIGIBLE':
                # Check if response already exists
                if not SurveyResponse.objects.filter(survey=survey, household=hh).exists():
                    SurveyResponse.objects.create(
                        survey=survey,
                        household=hh,
                        auditor=admin_user, # Link to Admin user (Auditor)
                        answers={
                            "monthly_income": str(random.randint(3000, 12000)),
                            "ration_card_type": random.choice(["BPL", "None"]),
                            "widow_assistance": str(random.choice([True, False])).lower()
                        }
                    )
                    response_count += 1
        print(f"Added {response_count} new survey responses.")

        # 5. Transactions (Mizan Ledger)
        # Income (Receipts)
        descriptions = ["Jumma Collection", "Zakat Donation", "General Sadaqah", "Fitra Collection", "Construction Fund"]
        
        # Add some transactions if none exist
        if JournalEntry.objects.count() < 10:
            print("Seeding Journal Entries (Vouchers)...")
            for i in range(15): 
                donor_hh = random.choice(households)
                member = donor_hh.members.filter(is_head_of_family=True).first()
                amount = random.choice([500, 1000, 2000, 5000, 10000, 25000])
                desc = random.choice(descriptions)
                
                # Determine Ledger
                credit_ledger = zakat_donation if "Zakat" in desc else general_donation
                
                pan = "ABCDE1234F" if amount > 2000 else ""
                
                # Create Receipt Voucher
                entry = JournalEntry.objects.create(
                    voucher_type=JournalEntry.VoucherType.RECEIPT,
                    date=date.today() - timedelta(days=random.randint(1, 60)),
                    narration=f"{desc} - {member.full_name}",
                    donor=member, # Link to member
                    donor_pan=pan,
                    created_by=admin_user,
                    is_finalized=True
                )
                
                # Double Entry Lines
                # Debit Cash
                JournalItem.objects.create(journal_entry=entry, ledger=cash_account, debit_amount=amount, credit_amount=0)
                # Credit Income
                JournalItem.objects.create(journal_entry=entry, ledger=credit_ledger, debit_amount=0, credit_amount=amount)
            
            # Expenses (Payments)
            expense_types = [
                ("Imam Salary", 15000, salary_exp), 
                ("Muezzin Salary", 12000, salary_exp), 
                ("Electricity Bill", 4500, elec_exp), 
                ("Masjid Repairs", 3000, maint_exp),
            ]
            
            supplier, _ = Supplier.objects.get_or_create(name="Ad-hoc Vendor", defaults={'address': "Bangalore"})

            for desc, amt, exp_ledger in expense_types:
                    # Create Payment Voucher
                entry = JournalEntry.objects.create(
                    voucher_type=JournalEntry.VoucherType.PAYMENT,
                    date=date.today() - timedelta(days=random.randint(1, 30)),
                    narration=desc,
                    supplier=supplier,
                    created_by=admin_user,
                    is_finalized=True
                )
                
                # Double Entry Lines
                # Debit Expense
                JournalItem.objects.create(journal_entry=entry, ledger=exp_ledger, debit_amount=amt, credit_amount=0)
                # Credit Cash
                JournalItem.objects.create(journal_entry=entry, ledger=cash_account, debit_amount=0, credit_amount=amt)

        print("Data Population Complete!")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Populate demo data for a specific tenant.')
    parser.add_argument('--schema', type=str, default='demo', help='Schema name to populate (default: demo)')
    args = parser.parse_args()
    
    populate(schema_name=args.schema)
