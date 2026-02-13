import random
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context
from apps.jamath.models import Household, Member

class Command(BaseCommand):
    help = 'Populates the database with 10 demo households'

    def add_arguments(self, parser):
        parser.add_argument('--schema', type=str, help='Schema to populate data in')

    def handle(self, *args, **kwargs):
        schema = kwargs.get('schema')
        if schema:
            self.stdout.write(f'Switching to schema: {schema}')
            with schema_context(schema):
                self._populate()
        else:
            self.stdout.write('No schema specified, running in current context (likely public). Use --schema to specify.')
            self._populate()
            
    def _populate(self):
        self.stdout.write('Creating demo households...')
        
        # Data for 10 households
        data = [
            ("1111111111", "Mohammed Yusuf", "Fatima"),
            ("2222222222", "Ibrahim Khalil", "Ayesha"),
            ("3333333333", "Abdullah Omar", "Zainab"),
            ("4444444444", "Ali Hassan", "Mariam"),
            ("5555555555", "Umar Farooq", "Khadija"),
            ("6666666666", "Usman Ghani", "Ruqayyah"),
            ("7777777777", "Abubakar Siddiq", "Asma"),
            ("8888888888", "Bilal Ahmed", "Sumayyah"),
            ("9999999999", "Tariq Jameel", "Hafsa"),
            ("1234567890", "Salahuddin Ayyubi", "Noor"),
        ]
        
        count = 0
        for phone, head_name, spouse_name in data:
            # Check if exists
            if Household.objects.filter(phone_number=phone).exists():
                self.stdout.write(self.style.WARNING(f'Household with phone {phone} already exists. Skipping.'))
                continue
                
            # Create Household
            household = Household.objects.create(
                phone_number=phone,
                address=f"House No. {random.randint(1, 999)}, Jamath Mohalla",
                economic_status=random.choice(['ZAKAT_ELIGIBLE', 'AAM']),
                housing_status=random.choice(['OWN', 'RENTED']),
                is_verified=True
            )
            
            # Create Head
            Member.objects.create(
                household=household,
                full_name=head_name,
                is_head_of_family=True,
                gender='MALE',
                marital_status='MARRIED',
                relationship_to_head='SELF',
                is_approved=True,
                is_alive=True
            )
            
            # Create Spouse
            Member.objects.create(
                household=household,
                full_name=spouse_name,
                is_head_of_family=False,
                gender='FEMALE',
                marital_status='MARRIED',
                relationship_to_head='SPOUSE',
                is_approved=True,
                is_alive=True
            )
            
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Successfully created {count} households.'))
