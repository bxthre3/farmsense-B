import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def test_real_data():
    platform = FarmSensePlatform()
    
    # Test location: Idaho Falls, Idaho (Major potato region)
    lat, lon = 43.4917, -112.0340
    
    print(f"--- FarmSense Real-World Data Test (Idaho Falls: {lat}, {lon}) ---")
    
    domains_to_test = ["irrigation", "planting", "field_prep"]
    
    for domain in domains_to_test:
        print(f"\nFetching recommendation for: {domain.upper()}")
        try:
            rec = platform.get_recommendation_with_real_data(domain, lat, lon)
            print(f"Base: {rec['base_recommendation']}")
            print(f"Flags: {rec['context_flags']}")
            print(f"Overlays: {rec['severity_overlays']}")
            print(f"Explainability Inputs: {rec['explainability'].get('inputs')}")
            print(f"Audit ID: {rec['audit_log_id']}")
        except Exception as e:
            print(f"Error fetching data: {e}")

if __name__ == "__main__":
    test_real_data()
