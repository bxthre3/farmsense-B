# FarmSense Unified Platform - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the remaining components of the FarmSense Unified Platform. The core architecture, base classes, and two domain engines (Planning and Irrigation) are already implemented.

## Current Implementation Status

### ✅ Completed Components

1. **Project Structure**: Complete directory structure with server, client, shared, scripts, and docs folders
2. **Type Definitions**: Comprehensive shared types in `shared/types.ts` including:
   - Base recommendation types (NOW/SOON/LATER/WAIT/MONITOR)
   - Context flags and severity overlays
   - Domain types for all 11 engines
   - Resolution metadata structures
   - Control and equipment types
   - Farm, field, crop, and soil types
3. **Base Engine Class**: Abstract base class in `server/domains/BaseEngine.ts` with:
   - Recommendation creation logic
   - Trend calculation utilities
   - Metric extraction helpers
   - Data quality checking
   - Confidence score calculation
4. **Domain Engines**:
   - Planning Engine: Pre-season planning and operational readiness
   - Irrigation Engine: Advanced water management with resolution awareness
5. **Domain Registry**: Central registry for managing all domain engines
6. **Configuration**: Package.json with all dependencies and build scripts
7. **Documentation**: Comprehensive README, analysis, and architecture documents

### 🚧 Components to Implement

1. **Remaining 9 Domain Engines**
2. **Database Schema and Migrations**
3. **tRPC API Procedures**
4. **Frontend React Application**
5. **Data Integration Workers**
6. **Equipment Control System**
7. **LLM Integration Service**
8. **Testing Infrastructure**

## Implementation Roadmap

### Phase 1: Complete Domain Engines (Priority: HIGH)

Implement the remaining 9 domain engines following the pattern established by Planning and Irrigation engines.

#### 1.1 Field Preparation Engine

**File**: `server/domains/FieldPrepEngine.ts`

**Key Inputs**:
- Available water capacity (AWC)
- Soil compaction level
- Precipitation forecast
- Equipment availability
- Previous crop residue

**Decision Logic**:
- If precipitation forecast > 5mm → WAIT (weather delay)
- If AWC < 30% and compaction > 70% → NOW (urgent preparation needed)
- If equipment unavailable → WAIT (equipment constraint)
- Otherwise → MONITOR

**KPIs**:
- soil_health_index
- operational_delay_risk
- field_readiness_score

#### 1.2 Planting Engine

**File**: `server/domains/PlantingEngine.ts`

**Key Inputs**:
- Soil temperature (current and trend)
- Soil moisture
- Weather forecast (3-7 days)
- Seed availability
- Equipment availability

**Decision Logic**:
- If soil temp < 7°C → WAIT (too cold for potato planting)
- If soil temp 7-10°C and rising → SOON (approaching optimal)
- If soil temp > 10°C and soil moisture adequate and no rain forecast → NOW
- If seed unavailable → WAIT (materials constraint)

**KPIs**:
- planting_efficiency
- germination_risk_score
- timing_optimality

#### 1.3 Nutrient Management Engine

**File**: `server/domains/NutrientEngine.ts`

**Key Inputs**:
- Soil nutrient levels (N, P, K)
- Crop growth stage
- Tissue test results
- Weather forecast
- Application equipment availability

**Decision Logic**:
- If nutrient deficiency detected and crop stage critical → NOW
- If nutrient levels approaching deficiency → SOON
- If precipitation forecast > 10mm → DELAY (weather delay)
- If adequate nutrient levels → MONITOR

**KPIs**:
- nutrient_use_efficiency
- application_timing_score
- environmental_impact_score

#### 1.4 Pest and Weed Control Engine

**File**: `server/domains/PestWeedEngine.ts`

**Key Inputs**:
- Pest pressure indicators
- Disease risk indices (temperature, humidity based)
- Weed emergence stage
- NDVI/vegetation indices from satellite
- Weather forecast

**Decision Logic**:
- If disease risk index > 80% → NOW (high risk)
- If pest pressure threshold crossed → SOON
- If weed emergence detected early → NOW (optimal control window)
- If weather unsuitable for application → DELAY

**KPIs**:
- pest_control_efficacy
- application_timing_score
- resistance_management_score

#### 1.5 Harvest Engine

**File**: `server/domains/HarvestEngine.ts`

