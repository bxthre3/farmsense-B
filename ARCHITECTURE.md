# FarmSense Architecture Documentation

## System Overview

FarmSense is a precision irrigation management system that combines real-time environmental monitoring, intelligent decision logic, and automated control to optimize water usage across multiple farms and fields.

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend Dashboard                   │
│  (Real-time metrics, recommendations, control interface, maps)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    tRPC + WebSocket/SSE
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    Express + tRPC Backend                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Decision Engine (Deterministic Rule-Based Logic)         │   │
│  │ - Soil moisture evaluation                               │   │
│  │ - Temperature and ET assessment                          │   │
│  │ - Resolution-aware recommendations                       │   │
│  │ - Audit trail logging                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Irrigation Control Layer                                 │   │
│  │ - Modbus TCP, MQTT, GPIO, HTTP protocols                │   │
│  │ - Validation rules and dry-run mode                      │   │
│  │ - Manual override and emergency kill switch              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LLM Analysis Service                                     │   │
│  │ - Historical pattern analysis                            │   │
│  │ - Natural language recommendations                       │   │
│  │ - Farmer question answering                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   PostgreSQL+          Redis Queue          External APIs
   TimescaleDB          (Celery)             (Weather, etc.)
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   Celery Worker      Celery Beat          Irrigation
   (Data Ingestion)   (Scheduling)         Equipment
```

## Database Schema

### Core Tables

**farms**
- Farm management and metadata
- Region and location information
- Owner and contact details

**fields**
- Individual field records
- Crop type and soil type associations
- Equipment assignments
- Spatial boundaries

**crops**
- Crop type definitions
- Water requirements (mm/day)
- Root depth and growth stages

**soil_types**
- Soil characteristics
- Field capacity and wilting point
- Bulk density

**irrigation_equipment**
- Equipment inventory (center-pivot, linear, etc.)
- Control protocol (Modbus TCP, MQTT, GPIO, HTTP)
- Network configuration
- Status tracking

### Data Tables

**raw_metrics**
- Unprocessed sensor and API data
- Full resolution lineage
- Data source tracking
- Timestamp and payload storage

**normalized_metrics** (TimescaleDB hypertable)
- Processed and standardized metrics
- Resolution metadata (temporal, spatial, source confidence)
- Aggregation method tracking
- Confidence scores

**irrigation_recommendations**
- Decision engine outputs
- Recommendation status (IRRIGATE/DELAY/HOLD)
- Reasoning and confidence scores
- Recommended duration and flow rate

**irrigation_control_actions**
- Executed control commands
- Equipment status and response
- Execution mode (DRY_RUN/SIMULATION/ACTUAL)
- Audit trail

**decision_audit_trail**
- Complete decision logic audit
- Input metrics and their resolutions
- Rule evaluations
- Recommendation generation details

**notifications**
- Owner alerts for critical events
- Equipment failures
- Sensor threshold violations
- Decision notifications

## Decision Engine

### Rule Evaluation Process

1. **Data Availability Check**
   - Verify sufficient metric data exists
   - Assess resolution and confidence levels
   - Flag missing or low-confidence data

2. **Precipitation Rule**
   - If recent precipitation ≥ 10mm → DELAY
   - Allows soil to stabilize before irrigation

3. **Critical Soil Moisture Rule**
   - If soil moisture ≤ wilting point → IRRIGATE (immediate)
   - Prevents crop stress

4. **Threshold-Based Rule**
   - Calculate irrigation threshold: wilting_point + (available_water × 0.3)
   - If soil moisture ≤ threshold:
     - If ET > 4 mm/day → IRRIGATE
     - Else → DELAY
   - Else → HOLD

5. **Temperature Safety Rule**
   - If soil temperature < 10°C → HOLD
   - Prevents cold-stress irrigation

### Resolution Tracking

Each metric includes:
- **Temporal Resolution**: Measurement frequency (5min - 60min)
- **Spatial Resolution**: Coverage area (1m - 1km)
- **Confidence Score**: 0.0 - 1.0 (data reliability)
- **Source Resolution**: Combined resolution string
- **Aggregation Method**: How data was processed

Decision confidence is reduced if:
- Any critical metric has confidence < 0.5
- Temporal resolution > 60 minutes
- Spatial resolution > 1km for point measurements

## Irrigation Control Abstraction

### Supported Protocols

1. **Modbus TCP**
   - Industrial standard for equipment control
   - Slave ID, register mapping
   - Connection validation

2. **MQTT**
   - IoT-friendly protocol
   - Topic-based command publishing
   - JSON payload format

3. **GPIO Relay**
   - Direct GPIO pin control
   - Relay switching for equipment
   - Local hardware interface

4. **HTTP**
   - RESTful API calls
   - JSON request/response
   - Authentication support

5. **Manual**
   - Placeholder for manual control
   - Audit trail only

### Validation Rules

- Equipment must be operational
- Duration must be 15-300 minutes
- Flow rate must be 0-100%
- No overlapping control commands
- Emergency stop always available

### Execution Modes

- **DRY_RUN**: Simulates command without execution
- **SIMULATION**: Calculates effects without hardware interaction
- **ACTUAL**: Real equipment control (requires validation)

## Data Ingestion Pipeline

### Celery Tasks

1. **Fetch Weather Data** (hourly)
   - Public weather API integration
   - Precipitation, temperature, ET calculation
   - Normalized storage with resolution metadata

2. **Process Sensor Data** (5-minute intervals)
   - Soil moisture, temperature readings
   - Validation and outlier detection
   - Normalization and confidence scoring

3. **Generate Recommendations** (hourly)
   - Decision engine evaluation
   - Audit trail logging
   - Notification generation

4. **Equipment Health Check** (15-minute intervals)
   - Status polling
   - Failure detection
   - Alert generation

## Real-time Updates

### Server-Sent Events (SSE)

- Field-specific metric updates
- Recommendation changes
- Control action status
- Equipment status changes
- Critical alerts

### Event Types

- `metric_update`: New normalized metric
- `recommendation_update`: New irrigation recommendation
- `control_action`: Equipment control command
- `equipment_status`: Equipment status change
- `alert`: Critical system alert

## LLM Analysis Service

### Capabilities

1. **Historical Pattern Analysis**
   - Analyzes 30+ days of irrigation data
   - Identifies trends and patterns
   - Generates optimization recommendations

2. **Farmer Question Answering**
   - Context-aware responses
   - Based on field-specific data
   - Natural language explanations

3. **Seasonal Optimization**
   - 90-day trend analysis
   - Efficiency recommendations
   - Crop performance insights

### Data Aggregation

- Metrics grouped by type
- Statistical calculations (avg, min, max)
- Recommendation history analysis
- Confidence-weighted analysis

## Audit Logging

### Complete Traceability

Every decision includes:
- Input metrics and their resolutions
- Rule evaluation results
- Confidence calculations
- Recommendation generation
- Control action execution
- User/system initiator
- Timestamp and audit trail

### Compliance

- GDPR-compliant data retention
- User action attribution
- Equipment command logging
- Sensor data provenance

## Deployment

### Docker Compose Stack

- PostgreSQL + TimescaleDB
- Redis (Celery broker)
- FastAPI backend
- Celery worker (data ingestion)
- Celery beat (scheduling)
- Next.js frontend

### Environment Configuration

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/farmsense

# Redis
REDIS_URL=redis://localhost:6379/0

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im

# LLM Integration
OPENAI_API_KEY=sk-...

# Application
ENVIRONMENT=production
LOG_LEVEL=info
```

