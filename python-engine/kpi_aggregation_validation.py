import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def validate_aggregation():
    platform = FarmSensePlatform()
    
    # Clear existing logs for clean validation
    for f in os.listdir(platform.audit_logger.log_dir):
        os.remove(os.path.join(platform.audit_logger.log_dir, f))
        
    print("--- KPI Aggregation Validation ---")
    
    # 1. Generate multiple recommendations for the same domain
    print("\n1. Generating multiple recommendations for Irrigation...")
    platform.get_recommendation("irrigation", {"awc": 50, "prev_awc": 55})
    platform.get_recommendation("irrigation", {"awc": 30, "prev_awc": 35})
    platform.get_recommendation("irrigation", {"awc": 10, "prev_awc": 15})
    
    # 2. Aggregate KPIs
    print("\n2. Aggregating KPIs for Irrigation...")
    aggregated = platform.aggregate_kpis("irrigation")
    print(f"   - Aggregated KPIs: {aggregated}")
    
    if "water_efficiency" in aggregated:
        # (50 + 30 + 10) / 3 = 30
        if aggregated["water_efficiency"] == 30.0:
            print("   - PASS: KPI aggregation (average) is correct.")
        else:
            print(f"   - FAIL: Expected 30.0, got {aggregated['water_efficiency']}")
    else:
        print("   - FAIL: water_efficiency KPI missing from aggregation.")

if __name__ == "__main__":
    validate_aggregation()
