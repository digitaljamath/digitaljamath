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
        # 1. Validate Data using Serializer (but don't save)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 2. Extract validated data
        data = serializer.validated_data
        
        # 3. Check availability manually since we are not saving yet
        # (Though serializer validators might have checked unique constraints, 
        # schema_name is derived and needs checking)
        
        domain_part = data.get('domain')
        schema_name = data.get('schema_name')
        if not schema_name:
             schema_name = domain_part.replace('-', '_').lower()
             data['schema_name'] = schema_name

        if Client.objects.filter(schema_name=schema_name).exists():
             return Response({"error": "This Masjid workspace name is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 4. Prepare data for task (must be serializable)
        task_data = {
            'name': data['name'],
            'schema_name': data['schema_name'],
            'owner_email': data['email'],
            'domain_part': domain_part,
            'email': data['email'],
            'password': data['password'], # Raw password to task
        }

        # 5. Trigger Async Task
        from .tasks import create_tenant_task
        create_tenant_task.delay(task_data)
        
        # 6. Return Accepted response
        import os
        base_domain = os.environ.get('DOMAIN_NAME', 'localhost')
        full_domain = f"{domain_part}.{base_domain}"
        
        return Response({
            "message": "Workspace creation started.",
            "status": "pending",
            "estimated_time": "2-3 minutes",
            "tenant_url": f"http://{full_domain}/",
            "login_url": f"http://{full_domain}/auth/login"
        }, status=status.HTTP_202_ACCEPTED)

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
                    "url": f"http://{domain.domain}/",
                    "login_url": f"http://{domain.domain}/auth/login"
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
