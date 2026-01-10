import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import json

def audit_kpis():
    platform = FarmSensePlatform()
    domains = ["planning", "field_prep", "planting", "irrigation", "nutrient", "pest_weed", "harvest", "processing", "packaging", "warehousing", "logistics"]
    
    print("--- KPI Attribution and Aggregatability Audit ---")
    
    for domain in domains:
        # Generate a recommendation with some dummy data to trigger KPI calculation
        inputs = {
            "awc": 40, "prev_awc": 45, "precipitation_forecast": 0, "equipment_available": True,
            "soil_temp": 15, "prev_soil_temp": 14, "seed_ready": True, "labor_available": True,
            "nitrogen": 80, "prev_nitrogen": 85, "crop_stage": "VEGETATIVE", "materials_available": True,
            "pest_count": 5, "prev_pest_count": 4, "humidity": 60,
            "skin_set": True, "queue_size": 30, "capacity_available": True,
            "inventory_level": 500, "storage_temp": 5, "prev_storage_temp": 4,
            "orders_pending": 8, "trucks_available": True,
            "plan_finalized": False, "market_data_ready": True, "compaction_level": 20
        }
        rec = platform.get_recommendation(domain, inputs)
        kpis = rec.get("kpis", {})
        
        print(f"\nDomain: {domain.upper()}")
        if not kpis:
            print("   - WARNING: No KPIs found.")
        else:
            for kpi_name, kpi_value in kpis.items():
                print(f"   - KPI: {kpi_name} = {kpi_value}")
                # Check for time-series compatibility (should be numeric or simple status)
                if isinstance(kpi_value, (int, float)):
                    print("     - Time-series compatible: YES")
                else:
                    print("     - Time-series compatible: NO (Status/String)")
                
                # Check for aggregatability (numeric values are aggregatable)
                if isinstance(kpi_value, (int, float)):
                    print("     - Aggregatable: YES")
                else:
                    print("     - Aggregatable: NO")

if __name__ == "__main__":
    audit_kpis()
