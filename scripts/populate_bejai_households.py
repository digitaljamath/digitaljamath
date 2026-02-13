import random
import sys
import os
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digitaljamath.settings')
django.setup()

from django_tenants.utils import schema_context
from apps.jamath.models import Household, Member

def create_households():
    schema_name = 'bejai'
    print(f"Switching to schema: {schema_name}")
    
    first_names_male = ["Mohammed", "Ibrahim", "Ahmed", "Ali", "Umar", "Usman", "Abubakar", "Bilal", "Tariq", "Salahuddin", "Yusuf", "Zaid", "Hassan", "Hussain", "Mustafa"]
    first_names_female = ["Fatima", "Ayesha", "Zainab", "Mariam", "Khadija", "Ruqayyah", "Asma", "Sumayyah", "Hafsa", "Noor", "Sara", "Hiba", "Safiya", "Amina", "Salma"]
    last_names = ["Khan", "Ahmed", "Shaikh", "Syed", "Pathan", "Baig", "Siddiqui", "Qureshi", "Ansari", "Mirza"]
    cities = ["Mangalore", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Surat"]
    professions = ["Engineer", "Doctor", "Teacher", "Business", "Accountant", "Driver", "Clerk", "Sales", "Manager", "Technician"]
    
    with schema_context(schema_name):
        # Fancy phone numbers
        fancy_numbers = [
            "1111111111", "2222222222", "3333333333", "4444444444", "5555555555",
            "6666666666", "7777777777", "8888888888", "9999999999", "1010101010"
        ]
        
        # Family configurations
        family_sizes = [3, 3, 3, 5, 5, 5, 6, 7, 8, 9]
        random.shuffle(family_sizes)
        
        count = 0
        for i, phone in enumerate(fancy_numbers):
            if Household.objects.filter(phone_number=phone).exists():
                print(f"Skipping {phone} - already exists")
                continue
                
            family_size = family_sizes[i]
            print(f"Creating household {i+1} with {family_size} members (Phone: {phone})...")
            
            # Create Household
            household = Household.objects.create(
                phone_number=phone,
                address=f"Flat {random.randint(101, 999)}, {random.choice(cities)}",
                economic_status=random.choice(['ZAKAT_ELIGIBLE', 'AAM']),
                housing_status=random.choice(['OWN', 'RENTED']),
                is_verified=True,
                custom_data={"village": random.choice(cities), "notes": "Auto-generated fancy household"}
            )
            
            # 1. Create Head (Male)
            last_name = random.choice(last_names)
            head_name = f"{random.choice(first_names_male)} {last_name}"
            head = Member.objects.create(
                household=household,
                full_name=head_name,
                is_head_of_family=True,
                gender='MALE',
                marital_status='MARRIED',
                relationship_to_head='SELF',
                is_approved=True,
                is_alive=True,
                # dob roughly 30-60 years ago
                dob=f"{random.randint(1965, 1995)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                profession=random.choice(professions),
                education="Graduate",
                is_employed=True,
                monthly_income=random.randint(20000, 100000)
            )
            
            remaining_members = family_size - 1
            
            # 2. Create Spouse
            if remaining_members > 0:
                Member.objects.create(
                    household=household,
                    full_name=f"{random.choice(first_names_female)} {last_name}",
                    is_head_of_family=False,
                    gender='FEMALE',
                    marital_status='MARRIED',
                    relationship_to_head='SPOUSE',
                    is_approved=True,
                    is_alive=True,
                    dob=f"{random.randint(1970, 2000)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                    profession="Homemaker",
                    education="12th Pass"
                )
                remaining_members -= 1
                
            # 3. Create Children/Parents
            while remaining_members > 0:
                gender = random.choice(['MALE', 'FEMALE'])
                if gender == 'MALE':
                    name = f"{random.choice(first_names_male)} {last_name}"
                    rel = 'SON'
                else:
                    name = f"{random.choice(first_names_female)} {last_name}"
                    rel = 'DAUGHTER'
                    
                Member.objects.create(
                    household=household,
                    full_name=name,
                    gender=gender,
                    marital_status='SINGLE',
                    relationship_to_head=rel,
                    is_approved=True,
                    is_alive=True,
                    dob=f"{random.randint(2005, 2023)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                    education="Student"
                )
                remaining_members -= 1
                
            count += 1
            
        print(f"Successfully created {count} households.")

if __name__ == "__main__":
    create_households()