**Key Inputs**:
- Crop maturity indicators (NDVI decline, vine senescence)
- Tuber size distribution
- Weather forecast (7-14 days)
- Storage availability
- Equipment availability
- Market prices

**Decision Logic**:
- If maturity reached and weather window available → NOW
- If maturity approaching and storage ready → SOON
- If rain forecast during harvest window → DELAY
- If storage unavailable → WAIT (capacity constraint)

**KPIs**:
- harvest_efficiency
- quality_preservation_score
- market_timing_score

#### 1.6 Processing Engine

**File**: `server/domains/ProcessingEngine.ts`

**Key Inputs**:
- Incoming harvest volume
- Processing capacity utilization
- Quality metrics (size, defects, disease)
- Equipment operational status
- Downstream demand

**Decision Logic**:
- If capacity < 80% and quality batch available → NOW
- If capacity > 90% → WAIT (capacity constraint)
- If equipment maintenance needed → WAIT (equipment constraint)
- Otherwise → MONITOR

**KPIs**:
- processing_efficiency
- quality_retention_score
- throughput_optimization

#### 1.7 Packaging Engine

**File**: `server/domains/PackagingEngine.ts`

**Key Inputs**:
- Processed product availability
- Packaging material inventory
- Order demand
- Equipment availability
- Labor availability

**Decision Logic**:
- If urgent orders and materials available → NOW
- If materials low → SOON (materials constraint approaching)
- If labor unavailable → WAIT (labor constraint)
- Otherwise → MONITOR

**KPIs**:
- packaging_efficiency
- material_utilization
- order_fulfillment_rate

#### 1.8 Warehousing Engine

**File**: `server/domains/WarehousingEngine.ts`

**Key Inputs**:
- Storage temperature and humidity
- Product quality metrics
- Storage capacity utilization
- Ventilation system status
- Product age

**Decision Logic**:
- If temperature/humidity out of range → NOW (emergency)
- If capacity > 95% → SOON (capacity constraint)
- If product quality declining → NOW (urgent action)
- Otherwise → MONITOR

**KPIs**:
- storage_quality_score
- capacity_utilization
- product_preservation_rate

#### 1.9 Logistics Engine

**File**: `server/domains/LogisticsEngine.ts`

**Key Inputs**:
- Order schedule
- Transportation availability
- Product readiness
- Delivery distance and conditions
- Market demand

**Decision Logic**:
- If urgent delivery and product ready → NOW
- If scheduled delivery approaching → SOON
- If transportation unavailable → WAIT (equipment constraint)
- Otherwise → MONITOR

**KPIs**:
- delivery_efficiency
- product_condition_score
- route_optimization_score

### Phase 2: Database Schema (Priority: HIGH)

#### 2.1 Create Drizzle Schema

**File**: `server/db/schema.ts`

Implement the complete database schema using Drizzle ORM:

```typescript
import { pgTable, uuid, varchar, timestamp, decimal, integer, jsonb, boolean, text } from 'drizzle-orm/pg-core';

// Farms table
export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  region: varchar('region', { length: 255 }),
  totalAcres: decimal('total_acres', { precision: 10, scale: 2 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Fields table
export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id').references(() => farms.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  acres: decimal('acres', { precision: 10, scale: 2 }),
  cropTypeId: uuid('crop_type_id').references(() => crops.id),
  soilTypeId: uuid('soil_type_id').references(() => soilTypes.id),
  boundaries: jsonb('boundaries'), // GeoJSON
  equipmentIds: jsonb('equipment_ids').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Continue with crops, soilTypes, equipment, metrics, recommendations, etc.
```

#### 2.2 Create TimescaleDB Hypertable Migration

**File**: `server/db/migrations/001_create_hypertables.sql`

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for normalized_metrics
SELECT create_hypertable('normalized_metrics', 'timestamp', 
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Create compression policy for old data
ALTER TABLE normalized_metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'field_id, metric_type'
);

SELECT add_compression_policy('normalized_metrics', INTERVAL '7 days');

-- Create retention policy
SELECT add_retention_policy('normalized_metrics', INTERVAL '1 year');
```

### Phase 3: tRPC API Procedures (Priority: HIGH)

#### 3.1 Create tRPC Router

**File**: `server/api/router.ts`

```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { domainRegistry } from '../domains/index.js';
import { DomainType } from '../../shared/types.js';

