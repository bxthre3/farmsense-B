# FarmSense Python Engine Integration Guide

## Overview

This document describes the integration of the comprehensive Python FarmSense engine (covering 11 operational domains) into the Node.js/React web application. The integration creates a hybrid system where:

- **Python Engine**: Handles deterministic decision logic for all 11 domains (Planning, Field Preparation, Planting, Irrigation, Nutrient Administration, Pest & Weed Control, Harvest, Processing, Packaging, Warehousing, Logistics)
- **Node.js Backend**: Provides REST/tRPC API layer, database management, and orchestration
- **React Frontend**: Displays recommendations, KPIs, and domain-specific dashboards

## Architecture

### Component Structure

```
farmsense/
├── python-engine/          # Python FarmSense engine
│   ├── engine.py          # Core recommendation classes
│   ├── potato_logic.py    # 11 domain-specific engines
│   ├── platform.py        # Platform orchestrator
│   ├── ingestion.py       # Data validation
│   ├── audit.py           # Audit logging
│   ├── engine_wrapper.py  # Node.js subprocess wrapper
│   └── [test files]       # Validation and testing
├── server/
│   ├── modules/
│   │   ├── pythonEngineWrapper.ts  # TypeScript wrapper
│   │   ├── hardRulesEngine.ts      # Legacy irrigation rules
│   │   └── [other modules]
│   ├── routers.ts         # tRPC endpoints
│   └── db.ts              # Database operations
├── client/
│   ├── src/
│   │   ├── pages/         # Domain-specific pages
│   │   ├── components/    # Reusable UI components
│   │   └── [other files]
└── drizzle/
    └── schema.ts          # Database schema
```

### Data Flow

```
Frontend Input
    ↓
tRPC Procedure
    ↓
Node.js Backend
    ↓
Python Engine Wrapper
    ↓
Python Subprocess (engine_wrapper.py)
    ↓
Domain Engine (e.g., IrrigationEngine)
    ↓
Recommendation Object
    ↓
JSON Output
    ↓
Node.js Backend
    ↓
Database Storage
    ↓
Frontend Display
```

## Integration Steps

### 1. Python Engine Files

All Python engine files are located in `/home/ubuntu/farmsense/python-engine/`:

- **engine.py**: Core classes (`Recommendation`, `DomainEngine`, enums for base recommendations, context flags, severity overlays)
- **potato_logic.py**: 11 domain-specific engines implementing deterministic rules
- **platform.py**: `FarmSensePlatform` class orchestrating all engines
- **ingestion.py**: Data validation and normalization
- **audit.py**: Audit logging and reconstruction
- **engine_wrapper.py**: Subprocess wrapper for Node.js integration
- **confirm_emergency.py**: Emergency confirmation handler

### 2. TypeScript Wrapper

The `pythonEngineWrapper.ts` module provides a TypeScript interface:

```typescript
import { pythonEngine } from "./modules/pythonEngineWrapper";

// Get a recommendation for a specific domain
const recommendation = await pythonEngine.getRecommendation("irrigation", {
  awc: 50,
  prev_awc: 60,
  precipitation_forecast: 10,
  crop_stage: "vegetative",
  equipment_available: true,
});

// Get all domain recommendations
const allRecommendations = await pythonEngine.getAllRecommendations({
  planning: { plan_finalized: true, ... },
  irrigation: { awc: 50, ... },
  // ... other domains
});

// Confirm an emergency recommendation
const confirmation = await pythonEngine.confirmEmergency(auditLogId);
```

### 3. tRPC Endpoints

Domain recommendation endpoints are added to `server/routers.ts`:

```typescript
domains: router({
  getRecommendation: protectedProcedure
    .input(z.object({
      domain: z.enum([...]),
      fieldId: z.number(),
      inputs: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Call Python engine
      const recommendation = await pythonEngine.getRecommendation(
        input.domain,
        input.inputs
      );
      // Store in database
      // Return to frontend
    }),

  confirmEmergency: protectedProcedure
    .input(z.object({ auditLogId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await pythonEngine.confirmEmergency(input.auditLogId);
    }),
})
```

