from rest_framework import serializers, viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from django.utils import timezone
from decimal import Decimal
import random

from .models import (
    Household, Member, Survey, SurveyResponse,
    MembershipConfig, Subscription, Receipt, Announcement, ServiceRequest
)
from .serializers import SurveySerializer, SurveyResponseSerializer
from .services import MembershipService, ProfileService, NotificationService


# ============================================================================
# SERIALIZERS
# ============================================================================

class MemberSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'full_name', 'is_head_of_family', 'relationship_to_head',
                  'gender', 'dob', 'age', 'marital_status', 'profession', 
                  'education', 'skills', 'is_employed', 'monthly_income', 
                  'requirements', 'is_alive', 'is_approved', 'household']
    
    def get_age(self, obj):
        if obj.dob:
            from datetime import date
            today = date.today()
            return today.year - obj.dob.year - ((today.month, today.day) < (obj.dob.month, obj.dob.day))
        return None


class HouseholdSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    head_name = serializers.SerializerMethodField()
    is_membership_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Household
        fields = ['id', 'membership_id', 'address', 'economic_status', 'housing_status',
                  'phone_number', 'is_verified', 'zakat_score', 'member_count', 
                  'head_name', 'is_membership_active', 'members', 'custom_data', 'created_at']
        read_only_fields = ['zakat_score', 'member_count', 'is_membership_active']
    
    def get_head_name(self, obj):
        head = obj.members.filter(is_head_of_family=True).first()
        return head.full_name if head else "Unknown"


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['id', 'receipt_number', 'amount', 'membership_portion', 
                  'donation_portion', 'payment_date', 'pdf_url', 'notes']


class SubscriptionSerializer(serializers.ModelSerializer):
    receipts = ReceiptSerializer(many=True, read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'start_date', 'end_date', 'amount_paid', 
                  'minimum_required', 'status', 'receipts']


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'published_at', 'expires_at']


class ServiceRequestSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ServiceRequest
        fields = ['id', 'request_type', 'request_type_display', 'description', 
                  'status', 'status_display', 'admin_notes', 'created_at', 'updated_at']
        read_only_fields = ['status', 'admin_notes', 'created_at', 'updated_at']


class MembershipConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipConfig
        fields = ['id', 'cycle', 'minimum_fee', 'currency', 'membership_id_prefix', 
                  'household_label', 'member_label', 'masjid_name', 'is_active']





# ============================================================================
# OTP AUTHENTICATION
# ============================================================================

# In-memory OTP store (use Redis in production)
_otp_store = {}


class RequestOTPView(APIView):
    """Send OTP to a registered phone number."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        phone = request.data.get('phone_number')
        
        if not phone:
            return Response({'error': 'Phone number is required'}, status=400)
        
        # Check if phone is registered with a household
        try:
            household = Household.objects.get(phone_number=phone)
        except Household.DoesNotExist:
            return Response({
                'error': 'Number not registered with Jamath. Please contact Admin.'
            }, status=404)
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        _otp_store[phone] = {
            'otp': otp,
            'household_id': household.id,
            'expires': timezone.now() + timezone.timedelta(minutes=5)
        }
        
        # Send OTP (mock for now)
        NotificationService.send_otp(phone, otp)
        
        return Response({
            'message': 'OTP sent successfully',
            'phone': phone[-4:]  # Show only last 4 digits
        })


class VerifyOTPView(APIView):
    """Verify OTP and return JWT tokens."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        phone = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        if not phone or not otp:
            return Response({'error': 'Phone and OTP are required'}, status=400)
        
        stored = _otp_store.get(phone)
        
        if not stored:
            return Response({'error': 'OTP expired or not found'}, status=400)
        
        if stored['otp'] != otp:
            return Response({'error': 'Invalid OTP'}, status=400)
        
        if stored['expires'] < timezone.now():
            del _otp_store[phone]
            return Response({'error': 'OTP expired'}, status=400)
        
        # Get household
        household = Household.objects.get(id=stored['household_id'])
        
        # Create a pseudo-user token (in production, link to actual User model)
        # For MVP, we'll return household data and a custom token
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get or create a member user
        head = household.members.filter(is_head_of_family=True).first()
        username = f"member_{household.id}"
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'first_name': head.full_name if head else 'Member'}
        )
        
        refresh = RefreshToken.for_user(user)
        
        # Cleanup
        del _otp_store[phone]
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'household_id': household.id,
            'membership_id': household.membership_id,
            'head_name': head.full_name if head else 'Unknown'
        })


# ============================================================================
# MEMBER PORTAL APIs
# ============================================================================