const t = initTRPC.create();

export const appRouter = t.router({
  // Domain procedures
  domains: t.router({
    listAll: t.procedure.query(async () => {
      const domains = domainRegistry.getAvailableDomains();
      return domains.map(d => ({
        domain: d,
        description: getDomainDescription(d),
        available: true
      }));
    }),
    
    getRecommendation: t.procedure
      .input(z.object({
        domain: z.nativeEnum(DomainType),
        fieldId: z.string().uuid(),
        manualOverrides: z.record(z.any()).optional()
      }))
      .query(async ({ input }) => {
        const engine = domainRegistry.getEngine(input.domain);
        if (!engine) {
          throw new Error(`Domain ${input.domain} not available`);
        }
        
        // Fetch current metrics, field data, etc. from database
        const engineInput = await buildEngineInput(input.fieldId, input.manualOverrides);
        
        // Generate recommendation
        const recommendation = await engine.generateRecommendation(engineInput);
        
        // Store in database
        await storeRecommendation(recommendation);
        
        return recommendation;
      }),
    
    // Add more procedures: getRecommendationHistory, confirmEmergency, aggregateKPIs
  }),
  
  // Farm procedures
  farms: t.router({
    list: t.procedure.query(async () => {
      // Query farms from database
    }),
    // Add more: get, create, update
  }),
  
  // Continue with fields, metrics, control, analysis routers
});

export type AppRouter = typeof appRouter;
```

### Phase 4: Data Integration Workers (Priority: MEDIUM)

#### 4.1 Create Python Worker for Open-Meteo

**File**: `server/workers/open_meteo_worker.py`

```python
from celery import Celery
import requests
from datetime import datetime

app = Celery('farmsense', broker='redis://localhost:6379/0')

@app.task
def fetch_weather_data(latitude: float, longitude: float, field_id: str):
    """Fetch weather data from Open-Meteo API"""
    base_url = "https://api.open-meteo.com/v1/forecast"
    
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"],
        "hourly": ["temperature_2m", "soil_temperature_0_to_7cm", "soil_moisture_0_to_7cm"],
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "et0_fao_evapotranspiration"]
    }
    
    response = requests.get(base_url, params=params)
    data = response.json()
    
    # Normalize and store metrics
    normalized_metrics = normalize_weather_data(data, field_id)
    store_metrics(normalized_metrics)
    
    return {"status": "success", "metrics_count": len(normalized_metrics)}
```

#### 4.2 Create Celery Beat Schedule

**File**: `server/workers/celeryconfig.py`

```python
from celery.schedules import crontab

beat_schedule = {
    'fetch-weather-hourly': {
        'task': 'workers.open_meteo_worker.fetch_weather_data',
        'schedule': crontab(minute=0),  # Every hour
    },
    'generate-recommendations-hourly': {
        'task': 'workers.recommendation_worker.generate_all_recommendations',
        'schedule': crontab(minute=15),  # 15 minutes past each hour
    },
    'check-equipment-health': {
        'task': 'workers.equipment_worker.check_equipment_status',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
}
```

### Phase 5: Frontend Application (Priority: MEDIUM)

#### 5.1 Create Main Dashboard Component

**File**: `client/src/pages/Dashboard.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { FarmCard } from '../components/FarmCard';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { MetricsChart } from '../components/MetricsChart';

export const Dashboard: React.FC = () => {
  const { data: farms, isLoading } = trpc.farms.list.useQuery();
  const { data: recommendations } = trpc.domains.getRecentRecommendations.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">FarmSense Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {farms?.map(farm => (
          <FarmCard key={farm.id} farm={farm} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationPanel recommendations={recommendations} />
        <MetricsChart />
      </div>
    </div>
  );
};
```

#### 5.2 Create Recommendation Component

**File**: `client/src/components/RecommendationCard.tsx`

```typescript
import React from 'react';
import { Recommendation, BaseRecommendation } from '../../../shared/types';
import { AlertTriangle, Clock, Info } from 'lucide-react';

