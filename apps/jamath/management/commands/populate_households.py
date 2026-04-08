import random
from django.core.management.base import BaseCommand
from apps.jamath.models import Household, Member
from apps.shared.models import Mosque

class Command(BaseCommand):
    help = 'Populates the database with 10 demo households'

    def add_arguments(self, parser):
        parser.add_argument('--mosque', type=int, required=True, help='ID of the Mosque to populate data in')

    def handle(self, *args, **kwargs):
        mosque_id = kwargs.get('mosque')
        try:
            mosque = Mosque.objects.get(id=mosque_id)
            self.stdout.write(f'Populating data for Mosque: {mosque.name}')
            self._populate(mosque)
        except Mosque.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Mosque with ID '{mosque_id}' not found!"))
            return
            
    def _populate(self, mosque):
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
            if Household.objects.filter(phone_number=phone, mosque=mosque).exists():
                self.stdout.write(self.style.WARNING(f'Household with phone {phone} already exists in this Mosque. Skipping.'))
                continue
                
            # Create Household
            household = Household.objects.create(
                mosque=mosque,
                phone_number=phone,
                address=f"House No. {random.randint(1, 999)}, Jamath Mohalla",
                economic_status=random.choice(['ZAKAT_ELIGIBLE', 'AAM']),
                housing_status=random.choice(['OWN', 'RENTED']),
                is_verified=True
            )
            
            # Create Head
            Member.objects.create(
                mosque=mosque,
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
                mosque=mosque,
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
