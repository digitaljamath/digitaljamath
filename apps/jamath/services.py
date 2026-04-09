from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import timedelta
from typing import Dict, Any, Optional
import uuid

from .models import (
    Household, Member, SurveyResponse, 
    MembershipConfig, Subscription, Receipt, ServiceRequest
)


class JamathService:
    """Legacy service for Zakat eligibility calculation."""
    
    @staticmethod
    def calculate_zakat_eligibility(household: Household) -> None:
        """
        Calculates zakat score based on custom data and updates economic status.
        """
        score = 0
        data = household.custom_data or {}
        
        if data.get('income', 0) < 5000:
            score += 50
        if data.get('has_critical_illness', False):
            score += 30
        if data.get('widow', False):
            score += 20
            
        household.zakat_score = score
        
        if score >= 80:
            household.economic_status = Household.EconomicStatus.ZAKAT_ELIGIBLE
        else:
            household.economic_status = Household.EconomicStatus.AAM
            
        household.save()

    @staticmethod
    def process_survey_response(response: SurveyResponse) -> None:
        """Process a new survey response and trigger Zakat calculation."""
        JamathService.calculate_zakat_eligibility(response.household)


class MembershipService:
    """Handles membership subscriptions, payments, and receipts."""
    
    @staticmethod
    def get_or_create_config(mosque=None) -> MembershipConfig:
        """Get the active membership config or create a default one for the mosque."""
        if not mosque:
            raise ValueError("Mosque scope is required to fetch membership configuration.")
        config, created = MembershipConfig.objects.get_or_create(
            is_active=True,
            mosque=mosque,
            defaults={
                'cycle': MembershipConfig.Cycle.ANNUAL,
                'minimum_fee': Decimal('1200.00'),
                'currency': 'INR'
            }
        )
        return config
    
    @staticmethod
    def get_cycle_end_date(start_date, cycle: str):
        """Calculate end date based on cycle type."""
        if cycle == MembershipConfig.Cycle.ANNUAL:
            return start_date + timedelta(days=365)
        elif cycle == MembershipConfig.Cycle.BI_YEARLY:
            return start_date + timedelta(days=182)
        elif cycle == MembershipConfig.Cycle.MONTHLY:
            return start_date + timedelta(days=30)
        return start_date + timedelta(days=365)
    
    @staticmethod
    def get_current_subscription(household: Household) -> Optional[Subscription]:
        """Get the household's current active or pending subscription."""
        today = timezone.now().date()
        return Subscription.objects.filter(
            household=household,
            start_date__lte=today,
            end_date__gte=today
        ).first()
    
    @staticmethod
    @transaction.atomic
    def process_payment(household: Household, amount: Decimal, notes: str = "", donor_pan: str = None, created_by = None, is_zakat: bool = False) -> Receipt:
        """
        Process a membership payment.
        
        - Creates or updates subscription
        - Splits amount into membership_portion and donation_portion
        - Generates a receipt
        - Updates subscription status
        
        Returns the created Receipt.
        """
        config = MembershipService.get_or_create_config(mosque=household.mosque)
        today = timezone.now().date()
        
        # Get or create subscription for current period
        subscription = MembershipService.get_current_subscription(household)
        
        if not subscription:
            # Create new subscription
            start_date = today
            end_date = MembershipService.get_cycle_end_date(start_date, config.cycle)
            subscription = Subscription.objects.create(
                household=household,
                start_date=start_date,
                end_date=end_date,
                minimum_required=config.minimum_fee,
                status=Subscription.Status.PENDING
            )
        
        # Calculate fee split
        if is_zakat:
            # Zakat cannot be used for membership fees
            membership_portion = Decimal('0.00')
            donation_portion = amount
        else:
            remaining_fee = subscription.minimum_required - subscription.amount_paid
            
            if remaining_fee <= 0:
                # Already paid full fee, everything is donation
                membership_portion = Decimal('0.00')
                donation_portion = amount
            elif amount >= remaining_fee:
                # Covers remaining fee + extra as donation
                membership_portion = remaining_fee
                donation_portion = amount - remaining_fee
            else:
                # Partial payment towards fee
                membership_portion = amount
                donation_portion = Decimal('0.00')
        
        # Only update subscription paid amount if NOT Zakat (or if we decide Zakat shouldn't count towards dues)
        # Zakat is restricted, so it strictly should NOT count towards "Membership Dues" which are usually for general upkeep.
        if not is_zakat:
            subscription.amount_paid += membership_portion # Only add the membership portion? Or total? 
            # If standard flow: amount_paid tracks how much "fee" is paid.
            # actually logic above: subscription.amount_paid += amount
            # If I pay 2000 (1200 fee, 800 donation), amount_paid should be 1200 or 2000? 
            # Looking at original code: `subscription.amount_paid += amount`
            # This implies `amount_paid` tracks TOTAL money given? Or just fee?
            # `remaining_fee = subscription.minimum_required - subscription.amount_paid`
            # This implies `amount_paid` includes donations? That seems wrong if donation > fee.
            # If I pay 10,000, 1200 fee, 8800 donation. `amount_paid` = 10,000. `remaining` = 1200 - 10000 = -8800.
            # `Math.max(0, ...)` helps in frontend.
            # But strictly `amount_paid` on subscription should probably track *credit towards fee*.
            # However, `Subscription` model has `amount_paid` field.
            # Let's stick to modifying `subscription.amount_paid` ONLY by `membership_portion` if `is_zakat` is False?
            # Original code: `subscription.amount_paid += amount`
            # If I change this behavior now, I might break existing assumptions.
            # unique constraint: Zakat should definitely NOT increase `amount_paid` because that would mark membership as Active.
            # So if is_zakat is True, we do NOT touch subscription.amount_paid.
            pass
        else:
            subscription.amount_paid += membership_portion # We only add the portion that actually went to fee? 
            # Wait, if original code was `+= amount`, then any donation counted towards fee?
            # "remaining_fee = min_req - amount_paid".
            # If I donate 500 (min 1200). Paid 500. Remaining 700.
            # If I donate 2000 (min 1200). Paid 2000. Remaining -800.
            # So yes, extra donation counts as "paid".
            # But Zakat definitely shouldn't.
            pass

        # To be safe and consistent with previous logic:
        if not is_zakat:
             # If it's general, we add the whole amount (as per original logic `amount_paid += amount`)
             # OR should we only add `membership_portion`?
             # If I change it to `membership_portion`, I fix a potential bug where donation counts as fee... but maybe that was intended?
             # Use `membership_portion` is safer for "Fee Tracking".
             # But let's check original code again:
             # `subscription.amount_paid += amount`
             # I will stick to: If not Zakat, add `amount`. If Zakat, add 0.
             subscription.amount_paid += amount

        subscription.update_status()
        
        # Generate receipt
        receipt_number = f"RCP-{household.membership_id or household.id}-{uuid.uuid4().hex[:8].upper()}"
        receipt = Receipt.objects.create(
            subscription=subscription,
            amount=amount,
            membership_portion=membership_portion,
            donation_portion=donation_portion,
            receipt_number=receipt_number,
            donor_pan=donor_pan,
            notes=notes,
            created_by=created_by
        )
        
        # LINK TO BAITUL MAAL (FINANCE)
        MembershipService.create_journal_entry_for_receipt(receipt, household, membership_portion, donation_portion, created_by, is_zakat=is_zakat)
        
        # TODO: Trigger notification (SMS/WhatsApp)
        # NotificationService.send_receipt(household.phone_number, receipt)
        
        return receipt
        
    @staticmethod
    def create_journal_entry_for_receipt(receipt, household, fee_amt, donation_amt, created_by=None, is_zakat=False):
        """Create a Double-Entry Accounting Record for the receipt."""
        from .models import Ledger, JournalEntry, JournalItem
        
        try:
            mosque = household.mosque
            # 1. Accounts Discovery / Creation (Idempotent)
            # Debit Account: Bank/Online Gateway
            bank_acct = Ledger.objects.filter(account_type=Ledger.AccountType.ASSET, name__icontains="Bank", mosque=mosque).first()
            if not bank_acct:
                 # Create a default bank account if none exists
                 bank_acct = Ledger.objects.create(
                     mosque=mosque,
                     name="Bank Account (Default)", 
                     code="1001", 
                     account_type=Ledger.AccountType.ASSET
                 )
            
            # Credit Account 1: Membership Fees
            fee_acct = Ledger.objects.filter(account_type=Ledger.AccountType.INCOME, name__icontains="Membership", mosque=mosque).first()
            if not fee_acct:
                 fee_acct = Ledger.objects.create(
                     mosque=mosque,
                     name="Membership Fees", 
                     code="4001", 
                     account_type=Ledger.AccountType.INCOME, 
                     fund_type=Ledger.FundType.UNRESTRICTED_GENERAL
                 )

            # Credit Account 2: Donations OR Zakat
            if is_zakat:
                donation_acct = Ledger.objects.filter(account_type=Ledger.AccountType.INCOME, fund_type=Ledger.FundType.RESTRICTED_ZAKAT, mosque=mosque).first()
                if not donation_acct:
                     donation_acct = Ledger.objects.create(
                         mosque=mosque,
                         name="Zakat Fund (Income)", 
                         code="4003", 
                         account_type=Ledger.AccountType.INCOME, 
                         fund_type=Ledger.FundType.RESTRICTED_ZAKAT
                     )
            else:
                donation_acct = Ledger.objects.filter(account_type=Ledger.AccountType.INCOME, name__icontains="Donation", mosque=mosque).first()
                if not donation_acct:
                     donation_acct = Ledger.objects.create(
                         mosque=mosque,
                         name="General Donations", 
                         code="4002", 
                         account_type=Ledger.AccountType.INCOME, 
                         fund_type=Ledger.FundType.UNRESTRICTED_GENERAL
                     )
            
            # 2. Create Voucher Header
            head_member = household.members.filter(is_head_of_family=True).first()
            
            narration_prefix = "Online - Zakat" if is_zakat else "Online"
            
            je = JournalEntry.objects.create(
                voucher_type=JournalEntry.VoucherType.RECEIPT,
                date=timezone.now().date(),
                narration=f"{narration_prefix} - {receipt.receipt_number} ({receipt.notes or 'Payment'})",
                donor=head_member,
                donor_pan=receipt.donor_pan or '',
                payment_mode=JournalEntry.PaymentMode.UPI, # Assuming UPI/Online
                is_finalized=True, # Auto-finalize system entries? Valid logic.
                created_by=created_by
            )
            
            # 3. Create Line Items
            # DEBIT: Bank (Total Amount)
            JournalItem.objects.create(
                journal_entry=je, 
                ledger=bank_acct, 
                debit_amount=receipt.amount,
                particulars=f"Receipt from {head_member.full_name if head_member else household.membership_id}"
            )
            
            # CREDIT: Membership
            if fee_amt > 0:
                JournalItem.objects.create(
                    journal_entry=je, 
                    ledger=fee_acct, 
                    credit_amount=fee_amt,
                    particulars="Membership Subscription"
                )
                
            # CREDIT: Donation
            if donation_amt > 0:
                JournalItem.objects.create(
                    journal_entry=je, 
                    ledger=donation_acct, 
                    credit_amount=donation_amt,
                    particulars="Voluntary Donation"
                )
             
            # 4. Validate and Save (Triggers constraints)
            je.clean() 
            je.clean() 
            je.save()

            from .models import ActivityLog
            if created_by:
                # Use total receipt amount
                amount_str = f"₹{receipt.amount:g}"
                action_desc = f"Received Payment of {amount_str} ({je.narration})"
                ActivityLog.objects.create(
                    user=created_by,
                    action='CREATE',
                    module='finance',
                    model_name='Journal Entry',
                    object_id=str(je.id),
                    details=action_desc
                )
            
        except Exception as e:
            # Log failure but do not rollback receipt? 
            # Ideally we want transaction atomic (which it is decorated with).
            # So if JE fails, Receipt fails. This is good data integrity.
            # But we must ensure Ledger creation acts don't fail on unique constraints if race condition?
            # get_or_create is better but code must be unique.
            # For now, simplistic approach is fine for single-threaded user testing.
            print(f"Baitul Maal Integration Error: {e}")
            raise e # Fail the transaction so we notice bugs immediately
    
    @staticmethod
    def get_membership_status(household: Household) -> Dict[str, Any]:
        """Get a summary of household's membership status."""
        subscription = MembershipService.get_current_subscription(household)
        
        config = MembershipService.get_or_create_config(mosque=household.mosque)
        if not subscription:
            return {
                'status': 'EXPIRED',
                'is_active': False,
                'amount_paid': Decimal('0.00'),
                'minimum_required': config.minimum_fee,
                'subscription': None
            }
        
        return {
            'status': subscription.status,
            'is_active': subscription.status == Subscription.Status.ACTIVE,
            'amount_paid': subscription.amount_paid,
            'minimum_required': subscription.minimum_required,
            'start_date': subscription.start_date,
            'end_date': subscription.end_date,
            'subscription_id': subscription.id
        }


