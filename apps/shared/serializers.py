from rest_framework import serializers
from .models import Client, Domain
from django.db import transaction

class TenantRegistrationSerializer(serializers.ModelSerializer):
    domain = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # schema_name is optional, derived from domain if needed, but we include it.
    schema_name = serializers.CharField(required=False) 

    class Meta:
        model = Client
        fields = ['name', 'schema_name', 'domain', 'email', 'password']

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
            # IMPORTANT: For local dev, we append .localhost
            # In validation we should check this.
            full_domain = f"{domain_part}.localhost"
            
            Domain.objects.create(
                domain=full_domain,
                tenant=tenant,
                is_primary=True
            )
            
            # We return tenant, view handles User creation
            # We need to attach the password back to the instance temporarily? 
            # No, view has access to serializer.validated_data['password']
            return tenant
