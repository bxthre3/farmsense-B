import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from farmsense.core.platform import FarmSensePlatform
import requests

def validate_real_world_integration():
    platform = FarmSensePlatform()
    
    # Test location: Boise, Idaho
    lat, lon = 43.6150, -116.2023
    
    print("--- Final Validation: Real-World & Multi-Source Integration ---")
    
    # 1. Test Open-Meteo Ingestion
    print("\n1. Testing Open-Meteo Ingestion...")
    try:
        weather_data = platform.weather_ingestor.fetch(lat, lon)
        print(f"   - Successfully fetched weather data for {lat}, {lon}")
        print(f"   - Current Temp: {weather_data['current']['temperature_2m']}°C")
        print(f"   - Soil Moisture (3-9cm): {weather_data['current']['soil_moisture_3_to_9cm']} m³/m³")
    except Exception as e:
        print(f"   - FAILED: {e}")

    # 2. Test Deterministic Mapping (Volumetric to AWC)
    print("\n2. Testing Deterministic Mapping (Volumetric -> AWC)...")
    from farmsense.data.ingestion import DataValidator
    validated = DataValidator.validate_irrigation_inputs(weather_data)
    print(f"   - Calculated AWC: {validated['awc']}%")
    print(f"   - Soil Temp: {validated['soil_temp']}°C")

    # 3. Test Domain Recommendation (Irrigation) with Real Data
    print("\n3. Testing Domain Recommendation (Irrigation) with Real Data...")
    rec = platform.get_recommendation_with_real_data("irrigation", lat, lon)
    print(f"   - Base Recommendation: {rec['base_recommendation']}")
    print(f"   - Explainability Inputs: {rec['explainability']['inputs_used']}")

    # 4. Test Multi-Source Logic (Manual Override)
    print("\n4. Testing Multi-Source Logic (Manual Override)...")
    # Simulate a manual sensor reading that overrides the public API
    manual_inputs = {"awc": 25} 
    rec_override = platform.get_recommendation_with_real_data("irrigation", lat, lon, manual_inputs=manual_inputs)
    print(f"   - Base with Override (AWC=25): {rec_override['base_recommendation']}")
    print(f"   - Severity Overlays: {rec_override['severity_overlays']}")
    
    if "EMERGENCY" in rec_override['severity_overlays']:
        print("   - PASS: Emergency triggered correctly on low AWC override.")
    else:
        print("   - FAIL: Emergency not triggered.")

if __name__ == "__main__":
    validate_real_world_integration()
