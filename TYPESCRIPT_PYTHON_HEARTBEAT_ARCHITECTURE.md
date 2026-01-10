# FarmSense-All: TypeScript UI + Python Heartbeat Grounding Architecture

## Executive Summary

**New Architecture**: TypeScript provides responsive, real-time UI updates while Python engine provides deterministic "heartbeat" grounding at regular intervals (every 5-15 minutes). This ensures:

- ✅ **Fully Deterministic**: Python engine is authoritative source of truth
- ✅ **Fully Explainable**: Every decision traceable to Python logic
- ✅ **Responsive UI**: TypeScript provides <100ms updates between heartbeats
- ✅ **Audit Trail**: Complete reconstruction capability
- ✅ **Safety**: Drift detection and automatic correction

This is **superior to pure Python** (too slow for UI) and **superior to pure TypeScript** (lacks determinism).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend                                │
│  (Dashboard, Fields, MapView, Robotics, Stats, Settings)        │
│                                                                  │
│  Real-time updates: <100ms latency                              │
│  Responsive to user interactions                                │
│  Displays current state + predictions                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js Backend (tRPC)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TypeScript State Machine (Stateful)                     │  │
│  │  - Current field conditions                              │  │
│  │  - Sensor readings (interpolated)                        │  │
│  │  - Recommendations (cached from Python)                  │  │
│  │  - KPIs (calculated in real-time)                        │  │
│  │  - Alerts and notifications                              │  │
│  │                                                           │  │
│  │  Updates: Every 1-5 seconds                              │  │
│  │  Source: Sensor streams, user inputs, WebSocket          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Python Heartbeat Grounding (Deterministic)              │  │
│  │  - Validates current state against rules                 │  │
│  │  - Generates authoritative recommendations               │  │
│  │  - Detects drift from deterministic baseline             │  │
│  │  - Corrects state if necessary                           │  │
│  │  - Logs all decisions with full explainability           │  │
│  │                                                           │  │
│  │  Executes: Every 5-15 minutes (configurable)             │  │
│  │  Subprocess: Isolated Python process                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            Python Deterministic Engine                           │
│  (11 Domain Engines)                                             │
│                                                                  │
│  - Planning, Field Prep, Planting                               │
│  - Irrigation, Nutrient, Pest/Weed                              │
│  - Harvest, Processing, Packaging                               │
│  - Warehousing, Logistics                                       │
│                                                                  │
│  Output: Deterministic recommendations with full explainability │
│  Audit Trail: Complete reconstruction capability                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                          │
│                                                                  │
│  - Current state (sensor readings, field conditions)            │
│  - Recommendations (from Python heartbeat)                      │
│  - Audit log (complete decision history)                        │
│  - Drift detection log (state corrections)                      │
│  - KPI history (performance tracking)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: The Heartbeat Cycle

### **Cycle 1: Real-Time TypeScript Updates (Every 1-5 seconds)**

```
Sensor Input → TypeScript State Machine → Cache Update → WebSocket → Frontend
     ↓
  - Soil moisture reading
  - Temperature update
  - Rainfall measurement
  - Robot position
  - User interaction
     ↓
  TypeScript interpolates and calculates:
  - Current field conditions
  - Trend analysis
  - Predicted next state
  - Cached recommendations (from last Python run)
     ↓
  Broadcast to frontend via WebSocket
  Latency: <100ms
```

### **Cycle 2: Python Heartbeat Grounding (Every 5-15 minutes)**

```
TypeScript State → Python Engine → Authoritative Decision → State Correction
     ↓
  Collect all current state:
  - Sensor readings (5-minute window)
  - Field conditions
  - Crop stage
  - Weather forecast
  - Equipment status
     ↓
  Python engine processes:
  - Validates state against rules
  - Generates deterministic recommendation
  - Calculates confidence scores
  - Detects drift from baseline
  - Logs full explainability
     ↓
  Compare Python output with TypeScript state:
  - If drift detected: Log correction
  - If recommendation changed: Notify frontend
  - If emergency: Trigger alert workflow
     ↓
  Update database:
  - Store authoritative recommendation
  - Log audit trail
  - Record drift detection
  - Update KPIs
     ↓
  Broadcast correction to frontend (if needed)
  Latency: 50-100ms (Python subprocess)
```