### 4. Database Schema Updates

The database schema (`drizzle/schema.ts`) includes tables for:

- **domainRecommendations**: Stores recommendations from all 11 domains
- **domainKPIs**: Tracks KPIs per domain
- **auditLogs**: Complete audit trail with reconstruction capability
- **emergencyConfirmations**: Tracks emergency confirmations

### 5. Frontend Integration

Domain-specific pages display recommendations and KPIs:

```typescript
// Example: Irrigation domain page
const IrrigationPage = () => {
  const [recommendation, setRecommendation] = useState(null);

  const getRecommendation = async () => {
    const result = await trpc.domains.getRecommendation.mutate({
      domain: "irrigation",
      fieldId: selectedFieldId,
      inputs: {
        awc: 50,
        prev_awc: 60,
        precipitation_forecast: 10,
        crop_stage: "vegetative",
        equipment_available: true,
      },
    });
    setRecommendation(result);
  };

  return (
    <div>
      <RecommendationCard recommendation={recommendation} />
      <KPIDisplay kpis={recommendation?.kpis} />
    </div>
  );
};
```

## Recommendation Output Format

All domain recommendations follow the unified format:

```json
{
  "domain": "irrigation",
  "issued_at": "2026-01-08T14:30:00Z",
  "valid_until": "2026-01-08T18:30:00Z",
  "remaining_time": "03:45:22",
  "base_recommendation": "NOW",
  "urgency_level": "HIGH",
  "display_color": "ORANGE",
  "context_flags": ["WEATHER_DELAY"],
  "severity_overlays": [],
  "requires_human_confirmation": false,
  "confirmed_at": null,
  "explainability": {
    "inputs_used": ["awc", "precipitation_forecast", "crop_stage"],
    "thresholds_crossed": ["awc < 65%"],
    "thresholds_approaching": [],
    "trends_considered": ["awc is DECREASING"],
    "crop_stage": "VEGETATIVE"
  },
  "kpis": {
    "water_efficiency": 0.85,
    "stress_avoidance": 0.92,
    "water_savings_potential": 0.78
  },
  "predicted_next_recommendation": "WAIT",
  "audit_log_id": "uuid-here"
}
```

## Domain-Specific Inputs

### Planning
```typescript
{
  plan_finalized: boolean,
  market_data_ready: boolean,
  labor_available: boolean
}
```

### Field Preparation
```typescript
{
  awc: number (0-100),
  compaction_level: number (0-100),
  precipitation_forecast: number (mm),
  equipment_available: boolean
}
```

### Planting
```typescript
{
  soil_temp: number (°C),
  prev_soil_temp: number (°C),
  seed_ready: boolean,
  labor_available: boolean
}
```

### Irrigation
```typescript
{
  awc: number (0-100),
  prev_awc: number (0-100),
  precipitation_forecast: number (mm),
  crop_stage: string,
  equipment_available: boolean
}
```

### Nutrient Administration
```typescript
{
  nitrogen: number,
  prev_nitrogen: number,
  crop_stage: string,
  materials_available: boolean
}
```

### Pest & Weed Control
```typescript
{
  pest_count: number,
  prev_pest_count: number,
  humidity: number (0-100),
  equipment_available: boolean
}
```

### Harvest
```typescript
{
  skin_set: boolean,
  soil_temp: number (°C),
  labor_available: boolean,
  equipment_available: boolean
}
```

### Processing
```typescript
{
  queue_size: number,
  capacity_available: boolean
}
```

### Packaging
```typescript
{
  inventory_level: number,
  materials_available: boolean
}
```

### Warehousing
```typescript
{
  storage_temp: number (°C),
  prev_storage_temp: number (°C),
  capacity_available: boolean
}
```

### Logistics
```typescript
{
  orders_pending: number,
  trucks_available: boolean
}
```

## Base Recommendations

All domains use the same 5 base recommendations with timing semantics:

