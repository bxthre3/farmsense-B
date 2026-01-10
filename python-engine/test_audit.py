import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
from farmsense.core.audit import Reconstructor
import json

def test_audit_reconstruction():
    platform = FarmSensePlatform()
    reconstructor = Reconstructor(platform)
    
    print("--- Audit Reconstruction Test ---")
    
    # 1. Generate a recommendation
    inputs = {"awc": 45, "prev_awc": 50, "precipitation_forecast": 0, "crop_stage": "TUBER_BULKING"}
    rec = platform.get_recommendation("irrigation", inputs)
    audit_id = rec["audit_log_id"]
    print(f"Generated Recommendation ID: {audit_id}")
    print(f"Original Base: {rec['base_recommendation']}")
    
    # 2. Reconstruct it
    print("\nReconstructing from Audit ID...")
    result = reconstructor.reconstruct(audit_id)
    
    print(f"Reconstructed Base: {result['reconstructed']['base_recommendation']}")
    print(f"Match: {result['match']}")
    
    if result['match']:
        print("\nPASS: Recommendation successfully reconstructed and matched.")
    else:
        print("\nFAIL: Reconstruction mismatch.")

if __name__ == "__main__":
    test_audit_reconstruction()