### **Complete Cycle Timeline**

```
Time    Event                           Latency    Source
────────────────────────────────────────────────────────────
00:00   Sensor reading received         <10ms      Hardware
00:05   TypeScript processes            <50ms      State machine
00:10   WebSocket broadcast             <100ms     Frontend
00:15   Python heartbeat triggered      50-100ms   Scheduler
00:20   Python generates decision       50-100ms   Python engine
00:25   Drift detection (if any)        <50ms      TypeScript
00:30   Database update                 <100ms     PostgreSQL
00:35   Frontend notification (if any)  <100ms     WebSocket

Next heartbeat: 5-15 minutes later
```

---

## Key Components

### **1. TypeScript State Machine (Stateful)**

```typescript
interface FieldState {
  fieldId: number;
  currentConditions: {
    soilMoisture: number;
    soilMoistureHistory: number[];
    temperature: number;
    rainfall: number;
    windSpeed: number;
  };
  
  cachedRecommendation: {
    domain: string;
    recommendation: 'NOW' | 'SOON' | 'LATER' | 'WAIT' | 'MONITOR';
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: Date;
    auditLogId: string;
  };
  
  predictedNextState: {
    soilMoisture: number;
    recommendation: string;
    confidence: number;
  };
  
  driftDetection: {
    isDrifting: boolean;
    driftAmount: number;
    lastCorrectionTime: Date;
  };
  
  kpis: {
    waterEfficiency: number;
    stressAvoidance: number;
    operationalReadiness: number;
  };
}

class FieldStateManager {
  private state: Map<number, FieldState> = new Map();
  
  // Called every 1-5 seconds
  updateFromSensor(fieldId: number, reading: SensorReading): void {
    const field = this.state.get(fieldId);
    if (!field) return;
    
    // Update current conditions
    field.currentConditions.soilMoisture = reading.soilMoisture;
    field.currentConditions.soilMoistureHistory.push(reading.soilMoisture);
    field.currentConditions.temperature = reading.temperature;
    field.currentConditions.rainfall = reading.rainfall;
    
    // Keep only last 100 readings
    if (field.currentConditions.soilMoistureHistory.length > 100) {
      field.currentConditions.soilMoistureHistory.shift();
    }
    
    // Predict next state
    this.predictNextState(fieldId);
    
    // Broadcast to frontend
    this.broadcastUpdate(fieldId);
  }
  
  // Called every 5-15 minutes (from Python heartbeat)
  groundWithPythonDecision(fieldId: number, pythonOutput: PythonRecommendation): void {
    const field = this.state.get(fieldId);
    if (!field) return;
    
    // Detect drift
    const drift = this.detectDrift(field, pythonOutput);
    
    if (drift.isDrifting) {
      // Log drift correction
      this.logDriftCorrection(fieldId, drift);
      
      // Correct state
      field.driftDetection = {
        isDrifting: true,
        driftAmount: drift.amount,
        lastCorrectionTime: new Date()
      };
    }
    
    // Update cached recommendation
    field.cachedRecommendation = {
      domain: pythonOutput.domain,
      recommendation: pythonOutput.base_recommendation,
      urgency: this.calculateUrgency(pythonOutput),
      timestamp: new Date(),
      auditLogId: pythonOutput.audit_log_id
    };
    
    // Broadcast update
    this.broadcastUpdate(fieldId);
  }
  
  private detectDrift(field: FieldState, pythonOutput: PythonRecommendation): DriftDetection {
    // Compare TypeScript prediction with Python authoritative output
    const prediction = field.predictedNextState;
    const pythonRec = pythonOutput.base_recommendation;
    
    const isDrifting = prediction.recommendation !== pythonRec;
    const driftAmount = Math.abs(prediction.confidence - pythonOutput.confidence_score);
    
    return { isDrifting, amount: driftAmount };
  }
  
  private predictNextState(fieldId: number): void {
    const field = this.state.get(fieldId);
    if (!field) return;
    
    // Use trend analysis to predict next state
    const history = field.currentConditions.soilMoistureHistory;
    const trend = this.calculateTrend(history);
    
    field.predictedNextState = {
      soilMoisture: history[history.length - 1] + trend,
      recommendation: this.predictRecommendation(history, trend),
      confidence: this.calculateConfidence(history)
    };
  }
  
  private broadcastUpdate(fieldId: number): void {
    const field = this.state.get(fieldId);
    if (!field) return;
    
    // Send to all connected clients via WebSocket
    this.websocket.broadcast(`field:${fieldId}`, {
      state: field,
      timestamp: new Date()
    });
  }
}
```