interface Props {
  recommendation: Recommendation;
  onConfirm?: (id: string) => void;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation, onConfirm }) => {
  const getColorClass = () => {
    const colorMap = {
      RED: 'bg-red-100 border-red-500',
      ORANGE: 'bg-orange-100 border-orange-500',
      YELLOW: 'bg-yellow-100 border-yellow-500',
      BLUE: 'bg-blue-100 border-blue-500',
      GREEN: 'bg-green-100 border-green-500',
      CYAN: 'bg-cyan-100 border-cyan-500',
      WHITE: 'bg-white border-gray-300'
    };
    return colorMap[recommendation.displayColor];
  };
  
  const getIcon = () => {
    if (recommendation.severityOverlays.includes('EMERGENCY')) {
      return <AlertTriangle className="text-red-600" />;
    }
    if (recommendation.baseRecommendation === BaseRecommendation.NOW) {
      return <Clock className="text-orange-600" />;
    }
    return <Info className="text-blue-600" />;
  };
  
  return (
    <div className={`border-l-4 p-4 rounded-lg shadow ${getColorClass()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold text-lg">{recommendation.domain}</h3>
        </div>
        <span className="text-sm text-gray-600">
          {recommendation.baseRecommendation}
        </span>
      </div>
      
      <div className="mt-2">
        <p className="text-sm text-gray-700">
          {recommendation.explainability.thresholdsCrossed[0]}
        </p>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Confidence: {(recommendation.confidence * 100).toFixed(0)}%
        </span>
        
        {recommendation.requiresHumanConfirmation && !recommendation.confirmedAt && (
          <button
            onClick={() => onConfirm?.(recommendation.id)}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Confirm Emergency
          </button>
        )}
      </div>
      
      {recommendation.predictedNextRecommendation && (
        <div className="mt-2 text-xs text-gray-600">
          Next: {recommendation.predictedNextRecommendation}
        </div>
      )}
    </div>
  );
};
```

### Phase 6: Equipment Control System (Priority: MEDIUM)

#### 6.1 Create Control Abstraction

**File**: `server/services/ControlService.ts`

```typescript
import { ControlCommand, ControlProtocol, ExecutionMode } from '../../shared/types.js';

export interface ProtocolHandler {
  validate(command: ControlCommand): Promise<boolean>;
  execute(command: ControlCommand): Promise<any>;
  getStatus(equipmentId: string): Promise<any>;
}

export class ModbusTCPHandler implements ProtocolHandler {
  async validate(command: ControlCommand): Promise<boolean> {
    // Validate Modbus TCP parameters
    return true;
  }
  
  async execute(command: ControlCommand): Promise<any> {
    // Execute Modbus TCP command
    // Use pymodbus or similar library
  }
  
  async getStatus(equipmentId: string): Promise<any> {
    // Query equipment status via Modbus
  }
}

// Implement MQTTHandler, GPIOHandler, HTTPHandler similarly

export class ControlService {
  private handlers: Map<ControlProtocol, ProtocolHandler>;
  
  constructor() {
    this.handlers = new Map();
    this.handlers.set(ControlProtocol.MODBUS_TCP, new ModbusTCPHandler());
    // Register other handlers
  }
  
  async executeCommand(command: ControlCommand): Promise<any> {
    // Get equipment from database
    const equipment = await getEquipment(command.equipmentId);
    
    // Get appropriate handler
    const handler = this.handlers.get(equipment.controlProtocol);
    if (!handler) {
      throw new Error(`No handler for protocol ${equipment.controlProtocol}`);
    }
    
    // Validate command
    const valid = await handler.validate(command);
    if (!valid) {
      throw new Error('Command validation failed');
    }
    
    // Execute based on mode
    if (command.executionMode === ExecutionMode.DRY_RUN) {
      return { status: 'simulated', message: 'Dry run - no actual execution' };
    } else if (command.executionMode === ExecutionMode.SIMULATION) {
      return this.simulateCommand(command, equipment);
    } else {
      return await handler.execute(command);
    }
  }
  
  private simulateCommand(command: ControlCommand, equipment: any): any {
    // Calculate expected effects without hardware interaction
  }
}
```

### Phase 7: LLM Integration (Priority: LOW)

#### 7.1 Create LLM Service

**File**: `server/services/LLMService.ts`

```typescript
import OpenAI from 'openai';
import { Recommendation, DomainType } from '../../shared/types.js';

export class LLMService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async explainRecommendation(recommendation: Recommendation): Promise<string> {
    const prompt = `
Explain this farming recommendation in clear, simple language:

Domain: ${recommendation.domain}
Recommendation: ${recommendation.baseRecommendation}
Urgency: ${recommendation.urgencyLevel}

Technical Details:
- Inputs used: ${recommendation.explainability.inputsUsed.join(', ')}
- Thresholds crossed: ${recommendation.explainability.thresholdsCrossed.join('; ')}
- Trends: ${recommendation.explainability.trendsConsidered.join('; ')}
- Crop stage: ${recommendation.explainability.cropStage}

Provide a 2-3 sentence explanation that a farmer can easily understand.
    `;
    
    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are an agricultural advisor explaining farming recommendations.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200
    });
    
    return response.choices[0].message.content || 'Unable to generate explanation';
  }
  
  async analyzeHistoricalPatterns(
    domain: DomainType,
    metrics: any[],
    recommendations: Recommendation[]
  ): Promise<string> {
    // Analyze historical data and generate insights
  }
  
  async answerQuestion(question: string, context: any): Promise<string> {
    // Answer farmer questions with context
  }
}
```

## Testing Strategy

### Unit Tests

Create unit tests for each domain engine:

**File**: `server/domains/__tests__/IrrigationEngine.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { IrrigationEngine } from '../IrrigationEngine';
import { BaseRecommendation } from '../../../shared/types';

describe('IrrigationEngine', () => {
  const engine = new IrrigationEngine();
  
  it('should recommend NOW for critical soil moisture', async () => {
    const input = {
      fieldId: 'test-field',
      currentMetrics: {
        soil_moisture: { value: 10, resolution: { confidenceScore: 0.9 } },
        soil_temperature: { value: 15, resolution: { confidenceScore: 0.9 } },
        precipitation: { value: 0, resolution: { confidenceScore: 0.9 } },
        evapotranspiration: { value: 5, resolution: { confidenceScore: 0.9 } }
      },
      fieldData: {} as any,
      cropData: null,
      soilData: { wiltingPointPercent: 12, fieldCapacityPercent: 30 } as any,
      equipmentData: [{ operationalStatus: 'OPERATIONAL' }] as any[]
    };
    
    const recommendation = await engine.generateRecommendation(input);
    
    expect(recommendation.baseRecommendation).toBe(BaseRecommendation.NOW);
    expect(recommendation.severityOverlays).toContain('EMERGENCY');
  });
  
  // Add more test cases
});
```

### Integration Tests

Test API procedures end-to-end:

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '../api/router';

describe('Domain API', () => {
  it('should generate recommendation via API', async () => {
    const caller = appRouter.createCaller({});
    
    const result = await caller.domains.getRecommendation({
      domain: 'IRRIGATION',
      fieldId: 'test-field-id'
    });
    
    expect(result).toHaveProperty('baseRecommendation');
    expect(result).toHaveProperty('confidence');
  });
});
```

## Deployment

### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: farmsense
      POSTGRES_USER: farmsense
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://farmsense:${DB_PASSWORD}@postgres:5432/farmsense
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
  
  celery-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      REDIS_URL: redis://redis:6379/0
      DATABASE_URL: postgresql://farmsense:${DB_PASSWORD}@postgres:5432/farmsense
    depends_on:
      - redis
      - postgres
  
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Next Steps

1. **Implement Remaining Domain Engines**: Follow the patterns in Planning and Irrigation engines
2. **Set Up Database**: Create schema and migrations using Drizzle
3. **Build API Layer**: Implement tRPC procedures for all operations
4. **Develop Frontend**: Create React components and pages
5. **Integrate Data Sources**: Implement Celery workers for API integrations
6. **Add Control System**: Implement protocol handlers for equipment control
7. **Test Thoroughly**: Write comprehensive unit and integration tests
8. **Deploy**: Use Docker Compose for production deployment

## Resources

- **Drizzle ORM**: https://orm.drizzle.team/
- **tRPC**: https://trpc.io/
- **TimescaleDB**: https://docs.timescale.com/
- **Celery**: https://docs.celeryproject.org/
- **Next.js**: https://nextjs.org/docs
- **React Query**: https://tanstack.com/query/latest

## Support

For questions or assistance with implementation:
- Review the architecture document in `docs/farmsense_unified_architecture.md`
- Check the analysis document in `docs/farmsense_analysis.md`
- Refer to existing implementations in `server/domains/`
- Contact the development team at dev@farmsense.io
