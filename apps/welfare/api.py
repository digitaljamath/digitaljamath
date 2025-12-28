from rest_framework import serializers, viewsets
from .models import Volunteer, GrantApplication

class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'

class GrantApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrantApplication
        fields = '__all__'
        read_only_fields = ['score', 'status'] # Status update usually done via specific endpoint action

class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer

class GrantApplicationViewSet(viewsets.ModelViewSet):
    queryset = GrantApplication.objects.all()
    serializer_class = GrantApplicationSerializer
