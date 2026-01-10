import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
from farmsense.core.engine import BaseRecommendation
import json

def validate_all_domains():
    platform = FarmSensePlatform()
    domains = [
        "planning", "field_prep", "planting", "irrigation", "nutrient",
        "pest_weed", "harvest", "processing", "packaging", "warehousing", "logistics"
    ]
    
    print("--- Comprehensive FarmSense Validation ---")
    
    all_passed = True
    for domain in domains:
        print(f"\nValidating Domain: {domain.upper()}")
        try:
            # Test with minimal inputs
            rec = platform.get_recommendation(domain, {})
            
            # 1. Check Unified Structure
            required_keys = [
                "issued_at", "valid_until", "remaining_time", "base_recommendation",
                "context_flags", "severity_overlays", "explainability", "kpis",
                "audit_log_id"
            ]
            for key in required_keys:
                if key not in rec:
                    print(f"   - FAIL: Missing key '{key}'")
                    all_passed = False
            
            # 2. Check Base Recommendation
            valid_bases = [b.value for b in BaseRecommendation]
            if rec["base_recommendation"] not in valid_bases:
                print(f"   - FAIL: Invalid base recommendation '{rec['base_recommendation']}'")
                all_passed = False
            
            # 3. Check Explainability
            exp = rec["explainability"]
            exp_keys = ["inputs_used", "thresholds_crossed", "thresholds_approaching", "trends_considered", "crop_stage"]
            for key in exp_keys:
                if key not in exp:
                    print(f"   - FAIL: Missing explainability key '{key}'")
                    all_passed = False
            
            # 4. Check KPIs
            if not rec["kpis"]:
                print(f"   - FAIL: No KPIs wired for domain")
                all_passed = False
            
            print(f"   - PASS: Structure, Base, Explainability, and KPIs validated.")
            
        except Exception as e:
            print(f"   - ERROR: {e}")
            all_passed = False

    if all_passed:
        print("\nGLOBAL VALIDATION SUCCESS: All domains conform to FarmSense standards.")
    else:
        print("\nGLOBAL VALIDATION FAILURE: Inconsistencies detected.")

if __name__ == "__main__":
    validate_all_domains()
