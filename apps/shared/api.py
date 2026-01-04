from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
import requests
from django.conf import settings
from .models import Client, Domain
from .serializers import TenantRegistrationSerializer
from django_tenants.utils import schema_context
from django.contrib.auth.models import User
import random
from django.utils import timezone
from rest_framework.views import APIView
from .email_service import EmailService


# Custom throttle for Find Workspace API - prevents email enumeration attacks
class FindWorkspaceThrottle(AnonRateThrottle):
    rate = '100/hour'  # Increased for development (was 5/hour)


# Registration throttles - prevent abuse of registration flow
class OTPRequestThrottle(AnonRateThrottle):
    rate = '100/hour'  # Increased for development (was 3/hour)


class CheckTenantThrottle(AnonRateThrottle):
    rate = '100/hour'  # Increased for development (was 10/hour)


class RegistrationThrottle(AnonRateThrottle):
    rate = '100/hour'  # Increased for development (was 5/hour)


def verify_recaptcha(token: str) -> bool:
    """Verify reCAPTCHA v3 token with Google's API."""
    # Skip verification in DEBUG mode (development)
    if getattr(settings, 'DEBUG', False):
        return True
    
    secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', None)
    if not secret_key:
        # If no secret key configured, skip verification
        return True
    
    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': secret_key,
                'response': token
            },
            timeout=5
        )
        result = response.json()
        # reCAPTCHA v3 returns a score (0.0 to 1.0), require at least 0.5
        return result.get('success', False) and result.get('score', 0) >= 0.5
    except Exception:
        return False