### **2. Python Heartbeat Scheduler**

```typescript
class PythonHeartbeatScheduler {
  private interval: NodeJS.Timer;
  private heartbeatIntervalMs: number = 5 * 60 * 1000; // 5 minutes
  
  start(): void {
    this.interval = setInterval(() => {
      this.executeHeartbeat();
    }, this.heartbeatIntervalMs);
  }
  
  stop(): void {
    clearInterval(this.interval);
  }
  
  private async executeHeartbeat(): Promise<void> {
    try {
      // Get all active fields
      const fields = await this.db.getAllActiveFields();
      
      for (const field of fields) {
        // Get current state from TypeScript state machine
        const currentState = this.stateManager.getState(field.id);
        
        // Call Python engine
        const pythonOutput = await this.pythonEngineWrapper.getRecommendation(
          field.domain,
          field.id,
          {
            awc: currentState.currentConditions.soilMoisture,
            prev_awc: currentState.currentConditions.soilMoistureHistory[
              currentState.currentConditions.soilMoistureHistory.length - 2
            ],
            precipitation_forecast: currentState.currentConditions.rainfall,
            crop_stage: field.cropStage,
            equipment_available: field.equipmentAvailable
          }
        );
        
        // Ground TypeScript state with Python decision
        this.stateManager.groundWithPythonDecision(field.id, pythonOutput);
        
        // Log to database
        await this.db.logHeartbeat({
          fieldId: field.id,
          pythonOutput,
          timestamp: new Date(),
          auditLogId: pythonOutput.audit_log_id
        });
      }
    } catch (error) {
      this.logger.error('Heartbeat execution failed', error);
      // Continue on next heartbeat
    }
  }
}
```

### **3. Drift Detection & Correction**

```typescript
interface DriftDetection {
  fieldId: number;
  isDrifting: boolean;
  driftAmount: number;
  typeScriptState: any;
  pythonState: any;
  correction: any;
  timestamp: Date;
}

class DriftDetector {
  async detectAndCorrect(
    fieldId: number,
    typeScriptState: FieldState,
    pythonOutput: PythonRecommendation
  ): Promise<DriftDetection> {
    const drift: DriftDetection = {
      fieldId,
      isDrifting: false,
      driftAmount: 0,
      typeScriptState,
      pythonState: pythonOutput,
      correction: null,
      timestamp: new Date()
    };
    
    // Check for recommendation drift
    if (typeScriptState.predictedNextState.recommendation !== pythonOutput.base_recommendation) {
      drift.isDrifting = true;
      drift.driftAmount = Math.abs(
        typeScriptState.predictedNextState.confidence - pythonOutput.confidence_score
      );
      
      // Correction: Use Python output as authoritative
      drift.correction = {
        field: 'recommendation',
        oldValue: typeScriptState.cachedRecommendation.recommendation,
        newValue: pythonOutput.base_recommendation,
        reason: 'Python heartbeat authoritative'
      };
    }
    
    // Check for state drift (soil moisture)
    const soilMoistureDrift = Math.abs(
      typeScriptState.currentConditions.soilMoisture - pythonOutput.inputs_used.awc
    );
    
    if (soilMoistureDrift > 5) { // 5% threshold
      drift.isDrifting = true;
      drift.driftAmount = Math.max(drift.driftAmount, soilMoistureDrift);
      
      drift.correction = {
        field: 'soilMoisture',
        oldValue: typeScriptState.currentConditions.soilMoisture,
        newValue: pythonOutput.inputs_used.awc,
        reason: 'Python sensor fusion authoritative'
      };
    }
    
    // Log drift if detected
    if (drift.isDrifting) {
      await this.db.logDriftDetection(drift);
      
      // Notify operators if drift is significant
      if (drift.driftAmount > 10) {
        await this.notificationService.notifyOperators({
          severity: 'WARNING',
          message: `Significant drift detected on field ${fieldId}: ${drift.driftAmount.toFixed(1)}%`,
          details: drift
        });
      }
    }
    
    return drift;
  }
}
```

