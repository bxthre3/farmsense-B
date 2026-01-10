import requests
from typing import Dict, Any, Optional
from datetime import datetime

class DataIngestor:
    """Base class for data ingestion from keyless sources."""
    def fetch(self, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class OpenMeteoIngestor(DataIngestor):
    """Ingests weather and soil data from Open-Meteo (No API Key)."""
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def fetch(self, lat: float, lon: float) -> Dict[str, Any]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": [
                "temperature_2m", "relative_humidity_2m", "precipitation", 
                "soil_temperature_6cm", "soil_moisture_3_to_9cm", "et0_fao_evapotranspiration"
            ],
            "current": [
                "temperature_2m", "relative_humidity_2m", "precipitation",
                "soil_temperature_6cm", "soil_moisture_3_to_9cm"
            ],
            "timezone": "auto",
            "forecast_days": 1
        }
        response = requests.get(self.BASE_URL, params=params)
        response.raise_for_status()
        return response.json()

class FAOSTATIngestor(DataIngestor):
    """Placeholder for FAOSTAT data ingestion (Market/Production)."""
    def fetch(self, area_code: str, item_code: str) -> Dict[str, Any]:
        # In a real scenario, this would call the FAOSTAT API or parse their public CSVs
        # For now, returning mock deterministic data for planning
        return {
            "source": "FAOSTAT",
            "item": "Potatoes",
            "market_trend": "STABLE",
            "avg_price_index": 105.2
        }

class DataValidator:
    """Cross-validates data from multiple sources."""
    @staticmethod
    def validate_irrigation_inputs(open_meteo_data: Dict[str, Any], wapor_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        current = open_meteo_data.get("current", {})
        hourly = open_meteo_data.get("hourly", {})
        
        # Mapping Open-Meteo volumetric soil moisture to AWC % (Simplified deterministic mapping)
        vol_moisture = current.get("soil_moisture_3_to_9cm", 0.2)
        awc_estimate = min(100, max(0, (vol_moisture / 0.4) * 100))
        
        # Trend calculation: compare current with 3 hours ago
        prev_vol_moisture = hourly.get("soil_moisture_3_to_9cm", [vol_moisture])[0]
        prev_awc = min(100, max(0, (prev_vol_moisture / 0.4) * 100))
        
        return {
            "awc": round(awc_estimate, 2),
            "prev_awc": round(prev_awc, 2),
            "soil_temp": current.get("soil_temperature_6cm"),
            "prev_soil_temp": hourly.get("soil_temperature_6cm", [current.get("soil_temperature_6cm")])[0],
            "humidity": current.get("relative_humidity_2m"),
            "precipitation_forecast": sum(hourly.get("precipitation", [])[:6]),
            "et": current.get("et0_fao_evapotranspiration", 0)
        }
