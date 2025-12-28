from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import ViewSets
from apps.finance.api import TransactionViewSet, BudgetViewSet, AssetViewSet, FundCategoryViewSet
from apps.jamath.api import (
    HouseholdViewSet, MemberViewSet, SurveyViewSet, SurveyResponseViewSet,
    AnnouncementViewSet, ServiceRequestViewSet,
    # OTP Auth
    RequestOTPView, VerifyOTPView,
    # Member Portal
    MemberPortalProfileView, MemberPortalReceiptsView, 
    MemberPortalAnnouncementsView, MemberPortalServiceRequestView,
    # Admin
    AdminPendingMembersView, AdminMembershipConfigView,
    # User Profile
    UserProfileView, ChangeEmailView, ChangePasswordView
)

from apps.welfare.api import VolunteerViewSet, GrantApplicationViewSet
from apps.shared.api import TenantRegistrationView, FindWorkspaceView, VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Router Setup
router = DefaultRouter()

# Finance
router.register(r'finance/transactions', TransactionViewSet)
router.register(r'finance/budgets', BudgetViewSet)
router.register(r'finance/assets', AssetViewSet)
router.register(r'finance/funds', FundCategoryViewSet)

# Jamath
router.register(r'jamath/households', HouseholdViewSet)
router.register(r'jamath/members', MemberViewSet)
router.register(r'jamath/surveys', SurveyViewSet)
router.register(r'jamath/responses', SurveyResponseViewSet)
router.register(r'jamath/announcements', AnnouncementViewSet)
router.register(r'jamath/service-requests', ServiceRequestViewSet)

# Welfare
router.register(r'welfare/volunteers', VolunteerViewSet)
router.register(r'welfare/grants', GrantApplicationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Tenant Registration
    path('api/register/', TenantRegistrationView.as_view(), name='register-tenant'),
    path('api/find-workspace/', FindWorkspaceView.as_view(), name='find-workspace'),
    path('api/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    
    # Admin Auth (username/password)
    path('api/auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('api/auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Member Portal OTP Auth
    path('api/portal/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('api/portal/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    
    # Member Portal APIs
    path('api/portal/profile/', MemberPortalProfileView.as_view(), name='portal-profile'),
    path('api/portal/receipts/', MemberPortalReceiptsView.as_view(), name='portal-receipts'),
    path('api/portal/announcements/', MemberPortalAnnouncementsView.as_view(), name='portal-announcements'),
    path('api/portal/service-requests/', MemberPortalServiceRequestView.as_view(), name='portal-service-requests'),
    
    # Admin (Zimmedar) APIs
    path('api/admin/pending-members/', AdminPendingMembersView.as_view(), name='admin-pending-members'),
    path('api/admin/membership-config/', AdminMembershipConfigView.as_view(), name='admin-membership-config'),
    
    # User Profile APIs
    path('api/user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/user/change-email/', ChangeEmailView.as_view(), name='change-email'),
    path('api/user/change-password/', ChangePasswordView.as_view(), name='change-password'),

    
    # REST API Router
    path('api/', include(router.urls)),
]
