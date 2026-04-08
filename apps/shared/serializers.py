from rest_framework import serializers
from .models import Mosque, SystemConfig
from django.db import transaction
import os

class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ['site_name', 'openrouter_api_key', 'brevo_api_key', 'brevo_email_sender', 'enable_registration', 'maintenance_mode']
        extra_kwargs = {
            'openrouter_api_key': {'write_only': True},
            'brevo_api_key': {'write_only': True}
        }

class TenantRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    setup_type = serializers.CharField(required=False)

    class Meta:
        model = Mosque
        fields = ['name', 'email', 'password', 'allow_manual_ledger', 'setup_type']

    def validate_setup_type(self, value):
        if value:
            value = value.upper()
            if value not in ['STANDARD', 'CUSTOM']:
                 raise serializers.ValidationError(f"Invalid setup type.")
            return value
        return 'STANDARD'

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        validated_data['owner_email'] = email

        with transaction.atomic():
            mosque = Mosque.objects.create(**validated_data)
            return mosque
