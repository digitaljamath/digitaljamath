"""
Management command to set up a demo tenant with sample data.
Usage: python manage.py setup_demo
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connection
from apps.shared.models import Client, Domain
from apps.jamath.models import Household, Member, MembershipConfig, Announcement
from decimal import Decimal
import random
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
    help = 'Sets up a demo tenant with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Setting up demo tenant...')
        
        # Create or get demo tenant
        demo_client, created = Client.objects.get_or_create(
            schema_name='demo',
            defaults={
                'name': 'Demo Masjid',
            }
        )

        
        if created:
            self.stdout.write(self.style.SUCCESS('Created demo tenant'))
        else:
            self.stdout.write('Demo tenant already exists')
        
        
        # Create domain
        env_domain = os.environ.get('DOMAIN_NAME', 'localhost')
        demo_domain_name = f'demo.{env_domain}'

        Domain.objects.get_or_create(
            domain=demo_domain_name,
            defaults={
                'tenant': demo_client,
                'is_primary': True,
            }
        )
        
        # Switch to demo schema
        connection.set_tenant(demo_client)
        
        # Create demo user
        User = get_user_model()
        demo_user, user_created = User.objects.get_or_create(
            username='admin@demo.com',
            defaults={
                'email': 'admin@demo.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        demo_user.set_password('password123')
        demo_user.save()
        self.stdout.write(self.style.SUCCESS(f'Demo user ready: admin@demo.com / password123'))
        
        # Create membership config
        MembershipConfig.objects.get_or_create(
            defaults={
                'cycle': 'ANNUAL',
                'minimum_fee': Decimal('1200.00'),
                'currency': 'INR',
                'membership_id_prefix': 'DEMO-',
                'is_active': True,
            }
        )
        
        # ... (rest of the data creation remains the same)

        # Create households if not enough exist
        if Household.objects.count() < 3:
            for i, hh_data in enumerate(sample_households):
                members_data = hh_data.pop('members')
                # Set phone number for the first household to match demo login
                if i == 0:
                    hh_data['phone_number'] = '+919876543210'
                    hh_data['is_verified'] = True
                
                household = Household.objects.create(**hh_data)
                
                for j, member_data in enumerate(members_data):
                    # Add phone number to the first member as well (in custom_data since field doesn't exist)
                    if i == 0 and j == 0:
                        if 'custom_data' not in member_data:
                            member_data['custom_data'] = {}
                        member_data['custom_data']['phone'] = '+919876543210'
                        member_data['full_name'] = "Demo Head (9876543210)"
                    
                    Member.objects.create(household=household, is_approved=True, **member_data)
                
                self.stdout.write(f'  Created household: {household.membership_id}')
        
        # Create sample announcements
        announcements = [
            {'title': 'Jummah Prayer Time Change', 'content': 'Starting next week, Jummah prayers will be at 1:30 PM instead of 1:00 PM.'},
            {'title': 'Ramadan Preparation Meeting', 'content': 'All committee members are requested to attend the Ramadan planning meeting on Saturday at 6 PM.'},
            {'title': 'Quran Classes Registration Open', 'content': 'Registration for new Quran classes for children aged 5-12 is now open. Contact the office for details.'},
        ]
        
        if Announcement.objects.count() == 0:
            for ann in announcements:
                Announcement.objects.create(**ann)
                self.stdout.write(f'  Created announcement: {ann["title"]}')

        
        self.stdout.write(self.style.SUCCESS(f'''
Demo setup complete!
----------------------
URL: {'http://' + demo_domain_name if env_domain == 'localhost' else 'https://' + demo_domain_name}
Password: password123
Username: admin@demo.com

Households: {Household.objects.count()}
Members: {Member.objects.count()}
Announcements: {Announcement.objects.count()}
        '''))
