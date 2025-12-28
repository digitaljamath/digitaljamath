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
        Domain.objects.get_or_create(
            domain='demo.localhost',
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
            username='demo',
            defaults={
                'email': 'demo@example.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if user_created:
            demo_user.set_password('demo123')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS('Created demo user (demo/demo123)'))
        
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
        
        # Sample households data
        sample_households = [
            {
                'address': 'No. 45, Tannery Road, Frazer Town, Bangalore',
                'economic_status': 'AAM',
                'housing_status': 'OWN',
                'phone_number': '+919876543210',
                'members': [
                    {'full_name': 'Mohammed Ahmed Khan', 'gender': 'MALE', 'is_head_of_family': True, 'relationship_to_head': 'SELF', 'marital_status': 'MARRIED', 'profession': 'Software Engineer', 'education': 'B.Tech', 'monthly_income': 75000},
                    {'full_name': 'Fatima Khan', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'SPOUSE', 'marital_status': 'MARRIED', 'profession': 'Homemaker', 'education': 'B.A.'},
                    {'full_name': 'Yusuf Khan', 'gender': 'MALE', 'is_head_of_family': False, 'relationship_to_head': 'SON', 'marital_status': 'SINGLE', 'education': '10th Standard'},
                ]
            },
            {
                'address': 'No. 12, Mosque Road, Shivajinagar, Bangalore',
                'economic_status': 'ZAKAT_ELIGIBLE',
                'housing_status': 'RENTED',
                'phone_number': '+919876543211',
                'members': [
                    {'full_name': 'Abdul Rashid', 'gender': 'MALE', 'is_head_of_family': True, 'relationship_to_head': 'SELF', 'marital_status': 'MARRIED', 'profession': 'Auto Driver', 'education': '8th Standard', 'monthly_income': 15000, 'requirements': 'Needs medical support for chronic illness'},
                    {'full_name': 'Amina Begum', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'SPOUSE', 'marital_status': 'MARRIED', 'skills': 'Tailoring, Embroidery'},
                ]
            },
            {
                'address': 'No. 78, Commercial Street, Richmond Town, Bangalore',
                'economic_status': 'AAM',
                'housing_status': 'OWN',
                'phone_number': '+919876543212',
                'members': [
                    {'full_name': 'Imran Ali', 'gender': 'MALE', 'is_head_of_family': True, 'relationship_to_head': 'SELF', 'marital_status': 'MARRIED', 'profession': 'Businessman', 'education': 'M.Com', 'monthly_income': 150000},
                    {'full_name': 'Sana Ali', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'SPOUSE', 'marital_status': 'MARRIED', 'profession': 'Doctor', 'education': 'MBBS', 'monthly_income': 80000},
                    {'full_name': 'Zara Ali', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'DAUGHTER', 'marital_status': 'SINGLE', 'education': '12th Standard'},
                    {'full_name': 'Omar Ali', 'gender': 'MALE', 'is_head_of_family': False, 'relationship_to_head': 'SON', 'marital_status': 'SINGLE', 'education': '8th Standard'},
                ]
            },
            {
                'address': 'No. 34, Johnson Market, Bangalore',
                'economic_status': 'ZAKAT_ELIGIBLE',
                'housing_status': 'RENTED',
                'phone_number': '+919876543213',
                'members': [
                    {'full_name': 'Mariam Bi', 'gender': 'FEMALE', 'is_head_of_family': True, 'relationship_to_head': 'SELF', 'marital_status': 'WIDOWED', 'skills': 'Cooking', 'requirements': 'Widow with two children, needs education support'},
                    {'full_name': 'Aisha', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'DAUGHTER', 'marital_status': 'SINGLE', 'education': '6th Standard'},
                    {'full_name': 'Ibrahim', 'gender': 'MALE', 'is_head_of_family': False, 'relationship_to_head': 'SON', 'marital_status': 'SINGLE', 'education': '4th Standard'},
                ]
            },
            {
                'address': 'No. 56, Museum Road, Cubbon Park, Bangalore',
                'economic_status': 'AAM',
                'housing_status': 'FAMILY',
                'phone_number': '+919876543214',
                'members': [
                    {'full_name': 'Dr. Farhan Siddiqui', 'gender': 'MALE', 'is_head_of_family': True, 'relationship_to_head': 'SELF', 'marital_status': 'MARRIED', 'profession': 'Professor', 'education': 'Ph.D', 'monthly_income': 120000},
                    {'full_name': 'Nadia Siddiqui', 'gender': 'FEMALE', 'is_head_of_family': False, 'relationship_to_head': 'SPOUSE', 'marital_status': 'MARRIED', 'profession': 'Lecturer', 'education': 'M.A.', 'monthly_income': 60000},
                ]
            },
        ]
        
        # Create households if not enough exist
        existing_count = Household.objects.count()
        if existing_count < 5:
            for hh_data in sample_households:
                members_data = hh_data.pop('members')
                household = Household.objects.create(**hh_data)
                
                for member_data in members_data:
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
URL: http://demo.localhost:3000
Username: demo
Password: demo123

Households: {Household.objects.count()}
Members: {Member.objects.count()}
Announcements: {Announcement.objects.count()}
        '''))
