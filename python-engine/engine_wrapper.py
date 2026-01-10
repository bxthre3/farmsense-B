#!/usr/bin/env python3
"""
Engine Wrapper Script
Reads JSON input from stdin, generates a recommendation, and outputs JSON to stdout
This allows Node.js to call the Python engine via subprocess
"""

import sys
import json
from datetime import datetime, timedelta
from enum import Enum

# Import the domain engines
try:
    from potato_logic import (
        PlanningEngine, FieldPrepEngine, PlantingEngine, IrrigationEngine,
        NutrientEngine, PestWeedEngine, HarvestEngine, ProcessingEngine,
        PackagingEngine, WarehousingEngine, LogisticsEngine
    )
except ImportError:
    # Fallback for different import paths
    from farmsense.domains.potato_logic import (
        PlanningEngine, FieldPrepEngine, PlantingEngine, IrrigationEngine,
        NutrientEngine, PestWeedEngine, HarvestEngine, ProcessingEngine,
        PackagingEngine, WarehousingEngine, LogisticsEngine
    )

# Map domain names to engine classes
DOMAIN_ENGINES = {
    "planning": PlanningEngine,
    "field_prep": FieldPrepEngine,
    "planting": PlantingEngine,
    "irrigation": IrrigationEngine,
    "nutrient": NutrientEngine,
    "pest_weed": PestWeedEngine,
    "harvest": HarvestEngine,
    "processing": ProcessingEngine,
    "packaging": PackagingEngine,
    "warehousing": WarehousingEngine,
    "logistics": LogisticsEngine,
}


def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        request = json.loads(input_data)

        domain = request.get("domain", "").lower()
        inputs = request.get("inputs", {})

        # Validate domain
        if domain not in DOMAIN_ENGINES:
            raise ValueError(f"Unknown domain: {domain}")

        # Get the appropriate engine
        engine_class = DOMAIN_ENGINES[domain]
        engine = engine_class()

        # Generate recommendation
        recommendation = engine.generate_recommendation(inputs)

        # Convert to dictionary and output as JSON
        output = recommendation.to_dict()
        print(json.dumps(output, indent=2, default=str))

    except Exception as e:
        # Output error as JSON
        error_output = {
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
