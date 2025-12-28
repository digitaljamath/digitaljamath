from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
import uuid

class Client(TenantMixin):
    name = models.CharField(max_length=100)
    owner_email = models.EmailField(default='admin@localhost.com') # To recover workspaces
    email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_on = models.DateField(auto_now_add=True)

    # Add more fields here if needed (e.g. city, contact info)
    
    def __str__(self):
        return self.name

class Domain(DomainMixin):
    pass
