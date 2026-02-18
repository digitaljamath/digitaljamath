from rest_framework import serializers
from .models import Client, Domain
from django.db import transaction
import os

class TenantRegistrationSerializer(serializers.ModelSerializer):
    domain = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # schema_name is optional, derived from domain if needed, but we include it.
    schema_name = serializers.CharField(required=False) 

    setup_type = serializers.CharField(required=False)

    class Meta:
        model = Client
        fields = ['name', 'schema_name', 'domain', 'email', 'password', 'allow_manual_ledger', 'setup_type']

    def validate_setup_type(self, value):
        if value:
            value = value.upper()
            if value not in Client.SetupType.values:
                 # Fallback/Log or raise? Let's raise to be safe but helpful
                 raise serializers.ValidationError(f"Invalid setup type. Choices: {Client.SetupType.values}")
            return value
        return Client.SetupType.STANDARD

    def create(self, validated_data):
        domain_part = validated_data.pop('domain')
        email = validated_data.pop('email')
        password = validated_data.pop('password') # Removing to not pass to Client.create
        
        # If schema_name wasn't passed, view handles it, or we default here
        if 'schema_name' not in validated_data:
             validated_data['schema_name'] = domain_part.replace('-', '_').lower()

        # Set owner_email for recovery
        validated_data['owner_email'] = email

        with transaction.atomic():
            tenant = Client.objects.create(**validated_data)
            
            # Domain Creation
            # Use DOMAIN_NAME from environment, fallback to localhost for dev
            base_domain = os.environ.get('DOMAIN_NAME', 'localhost')
            full_domain = f"{domain_part}.{base_domain}"
            
            Domain.objects.create(
                domain=full_domain,
                tenant=tenant,
                is_primary=True
            )
            
            # We return tenant, view handles User creation
            # We need to attach the password back to the instance temporarily? 
            # No, view has access to serializer.validated_data['password']
            return tenant
