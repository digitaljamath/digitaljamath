from rest_framework import serializers, viewsets, status, permissions, filters
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
    MembershipConfig, Subscription, Receipt, Announcement, ServiceRequest,
    Ledger, Supplier, JournalEntry, JournalItem
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
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'published_at', 'expires_at', 'created_by_name', 'status']


class ServiceRequestSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requester_name = serializers.SerializerMethodField()
    household_id = serializers.CharField(source='household.membership_id', read_only=True)
    
    class Meta:
        model = ServiceRequest
        fields = ['id', 'request_type', 'request_type_display', 'description', 
                  'status', 'status_display', 'admin_notes', 'created_at', 'updated_at',
                  'requester_name', 'household_id']
        read_only_fields = ['status', 'admin_notes', 'created_at', 'updated_at']

    def get_requester_name(self, obj):
        # Get head of household name
        head = obj.household.members.filter(is_head_of_family=True).first()
        if head:
            return head.full_name
        # Fallback to first member
        first_member = obj.household.members.first()
        if first_member:
            return first_member.full_name
        return obj.household.membership_id or "Unknown"


class MembershipConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipConfig
        fields = ['id', 'cycle', 'minimum_fee', 'currency', 'membership_id_prefix', 
                  'household_label', 'member_label', 'masjid_name', 'is_active']


# ============================================================================
# MIZAN LEDGER SERIALIZERS
# ============================================================================

class LedgerSerializer(serializers.ModelSerializer):
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Ledger
        fields = ['id', 'code', 'name', 'account_type', 'fund_type', 'parent', 
                  'is_system', 'is_active', 'balance', 'children']
        read_only_fields = ['is_system']

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return LedgerSerializer(children, many=True).data if children.exists() else []


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'address', 'gstin', 'is_active']


class JournalItemSerializer(serializers.ModelSerializer):
    ledger_name = serializers.CharField(source='ledger.name', read_only=True)
    ledger_code = serializers.CharField(source='ledger.code', read_only=True)

    class Meta:
        model = JournalItem
        fields = ['id', 'ledger', 'ledger_name', 'ledger_code', 'debit_amount', 'credit_amount', 'particulars']


class JournalEntrySerializer(serializers.ModelSerializer):
    items = JournalItemSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    donor_name = serializers.SerializerMethodField()
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'voucher_number', 'voucher_type', 'date', 'narration',
                  'donor', 'donor_name', 'donor_name_manual', 'donor_pan', 'donor_intent',
                  'supplier', 'supplier_name', 'vendor_invoice_no', 'vendor_invoice_date', 'proof_document',
                  'payment_mode', 'is_finalized', 'total_amount', 'items',
                  'created_by_name', 'created_at']
        read_only_fields = ['voucher_number', 'is_finalized', 'created_at']

    def get_donor_name(self, obj):
        if obj.donor:
            return obj.donor.full_name
        return obj.donor_name_manual or "Unknown"

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        journal_entry = JournalEntry.objects.create(**validated_data)
        
        for item_data in items_data:
            JournalItem.objects.create(journal_entry=journal_entry, **item_data)
        
        # Run validation after items are created
        journal_entry.full_clean()
        return journal_entry

    def update(self, instance, validated_data):
        if instance.is_finalized:
            raise serializers.ValidationError("Cannot modify a finalized entry.")
        
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                JournalItem.objects.create(journal_entry=instance, **item_data)
        
        instance.full_clean()
        return instance



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
             # Magic OTP for demo/dev (Only for specific demo number)
             if otp != '123456' or phone != '+919876543210':
                 return Response({'error': 'Invalid OTP'}, status=400)
        
        if stored['expires'] < timezone.now():
             if otp != '123456' or phone != '+919876543210': # Magic OTP never expires
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