### **4. Audit Trail & Explainability**

```typescript
interface AuditLogEntry {
  auditLogId: string;
  timestamp: Date;
  fieldId: number;
  domain: string;
  
  // TypeScript state at time of Python heartbeat
  typeScriptState: {
    soilMoisture: number;
    temperature: number;
    predictedRecommendation: string;
  };
  
  // Python authoritative decision
  pythonDecision: {
    baseRecommendation: string;
    contextFlags: string[];
    severityOverlays: string[];
    explainability: {
      inputsUsed: string[];
      thresholdsCrossed: string[];
      trendConsidered: string[];
      cropStage: string;
    };
    kpis: Record<string, number>;
  };
  
  // Drift detection result
  driftDetection: {
    isDrifting: boolean;
    driftAmount: number;
    correction: any;
  };
  
  // Full reconstruction capability
  canReconstruct: boolean;
  reconstructionData: {
    inputs: any;
    thresholds: any;
    logic: string;
  };
}

class AuditTrailService {
  async logHeartbeat(entry: AuditLogEntry): Promise<void> {
    // Store in database
    await this.db.auditLog.create({
      ...entry,
      reconstructionData: {
        inputs: entry.pythonDecision.explainability.inputsUsed,
        thresholds: entry.pythonDecision.explainability.thresholdsCrossed,
        logic: `Field ${entry.fieldId} at ${entry.timestamp}: ${entry.pythonDecision.baseRecommendation}`
      }
    });
  }
  
  async reconstructDecision(auditLogId: string): Promise<ReconstructedDecision> {
    const entry = await this.db.auditLog.findById(auditLogId);
    if (!entry) throw new Error('Audit log entry not found');
    
    return {
      auditLogId,
      timestamp: entry.timestamp,
      fieldId: entry.fieldId,
      originalDecision: entry.pythonDecision.baseRecommendation,
      inputs: entry.reconstructionData.inputs,
      thresholds: entry.reconstructionData.thresholds,
      logic: entry.reconstructionData.logic,
      driftDetected: entry.driftDetection.isDrifting,
      driftCorrection: entry.driftDetection.correction,
      fullExplainability: entry.pythonDecision.explainability
    };
  }
}
```

---

## Benefits of This Architecture

### **1. Determinism**
- Python engine is authoritative source of truth
- Every 5-15 minutes, system is grounded in deterministic logic
- Drift detection ensures TypeScript doesn't diverge
- Complete reconstruction capability

### **2. Explainability**
- Every decision traceable to Python logic
- Full reasoning chain captured in audit log
- Drift corrections logged and explained
- Regulatory-compliant audit trail

### **3. Responsiveness**
- TypeScript provides <100ms UI updates
- No waiting for Python subprocess
- Real-time sensor data streaming
- Smooth user experience

### **4. Safety**
- Python heartbeat catches TypeScript errors
- Drift detection prevents silent failures
- Emergency overlay triggers human confirmation
- Isolated subprocess prevents crashes

