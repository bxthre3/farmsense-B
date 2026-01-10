from farmsense.core.engine import DomainEngine, Recommendation, BaseRecommendation, ContextFlag, SeverityOverlay
from farmsense.data.thresholds import POTATO_THRESHOLDS
from typing import Dict, Any, List, Optional

class DeterministicEngine(DomainEngine):
    """Base class for deterministic domain engines with trend awareness and KPI tracking."""
    
    def calculate_trend(self, current: float, previous: Optional[float], rate_of_change: Optional[float] = None) -> str:
        if previous is None:
            return "STABLE"
        if rate_of_change is not None:
            if rate_of_change > 0: return "INCREASING"
            if rate_of_change < 0: return "DECREASING"
        if current < previous: return "DECREASING"
        if current > previous: return "INCREASING"
        return "STABLE"

class PlanningEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("PLANNING")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        plan_finalized = inputs.get("plan_finalized", False)
        market_data_ready = inputs.get("market_data_ready", False)
        labor_available = inputs.get("labor_available", True)
        
        crossed = []
        flags = []
        kpis = {"operational_readiness": 0}
        predicted_next = BaseRecommendation.WAIT

        if not labor_available:
            flags.append(ContextFlag.LABOR_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif not plan_finalized and market_data_ready:
            base = BaseRecommendation.NOW
            crossed.append("Market data is ready for final planning.")
            kpis["operational_readiness"] = 100
            predicted_next = BaseRecommendation.WAIT
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["plan_finalized", "market_data_ready", "labor_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Market data availability"],
            "crop_stage": "PRE-SEASON"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class FieldPrepEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("FIELD_PREP")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        awc = inputs.get("awc", 100)
        compaction = inputs.get("compaction_level", 0)
        precip_forecast = inputs.get("precipitation_forecast", 0)
        equipment_available = inputs.get("equipment_available", True)
        
        flags = []
        crossed = []
        kpis = {"soil_health_index": 100 - compaction}
        predicted_next = BaseRecommendation.WAIT

        if not equipment_available:
            flags.append(ContextFlag.EQUIPMENT_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif precip_forecast > 5:
            flags.append(ContextFlag.WEATHER_DELAY)
            base = BaseRecommendation.WAIT
            crossed.append(f"Precipitation forecast ({precip_forecast}mm) exceeds the 5mm threshold for field work.")
            kpis["operational_delay_risk"] = 100 # Numeric for aggregation
            predicted_next = BaseRecommendation.SOON
        elif awc < 30 and compaction > 70:
            base = BaseRecommendation.NOW
            crossed.append(f"Soil moisture ({awc}%) is low and compaction ({compaction}) is high, requiring immediate preparation.")
            kpis["stress_avoidance_potential"] = 100
            predicted_next = BaseRecommendation.WAIT
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["awc", "compaction_level", "precipitation_forecast", "equipment_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Soil moisture and compaction trends"],
            "crop_stage": "PRE-PLANTING"
        }
        return Recommendation(self.domain_name, base, context_flags=flags, explainability=explain, raw_inputs=inputs, kpis=kpis, predicted_next=predicted_next)

class PlantingEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("PLANTING")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        soil_temp = inputs.get("soil_temp", 0)
        prev_temp = inputs.get("prev_soil_temp")
        seed_ready = inputs.get("seed_ready", True)
        labor_available = inputs.get("labor_available", True)
        
        trend = self.calculate_trend(soil_temp, prev_temp)
        thresh = POTATO_THRESHOLDS["planting"]
        crossed = []
        approaching = []
        flags = []
        kpis = {"planting_window_optimization": 0}
        predicted_next = BaseRecommendation.WAIT

        if not labor_available:
            flags.append(ContextFlag.LABOR_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif seed_ready and thresh["min_soil_temp"] <= soil_temp <= thresh["max_soil_temp"]:
            base = BaseRecommendation.NOW
            crossed.append(f"Soil temperature ({soil_temp}°C) is within the optimal planting range ({thresh['min_soil_temp']}°C to {thresh['max_soil_temp']}°C).")
            kpis["planting_window_optimization"] = 100
            predicted_next = BaseRecommendation.WAIT
        elif seed_ready and soil_temp < thresh["min_soil_temp"] and trend == "INCREASING":
            base = BaseRecommendation.SOON
            approaching.append(f"Soil temperature ({soil_temp}°C) is warming toward the minimum planting threshold ({thresh['min_soil_temp']}°C).")
            kpis["planting_window_optimization"] = 50
            predicted_next = BaseRecommendation.NOW
        elif seed_ready and soil_temp < thresh["min_soil_temp"]:
            base = BaseRecommendation.MONITOR
            predicted_next = BaseRecommendation.SOON
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["soil_temp", "prev_soil_temp", "seed_ready", "labor_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": approaching,
            "trends_considered": [f"Soil temperature is {trend}"],
            "crop_stage": "PLANTING"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class IrrigationEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("IRRIGATION")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        awc = inputs.get("awc", 100)
        prev_awc = inputs.get("prev_awc")
        precip_forecast = inputs.get("precipitation_forecast", 0)
        equipment_available = inputs.get("equipment_available", True)
        
        thresh = POTATO_THRESHOLDS["irrigation"]
        stage = inputs.get("crop_stage", "VEGETATIVE")
        
        trend = self.calculate_trend(awc, prev_awc)
        flags = []
        overlays = []
        crossed = []
        approaching = []
        kpis = {"water_efficiency": awc, "stress_avoidance": 100}
        predicted_next = BaseRecommendation.WAIT

        if not equipment_available:
            flags.append(ContextFlag.EQUIPMENT_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif awc < thresh["critical_awc"]:
            crossed.append(f"Available Water Content ({awc}%) has dropped below the critical threshold ({thresh['critical_awc']}%).")
            kpis["stress_avoidance"] = max(0, 100 - (thresh["critical_awc"] - awc) * 5)
            if precip_forecast > thresh["weather_delay_precip"]:
                base = BaseRecommendation.WAIT
                flags.append(ContextFlag.WEATHER_DELAY)
                kpis["water_savings_potential"] = precip_forecast * 10
                predicted_next = BaseRecommendation.NOW
            else:
                base = BaseRecommendation.NOW
                if awc < thresh["emergency_awc"]:
                    overlays.append(SeverityOverlay.EMERGENCY)
                    crossed.append(f"Available Water Content ({awc}%) is at a dangerous level (below {thresh['emergency_awc']}%).")
                predicted_next = BaseRecommendation.WAIT
        elif awc < thresh["soon_awc"]:
            approaching.append(f"Available Water Content ({awc}%) is nearing the critical irrigation threshold ({thresh['critical_awc']}%).")
            if trend == "DECREASING":
                base = BaseRecommendation.SOON
                predicted_next = BaseRecommendation.NOW
            else:
                base = BaseRecommendation.LATER
                predicted_next = BaseRecommendation.SOON
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["awc", "prev_awc", "precipitation_forecast", "equipment_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": approaching,
            "trends_considered": [f"Available Water Content is {trend}"],
            "crop_stage": stage
        }
        return Recommendation(self.domain_name, base, context_flags=flags, severity_overlays=overlays, explainability=explain, raw_inputs=inputs, kpis=kpis, predicted_next=predicted_next)

class NutrientEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("NUTRIENT")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        n_level = inputs.get("nitrogen", 100)
        prev_n_level = inputs.get("prev_nitrogen")
        stage = inputs.get("crop_stage", "VEGETATIVE")
        target = POTATO_THRESHOLDS["nutrient"]["nitrogen_targets"].get(stage, 100)
        materials_available = inputs.get("materials_available", True)
        
        trend = self.calculate_trend(n_level, prev_n_level)
        crossed = []
        approaching = []
        flags = []
        kpis = {"nutrient_use_efficiency": 100 if n_level >= target else (n_level / target) * 100}
        predicted_next = BaseRecommendation.WAIT

        if not materials_available:
            flags.append(ContextFlag.MATERIALS_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif n_level < target:
            base = BaseRecommendation.NOW
            crossed.append(f"Nitrogen level ({n_level}) is below the target ({target}) for the {stage} stage.")
            predicted_next = BaseRecommendation.WAIT
        elif n_level < target * 1.1:
            base = BaseRecommendation.SOON
            approaching.append(f"Nitrogen level ({n_level}) is approaching the target ({target}).")
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["nitrogen", "prev_nitrogen", "crop_stage", "materials_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": approaching,
            "trends_considered": [f"Nitrogen level is {trend}"],
            "crop_stage": stage
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class PestWeedEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("PEST_WEED")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        pest_count = inputs.get("pest_count", 0)
        prev_pest = inputs.get("prev_pest_count")
        humidity = inputs.get("humidity", 0)
        equipment_available = inputs.get("equipment_available", True)
        
        thresh = POTATO_THRESHOLDS["pest_weed"]
        
        trend = self.calculate_trend(pest_count, prev_pest)
        overlays = []
        crossed = []
        approaching = []
        flags = []
        kpis = {"crop_health_protection": 100 - pest_count}
        predicted_next = BaseRecommendation.WAIT

        if not equipment_available:
            flags.append(ContextFlag.EQUIPMENT_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif pest_count > thresh["pest_count_threshold"] or humidity > thresh["humidity_threshold"]:
            base = BaseRecommendation.NOW
            if pest_count > thresh["pest_count_threshold"]: crossed.append(f"Pest count ({pest_count}) exceeds the threshold ({thresh['pest_count_threshold']}).")
            if humidity > thresh["humidity_threshold"]: crossed.append(f"Humidity ({humidity}%) exceeds the disease risk threshold ({thresh['humidity_threshold']}%).")
            if pest_count > thresh["emergency_pest_count"]:
                overlays.append(SeverityOverlay.EMERGENCY)
                crossed.append(f"Pest count ({pest_count}) is at an emergency level (above {thresh['emergency_pest_count']}).")
            predicted_next = BaseRecommendation.WAIT
        elif trend == "INCREASING":
            base = BaseRecommendation.MONITOR
            approaching.append(f"Pest count ({pest_count}) is increasing toward the threshold ({thresh['pest_count_threshold']}).")
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["pest_count", "prev_pest_count", "humidity", "equipment_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": approaching,
            "trends_considered": [f"Pest count is {trend}"],
            "crop_stage": "GROWTH"
        }
        return Recommendation(self.domain_name, base, severity_overlays=overlays, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class HarvestEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("HARVEST")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        skin_set = inputs.get("skin_set", False)
        soil_temp = inputs.get("soil_temp", 0)
        labor_available = inputs.get("labor_available", True)
        equipment_available = inputs.get("equipment_available", True)
        
        thresh = POTATO_THRESHOLDS["harvest"]
        
        crossed = []
        flags = []
        kpis = {"harvest_readiness": 100 if skin_set else 50}
        predicted_next = BaseRecommendation.WAIT

        if not labor_available:
            flags.append(ContextFlag.LABOR_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif not equipment_available:
            flags.append(ContextFlag.EQUIPMENT_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif skin_set and thresh["min_soil_temp"] <= soil_temp <= thresh["max_soil_temp"]:
            base = BaseRecommendation.NOW
            crossed.append("Skin set is complete and soil temperature is optimal for harvest.")
            predicted_next = BaseRecommendation.WAIT
        elif skin_set:
            base = BaseRecommendation.MONITOR
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["skin_set", "soil_temp", "labor_available", "equipment_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Maturity and soil temp trends"],
            "crop_stage": "MATURITY"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class ProcessingEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("PROCESSING")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        queue = inputs.get("queue_size", 0)
        capacity_available = inputs.get("capacity_available", True)
        
        crossed = []
        flags = []
        kpis = {"throughput_efficiency": max(0, 100 - queue)}
        predicted_next = BaseRecommendation.WAIT

        if not capacity_available:
            flags.append(ContextFlag.CAPACITY_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif queue > 50:
            base = BaseRecommendation.NOW
            crossed.append(f"Processing queue ({queue}) exceeds the high-priority threshold (50).")
            predicted_next = BaseRecommendation.WAIT
        elif queue > 20:
            base = BaseRecommendation.SOON
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["queue_size", "capacity_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Throughput trends"],
            "crop_stage": "POST-HARVEST"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class PackagingEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("PACKAGING")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        inventory = inputs.get("inventory_level", 0)
        materials_available = inputs.get("materials_available", True)
        
        crossed = []
        flags = []
        kpis = {"inventory_turnover_potential": inventory / 10}
        predicted_next = BaseRecommendation.WAIT

        if not materials_available:
            flags.append(ContextFlag.MATERIALS_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif inventory > 1000:
            base = BaseRecommendation.NOW
            crossed.append(f"Inventory level ({inventory}) exceeds the packaging threshold (1000).")
            predicted_next = BaseRecommendation.WAIT
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["inventory_level", "materials_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Inventory accumulation rate"],
            "crop_stage": "POST-HARVEST"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class WarehousingEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("WAREHOUSING")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        temp = inputs.get("storage_temp", 4)
        prev_temp = inputs.get("prev_storage_temp")
        capacity_available = inputs.get("capacity_available", True)
        
        thresh = POTATO_THRESHOLDS["warehousing"]
        
        trend = self.calculate_trend(temp, prev_temp)
        overlays = []
        crossed = []
        approaching = []
        flags = []
        kpis = {"post_harvest_loss_reduction": 100 - (temp - thresh["max_temp"]) * 10 if temp > thresh["max_temp"] else 100}
        predicted_next = BaseRecommendation.WAIT

        if not capacity_available:
            flags.append(ContextFlag.CAPACITY_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif temp > thresh["max_temp"]:
            base = BaseRecommendation.NOW
            overlays.append(SeverityOverlay.EMERGENCY)
            crossed.append(f"Storage temperature ({temp}°C) exceeds the maximum safe threshold ({thresh['max_temp']}°C).")
            predicted_next = BaseRecommendation.WAIT
        elif trend == "INCREASING":
            base = BaseRecommendation.MONITOR
            approaching.append(f"Storage temperature ({temp}°C) is increasing toward the maximum threshold ({thresh['max_temp']}°C).")
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["storage_temp", "prev_storage_temp", "capacity_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": approaching,
            "trends_considered": [f"Storage temperature is {trend}"],
            "crop_stage": "STORAGE"
        }
        return Recommendation(self.domain_name, base, severity_overlays=overlays, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)

class LogisticsEngine(DeterministicEngine):
    def __init__(self):
        super().__init__("LOGISTICS")

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        orders = inputs.get("orders_pending", 0)
        trucks_available = inputs.get("trucks_available", True)
        
        crossed = []
        flags = []
        kpis = {"dispatch_efficiency": 100 - orders}
        predicted_next = BaseRecommendation.WAIT

        if not trucks_available:
            flags.append(ContextFlag.EQUIPMENT_CONSTRAINT)
            base = BaseRecommendation.WAIT
        elif orders > 10:
            base = BaseRecommendation.NOW
            crossed.append(f"Pending orders ({orders}) exceed the immediate dispatch threshold (10).")
            predicted_next = BaseRecommendation.WAIT
        elif orders > 5:
            base = BaseRecommendation.SOON
            predicted_next = BaseRecommendation.NOW
        else:
            base = BaseRecommendation.WAIT
            
        explain = {
            "inputs_used": ["orders_pending", "trucks_available"],
            "thresholds_crossed": crossed,
            "thresholds_approaching": [],
            "trends_considered": ["Order fulfillment rate"],
            "crop_stage": "DISTRIBUTION"
        }
        return Recommendation(self.domain_name, base, explainability=explain, raw_inputs=inputs, kpis=kpis, context_flags=flags, predicted_next=predicted_next)
