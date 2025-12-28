from django_tenants.utils import schema_context
from apps.jamath.models import Household, Member, Survey, SurveyResponse
from apps.finance.models import FundCategory, Transaction, Budget, Asset
from apps.welfare.models import Volunteer, GrantApplication
from django.contrib.auth import get_user_model
from datetime import date, timedelta
import random
from unittest.mock import patch

def populate(schema_name='jama_blr'):
    print(f"Populating rich data for schema: {schema_name}")
    
    # Mock the Celery task to avoid Redis connection issues
    with patch('apps.finance.signals.perform_audit_task.delay') as mock_task:
        with schema_context(schema_name):
            User = get_user_model()
            # Ensure admin exists for auditor link
            admin_user, _ = User.objects.get_or_create(username="admin")
            if not admin_user.check_password("password123"):
                admin_user.set_password("password123")
                admin_user.save()

            # 1. Fund Categories
            zakat_fund, _ = FundCategory.objects.get_or_create(
                name="Zakat Fund", 
                defaults={'fund_type': 'RESTRICTED', 'source': 'LOCAL'}
            )
            general_fund, _ = FundCategory.objects.get_or_create(
                name="Masjid Operations", 
                defaults={'fund_type': 'OPERATIONAL', 'source': 'LOCAL'}
            )
            
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

            # 5. Transactions
            # Income (Jumma Collections & Zakat)
            descriptions = ["Jumma Collection", "Zakat Donation", "General Sadaqah", "Fitra Collection", "Construction Fund"]
            
            # Add some transactions if none exist
            if Transaction.objects.count() < 10:
                for i in range(25): 
                    donor = random.choice(households)
                    amount = random.choice([500, 1000, 2000, 5000, 10000, 25000])
                    desc = random.choice(descriptions)
                    fund = zakat_fund if "Zakat" in desc else general_fund
                    pan = "ABCDE1234F" if amount > 2000 else None
                    
                    Transaction.objects.create(
                        fund_category=fund,
                        amount=amount,
                        description=f"{desc} - {donor.members.first().full_name}",
                        is_expense=False,
                        linked_household=donor,
                        donor_pan=pan
                    )
                
                # Expenses
                expense_types = [
                    ("Imam Salary", 15000), 
                    ("Muezzin Salary", 12000), 
                    ("Electricity Bill", 4500), 
                    ("Water Bill", 800),
                    ("Masjid Cleaning", 3000),
                    ("Friday Biryani for Poor", 6000),
                    ("Madrasa Books", 2500)
                ]
                
                for desc, amt in expense_types:
                    Transaction.objects.create(fund_category=general_fund, amount=amt, description=desc, is_expense=True)

            print("Data Population Complete!")

if __name__ == '__main__':
    populate()