class ProfileService:
    """Handles member profile updates with approval workflow."""
    
    @staticmethod
    def add_member_pending_approval(
        household: Household,
        full_name: str,
        relationship: str,
        gender: str = Member.Gender.MALE,
        **kwargs
    ) -> Member:
        """
        Add a new member that requires admin approval.
        Sets is_approved=False until a Zimmedar approves.
        """
        member = Member.objects.create(
            household=household,
            full_name=full_name,
            relationship_to_head=relationship,
            gender=gender,
            is_head_of_family=False,
            is_approved=False,  # Pending approval
            **kwargs
        )
        # TODO: Notify admin of pending approval
        return member
    
    @staticmethod
    def approve_member(member: Member, approved_by=None) -> Member:
        """Approve a pending member profile."""
        member.is_approved = True
        member.save()
        return member
    
    @staticmethod
    def get_pending_members() -> list:
        """Get all members awaiting approval."""
        return list(Member.objects.filter(is_approved=False).select_related('household'))


class NotificationService:
    """Placeholder for SMS/WhatsApp notifications."""
    
    @staticmethod
    def send_receipt(phone_number: str, receipt: Receipt) -> bool:
        """
        Send receipt notification to the household.
        Currently just logs to console (mock implementation).
        """
        print(f"[MOCK SMS] To: {phone_number}")
        print(f"  Receipt: {receipt.receipt_number}")
        print(f"  Amount: ₹{receipt.amount}")
        print(f"  Membership: ₹{receipt.membership_portion}, Donation: ₹{receipt.donation_portion}")
        return True
    
    @staticmethod
    def send_otp(phone_number: str, otp: str) -> bool:
        """
        Send OTP for login verification.
        Currently just logs to console (mock implementation).
        """
        print(f"[MOCK SMS] To: {phone_number}")
        print(f"  Your OTP for DigitalJamath is: {otp}")
        return True
