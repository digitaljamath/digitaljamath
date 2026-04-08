"""
Middleware for Role-Based Access Control
"""
from django.http import HttpResponseForbidden, HttpResponseRedirect
from django.conf import settings


class RBACMiddleware:
    """
    Enforces Role-Based Access Control for API endpoints.
    Checks StaffMember Permissions against the requested module.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        if not request.user.is_authenticated:
            return self.get_response(request)

        # Extract module from path: /api/finance/ledgers -> 'finance'
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) < 2:
            return self.get_response(request)
        
        module = path_parts[1]
        
        # Modules to enforce RBAC on
        # 'jamath' is likely base module, restrict specific sub-modules or assume 'jamath' covers basic CRM
        PROTECTED_MODULES = ['finance', 'welfare', 'jamath'] 
        if module not in PROTECTED_MODULES:
            return self.get_response(request)
        
        # Check Permissions
        # Need to import inside method to avoid circular import or app registry issues
        from apps.jamath.models import StaffMember
        
        try:
            # Check if user is assigned a role in this tenant
            staff_member = StaffMember.objects.select_related('role').get(user=request.user)
            role_perms = staff_member.role.permissions # {'finance': 'admin', 'welfare': 'read'}
            
            user_perm = role_perms.get(module)
            
            if not user_perm:
                 # No explicit permission for this module -> Block
                 from django.http import JsonResponse
                 return JsonResponse({'error': f'Access Denied: You do not have permission for the {module} module.'}, status=403)
                 
        except StaffMember.DoesNotExist:
            # Not a staff member -> Block if superuser check fails (or allow superusers always?)
            if request.user.is_superuser:
                return self.get_response(request)
            
            from django.http import JsonResponse
            return JsonResponse({'error': 'Access Denied: You are not a staff member assigned to this tenant.'}, status=403)

        return self.get_response(request)
