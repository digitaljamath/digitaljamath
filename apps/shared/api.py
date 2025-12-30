from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from .models import Client, Domain
from .serializers import TenantRegistrationSerializer
from django_tenants.utils import schema_context
from django.contrib.auth.models import User

class TenantRegistrationView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = TenantRegistrationSerializer
    permission_classes = [] # Allow anyone to register
    
    def create(self, request, *args, **kwargs):
        # Enforce 'public' schema logic if needed, but for now we trust the caller
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        schema_name = serializer.validated_data.get('schema_name')
        if not schema_name:
             # Auto-generate schema name from domain if missing
             schema_name = serializer.validated_data['domain'].replace('-', '_').lower()
             serializer.validated_data['schema_name'] = schema_name

        if Client.objects.filter(schema_name=schema_name).exists():
             return Response({"error": "This Masjid workspace name is already taken."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tenant = serializer.save()
            
            # Now create the admin user inside the tenant
            # Note: The password in validated_data is raw, which is what create_user expects
            with schema_context(tenant.schema_name):
                User.objects.create_user(
                    username='admin',
                    email=serializer.validated_data['email'],
                    password=serializer.validated_data['password'],
                    is_staff=True,
                    is_superuser=True
                )
            
            # Send Verification Email (non-blocking - don't fail registration if email fails)
            try:
                from .utils import send_verification_email
                send_verification_email(tenant)
            except Exception as email_error:
                # Log the error but don't fail registration
                print(f"Warning: Failed to send verification email: {email_error}")
                
            return Response({
                "message": "Workspace created successfully.",
                "tenant_url": f"http://{tenant.domains.first().domain}:3000/",
                "login_url": f"http://{tenant.domains.first().domain}:3000/auth/login"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Cleanup if failed
            if 'tenant' in locals() and tenant.pk:
                tenant.delete(keep_parents=True) # Soft or hard delete depending on config
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FindWorkspaceView(generics.GenericAPIView):
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        clients = Client.objects.filter(owner_email__iexact=email)
        
        if not clients.exists():
            return Response({"workspaces": []}, status=status.HTTP_200_OK)
            
        results = []
        for client in clients:
            domain = client.domains.filter(is_primary=True).first()
            if domain:
                results.append({
                    "name": client.name,
                    "url": f"http://{domain.domain}:3000/",
                    "login_url": f"http://{domain.domain}:3000/auth/login"
                })
                
        return Response({"workspaces": results}, status=status.HTTP_200_OK)

class TenantInfoView(generics.GenericAPIView):
    permission_classes = []

    def get(self, request):
        tenant = request.tenant
        if tenant.schema_name == 'public':
            return Response({"name": "DigitalJamath", "is_public": True})
        
        return Response({
            "name": tenant.name,
            "schema_name": tenant.schema_name,
            "is_public": False
        })

from .utils import send_verification_email, send_password_reset_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

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
                send_password_reset_email(user, tenant.domains.first().domain)
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