## Performance Considerations

### Database Optimization

- TimescaleDB hypertables for metrics
- Automatic compression for old data
- Indexing on field_id, timestamp, metric_type
- Partitioning by time for large datasets

### Caching Strategy

- Redis for real-time metric caching
- Decision cache (5-minute TTL)
- Recommendation cache (1-hour TTL)

### Scalability

- Horizontal scaling of Celery workers
- Database read replicas for analytics
- CDN for static frontend assets
- API rate limiting and throttling

## Security

### Authentication & Authorization

- OAuth 2.0 integration
- JWT-based session management
- Role-based access control (admin/user)
- Field-level access restrictions

### Data Protection

- Encrypted database connections
- HTTPS/TLS for all communications
- Secure API key management
- Input validation and sanitization

### Control Safety

- Dry-run mode for all commands
- Manual override requirements
- Emergency kill switch always available
- Audit trail for all actions

## Monitoring & Alerting

### Metrics

- System health (CPU, memory, disk)
- Database performance
- API response times
- Celery task queue depth
- Equipment status

### Alerts

- Equipment offline
- Sensor failures
- Database connection issues
- Celery worker failures
- Critical irrigation decisions

## Future Enhancements

- Machine learning model for predictive irrigation
- Multi-region water management
- Integration with agricultural marketplaces
- Mobile app for field monitoring
- Advanced visualization and reporting
- Blockchain-based audit trail
