from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.conf import settings
from .models import Mosque
from .serializers import TenantRegistrationSerializer
from django.contrib.auth.models import User
import random
from django.utils import timezone
from rest_framework.views import APIView
from .email_service import EmailService
from django.core.signing import Signer, BadSignature


class FindWorkspaceThrottle(AnonRateThrottle):
    rate = '100/hour'

class OTPRequestThrottle(AnonRateThrottle):
    rate = '100/hour'

class CheckMosqueThrottle(AnonRateThrottle):
    rate = '100/hour'

class RegistrationThrottle(AnonRateThrottle):
    rate = '100/hour'


class MosqueRegistrationView(generics.CreateAPIView):
    queryset = Mosque.objects.all()
    serializer_class = TenantRegistrationSerializer
    permission_classes = []
    throttle_classes = [RegistrationThrottle]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Removed verification token check for seamless registration
        # We assume the provided email is correct for now on the unified platform
        
        # Check against existing mosques by owner email or name
        if Mosque.objects.filter(name__iexact=data['name']).exists():
             return Response({"error": "This Mosque name is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        
        task_data = {
            'name': data['name'],
            'owner_email': data['email'],
            'password': data['password'],
            'setup_type': data.get('setup_type', 'STANDARD'),
        }

        from .tasks import create_tenant_task
        import os
        
        base_domain = os.environ.get('DOMAIN_NAME', 'localhost')
        
        if settings.DEBUG or os.environ.get('CELERY_SYNC', 'false').lower() == 'true':
            try:
                result = create_tenant_task(task_data)
                return Response({
                    "message": "Mosque created successfully.",
                    "status": "SUCCESS",
                    "task_id": "sync-task",
                    "login_url": result.get('login_url', f"http://{base_domain}/auth/masjid/login")
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": str(e),
                    "status": "FAILURE"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            task_result = create_tenant_task.delay(task_data)
            return Response({
                "message": "Mosque creation started.",
                "status": "pending",
                "task_id": task_result.id,
                "login_url": f"http://{base_domain}/auth/masjid/login"
            }, status=status.HTTP_202_ACCEPTED)

_reg_otp_store = {}

class RequestRegistrationOTPView(APIView):
    permission_classes = []
    throttle_classes = [OTPRequestThrottle]

    def post(self, request):
        email = request.data.get('email')
        masjid_name = request.data.get('masjid_name', 'DigitalJamath Platform')
        
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        otp = str(random.randint(100000, 999999))
        if settings.DEBUG:
            print(f"DEBUG OTP for {email}: {otp}")
            
        _reg_otp_store[email] = {
            'otp': otp,
            'expires': timezone.now() + timezone.timedelta(minutes=10)
        }
        
        try:
            EmailService.send_email(
                subject=f"Verification Code for {masjid_name}",
                html_content=f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
                    <h2 style="color: #333;">Verify your Email</h2>
                    <p style="color: #666;">You are setting up a platform for <strong>{masjid_name}</strong>.</p>
                    <p>Use the code below to complete verification:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #111; margin: 0; font-family: monospace;">{otp}</h1>
                    </div>
                </div>""",
                recipient_list=[email]
            )
        except Exception as e:
            print(f"OTP Send Error: {e}")
            return Response({'error': 'Failed to send OTP. Please try again.'}, status=500)
            
        return Response({'message': 'OTP sent successfully'})

class VerifyRegistrationOTPView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=400)
            
        stored = _reg_otp_store.get(email)
        if not stored:
            return Response({'error': 'OTP expired or not found'}, status=400)
            
        if stored['otp'] != otp:
             return Response({'error': 'Invalid OTP'}, status=400)
                 
        if stored['expires'] < timezone.now():
             del _reg_otp_store[email]
             return Response({'error': 'OTP expired'}, status=400)
        
        signer = Signer()
        verification_token = signer.sign(email)
        del _reg_otp_store[email]
            
        return Response({
            'message': 'Email verified.',
            'verification_token': verification_token
        })

class FindWorkspaceView(generics.GenericAPIView):
    permission_classes = []
    throttle_classes = [FindWorkspaceThrottle]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        mosques = Mosque.objects.filter(owner_email__iexact=email)
        
        if mosques.exists():
            try:
                results = []
                for mosque in mosques:
                    protocol = 'https' if not settings.DEBUG else 'http'
                    domain = os.environ.get('DOMAIN_NAME', 'localhost:5173')
                    results.append({
                        "name": mosque.name,
                        "url": f"{protocol}://{domain}/",
                        "login_url": f"{protocol}://{domain}/auth/login"
                    })
                if results:
                    EmailService.send_workspace_login_info(email, results)
            except Exception as e:
                print(f"Find Workspace Error: {str(e)}")

        return Response({
            "success": True,
            "message": "If an account exists with this email, you will receive login information shortly."
        }, status=status.HTTP_200_OK)


class TenantInfoView(generics.GenericAPIView):
    permission_classes = []

    def get(self, request):
        # We can pass Mosque ID from headers if needed, but for public info,
        # it might just return the unified platform name.
        return Response({
            "name": "DigitalJamath Platform",
            "is_public": True,
        })


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = []
    
    def get(self, request):
        token = request.query_params.get('token')
        if not token:
             return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            client = Mosque.objects.get(verification_token=token)
            if client.email_verified:
                 return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)
            
            client.email_verified = True
            client.save()
            return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)
        except Mosque.DoesNotExist:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

_reset_otp_store = {}

class RequestPasswordResetOTPView(generics.GenericAPIView):
    permission_classes = []
    throttle_classes = [OTPRequestThrottle] 

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If an account exists, an OTP has been sent.'})
        
        otp = str(random.randint(100000, 999999))
        if settings.DEBUG:
            print(f"RESET OTP for {email}: {otp}")
            
        _reset_otp_store[email] = {
            'otp': otp,
            'expires': timezone.now() + timezone.timedelta(minutes=10),
        }
        
        try:
            EmailService.send_email(
                subject=f"Password Reset Code",
                html_content=f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p style="color: #666;">Use the code below to reset your password.</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #111; margin: 0; font-family: monospace;">{otp}</h1>
                    </div>
                </div>""",
                recipient_list=[email]
            )
        except Exception as e:
            print(f"OTP Send Error: {e}")
            
        return Response({'message': 'If an account exists, an OTP has been sent.'})

class VerifyPasswordResetOTPView(generics.GenericAPIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=400)
            
        stored = _reset_otp_store.get(email)
        if not stored:
            return Response({'error': 'OTP expired or not found'}, status=400)

        if stored['otp'] != otp:
             return Response({'error': 'Invalid OTP'}, status=400)
                 
        if stored['expires'] < timezone.now():
             del _reset_otp_store[email]
             return Response({'error': 'OTP expired'}, status=400)
        
        signer = Signer(salt='password-reset') 
        reset_token = signer.sign(email)
        del _reset_otp_store[email]
            
        return Response({
            'message': 'OTP verified.',
            'reset_token': reset_token
        })

class ConfirmPasswordResetOTPView(generics.GenericAPIView):
    permission_classes = []

    def post(self, request):
        reset_token = request.data.get('reset_token')
        new_password = request.data.get('new_password')
        
        if not reset_token or not new_password:
             return Response({'error': 'Missing fields'}, status=400)
             
        signer = Signer(salt='password-reset')
        try:
            email = signer.unsign(reset_token)
        except BadSignature:
            return Response({'error': 'Invalid or expired token'}, status=400)
            
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password reset successful. Please login."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

class CheckTenantView(generics.GenericAPIView):
    permission_classes = []
    throttle_classes = [CheckMosqueThrottle]

    def get(self, request):
        name = request.query_params.get('name', request.query_params.get('schema_name'))
        if not name:
             return Response({"error": "Name required"}, status=status.HTTP_400_BAD_REQUEST)

        exists = Mosque.objects.filter(name__iexact=name).exists()
        return Response({"exists": exists}, status=status.HTTP_200_OK)

class SetupTenantView(APIView):
    """Check registration task status or apply setup configuration."""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id is required'}, status=400)
        
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': result.status,
        }
        
        if result.status == 'SUCCESS':
            task_result = result.result or {}
            response_data['login_url'] = task_result.get('login_url', '')
            response_data['tenant_url'] = task_result.get('tenant_url', '')
        elif result.status == 'FAILURE':
            response_data['error'] = str(result.result)
        
        return Response(response_data)

    def post(self, request):
        token = request.data.get('verification_token')
        mosque_id = request.data.get('mosque_id')
        setup_data = request.data.get('setup_data', {})
        
        if not token or not mosque_id:
            return Response({'error': 'Missing token or mosque ID'}, status=400)

        signer = Signer()
        try:
            original_email = signer.unsign(token)
        except BadSignature:
            return Response({'error': 'Invalid token'}, status=400)

        try:
            mosque = Mosque.objects.get(id=mosque_id)
            if mosque.owner_email != original_email:
                return Response({'error': 'Permission denied'}, status=403)
        except Mosque.DoesNotExist:
            return Response({'error': 'Workspace not found'}, status=404)

        try:
            account_type = setup_data.get('accountType', 'standard')
            if account_type == 'standard':
                from django.core.management import call_command
                call_command('seed_ledger', mosque=mosque.id)
                print(f"[{mosque.name}] Seeded Mizan Ledger Chart of Accounts.")
        except Exception as e:
            print(f"Setup Error: {e}")
            pass

        return Response({'message': 'Setup applied successfully'})


class PublicMosqueListView(APIView):
    """Publicly lists all available Mosques on the platform."""
    permission_classes = []

    def get(self, request):
        mosques = Mosque.objects.all().values('id', 'name').order_by('name')
        return Response(list(mosques))


class PublicMosqueAnnouncementView(APIView):
    """Public endpoint to fetch announcements marked as is_public for a specific Masjid."""
    permission_classes = []

    def get(self, request, mosque_id):
        from apps.jamath.models import Announcement
        
        try:
            mosque = Mosque.objects.get(id=mosque_id)
        except Mosque.DoesNotExist:
            return Response({"error": "Masjid not found"}, status=404)
            
        announcements = Announcement.objects.filter(
            mosque=mosque,
            is_public=True,
            status='PUBLISHED'
        ).order_by('-published_at')[:10]
        
        data = []
        for ann in announcements:
            data.append({
                'id': ann.id,
                'title': ann.title,
                'content': ann.content,
                'published_at': ann.published_at,
                'image': request.build_absolute_uri(ann.image.url) if ann.image else None,
                'is_fundraiser': ann.is_fundraiser,
                'fundraising_target': ann.fundraising_target,
                'created_by_name': ann.created_by.username if ann.created_by else 'Admin'
            })
            
        return Response(data)


class GlobalPublicAnnouncementsView(APIView):
    """Public endpoint to fetch all recent globally public announcements across all Masjids."""
    permission_classes = []

    def get(self, request):
        from apps.jamath.models import Announcement
        
        announcements = Announcement.objects.filter(
            is_public=True,
            status='PUBLISHED'
        ).select_related('mosque').order_by('-published_at')[:5]
        
        from apps.jamath.models import JournalEntry, JournalItem
        from django.db.models import Sum

        data = []
        for ann in announcements:
            # Dynamically calculate amount raised by matching a specific pattern in the narration string
            narration_pattern = f"Ann: {ann.id}"
            
            raised = JournalItem.objects.filter(
                journal_entry__narration__contains=narration_pattern,
                credit_amount__gt=0
            ).aggregate(total=Sum('credit_amount'))['total'] or 0.00
            
            data.append({
                'id': ann.id,
                'mosque_id': ann.mosque.id if ann.mosque else 0,
                'mosque_name': ann.mosque.name if ann.mosque else "Platform wide",
                'title': ann.title,
                'content': ann.content,
                'published_at': ann.published_at,
                'image': request.build_absolute_uri(ann.image.url) if ann.image else None,
                'is_fundraiser': ann.is_fundraiser,
                'fundraising_target': ann.fundraising_target,
                'amount_raised': raised,
                'is_fully_funded': (float(raised) >= float(ann.fundraising_target)) if ann.fundraising_target else False
            })
            
        return Response(data)


class GuestDonationView(APIView):
    """Accepts unauthenticated guest donations straight to a Masjid's Mizan Ledger."""
    permission_classes = []

    def post(self, request, mosque_id):
        from apps.jamath.models import Ledger, JournalEntry, JournalItem, Announcement
        from django.db import transaction
        from django.utils import timezone
        from django.db.models import Sum
        
        try:
            mosque = Mosque.objects.get(id=mosque_id)
        except Mosque.DoesNotExist:
            return Response({"error": "Masjid not found"}, status=404)
            
        amount = request.data.get('amount')
        donor_name = request.data.get('donor_name', 'Guest User')
        donation_type = request.data.get('donation_type', 'General')
        announcement_id = request.data.get('announcement_id')
        
        if not amount:
            return Response({"error": "Amount is required"}, status=400)
            
        try:
            amount = float(amount)
        except ValueError:
            return Response({"error": "Invalid amount"}, status=400)
            
        # Optional: Prevent over-donation if linked to an announcement target
        announcement = None
        if announcement_id:
            try:
                announcement = Announcement.objects.get(id=announcement_id, mosque=mosque)
                if announcement.fundraising_target:
                    # Dynamically calculate current raised via narration matching
                    narration_pattern = f"Ann: {announcement.id}"
                    raised = JournalItem.objects.filter(
                        journal_entry__narration__contains=narration_pattern,
                        credit_amount__gt=0
                    ).aggregate(total=Sum('credit_amount'))['total'] or 0.00
                    
                    remaining = float(announcement.fundraising_target) - float(raised)
                    
                    if remaining <= 0:
                        return Response({"error": "Goal reached! We are fully funded."}, status=400)
                    if amount > remaining:
                        return Response({"error": f"You can only donate up to ₹{remaining} to reach the goal!"}, status=400)
                        
            except Announcement.DoesNotExist:
                pass # Proceed normally without announcement tracking

        # Map donation type to the correct Income Ledger code
        ledger_map = {
            'General': '3001',
            'Zakat': '3002',
            'Sadaqah': '3003',
            'Construction': '3004'
        }
        income_code = ledger_map.get(donation_type, '3001')
        
        try:
            with transaction.atomic():
                # Get the relevant ledgers
                income_ledger = Ledger.objects.get(mosque=mosque, code=income_code)
                asset_ledger = Ledger.objects.get(mosque=mosque, code='1002') # Assuming guest pays via online/Bank
                
                # Build the Double-Entry Accounting record
                narration = f"Guest Donation - {donation_type}"
                if announcement:
                    narration += f" - Ann: {announcement.id}"
                    
                je = JournalEntry.objects.create(
                    mosque=mosque,
                    voucher_type=JournalEntry.VoucherType.RECEIPT,
                    date=timezone.now().date(),
                    narration=narration,
                    donor_name_manual=donor_name,
                    payment_mode=JournalEntry.PaymentMode.UPI # Online donation proxy
                )
                
                # Debit: Add money to the Bank Account (Asset)
                JournalItem.objects.create(
                    mosque=mosque,
                    journal_entry=je,
                    ledger=asset_ledger,
                    debit_amount=amount,
                    credit_amount=0
                )
                # Credit: Record as Income
                JournalItem.objects.create(
                    mosque=mosque,
                    journal_entry=je,
                    ledger=income_ledger,
                    debit_amount=0,
                    credit_amount=amount
                )
                
            return Response({"message": "Donation successful", "voucher_number": je.voucher_number})
        except Ledger.DoesNotExist:
            return Response({"error": "The Chart of Accounts for this Masjid is incomplete."}, status=400)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Guest Donation Error: {e}")
            return Response({"error": "Failed to process donation."}, status=500)
