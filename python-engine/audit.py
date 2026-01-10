import json
import os
from typing import Dict, Any, Optional, List
from farmsense.core.engine import Recommendation

class AuditLogger:
    def __init__(self, log_dir: str = "/home/ubuntu/farmsense/logs"):
        self.log_dir = log_dir
        os.makedirs(self.log_dir, exist_ok=True)

    def log_recommendation(self, recommendation: Recommendation):
        log_path = os.path.join(self.log_dir, f"{recommendation.audit_log_id}.json")
        with open(log_path, "w") as f:
            json.dump(recommendation.to_dict(), f, indent=4)
        
        # Also save raw inputs for reconstruction
        input_path = os.path.join(self.log_dir, f"{recommendation.audit_log_id}_inputs.json")
        with open(input_path, "w") as f:
            json.dump({
                "domain": recommendation.domain,
                "raw_inputs": recommendation.raw_inputs,
                "issued_at": recommendation.issued_at.isoformat()
            }, f, indent=4)

    def get_log(self, audit_id: str) -> Optional[Dict[str, Any]]:
        log_path = os.path.join(self.log_dir, f"{audit_id}.json")
        if os.path.exists(log_path):
            with open(log_path, "r") as f:
                return json.load(f)
        return None

    def get_inputs(self, audit_id: str) -> Optional[Dict[str, Any]]:
        input_path = os.path.join(self.log_dir, f"{audit_id}_inputs.json")
        if os.path.exists(input_path):
            with open(input_path, "r") as f:
                return json.load(f)
        return None

    def get_all_logs(self) -> List[Dict[str, Any]]:
        logs = []
        for filename in os.listdir(self.log_dir):
            if filename.endswith(".json") and not filename.endswith("_inputs.json"):
                with open(os.path.join(self.log_dir, filename), "r") as f:
                    logs.append(json.load(f))
        return logs

class Reconstructor:
    def __init__(self, platform):
        self.platform = platform
        self.audit_logger = AuditLogger()

    def reconstruct(self, audit_id: str) -> Dict[str, Any]:
        input_data = self.audit_logger.get_inputs(audit_id)
        if not input_data:
            raise ValueError(f"Audit ID {audit_id} not found.")
        
        domain = input_data["domain"]
        raw_inputs = input_data["raw_inputs"]
        
        # Re-run the engine with the same inputs
        reconstructed_rec = self.platform.get_recommendation(domain, raw_inputs)
        
        # Compare with original log
        original_log = self.audit_logger.get_log(audit_id)
        
        return {
            "original": original_log,
            "reconstructed": reconstructed_rec,
            "match": reconstructed_rec["base_recommendation"] == original_log["base_recommendation"]
        }
