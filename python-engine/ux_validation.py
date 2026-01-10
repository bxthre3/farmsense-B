import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def validate_ux():
    platform = FarmSensePlatform()
    
    print("--- Operator UX Validation ---")
    
    # Test: Urgency signaling and color coding
    print("\n1. Validating Urgency and Color Coding (Irrigation Domain)...")
    # Scenario: Critical AWC (NOW) - Use 50% which is < 65% but > 40% (emergency)
    inputs = {"awc": 50, "prev_awc": 55, "precipitation_forecast": 0, "equipment_available": True}
    rec = platform.get_recommendation("irrigation", inputs)
    
    print(f"   - Base Recommendation: {rec['base_recommendation']}")
    print(f"   - Urgency Level: {rec['urgency_level']}")
    print(f"   - Display Color: {rec['display_color']}")
    
    if rec['urgency_level'] == "HIGH" and rec['display_color'] == "ORANGE":
        print("   - PASS: Urgency and color correctly mapped for NOW.")
    else:
        print("   - FAIL: Urgency/Color mapping violation.")

    # Test: Emergency Urgency
    print("\n2. Validating Emergency Urgency...")
    # Scenario: Emergency AWC
    inputs = {"awc": 5, "prev_awc": 10, "precipitation_forecast": 0, "equipment_available": True}
    rec = platform.get_recommendation("irrigation", inputs)
    print(f"   - Urgency Level: {rec['urgency_level']}")
    if rec['urgency_level'] == "CRITICAL":
        print("   - PASS: Emergency correctly escalated urgency to CRITICAL.")
    else:
        print("   - FAIL: Emergency urgency escalation violation.")

    # Test: Recommendation Language
    print("\n3. Validating Recommendation Language...")
    explain = rec['explainability']
    print(f"   - Thresholds Crossed: {explain['thresholds_crossed']}")
    if any("Available Water Content" in t for t in explain['thresholds_crossed']):
        print("   - PASS: Recommendation language is clear and human-readable.")
    else:
        print("   - FAIL: Recommendation language is still too technical/cryptic.")

if __name__ == "__main__":
    validate_ux()