### **5. Scalability**
- TypeScript handles real-time load
- Python runs asynchronously on schedule
- Can scale Python processes independently
- WebSocket broadcasts to multiple clients

### **6. Auditability**
- Complete audit trail of all decisions
- Drift corrections logged
- Full reconstruction capability
- Regulatory compliance

---

## Configuration

### **Heartbeat Interval**
```typescript
// Configurable based on domain and risk
const HEARTBEAT_INTERVALS = {
  irrigation: 5 * 60 * 1000,      // 5 minutes (critical)
  nutrient: 15 * 60 * 1000,       // 15 minutes
  pestWeed: 30 * 60 * 1000,       // 30 minutes
  harvest: 60 * 60 * 1000,        // 1 hour
  default: 10 * 60 * 1000         // 10 minutes
};
```

### **Drift Thresholds**
```typescript
const DRIFT_THRESHOLDS = {
  soilMoisture: 5,                // 5% threshold
  recommendation: 0,              // Any change is drift
  confidence: 0.1,                // 10% confidence change
  emergencyOverlay: 0             // Any emergency is critical
};
```

### **Alert Thresholds**
```typescript
const ALERT_THRESHOLDS = {
  minorDrift: 5,                  // 5% drift triggers warning
  majorDrift: 10,                 // 10% drift triggers alert
  emergencyDrift: 20              // 20% drift triggers critical
};
```

---

## Implementation Roadmap

### **Phase 1: TypeScript State Machine**
- [ ] Implement FieldStateManager
- [ ] Add sensor data ingestion
- [ ] Create prediction logic
- [ ] Implement WebSocket broadcasting
- [ ] Add real-time KPI calculation

### **Phase 2: Python Heartbeat Integration**
- [ ] Create PythonHeartbeatScheduler
- [ ] Implement drift detection
- [ ] Add state correction logic
- [ ] Create audit logging
- [ ] Implement reconstruction capability

### **Phase 3: Testing & Validation**
- [ ] Unit tests for state machine
- [ ] Integration tests for heartbeat
- [ ] Drift detection validation
- [ ] Audit trail verification
- [ ] Performance benchmarking

### **Phase 4: Optimization**
- [ ] Caching strategy
- [ ] Database query optimization
- [ ] WebSocket message batching
- [ ] Python subprocess pooling
- [ ] Memory optimization

### **Phase 5: Monitoring & Alerting**
- [ ] Heartbeat health monitoring
- [ ] Drift rate tracking
- [ ] Performance metrics
- [ ] Alert system
- [ ] Dashboard integration

---

## Comparison: Previous vs. New Architecture

| Aspect | Pure Python | Pure TypeScript | **New Hybrid** |
|---|---|---|---|
| **Determinism** | ✅ Full | ❌ None | ✅ Full (Python grounded) |
| **Explainability** | ✅ Full | ❌ Limited | ✅ Full (audit trail) |
| **Responsiveness** | ❌ Slow (50-100ms) | ✅ Fast (<5ms) | ✅ Fast (<100ms) |
| **Auditability** | ✅ Complete | ❌ None | ✅ Complete |
| **Safety** | ✅ Isolated | ❌ In-process | ✅ Both |
| **Scalability** | ⚠️ Limited | ✅ Good | ✅ Excellent |
| **Drift Detection** | ❌ None | ❌ None | ✅ Automatic |
| **IP Protection** | ✅ Strong | ❌ Weak | ✅ Strong |

---

## Conclusion

The **TypeScript UI + Python Heartbeat Grounding** architecture is superior because it combines:

- **Determinism & Auditability** from Python
- **Responsiveness & Scalability** from TypeScript
- **Safety & Drift Detection** from both working together

This is the optimal architecture for FarmSense-All: fully deterministic, fully explainable, and fully responsive.

---

## Next Steps

1. Implement TypeScript state machine
2. Create Python heartbeat scheduler
3. Add drift detection and correction
4. Build audit trail system
5. Test end-to-end workflow
6. Deploy to production

**Status**: Ready for implementation
