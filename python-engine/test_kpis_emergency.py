import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def test_kpis_and_emergency():
    platform = FarmSensePlatform()
    
    print("--- KPI and Emergency Confirmation Test ---")
    
    # 1. Test Irrigation KPIs
    print("\n1. Testing Irrigation KPIs...")
    inputs = {"awc": 25, "prev_awc": 30, "precipitation_forecast": 0, "crop_stage": "TUBER_BULKING"}
    rec = platform.get_recommendation("irrigation", inputs)
    print(f"   - Base: {rec['base_recommendation']}")
    print(f"   - KPIs: {rec['kpis']}")
    print(f"   - Overlays: {rec['severity_overlays']}")
    print(f"   - Requires Confirmation: {rec['requires_human_confirmation']}")
    
    # 2. Test Emergency Confirmation
    print("\n2. Testing Emergency Confirmation...")
    audit_id = rec["audit_log_id"]
    confirm_result = platform.confirm_emergency(audit_id)
    print(f"   - Confirmation Status: {confirm_result['status']}")
    print(f"   - Confirmed At: {confirm_result['confirmed_at']}")
    
    # 3. Test Warehousing KPIs (Loss Reduction)
    print("\n3. Testing Warehousing KPIs...")
    inputs_wh = {"storage_temp": 12, "prev_storage_temp": 10}
    rec_wh = platform.get_recommendation("warehousing", inputs_wh)
    print(f"   - Base: {rec_wh['base_recommendation']}")
    print(f"   - KPIs: {rec_wh['kpis']}")
    
    # 4. Test Operator Visibility (Validity Window)
    print("\n4. Testing Operator Visibility...")
    print(f"   - Remaining Time: {rec['remaining_time']}")
    
    if rec['kpis']['stress_avoidance'] < 100 and confirm_result['status'] == "CONFIRMED":
        print("\nPASS: KPIs wired correctly and emergency confirmation functional.")
    else:
        print("\nFAIL: KPI or emergency logic mismatch.")

if __name__ == "__main__":
    test_kpis_and_emergency()
