from django.contrib import admin
from .models import Household, Member, MembershipConfig

@admin.register(MembershipConfig)
class MembershipConfigAdmin(admin.ModelAdmin):
    list_display = ('cycle', 'minimum_fee', 'currency', 'is_active', 'updated_at')
    list_filter = ('is_active', 'cycle', 'payment_gateway_provider')

class MemberInline(admin.StackedInline):
    model = Member
    extra = 0
    fields = ('full_name', 'relationship_to_head', 'gender', 'dob', 'is_head_of_family', 'phone_number')
    readonly_fields = ('created_by',)

@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ('membership_id', 'head_name_display', 'phone_number', 'economic_status', 'member_count', 'is_verified')
    list_filter = ('economic_status', 'housing_status', 'is_verified')
    search_fields = ('membership_id', 'phone_number', 'address', 'members__full_name')
    inlines = [MemberInline]
    
    def head_name_display(self, obj):
        head = obj.members.filter(is_head_of_family=True).first()
        return head.full_name if head else "-"
    head_name_display.short_description = "Head of Family"

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'household_link', 'relationship_to_head', 'gender', 'age_display', 'is_approved')
    list_filter = ('gender', 'marital_status', 'is_head_of_family', 'is_approved')
    search_fields = ('full_name', 'household__membership_id', 'household__phone_number')
    autocomplete_fields = ['household']
    
    def household_link(self, obj):
        return obj.household.membership_id
    household_link.short_description = "Household ID"
    
    def age_display(self, obj):
        if obj.dob:
            from django.utils import timezone
            today = timezone.now().date()
            return today.year - obj.dob.year - ((today.month, today.day) < (obj.dob.month, obj.dob.day))
        return "-"
    age_display.short_description = "Age"
