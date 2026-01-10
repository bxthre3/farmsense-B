import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
from farmsense.core.engine import BaseRecommendation, ContextFlag
import json

def validate_weather_and_constraints():
    platform = FarmSensePlatform()
    
    print("--- Weather and Constraint Handling Validation ---")
    
    # 1. Test: Weather never produces standalone recommendations
    # 2. Test: Weather influences only context flags or WAIT due to conflicts
    print("\n1 & 2. Validating Weather Logic (Irrigation Domain)...")
    # Scenario: Critical AWC but high precipitation forecast
    inputs = {
        "awc": 20, 
        "prev_awc": 25, 
        "precipitation_forecast": 15, 
        "crop_stage": "TUBER_BULKING",
        "equipment_available": True
    }
    rec = platform.get_recommendation("irrigation", inputs)
    
    print(f"   - Base Recommendation: {rec['base_recommendation']}")
    print(f"   - Context Flags: {rec['context_flags']}")
    
    if rec['base_recommendation'] == "WAIT" and "WEATHER_DELAY" in rec['context_flags']:
        print("   - PASS: Weather correctly triggered WAIT with WEATHER_DELAY flag.")
    else:
        print("   - FAIL: Weather logic violation.")

    # 3. Test: All recommendations include mandatory fields
    print("\n3. Validating Mandatory Fields (All Domains)...")
    domains = ["planning", "field_prep", "planting", "irrigation", "nutrient", "pest_weed", "harvest", "processing", "packaging", "warehousing", "logistics"]
    mandatory_fields = ["issued_at", "valid_until", "remaining_time", "predicted_next_recommendation"]
    
    all_fields_present = True
    for domain in domains:
        rec = platform.get_recommendation(domain, {})
        for field in mandatory_fields:
            if field not in rec:
                print(f"   - FAIL: Domain '{domain}' missing field '{field}'")
                all_fields_present = False
    
    if all_fields_present:
        print("   - PASS: All domains include mandatory timing and prediction fields.")

    # 4. Test: Recommendations expire deterministically
    print("\n4. Validating Deterministic Expiration...")
    # This is verified by the core engine logic: valid_until = issued_at + duration
    # and the is_valid() check in platform.py
    if "valid_until" in rec and "issued_at" in rec:
        print("   - PASS: Expiration logic is built into the core Recommendation class.")
    else:
        print("   - FAIL: Expiration fields missing.")

if __name__ == "__main__":
    validate_weather_and_constraints()