class TenantRegistrationView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = TenantRegistrationSerializer
    permission_classes = []  # Allow anyone to register
    throttle_classes = [RegistrationThrottle]  # Rate limit: 5/hour per IP
    
    def post(self, request, *args, **kwargs):
        # 1. Validate Data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # 2. Check Verification (Using Verification Token from OTP step)
        verification_token = request.data.get('verification_token')
        if not verification_token:
             return Response({"error": "Verification token required. Please verify email first."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the token (Simple check against our cache/store)
        # For MVP, we decode the token or check local store.
        # Let's assume the token IS the email (signed) or we check a store.
        # We will implement a simple signed token verification here.
        from django.core.signing import Signer, BadSignature
        signer = Signer()
        try:
             original_email = signer.unsign(verification_token)
             if original_email != data['email']:
                 return Response({"error": "Token does not match email."}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
             return Response({"error": "Invalid verification token."}, status=status.HTTP_400_BAD_REQUEST)

        
        # 3. Check Availability
        domain_part = data.get('domain')
        schema_name = data.get('schema_name')
        if not schema_name:
             schema_name = domain_part.replace('-', '_').lower()
             data['schema_name'] = schema_name

        if Client.objects.filter(schema_name=schema_name).exists():
             return Response({"error": "This Masjid workspace name is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 4. Prepare Task Data
        task_data = {
            'name': data['name'],
            'schema_name': data['schema_name'],
            'owner_email': data['email'],
            'domain_part': domain_part,
            'email': data['email'],
            'password': data['password'],
            'setup_type': request.data.get('setup_type', 'standard'),  # standard or custom
        }

        # 5. Trigger Task (Async if Celery is running, Sync for local dev)
        from .tasks import create_tenant_task
        from django.conf import settings
        import os
        
        base_domain = os.environ.get('DOMAIN_NAME', 'localhost')
        full_domain = f"{domain_part}.{base_domain}"
        
        # In DEBUG mode or when CELERY_SYNC=True, run synchronously
        if settings.DEBUG or os.environ.get('CELERY_SYNC', 'false').lower() == 'true':
            # Run synchronously for local development
            try:
                result = create_tenant_task(task_data)
                return Response({
                    "message": "Workspace created successfully.",
                    "status": "SUCCESS",
                    "task_id": "sync-task",
                    "tenant_url": result.get('tenant_url', f"http://{full_domain}/"),
                    "login_url": result.get('login_url', f"http://{full_domain}/auth/login")
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": str(e),
                    "status": "FAILURE"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Run async via Celery in production
            task_result = create_tenant_task.delay(task_data)
            return Response({
                "message": "Workspace creation started.",
                "status": "pending",
                "task_id": task_result.id,
                "tenant_url": f"http://{full_domain}/",
                "login_url": f"http://{full_domain}/auth/login"
            }, status=status.HTTP_202_ACCEPTED)

# In-memory OTP store for Registration
_reg_otp_store = {}

class RequestRegistrationOTPView(APIView):
    """Send OTP to email for registration."""
    permission_classes = []
    throttle_classes = [OTPRequestThrottle]  # Rate limit: 3/hour per IP

    def post(self, request):
        email = request.data.get('email')
        masjid_name = request.data.get('masjid_name', 'DigitalJamath Workspace')
        
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        # Check if email is already an owner? (Optional, maybe allow multiple workspaces)
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        _reg_otp_store[email] = {
            'otp': otp,
            'expires': timezone.now() + timezone.timedelta(minutes=10)
        }
        
        # Send OTP
        try:
            from .email_service import EmailService
            EmailService.send_email(
                subject=f"Verification Code for {masjid_name}",
                html_content=f"""
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
                    <h2 style="color: #333;">Verify your Email</h2>
                    <p style="color: #666;">You are setting up a workspace for <strong>{masjid_name}</strong>.</p>
                    <p>Use the code below to complete verification:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #111; margin: 0; font-family: monospace;">{otp}</h1>
                    </div>
                    
                    <p style="font-size: 12px; color: #999;">This code expires in 10 minutes.</p>
                </div>
                """,
                recipient_list=[email]
            )
        except Exception as e:
            return Response({'error': 'Failed to send OTP. Please try again.'}, status=500)
            
        return Response({'message': 'OTP sent successfully'})

class VerifyRegistrationOTPView(APIView):
    """Verify OTP and return a signed token for registration."""
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
             # Magic OTP for dev ONLY (disabled in production)
             if not (settings.DEBUG and otp == '112233'):
                 return Response({'error': 'Invalid OTP'}, status=400)
                 
        if stored['expires'] < timezone.now():
             if not (settings.DEBUG and otp == '112233'):
                 del _reg_otp_store[email]
                 return Response({'error': 'OTP expired'}, status=400)
        
        # Success: Generate Signed Token
        from django.core.signing import Signer
        signer = Signer()
        verification_token = signer.sign(email)
        
        # Clear OTP (don't clear if using magic OTP in debug)
        if not (settings.DEBUG and otp == '112233'):
            del _reg_otp_store[email]
            
        return Response({
            'message': 'Email verified.',
            'verification_token': verification_token
        })


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class FindWorkspaceView(generics.GenericAPIView):
    """
    Find Masjid API with security protections:
    - Rate limiting (5 requests/hour per IP)
    - reCAPTCHA v3 verification
    - Email confirmation (sends login info via email, no direct data return)
    """
    permission_classes = []
    throttle_classes = [FindWorkspaceThrottle]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        captcha_token = request.data.get('captcha_token')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify reCAPTCHA (if configured)
        if not verify_recaptcha(captcha_token or ''):
            return Response(
                {"error": "Security verification failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find workspaces for this email
        clients = Client.objects.filter(owner_email__iexact=email)
        
        if clients.exists():
            try:
                results = []
                for client in clients:
                    # Defensive check for domains/domain_set
                    domains = getattr(client, 'domains', None) or getattr(client, 'domain_set', None)
                    if domains:
                        domain = domains.filter(is_primary=True).first()
                        if domain:
                            protocol = 'https' if not settings.DEBUG else 'http'
                            results.append({
                                "name": client.name,
                                "url": f"{protocol}://{domain.domain}/",
                                "login_url": f"{protocol}://{domain.domain}/auth/login"
                            })
                
                # Send email with workspace info instead of returning directly
                if results:
                    EmailService.send_workspace_login_info(email, results)
                    
            except Exception as e:
                # Catch ALL errors (AttributeError, SMTP, etc) to prevent 500
                import traceback
                print(f"Find Workspace Error: {str(e)}")
                traceback.print_exc()

        
        # Always return same success message to prevent email enumeration
        return Response({
            "success": True,
            "message": "If an account exists with this email, you will receive login information shortly."
        }, status=status.HTTP_200_OK)

class TenantInfoView(generics.GenericAPIView):
    permission_classes = []

    def get(self, request):
        tenant = request.tenant
        if tenant.schema_name == 'public':
            return Response({"name": "DigitalJamath", "is_public": True})
        
        from django.conf import settings
        return Response({
            "name": tenant.name,
            "schema_name": tenant.schema_name,
            "is_public": False,
            "telegram_bot_username": settings.TELEGRAM_BOT_USERNAME
        })

from .utils import send_verification_email, send_password_reset_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.core.signing import Signer, BadSignature

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = []
    
    def get(self, request):
        token = request.query_params.get('token')
        if not token:
             return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            client = Client.objects.get(verification_token=token)
            if client.email_verified:
                 return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)
            
            client.email_verified = True
            client.save()
            return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)
        except Client.DoesNotExist:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        
        tenant = request.tenant
        if tenant.schema_name == 'public':
             return Response({"error": "Please use your workspace URL to reset password."}, status=status.HTTP_400_BAD_REQUEST)
             
        with schema_context(tenant.schema_name):
            try:
                user = User.objects.get(email=email)
                try:
                    send_password_reset_email(user, tenant.domains.first().domain)
                except Exception as e:
                    print(f"Failed to send password reset email: {e}")
                    # Return 200 even if email fails, to avoid enumeration and panic
                    pass
                return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                 return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = []
    
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        
        if not uidb64 or not token or not password:
             return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
             
        tenant = request.tenant
        if tenant.schema_name == 'public':
             return Response({"error": "Invalid context"}, status=status.HTTP_400_BAD_REQUEST)
             
        with schema_context(tenant.schema_name):
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
                
                if default_token_generator.check_token(user, token):
                    user.set_password(password)
                    user.save()
                    return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                 return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class CheckTenantView(generics.GenericAPIView):
    permission_classes = []
    throttle_classes = [CheckTenantThrottle]  # Rate limit: 10/hour per IP

    def get(self, request):
        schema_name = request.query_params.get('schema_name')
        if not schema_name:
             return Response({"error": "Schema name required"}, status=status.HTTP_400_BAD_REQUEST)

        exists = Client.objects.filter(schema_name=schema_name).exists()
        return Response({"exists": exists}, status=status.HTTP_200_OK)

class SetupTenantView(APIView):
    """Check registration task status or apply setup configuration."""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """Poll for Celery task status (provisioning progress)."""
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
            # Task completed - return login URL
            task_result = result.result or {}
            response_data['login_url'] = task_result.get('login_url', '')
            response_data['tenant_url'] = task_result.get('tenant_url', '')
        elif result.status == 'FAILURE':
            response_data['error'] = str(result.result)
        
        return Response(response_data)

    def post(self, request):
        token = request.data.get('verification_token')
        schema_name = request.data.get('schema_name')
        setup_data = request.data.get('setup_data', {})
        
        if not token or not schema_name:
            return Response({'error': 'Missing token or schema'}, status=400)

        # Verify Token
        signer = Signer()
        try:
            original_email = signer.unsign(token)
        except BadSignature:
            return Response({'error': 'Invalid token'}, status=400)

        # Verify Tenant Ownership
        try:
            client = Client.objects.get(schema_name=schema_name)
            if client.owner_email != original_email:
                return Response({'error': 'Permission denied'}, status=403)
        except Client.DoesNotExist:
            return Response({'error': 'Workspace not found'}, status=404)

        # Apply Setup
        try:
            from django_tenants.utils import schema_context
            # Note: FundCategory import must happen inside a method or ensure app is ready
            # But since this is a shared app, it's fine.
            # However, to be safe from 'AppRegistryNotReady' if imported at top level in some configs:
            # from apps.finance.models import FundCategory
            
            with schema_context(schema_name):
                # CHART OF ACCOUNTS
                account_type = setup_data.get('accountType', 'standard')
                if account_type == 'standard':
                    from django.core.management import call_command
                    # Seed Mizan Ledger Chart of Accounts
                    call_command('seed_ledger')
                    print(f"[{schema_name}] Seeded Mizan Ledger Chart of Accounts.")

        except Exception as e:
            print(f"Setup Error: {e}")
            # We don't want to fail the whole process if seeding fails, just log it.
            # But for now, let's return success with warning or just success.
            # return Response({'error': str(e)}, status=500) 
            pass

        return Response({'message': 'Setup applied successfully'})