| Recommendation | Timing | Description |
|---|---|---|
| **NOW** | 0–2 hours | Immediate action required |
| **SOON** | 3–7 hours | Action required in near future |
| **LATER** | 8–16 hours | Action required within a day |
| **WAIT** | Intentionally Paused | Action paused due to constraints |
| **MONITOR** | Observation Only | Borderline conditions, no action yet |

## Context Flags

Context flags express operational constraints without changing the base recommendation:

- `WEATHER_DELAY`: Action delayed due to weather
- `LABOR_CONSTRAINT`: Labor unavailable
- `EQUIPMENT_CONSTRAINT`: Equipment unavailable
- `CAPACITY_CONSTRAINT`: Processing/storage capacity full
- `MATERIALS_CONSTRAINT`: Required materials unavailable

## Severity Overlays

- `EMERGENCY`: Critical risk requiring immediate human confirmation

## KPIs Tracked

Each domain tracks relevant KPIs:

- **Planning**: `operational_readiness`
- **Field Prep**: `soil_health_index`, `operational_delay_risk`, `stress_avoidance_potential`
- **Planting**: `planting_window_optimization`
- **Irrigation**: `water_efficiency`, `stress_avoidance`, `water_savings_potential`
- **Nutrient**: `nutrient_use_efficiency`
- **Pest/Weed**: `crop_health_protection`
- **Harvest**: `harvest_readiness`
- **Processing**: `throughput_efficiency`
- **Packaging**: `inventory_turnover_potential`
- **Warehousing**: `post_harvest_loss_reduction`
- **Logistics**: `dispatch_efficiency`

## Testing

### Unit Tests

Python engine tests are in `/python-engine/test_*.py`:

```bash
cd /home/ubuntu/farmsense/python-engine
python3 -m pytest test_*.py -v
```

### Integration Tests

TypeScript tests for the wrapper:

```bash
cd /home/ubuntu/farmsense
pnpm test
```

### Manual Testing

```bash
# Test a single domain recommendation
curl -X POST http://localhost:3000/api/trpc/domains.getRecommendation \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "irrigation",
    "fieldId": 1,
    "inputs": {
      "awc": 50,
      "prev_awc": 60,
      "precipitation_forecast": 10,
      "crop_stage": "vegetative",
      "equipment_available": true
    }
  }'
```

## Deployment Considerations

1. **Python Environment**: Ensure Python 3.8+ is installed on the deployment server
2. **Dependencies**: The Python engine has minimal dependencies (standard library only)
3. **Performance**: Subprocess calls add ~100-200ms latency; consider caching for repeated calls
4. **Scalability**: For high-volume scenarios, consider running a persistent Python service instead of subprocess spawning
5. **Error Handling**: All subprocess errors are caught and logged; failures default to WAIT recommendation

## Future Enhancements

1. **Persistent Python Service**: Replace subprocess with persistent gRPC/FastAPI service
2. **ML Integration**: Add machine learning models for gray-zone decisions
3. **Real-time Updates**: WebSocket support for live recommendation updates
4. **Batch Processing**: Process multiple fields/farms in parallel
5. **Custom Rules**: Allow farmers to define custom thresholds per field

## Troubleshooting

### Python Engine Not Found

Ensure Python files are in `/home/ubuntu/farmsense/python-engine/` and `PYTHONPATH` is set correctly.

### Subprocess Timeout

Increase timeout in `pythonEngineWrapper.ts` if recommendations take longer than 30 seconds.

### JSON Parse Errors

Check Python engine output format; ensure all responses are valid JSON.

### Import Errors

Verify all Python module imports match the actual file structure in `python-engine/`.

## References

- **FarmSense Implementation Report**: See `/upload/FarmSense Implementation Report.md`
- **FarmSense Audit Report**: See `/upload/FarmSense Implementation Audit Report.md`
- **Python Engine Code**: See `python-engine/` directory
- **TypeScript Wrapper**: See `server/modules/pythonEngineWrapper.ts`
