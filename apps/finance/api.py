from rest_framework import serializers, viewsets
from .models import FundCategory, Transaction, Budget, Asset

class FundCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FundCategory
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        depth = 1 # To show category details if needed, but depth=1 makes writes harder.
        # Let's remove depth=1 and use explicit primary key fields for writes if we want,
        # but for simple CRUD __all__ is fine. 'linked_household' will be an ID.

        read_only_fields = ['audit_status', 'audit_notes', 'is_active', 'date']

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'

# -- Views --

class FundCategoryViewSet(viewsets.ModelViewSet):
    queryset = FundCategory.objects.all()
    serializer_class = FundCategorySerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.filter(is_active=True).order_by('-date')
    serializer_class = TransactionSerializer

    def perform_destroy(self, instance):
        # Soft delete logic
        instance.delete()

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
