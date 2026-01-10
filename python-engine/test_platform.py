import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def test_platform():
    platform = FarmSensePlatform()
    
    # Mock inputs for all domains
    test_inputs = {
        "planning": {"plan_finalized": False, "market_data_ready": True},
        "field_prep": {"soil_moisture": 10, "compaction_level": 80, "precipitation_forecast": 0},
        "planting": {"soil_temp": 12, "seed_ready": True},
        "irrigation": {"awc": 35, "et": 5, "forecast_rain": 0, "crop_stage": "TUBER_BULKING"},
        "nutrient": {"nitrogen": 120, "crop_stage": "TUBER_INITIATION"},
        "pest_weed": {"pest_count": 60, "humidity": 90},
        "harvest": {"skin_set": True, "soil_temp": 15},
        "processing": {"queue_size": 10},
        "packaging": {"inventory_level": 1500},
        "warehousing": {"storage_temp": 10},
        "logistics": {"orders_pending": 8}
    }
    
    print("--- FarmSense Platform Test ---")
    recommendations = platform.get_all_recommendations(test_inputs)
    
    for domain, rec in recommendations.items():
        print(f"\nDomain: {domain.upper()}")
        print(f"Base: {rec['base_recommendation']}")
        if rec['context_flags']:
            print(f"Flags: {rec['context_flags']}")
        if rec['severity_overlays']:
            print(f"Overlays: {rec['severity_overlays']}")
        print(f"Explainability: {rec['explainability']}")
        print(f"Audit ID: {rec['audit_log_id']}")

if __name__ == "__main__":
    test_platform()
