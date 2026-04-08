from django.core.management.base import BaseCommand
from apps.jamath.models import Ledger


class Command(BaseCommand):
    help = 'Seed the default Chart of Accounts for Mizan Ledger'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mosque_id',
            type=int,
            help='ID of the Mosque to seed the ledger for',
            default=None,
        )

    def handle(self, *args, **options):
        mosque_id = options.get('mosque_id')
        AT = Ledger.AccountType
        FT = Ledger.FundType

        # Define default Chart of Accounts
        chart = [
            # Assets (1xxx)
            {'code': '1000', 'name': 'Assets', 'type': AT.ASSET, 'fund': None, 'children': [
                {'code': '1001', 'name': 'Cash in Hand', 'type': AT.ASSET, 'fund': None},
                {'code': '1002', 'name': 'Bank Account - Primary', 'type': AT.ASSET, 'fund': None},
                {'code': '1003', 'name': 'Zakat Cash Account', 'type': AT.ASSET, 'fund': FT.RESTRICTED_ZAKAT},
                {'code': '1004', 'name': 'Sadaqah Cash Account', 'type': AT.ASSET, 'fund': FT.RESTRICTED_SADAQAH},
                {'code': '1010', 'name': 'Fixed Assets', 'type': AT.ASSET, 'fund': None},
            ]},
            
            # Liabilities (2xxx)
            {'code': '2000', 'name': 'Liabilities', 'type': AT.LIABILITY, 'fund': None, 'children': [
                {'code': '2001', 'name': 'Creditors', 'type': AT.LIABILITY, 'fund': None},
                {'code': '2002', 'name': 'Advance Received', 'type': AT.LIABILITY, 'fund': None},
            ]},
            
            # Income (3xxx)
            {'code': '3000', 'name': 'Income', 'type': AT.INCOME, 'fund': None, 'children': [
                {'code': '3001', 'name': 'Donation - General', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '3002', 'name': 'Donation - Zakat', 'type': AT.INCOME, 'fund': FT.RESTRICTED_ZAKAT},
                {'code': '3003', 'name': 'Donation - Sadaqah', 'type': AT.INCOME, 'fund': FT.RESTRICTED_SADAQAH},
                {'code': '3004', 'name': 'Donation - Construction', 'type': AT.INCOME, 'fund': FT.RESTRICTED_CONSTRUCTION},
                {'code': '3005', 'name': 'Membership Fees', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '3006', 'name': 'Interest/Profit Income', 'type': AT.INCOME, 'fund': FT.UNRESTRICTED_GENERAL},
            ]},
            
            # Expenses (4xxx)
            {'code': '4000', 'name': 'Expenses', 'type': AT.EXPENSE, 'fund': None, 'children': [
                {'code': '4001', 'name': 'Electricity', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4002', 'name': 'Water & Sewage', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4003', 'name': 'Repairs & Maintenance', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4004', 'name': 'Staff Salaries', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4005', 'name': 'Religious Activities', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4006', 'name': 'Zakat Distribution', 'type': AT.EXPENSE, 'fund': FT.RESTRICTED_ZAKAT},
                {'code': '4007', 'name': 'Sadaqah Distribution', 'type': AT.EXPENSE, 'fund': FT.RESTRICTED_SADAQAH},
                {'code': '4008', 'name': 'Construction Expenses', 'type': AT.EXPENSE, 'fund': FT.RESTRICTED_CONSTRUCTION},
                {'code': '4009', 'name': 'Office & Stationery', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '4010', 'name': 'Miscellaneous', 'type': AT.EXPENSE, 'fund': FT.UNRESTRICTED_GENERAL},
            ]},
            
            # Equity/Corpus (5xxx)
            {'code': '5000', 'name': 'Equity / Corpus', 'type': AT.EQUITY, 'fund': None, 'children': [
                {'code': '5001', 'name': 'Opening Balance', 'type': AT.EQUITY, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '5002', 'name': 'Zakat Corpus', 'type': AT.EQUITY, 'fund': FT.RESTRICTED_ZAKAT},
                {'code': '5003', 'name': 'General Corpus', 'type': AT.EQUITY, 'fund': FT.UNRESTRICTED_GENERAL},
                {'code': '5004', 'name': 'Construction Fund', 'type': AT.EQUITY, 'fund': FT.RESTRICTED_CONSTRUCTION},
            ]},
        ]

        created_count = 0
        skipped_count = 0

        for parent_data in chart:
            parent, created = Ledger.objects.get_or_create(
                code=parent_data['code'],
                mosque_id=mosque_id,
                defaults={
                    'name': parent_data['name'],
                    'account_type': parent_data['type'],
                    'fund_type': parent_data['fund'],
                    'is_system': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created: {parent.code} - {parent.name}")
            else:
                skipped_count += 1

            for child_data in parent_data.get('children', []):
                child, created = Ledger.objects.get_or_create(
                    code=child_data['code'],
                    mosque_id=mosque_id,
                    defaults={
                        'name': child_data['name'],
                        'account_type': child_data['type'],
                        'fund_type': child_data['fund'],
                        'parent': parent,
                        'is_system': True,
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(f"    Created: {child.code} - {child.name}")
                else:
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nChart of Accounts seeded: {created_count} created, {skipped_count} already existed.'
        ))
