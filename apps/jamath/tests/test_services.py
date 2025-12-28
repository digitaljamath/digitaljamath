from django.test import TestCase
from apps.jamath.models import Household
from apps.jamath.services import JamathService

class JamathServiceTests(TestCase):
    def test_zakat_eligibility_high_score(self):
        """Test that high score sets status to ZAKAT_ELIGIBLE."""
        household = Household(
            custom_data={'income': 4000, 'has_critical_illness': True, 'widow': True} 
            # 50 + 30 + 20 = 100
        )
        # Mock save to avoid DB
        household.save = lambda: None 
        
        JamathService.calculate_zakat_eligibility(household)
        
        assert household.zakat_score == 100
        assert household.economic_status == Household.EconomicStatus.ZAKAT_ELIGIBLE

    def test_zakat_eligibility_low_score(self):
        """Test that low score sets status correctly."""
        household = Household(
            custom_data={'income': 100000} # Score 0
        )
        household.save = lambda: None
        
        JamathService.calculate_zakat_eligibility(household)
        
        assert household.zakat_score == 0
        assert household.economic_status == Household.EconomicStatus.WEALTHY
