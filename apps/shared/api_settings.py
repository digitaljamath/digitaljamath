from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import SystemConfig
from .serializers import SystemConfigSerializer

class SystemConfigView(generics.RetrieveUpdateAPIView):
    """
    API for managing global system settings (API keys, etc).
    Only accessible by Super Admins.
    """
    serializer_class = SystemConfigSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        return SystemConfig.get_solo()

    def update(self, request, *args, **kwargs):
        # Standard update but ensure singleton pattern via get_object
        return super().update(request, *args, **kwargs)
