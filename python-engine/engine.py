from enum import Enum
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid

class BaseRecommendation(Enum):
    NOW = "NOW"
    SOON = "SOON"
    LATER = "LATER"
    WAIT = "WAIT"
    MONITOR = "MONITOR"

class ContextFlag(Enum):
    WEATHER_DELAY = "WEATHER_DELAY"
    LABOR_CONSTRAINT = "LABOR_CONSTRAINT"
    EQUIPMENT_CONSTRAINT = "EQUIPMENT_CONSTRAINT"
    CAPACITY_CONSTRAINT = "CAPACITY_CONSTRAINT"
    MATERIALS_CONSTRAINT = "MATERIALS_CONSTRAINT"

class SeverityOverlay(Enum):
    EMERGENCY = "EMERGENCY"

class Recommendation:
    def __init__(
        self,
        domain: str,
        base: BaseRecommendation,
        context_flags: List[ContextFlag] = None,
        severity_overlays: List[SeverityOverlay] = None,
        explainability: Dict[str, Any] = None,
        predicted_next: Optional[BaseRecommendation] = None,
        valid_duration_hours: int = 4,
        raw_inputs: Dict[str, Any] = None,
        kpis: Dict[str, Any] = None
    ):
        self.issued_at = datetime.now()
        self.valid_until = self.issued_at + timedelta(hours=valid_duration_hours)
        self.domain = domain
        # Enforce unified base recommendation: NOW, SOON, LATER, WAIT, MONITOR
        self.base_recommendation = base.value
        self.context_flags = [flag.value for flag in (context_flags or [])]
        self.severity_overlays = [overlay.value for overlay in (severity_overlays or [])]
        
        # Emergency Confirmation Logic
        self.requires_human_confirmation = SeverityOverlay.EMERGENCY.value in self.severity_overlays
        self.confirmed_at = None

        # Mandatory Explainability Structure
        self.explainability = {
            "inputs_used": explainability.get("inputs_used", []),
            "thresholds_crossed": explainability.get("thresholds_crossed", []),
            "thresholds_approaching": explainability.get("thresholds_approaching", []),
            "trends_considered": explainability.get("trends_considered", []),
            "crop_stage": explainability.get("crop_stage", "UNKNOWN")
        }
        
        self.kpis = kpis or {} # Linked KPIs (e.g., water_efficiency, stress_avoidance)
        self.predicted_next_recommendation = predicted_next.value if predicted_next else None
        self.audit_log_id = str(uuid.uuid4())
        self.raw_inputs = raw_inputs or {} # For reconstruction

    def confirm_emergency(self):
        if self.requires_human_confirmation:
            self.confirmed_at = datetime.now().isoformat()

    def is_valid(self) -> bool:
        return datetime.now() < self.valid_until

    @property
    def remaining_time(self) -> str:
        remaining = self.valid_until - datetime.now()
        if remaining.total_seconds() <= 0:
            return "00:00:00"
        hours, remainder = divmod(int(remaining.total_seconds()), 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02}:{minutes:02}:{seconds:02}"

    def to_dict(self) -> Dict[str, Any]:
        # Urgency signaling based on base recommendation
        urgency_map = {
            "NOW": "HIGH",
            "SOON": "MEDIUM",
            "LATER": "LOW",
            "WAIT": "NONE",
            "MONITOR": "INFO"
        }
        
        # Color coding for UX (text-based representation)
        color_map = {
            "NOW": "ORANGE",
            "SOON": "YELLOW",
            "LATER": "BLUE",
            "WAIT": "GREEN",
            "MONITOR": "CYAN"
        }
        
        # Emergency override for urgency
        urgency = urgency_map.get(self.base_recommendation, "NONE")
        if "EMERGENCY" in self.severity_overlays:
            urgency = "CRITICAL"

        return {
            "domain": self.domain,
            "issued_at": self.issued_at.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "remaining_time": self.remaining_time,
            "base_recommendation": self.base_recommendation,
            "urgency_level": urgency,
            "display_color": color_map.get(self.base_recommendation, "WHITE"),
            "context_flags": self.context_flags,
            "severity_overlays": self.severity_overlays,
            "requires_human_confirmation": self.requires_human_confirmation,
            "confirmed_at": self.confirmed_at,
            "explainability": self.explainability,
            "kpis": self.kpis,
            "predicted_next_recommendation": self.predicted_next_recommendation,
            "audit_log_id": self.audit_log_id
        }

class DomainEngine:
    def __init__(self, domain_name: str):
        self.domain_name = domain_name

    def generate_recommendation(self, inputs: Dict[str, Any]) -> Recommendation:
        raise NotImplementedError("Subclasses must implement generate_recommendation")
