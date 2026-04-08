from django.core.management.base import BaseCommand
from apps.jamath.models import Ledger
from apps.shared.models import Mosque


class Command(BaseCommand):
    help = 'Seed the default Chart of Accounts for a specific Mosque'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mosque',
            type=int,
            required=True,
            help='ID of the Mosque'
        )

    def handle(self, *args, **options):
        mosque_id = options['mosque']
        
        try:
            mosque = Mosque.objects.get(id=mosque_id)
            self.stdout.write(f"Seeding ledgers for: {mosque.name} (ID: {mosque_id})")
        except Mosque.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Mosque with ID '{mosque_id}' not found!"))
            return

        AT = Ledger.AccountType
        FT = Ledger.FundType

        # Essential ledgers for simplified finance entry
        ledgers_to_create = [
            # Assets
            {'code': '1001', 'name': 'Cash in Hand', 'type': AT.ASSET, 'fund': None},
            {'code': '1002', 'name': 'Bank Account - Primary', 'type': AT.ASSET, 'fund': None},
            
            # Income
            {'code': '3001', 'name': 'Donation - General', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '3002', 'name': 'Donation - Zakat', 'type': AT.INCOME, 'fund': FT.RESTRICTED_ZAKAT},
            {'code': '3005', 'name': 'Membership Fees', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
            
            # Expenses
            {'code': '4001', 'name': 'Electricity', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4002', 'name': 'Water & Sewage', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4003', 'name': 'Repairs & Maintenance', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            {'code': '4006', 'name': 'Zakat Distribution', 'type': AT.EXPENSE, 'fund': FT.RESTRICTED_ZAKAT},
            {'code': '4010', 'name': 'Miscellaneous', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
        ]

        created_count = 0
        skipped_count = 0

        for ledger_data in ledgers_to_create:
            ledger, created = Ledger.objects.get_or_create(
                mosque=mosque,
                code=ledger_data['code'],
                defaults={
                    'name': ledger_data['name'],
                    'account_type': ledger_data['type'],
                    'fund_type': ledger_data['fund'],
                    'is_system': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✓ Created: {ledger.code} - {ledger.name}")
            else:
                skipped_count += 1
                self.stdout.write(f"  - Exists: {ledger.code} - {ledger.name}")

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Done! {created_count} created, {skipped_count} already existed.'
        ))