class MemberPortalMemberView(APIView):
    """Allow members to add/edit family details."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = request.user.username
        if not username.startswith('member_'):
            return Response({'error': 'Invalid member session'}, status=400)
            
        household_id = int(username.split('_')[1])
        try:
            household = Household.objects.get(id=household_id)
        except Household.DoesNotExist:
            return Response({'error': 'Household not found'}, status=404)

        # Basic validation
        full_name = request.data.get('full_name')
        if not full_name:
            return Response({'error': 'Full name is required'}, status=400)

        # Create member (Pending Approval)
        member = Member.objects.create(
            household=household,
            full_name=full_name,
            relationship_to_head=request.data.get('relationship_to_head', 'OTHER'),
            gender=request.data.get('gender', 'MALE'),
            marital_status=request.data.get('marital_status', 'SINGLE'),
            profession=request.data.get('profession', ''),
            education=request.data.get('education', ''),
            skills=request.data.get('skills', ''),
            requirements=request.data.get('requirements', ''),
            is_head_of_family=False,
            is_approved=False,  # Needs Admin Approval
            is_alive=True
        )

        return Response(MemberSerializer(member).data, status=201)


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
    queryset = Household.objects.prefetch_related('members').distinct()
    serializer_class = HouseholdSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['membership_id', 'address', 'phone_number', 'members__full_name']



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
    
    def get_queryset(self):
        queryset = Announcement.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset.order_by('-published_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    
    def get_queryset(self):
        queryset = ServiceRequest.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset.order_by('-created_at')
    
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


# ============================================================================
# MIZAN LEDGER VIEWSETS
# ============================================================================

class LedgerViewSet(viewsets.ModelViewSet):
    """Chart of Accounts management."""
    queryset = Ledger.objects.filter(parent=None, is_active=True)  # Only top-level by default
    serializer_class = LedgerSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Ledger.objects.filter(is_active=True)
        account_type = self.request.query_params.get('type')
        flat = self.request.query_params.get('flat')
        
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        # Flat list for dropdowns
        if flat:
            return queryset.order_by('code')
        
        # Hierarchical (top-level only, children via serializer)
        return queryset.filter(parent=None).order_by('code')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response({'error': 'Cannot delete system accounts.'}, status=400)
        if instance.journal_items.exists():
            return Response({'error': 'Cannot delete account with transactions.'}, status=400)
        instance.is_active = False
        instance.save()
        return Response(status=204)


class SupplierViewSet(viewsets.ModelViewSet):
    """Vendor/Supplier management."""
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.payments.exists():
            return Response({'error': 'Cannot delete supplier with payments.'}, status=400)
        instance.is_active = False
        instance.save()
        return Response(status=204)


class JournalEntryViewSet(viewsets.ModelViewSet):
    """Journal Entry (Voucher) management."""
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = JournalEntry.objects.all()
        voucher_type = self.request.query_params.get('type')
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        
        if voucher_type:
            queryset = queryset.filter(voucher_type=voucher_type)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset.order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Lock a journal entry to prevent further modifications."""
        entry = self.get_object()
        if entry.is_finalized:
            return Response({'error': 'Already finalized.'}, status=400)
        entry.is_finalized = True
        entry.save()
        return Response({'message': 'Entry finalized successfully.'})


class LedgerReportsView(APIView):
    """Ledger reports: Day Book, Trial Balance."""
    permission_classes = [IsAdminUser]

    def get(self, request, report_type):
        from django.db.models import Sum

        if report_type == 'day-book':
            date = request.query_params.get('date', timezone.now().date().isoformat())
            entries = JournalEntry.objects.filter(date=date).order_by('created_at')
            return Response({
                'date': date,
                'entries': JournalEntrySerializer(entries, many=True).data,
                'summary': {
                    'total_receipts': entries.filter(voucher_type='RECEIPT').aggregate(
                        total=Sum('items__credit_amount'))['total'] or 0,
                    'total_payments': entries.filter(voucher_type='PAYMENT').aggregate(
                        total=Sum('items__debit_amount'))['total'] or 0,
                }
            })

        elif report_type == 'trial-balance':
            ledgers = Ledger.objects.filter(is_active=True).order_by('code')
            data = []
            total_debit = Decimal('0.00')
            total_credit = Decimal('0.00')
            
            for ledger in ledgers:
                balance = ledger.balance
                if balance > 0:
                    if ledger.account_type in ['ASSET', 'EXPENSE']:
                        total_debit += balance
                        data.append({'code': ledger.code, 'name': ledger.name, 'debit': balance, 'credit': 0})
                    else:
                        total_credit += balance
                        data.append({'code': ledger.code, 'name': ledger.name, 'debit': 0, 'credit': balance})
                elif balance < 0:
                    if ledger.account_type in ['ASSET', 'EXPENSE']:
                        total_credit += abs(balance)
                        data.append({'code': ledger.code, 'name': ledger.name, 'debit': 0, 'credit': abs(balance)})
                    else:
                        total_debit += abs(balance)
                        data.append({'code': ledger.code, 'name': ledger.name, 'debit': abs(balance), 'credit': 0})
            
            return Response({
                'ledgers': data,
                'total_debit': total_debit,
                'total_credit': total_credit,
                'is_balanced': total_debit == total_credit
            })

        return Response({'error': 'Invalid report type'}, status=400)


