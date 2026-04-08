"""
Management command to set up a demo mosque with sample data.
Usage: python manage.py setup_demo
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection, transaction
from apps.shared.models import Mosque
from apps.jamath.models import Household, Member, MembershipConfig, Announcement
from decimal import Decimal
import os
from datetime import date

sample_households = [
    {
        "membership_id": "DEMO-001",
        "address": "123 Minaret Street, Demo City",
        "economic_status": "AAM",
        "members": [
            {
                'full_name': 'Yusuf Demo',
                'is_head_of_family': True,
                'gender': 'MALE',
                'marital_status': 'MARRIED',
                'dob': date(1980, 1, 1),
                'profession': 'Software Engineer',
                'relationship_to_head': 'SELF',
                'phone_number': '+919876543210'
            },
            {
                "full_name": "Zainab Demo",
                "is_head_of_family": False,
                "gender": "FEMALE",
                "marital_status": "MARRIED",
                "dob": date(1985, 6, 15),
                "profession": "Teacher",
                "relationship_to_head": "SPOUSE"
            }
        ]
    },
    {
        "membership_id": "DEMO-002",
        "address": "45 Market Road, Demo City",
        "economic_status": "ZAKAT_ELIGIBLE",
        "members": [
            {
                "full_name": "Ahmed Worker",
                "is_head_of_family": True,
                "gender": "MALE",
                "marital_status": "MARRIED",
                "dob": date(1975, 3, 10),
                "profession": "Daily Wage",
                "relationship_to_head": "SELF"
            },
            {
                "full_name": "Fatima Worker",
                "is_head_of_family": False,
                "gender": "FEMALE",
                "marital_status": "MARRIED",
                "dob": date(1978, 8, 20),
                "profession": "Housewife",
                "relationship_to_head": "SPOUSE"
            }
        ]
    }
]


class Command(BaseCommand):
    help = 'Sets up a demo mosque platform with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Setting up demo platform...')
        
        with transaction.atomic():
            # Create or get demo mosque
            demo_mosque, created = Mosque.objects.get_or_create(
                name='Demo Masjid',
                defaults={
                    'owner_email': 'demo@digitaljamath.com',
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS('Created demo mosque'))
            else:
                self.stdout.write('Demo mosque already exists')
            
            # --- DATA WIPE START ---
            self.stdout.write(self.style.WARNING("Wiping existing demo data..."))
            
            # Finance
            from apps.jamath.models import JournalEntry, Ledger
            JournalEntry.objects.filter(mosque=demo_mosque).delete()
            
            # Welfare
            from apps.welfare.models import GrantApplication, Volunteer
            GrantApplication.objects.filter(mosque=demo_mosque).delete()
            Volunteer.objects.filter(mosque=demo_mosque).delete()

            # Surveys
            from apps.jamath.models import Survey, SurveyResponse
            SurveyResponse.objects.filter(survey__mosque=demo_mosque).delete()
            Survey.objects.filter(mosque=demo_mosque).delete()

            # Member Data (Households cascade delete Members)
            Household.objects.filter(mosque=demo_mosque).delete()
            
            # Announcements
            Announcement.objects.filter(mosque=demo_mosque).delete()
            
            self.stdout.write(self.style.SUCCESS("Demo data wiped successfully."))
            # --- DATA WIPE END ---
            
            # Create demo user
            User = get_user_model()
            demo_user, user_created = User.objects.get_or_create(
                username='demo@digitaljamath.com',
                defaults={
                    'email': 'demo@digitaljamath.com',
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            demo_user.set_password('password123')
            demo_user.save()
            
            from apps.jamath.models import StaffRole, StaffMember
            admin_role, _ = StaffRole.objects.get_or_create(
                mosque=demo_mosque,
                name='Admin',
                defaults={'permissions': {'census': 'admin', 'finance': 'admin', 'welfare': 'admin', 'settings': 'admin'}}
            )
            StaffMember.objects.get_or_create(
                user=demo_user, mosque=demo_mosque,
                defaults={'role': admin_role, 'designation': 'Administrator'}
            )

            self.stdout.write(self.style.SUCCESS(f'Demo user ready: demo@digitaljamath.com / password123'))
            
            # Create membership config
            MembershipConfig.objects.get_or_create(
                mosque=demo_mosque,
                defaults={
                    'cycle': 'ANNUAL',
                    'minimum_fee': Decimal('1200.00'),
                    'currency': 'INR',
                    'membership_id_prefix': 'DEMO-',
                    'is_active': True,
                }
            )
            
            # Ensure canonical demo household exists and is correct
            demo_hh, hh_created = Household.objects.get_or_create(
                mosque=demo_mosque,
                membership_id='DEMO-001',
                defaults={
                    'address': 'Demo Masjid Campus, Bangalore',
                    'economic_status': Household.EconomicStatus.AAM,
                    'housing_status': Household.HousingStatus.OWN,
                    'phone_number': '+919876543210',
                    'is_verified': True,
                }
            )
            if not hh_created:
                demo_hh.phone_number = '+919876543210'
                demo_hh.is_verified = True
                demo_hh.save()

            demo_member, member_created = Member.objects.get_or_create(
                mosque=demo_mosque,
                household=demo_hh,
                is_head_of_family=True,
                defaults={
                    'full_name': 'Ahmed Khan',
                    'relationship_to_head': Member.Relationship.SELF,
                    'gender': Member.Gender.MALE,
                    'is_approved': True,
                }
            )

            if Household.objects.filter(mosque=demo_mosque).count() < 5:
                for i, hh_data in enumerate(sample_households):
                    if i == 0: continue
                    members_data = hh_data.pop('members')
                    household = Household.objects.create(mosque=demo_mosque, **hh_data)
                    for member_data in members_data:
                        Member.objects.create(mosque=demo_mosque, household=household, is_approved=True, **member_data)
            
            announcements = [
                {'title': 'Jummah Prayer Time Change', 'content': 'Starting next week, Jummah prayers will be at 1:30 PM instead of 1:00 PM.'},
                {'title': 'Ramadan Preparation Meeting', 'content': 'All committee members are requested to attend the Ramadan planning meeting on Saturday at 6 PM.'},
                {'title': 'Quran Classes Registration Open', 'content': 'Registration for new Quran classes for children aged 5-12 is now open. Contact the office for details.'},
            ]
            
            if Announcement.objects.filter(mosque=demo_mosque).count() == 0:
                for ann in announcements:
                    Announcement.objects.create(mosque=demo_mosque, **ann)
                    self.stdout.write(f'  Created announcement: {ann["title"]}')

            self.stdout.write(self.style.SUCCESS(f'''
    Demo setup complete!
    ----------------------
    Password: password123
    Username: demo@digitaljamath.com
            '''))
