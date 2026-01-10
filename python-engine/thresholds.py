from typing import Dict, Any

POTATO_THRESHOLDS = {
    "growth_stages": [
        "SPROUT_DEVELOPMENT",
        "VEGETATIVE",
        "TUBER_INITIATION",
        "TUBER_BULKING",
        "MATURITY"
    ],
    "irrigation": {
        "critical_awc": 65,  # Allowable Water Content %
        "emergency_awc": 40,
        "soon_awc": 75,
        "weather_delay_precip": 5.0  # mm
    },
    "planting": {
        "min_soil_temp": 7,  # Celsius
        "max_soil_temp": 15,
        "optimal_soil_temp": 12
    },
    "nutrient": {
        "nitrogen_targets": {
            "SPROUT_DEVELOPMENT": 50,
            "VEGETATIVE": 100,
            "TUBER_INITIATION": 150,
            "TUBER_BULKING": 120,
            "MATURITY": 50
        }
    },
    "pest_weed": {
        "humidity_threshold": 85,
        "pest_count_threshold": 10,
        "emergency_pest_count": 50
    },
    "harvest": {
        "min_soil_temp": 10,
        "max_soil_temp": 18,
        "skin_set_required": True
    },
    "warehousing": {
        "optimal_temp": 4,
        "max_temp": 8
    }
}