class TallyExportView(APIView):
    """Export financial data to Tally-compatible Excel format."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from openpyxl import Workbook
        from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
        from openpyxl.utils import get_column_letter
        from django.http import HttpResponse
        import io

        # Get date range from query params (default: current financial year Apr-Mar)
        year = request.query_params.get('year')
        if year:
            year = int(year)
        else:
            today = timezone.now().date()
            year = today.year if today.month >= 4 else today.year - 1
        
        start_date = f"{year}-04-01"
        end_date = f"{year + 1}-03-31"

        # Fetch all journal entries in date range
        entries = JournalEntry.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).prefetch_related('items__ledger', 'donor').order_by('date', 'voucher_number')

        # Create workbook
        wb = Workbook()
        
        # ========== Tab 1: All Transactions ==========
        ws1 = wb.active
        ws1.title = "Journal Entries"
        
        # Header styling
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="2B579A", end_color="2B579A", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        # Headers
        headers = [
            "Date", "Voucher_Type", "Voucher_Number", "Ledger_Code", "Ledger_Name",
            "Fund_Category", "Debit", "Credit", "Narration", "Payment_Mode",
            "Donor_Name", "Donor_PAN", "Supplier_Name", "Invoice_No"
        ]
        
        for col, header in enumerate(headers, 1):
            cell = ws1.cell(row=1, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # Data rows
        row_num = 2
        for entry in entries:
            for item in entry.items.all():
                # Format date as DD-MM-YYYY
                formatted_date = entry.date.strftime("%d-%m-%Y")
                
                donor_name = ""
                donor_pan = ""
                if entry.donor:
                    donor_name = entry.donor.full_name
                elif entry.donor_name_manual:
                    donor_name = entry.donor_name_manual
                donor_pan = entry.donor_pan or ""
                
                supplier_name = entry.supplier.name if entry.supplier else ""
                
                row_data = [
                    formatted_date,
                    entry.voucher_type,
                    entry.voucher_number,
                    item.ledger.code,
                    item.ledger.name,
                    item.ledger.fund_type or "GENERAL",
                    float(item.debit_amount) if item.debit_amount > 0 else "",
                    float(item.credit_amount) if item.credit_amount > 0 else "",
                    entry.narration,
                    entry.payment_mode,
                    donor_name,
                    donor_pan,
                    supplier_name,
                    entry.vendor_invoice_no or ""
                ]
                
                for col, value in enumerate(row_data, 1):
                    cell = ws1.cell(row=row_num, column=col, value=value)
                    cell.border = thin_border
                
                row_num += 1

        # Auto-adjust column widths
        for col in range(1, len(headers) + 1):
            ws1.column_dimensions[get_column_letter(col)].width = 15

        # ========== Tab 2: Donor List (for Form 10BD) ==========
        ws2 = wb.create_sheet(title="Donor List (Form 10BD)")
        
        donor_headers = [
            "Sr_No", "Donor_Name", "PAN", "Phone", "Total_Donation",
            "Donation_Type", "Address"
        ]
        
        for col, header in enumerate(donor_headers, 1):
            cell = ws2.cell(row=1, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # Aggregate donors
        donor_data = {}
        for entry in entries.filter(voucher_type='RECEIPT'):
            donor_key = None
            donor_name = ""
            donor_pan = ""
            donor_phone = ""
            
            if entry.donor:
                donor_key = f"member_{entry.donor.id}"
                donor_name = entry.donor.full_name
                donor_pan = entry.donor_pan or ""
                donor_phone = entry.donor.household.phone_number or "" if hasattr(entry.donor, 'household') else ""
            elif entry.donor_name_manual:
                donor_key = f"guest_{entry.donor_name_manual}_{entry.donor_pan or 'nopan'}"
                donor_name = entry.donor_name_manual
                donor_pan = entry.donor_pan or ""
            
            if donor_key:
                if donor_key not in donor_data:
                    donor_data[donor_key] = {
                        'name': donor_name,
                        'pan': donor_pan,
                        'phone': donor_phone,
                        'total': Decimal('0.00'),
                        'types': set()
                    }
                
                # Add total (credit amounts for receipts)
                for item in entry.items.filter(credit_amount__gt=0):
                    donor_data[donor_key]['total'] += item.credit_amount
                    if item.ledger.fund_type:
                        donor_data[donor_key]['types'].add(item.ledger.fund_type)

        # Write donor rows
        row_num = 2
        for idx, (key, data) in enumerate(sorted(donor_data.items(), key=lambda x: x[1]['name']), 1):
            row = [
                idx,
                data['name'],
                data['pan'],
                data['phone'],
                float(data['total']),
                ", ".join(data['types']) or "GENERAL",
                ""
            ]
            for col, value in enumerate(row, 1):
                cell = ws2.cell(row=row_num, column=col, value=value)
                cell.border = thin_border
            row_num += 1

        # Auto-adjust column widths
        for col in range(1, len(donor_headers) + 1):
            ws2.column_dimensions[get_column_letter(col)].width = 18

        # Generate response
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"Mizan_Export_FY{year}-{year+1}.xlsx"
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
