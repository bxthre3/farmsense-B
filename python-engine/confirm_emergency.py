#!/usr/bin/env python3
"""
Emergency Confirmation Script
Confirms an emergency recommendation by audit log ID
"""

import sys
import json
from datetime import datetime

try:
    from audit import AuditLogger
except ImportError:
    from farmsense.core.audit import AuditLogger


def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        request = json.loads(input_data)

        audit_log_id = request.get("audit_log_id")

        if not audit_log_id:
            raise ValueError("audit_log_id is required")

        # Create audit logger and confirm emergency
        audit_logger = AuditLogger()
        log = audit_logger.get_log(audit_log_id)

        if not log:
            raise ValueError(f"Audit ID {audit_log_id} not found")

        if "EMERGENCY" not in log.get("severity_overlays", []):
            output = {"status": "NO_EMERGENCY", "audit_log_id": audit_log_id}
        else:
            # Update the log with confirmation
            log["confirmed_at"] = datetime.now().isoformat()
            audit_logger.update_log(audit_log_id, log)

            output = {
                "status": "CONFIRMED",
                "confirmed_at": log["confirmed_at"],
                "audit_log_id": audit_log_id,
            }

        print(json.dumps(output, indent=2))

    except Exception as e:
        error_output = {
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
