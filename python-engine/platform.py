import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from farmsense.core.engine import Recommendation
from farmsense.domains.potato_logic import (
    PlanningEngine, FieldPrepEngine, PlantingEngine, IrrigationEngine,
    NutrientEngine, PestWeedEngine, HarvestEngine, ProcessingEngine,
    PackagingEngine, WarehousingEngine, LogisticsEngine
)

from farmsense.data.ingestion import OpenMeteoIngestor, DataValidator
from farmsense.core.audit import AuditLogger

class FarmSensePlatform:
    def __init__(self):
        self.engines = {
            "planning": PlanningEngine(),
            "field_prep": FieldPrepEngine(),
            "planting": PlantingEngine(),
            "irrigation": IrrigationEngine(),
            "nutrient": NutrientEngine(),
            "pest_weed": PestWeedEngine(),
            "harvest": HarvestEngine(),
            "processing": ProcessingEngine(),
            "packaging": PackagingEngine(),
            "warehousing": WarehousingEngine(),
            "logistics": LogisticsEngine()
        }
        self.weather_ingestor = OpenMeteoIngestor()
        self.audit_logger = AuditLogger()

    def get_recommendation_with_real_data(self, domain: str, lat: float, lon: float, manual_inputs: Dict[str, Any] = None) -> Dict[str, Any]:
        domain = domain.lower()
        if domain not in self.engines:
            raise ValueError(f"Unknown domain: {domain}")
        
        # Fetch real-world data
        weather_data = self.weather_ingestor.fetch(lat, lon)
        validated_inputs = DataValidator.validate_irrigation_inputs(weather_data)
        
        # Merge with manual inputs (manual overrides real-world if provided)
        final_inputs = {**validated_inputs, **(manual_inputs or {})}
        
        recommendation_obj = self.engines[domain].generate_recommendation(final_inputs)
        self.audit_logger.log_recommendation(recommendation_obj)
        return self._filter_for_operator(recommendation_obj)

    def get_recommendation(self, domain: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        domain = domain.lower()
        if domain not in self.engines:
            raise ValueError(f"Unknown domain: {domain}")
        
        recommendation_obj = self.engines[domain].generate_recommendation(inputs)
        self.audit_logger.log_recommendation(recommendation_obj)
        return self._filter_for_operator(recommendation_obj)

    def _filter_for_operator(self, recommendation_obj: Recommendation) -> Dict[str, Any]:
        """Refine visibility: operators see only valid recommendations and key flags."""
        if not recommendation_obj.is_valid():
            return {"status": "EXPIRED", "audit_log_id": recommendation_obj.audit_log_id}
        
        return recommendation_obj.to_dict()

    def confirm_emergency(self, audit_id: str) -> Dict[str, Any]:
        """Explicit human confirmation for emergency overlays."""
        log = self.audit_logger.get_log(audit_id)
        if not log:
            raise ValueError(f"Audit ID {audit_id} not found.")
        
        if "EMERGENCY" not in log["severity_overlays"]:
            return {"status": "NO_EMERGENCY", "audit_log_id": audit_id}
        
        # In a real system, we'd update the database. Here we update the log file.
        log["confirmed_at"] = datetime.now().isoformat()
        import json
        log_path = os.path.join(self.audit_logger.log_dir, f"{audit_id}.json")
        with open(log_path, "w") as f:
            json.dump(log, f, indent=4)
            
        return {"status": "CONFIRMED", "confirmed_at": log["confirmed_at"], "audit_log_id": audit_id}

    def get_all_recommendations(self, all_inputs: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        results = {}
        for domain in self.engines:
            inputs = all_inputs.get(domain, {})
            results[domain] = self.get_recommendation(domain, inputs)
        return results

    def aggregate_kpis(self, domain: Optional[str] = None) -> Dict[str, float]:
        """Aggregate KPIs from the audit log for a specific domain or all domains."""
        logs = self.audit_logger.get_all_logs()
        aggregated = {}
        counts = {}
        
        for log in logs:
            # The Recommendation.to_dict() doesn't include 'domain' directly, 
            # but it's in the audit log structure or we can add it.
            # Let's check the log structure.
            log_domain = log.get("domain")
            if not log_domain:
                # Fallback to checking if it's in the audit log filename or similar
                # For now, let's ensure it's in the to_dict()
                continue
                
            if domain and log_domain.lower() != domain.lower():
                continue
            
            kpis = log.get("kpis", {})
            for k, v in kpis.items():
                if isinstance(v, (int, float)):
                    aggregated[k] = aggregated.get(k, 0) + v
                    counts[k] = counts.get(k, 0) + 1
        
        # Calculate averages
        for k in aggregated:
            aggregated[k] = round(aggregated[k] / counts[k], 2)
            
        return aggregated
