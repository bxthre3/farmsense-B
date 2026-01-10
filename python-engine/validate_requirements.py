import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
from farmsense.core.engine import BaseRecommendation, ContextFlag, SeverityOverlay
import datetime

def validate():
    platform = FarmSensePlatform()
    
    print("Checking Requirements...")
    
    # 1. Check all 11 domains
    expected_domains = [
        "planning", "field_prep", "planting", "irrigation", "nutrient",
        "pest_weed", "harvest", "processing", "packaging", "warehousing", "logistics"
    ]
    missing = [d for d in expected_domains if d not in platform.engines]
    print(f"- All 11 domains present: {'PASS' if not missing else f'FAIL (Missing: {missing})'}")
    
    # 2. Check Recommendation Structure
    test_rec = platform.get_recommendation("irrigation", {"awc": 30, "forecast_rain": 0})
    required_fields = [
        "issued_at", "valid_until", "remaining_time", "base_recommendation",
        "context_flags", "severity_overlays", "explainability",
        "predicted_next_recommendation", "audit_log_id"
    ]
    missing_fields = [f for f in required_fields if f not in test_rec]
    print(f"- Recommendation structure valid: {'PASS' if not missing_fields else f'FAIL (Missing: {missing_fields})'}")
    
    # 3. Check Weather Delay Rule
    weather_rec = platform.get_recommendation("irrigation", {"awc": 30, "forecast_rain": 20})
    has_weather_delay = "WEATHER_DELAY" in weather_rec["context_flags"]
    is_wait = "WAIT" in weather_rec["base_recommendation"]
    print(f"- Weather Delay Rule (WAIT + WEATHER_DELAY): {'PASS' if has_weather_delay and is_wait else 'FAIL'}")
    
    # 4. Check Emergency Overlay
    emergency_rec = platform.get_recommendation("irrigation", {"awc": 20, "forecast_rain": 0})
    has_emergency = "EMERGENCY" in emergency_rec["severity_overlays"]
    print(f"- Emergency Overlay: {'PASS' if has_emergency else 'FAIL'}")

    # 5. Check Explainability
    has_explain = bool(test_rec["explainability"])
    print(f"- Explainability present: {'PASS' if has_explain else 'FAIL'}")

if __name__ == "__main__":
    validate()
