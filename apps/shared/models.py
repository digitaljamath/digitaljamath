from django.db import models
import uuid

class Mosque(models.Model):
    name = models.CharField(max_length=100)
    owner_email = models.EmailField(default='admin@localhost.com') # To recover workspaces
    email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_on = models.DateField(auto_now_add=True)
    
    # Feature Flags
    allow_manual_ledger = models.BooleanField(default=False, help_text="Allow this Mosque to use Manual Ledger (Advanced Finance Mode)")
    
    # Add more fields here if needed (e.g. city, contact info)
    
    def __str__(self):
        return self.name

class MosqueScoped(models.Model):
    mosque = models.ForeignKey(Mosque, on_delete=models.CASCADE, related_name='%(class)s_objects', null=True, blank=True)

    class Meta:
        abstract = True

class SystemConfig(models.Model):
    """
    Singleton model for global system configuration.
    Stores API keys and site-wide settings.
    """
    site_name = models.CharField(max_length=100, default="DigitalJamath")
    
    # AI Configuration
    openrouter_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API Key for Basira AI (OpenRouter)")
    
    # Email Configuration (Brevo)
    brevo_api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API Key for Brevo SMTP")
    brevo_email_sender = models.EmailField(default="noreply@project-mizan.com", help_text="Default sender email address")
    
    # Feature Flags
    enable_registration = models.BooleanField(default=True, help_text="Allow new workspaces to register")
    maintenance_mode = models.BooleanField(default=False, help_text="Enable maintenance mode (only admins can login)")
    
    class Meta:
        verbose_name = "System Configuration"
        verbose_name_plural = "System Configuration"

    def __str__(self):
        return "System Configuration"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SystemConfig.objects.exists():
            return SystemConfig.objects.first()
        return super(SystemConfig, self).save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