class MemberPortalProfileView(APIView):
    """Get the logged-in member's household profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Extract household from user (linked via username pattern)
        username = request.user.username
        if username.startswith('member_'):
            household_id = int(username.split('_')[1])
            household = Household.objects.prefetch_related('members').get(id=household_id)
            
            # Get membership status
            membership_status = MembershipService.get_membership_status(household)
            
            return Response({
                'household': HouseholdSerializer(household).data,
                'membership': membership_status
            })
        
        return Response({'error': 'Invalid member session'}, status=400)


class MemberPortalReceiptsView(APIView):
    """Get all receipts for the member's household."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        username = request.user.username
        if username.startswith('member_'):
            household_id = int(username.split('_')[1])
            
            receipts = Receipt.objects.filter(
                subscription__household_id=household_id
            ).order_by('-payment_date')
            
            return Response(ReceiptSerializer(receipts, many=True).data)
        
        return Response({'error': 'Invalid member session'}, status=400)


class MemberPortalAnnouncementsView(APIView):
    """Get active announcements (bulletin board)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        announcements = Announcement.objects.filter(
            is_active=True,
            published_at__lte=now
        ).filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=now)
        )
        
        return Response(AnnouncementSerializer(announcements, many=True).data)


class MemberPortalServiceRequestView(APIView):
    """Submit and view service requests."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        username = request.user.username
        if username.startswith('member_'):
            household_id = int(username.split('_')[1])
            requests = ServiceRequest.objects.filter(household_id=household_id)
            return Response(ServiceRequestSerializer(requests, many=True).data)
        return Response({'error': 'Invalid member session'}, status=400)
    
    def post(self, request):
        username = request.user.username
        if username.startswith('member_'):
            household_id = int(username.split('_')[1])
            
            service_request = ServiceRequest.objects.create(
                household_id=household_id,
                request_type=request.data.get('request_type'),
                description=request.data.get('description', '')
            )
            
            return Response(ServiceRequestSerializer(service_request).data, status=201)
        return Response({'error': 'Invalid member session'}, status=400)


# ============================================================================
# ADMIN (ZIMMEDAR) APIs
# ============================================================================

class AdminPendingMembersView(APIView):
    """View and approve pending member profiles."""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        pending = ProfileService.get_pending_members()
        return Response(MemberSerializer(pending, many=True).data)
    
    def post(self, request):
        member_id = request.data.get('member_id')
        action = request.data.get('action')  # 'approve' or 'reject'
        
        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)
        
        if action == 'approve':
            ProfileService.approve_member(member, approved_by=request.user)
            return Response({'message': 'Member approved'})
        elif action == 'reject':
            member.delete()
            return Response({'message': 'Member rejected and removed'})
        
        return Response({'error': 'Invalid action'}, status=400)


class AdminMembershipConfigView(APIView):
    """View and update membership configuration."""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        config = MembershipService.get_or_create_config()
        return Response(MembershipConfigSerializer(config).data)
    
    def put(self, request):
        config = MembershipService.get_or_create_config()
        serializer = MembershipConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# ============================================================================
# EXISTING VIEWSETS (Updated)
# ============================================================================

class HouseholdViewSet(viewsets.ModelViewSet):
    queryset = Household.objects.prefetch_related('members')
    serializer_class = HouseholdSerializer



class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.filter(is_approved=True)
    serializer_class = MemberSerializer


class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer


class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.filter(survey__is_active=True)
    serializer_class = SurveyResponseSerializer

    def perform_create(self, serializer):
        from .services import JamathService
        instance = serializer.save()
        JamathService.process_survey_response(instance)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        service_request = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')
        
        if new_status in dict(ServiceRequest.Status.choices):
            service_request.status = new_status
            service_request.admin_notes = admin_notes
            service_request.handled_by = request.user
            service_request.save()
            return Response(ServiceRequestSerializer(service_request).data)
        
        return Response({'error': 'Invalid status'}, status=400)


# ============================================================================
# USER PROFILE API
# ============================================================================

class UserProfileView(APIView):
    """Get and update user profile."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
            'is_staff': user.is_staff,
        })
    
    def put(self, request):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()
        return Response({
            'message': 'Profile updated successfully',
            'first_name': user.first_name,
            'last_name': user.last_name,
        })


class ChangeEmailView(APIView):
    """Change user email with password verification."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        new_email = request.data.get('new_email')
        password = request.data.get('password')
        
        if not new_email or not password:
            return Response({'error': 'Email and password are required'}, status=400)
        
        if not user.check_password(password):
            return Response({'error': 'Invalid password'}, status=400)
        
        # Check if email already exists
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response({'error': 'Email already in use'}, status=400)
        
        user.email = new_email
        user.save()
        return Response({'message': 'Email updated successfully', 'email': new_email})


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([current_password, new_password, confirm_password]):
            return Response({'error': 'All password fields are required'}, status=400)
        
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=400)
        
        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match'}, status=400)
        
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})

