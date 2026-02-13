from rest_framework import serializers, viewsets
from .models import Volunteer, GrantApplication
from apps.jamath.api import AuditLogMixin, HasStaffPermission
from rest_framework.permissions import IsAdminUser


class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'

class GrantApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrantApplication
        fields = '__all__'
        read_only_fields = ['score', 'status'] # Status update usually done via specific endpoint action

class VolunteerViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer
    permission_classes = [IsAdminUser | HasStaffPermission]
    required_module = 'welfare'


class GrantApplicationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GrantApplication.objects.all()
    serializer_class = GrantApplicationSerializer
    permission_classes = [IsAdminUser | HasStaffPermission]
    required_module = 'welfare'

