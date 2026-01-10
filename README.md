# FarmSense-All: The Complete Agricultural Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/bxthre3/FarmSense-All/actions/workflows/ci.yml/badge.svg)](https://github.com/bxthre3/FarmSense-All)

**FarmSense-All** is the definitive, production-ready consolidation of the FarmSense platform—integrating advanced UI/UX, robust backend logic, deterministic Python decision engines, and comprehensive strategic documentation into a single, unified agricultural operating system.

## 🎯 What is FarmSense-All?

FarmSense-All represents the **complete vision** of deterministic farming automation. It consolidates four major versions into one cohesive system:

- **farmsense-full**: Advanced UI with Robotics, Map View, Idle Mode, and 11 TypeScript domain engines
- **farmsense**: Production-ready backend with decision engines, irrigation control, real-time services, and comprehensive deployment documentation
- **FarmSense-Alpha**: Strategic documentation, IP strategy, 332+ metric dictionary, and Keyless API mapping
- **Current Session**: Python deterministic engine (11 domains), subprocess integration, and full auditability

The result is a **complete "Agricultural Operating System"** with deterministic, auditable decision-making, 11 operational domains covering the entire crop lifecycle, advanced spatial intelligence and robotics fleet management, and full explainability and compliance-ready audit trails.

## 🚀 Key Features

### **11 Domain Intelligence Engines**
Comprehensive coverage from Planning through Logistics: Planning, Field Preparation, Planting, Irrigation, Nutrient Administration, Pest & Weed Control, Harvest, Processing, Packaging, Warehousing, and Logistics.

### **Deterministic Decision Framework**
- **Unified Recommendation Model**: All domains use NOW/SOON/LATER/WAIT/MONITOR
- **Context Flags**: Weather delays, labor constraints, equipment availability, capacity limits, material availability
- **Severity Overlays**: Emergency conditions requiring human confirmation
- **Full Explainability**: Every recommendation includes inputs, thresholds, trends, and crop stage
- **KPI Integration**: Domain-specific performance metrics with aggregation capability
- **Audit Trail**: Complete reconstruction capability with audit_log_id tracking

### **Advanced User Interface**
- **Spatial-First Map View**: Real-time field visualization with robot positioning and sensor data
- **Robotics Command Center**: Full fleet management with modular attachment support and utilization tracking
- **Idle Mode**: Cognitive-load-aware UI that surfaces critical recommendations during inactivity
- **Advanced Dashboard**: Real-time monitoring with KPI visualization
- **Statistics Page**: Historical analysis and performance trends
- **Settings Interface**: User preferences and system configuration
- **Mobile-First Design**: Fully responsive for field operations

### **Production-Ready Backend**
- **tRPC Type-Safe API**: 25+ procedures with full type safety
- **Real-Time Service**: WebSocket-based live updates for dashboard
- **LLM Analysis**: Gray-zone decision support with confidence scoring
- **Data Ingestion**: Multi-source sensor data normalization and validation
- **Python Engine Bridge**: Subprocess communication for deterministic logic
- **Database Layer**: PostgreSQL with Drizzle ORM and migrations

### **Compliance & Auditability**
- **Deterministic Logic**: No AI inference, science-backed rules only
- **Full Reconstruction**: Every decision can be replayed with original inputs
- **Audit Logging**: Complete trail of all inputs, outputs, timestamps, and confidence scores
- **Emergency Confirmation**: Human sign-off required for critical decisions
- **Metrics Dictionary**: 332+ standardized metrics for regulatory compliance
- **IP Protection**: Strategic documentation and patent-ready architecture

## 🏗️ Architecture

### **Technology Stack**

**Frontend**: React 19 with TypeScript, Tailwind CSS 4, Vite, Lucide Icons, Framer Motion, TanStack React Query

**Backend**: Node.js with Express, tRPC 11, PostgreSQL with Drizzle ORM, Python subprocess bridge

**Decision Engine**: Python 3.8+ with deterministic logic, 11 domain-specific engines, JSON-based input/output

**Deployment**: Docker Compose for local development, production deployment guides, environment-based configuration

### **Project Structure**

```
FarmSense-All/
├── client/                          # React frontend
│   ├── src/pages/                  # Dashboard, Fields, MapView, Robotics, Stats, Settings
│   ├── src/components/             # Reusable UI components
│   └── public/                     # Static assets
├── server/                          # Node.js backend
│   ├── api/                        # tRPC router and procedures
│   ├── db/                         # Database schema and queries
│   ├── domains/                    # TypeScript domain engines
│   ├── services/                   # Business logic services
│   └── [core modules]              # Data ingestion, decision engine, irrigation control, LLM analysis
├── python-engine/                   # Python deterministic engines
│   ├── engine.py                   # Core recommendation classes
│   ├── potato_logic.py             # 11 domain engines
│   ├── platform.py                 # Orchestrator
│   └── [validation & test files]
├── drizzle/                         # Database schema and migrations
├── docs/                            # Comprehensive documentation
└── scripts/                         # Deployment and utility scripts
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- Python 3.8+
- PostgreSQL 13+
- pnpm or npm

### **Installation**

```bash
# Clone the repository
git clone https://github.com/bxthre3/FarmSense-All.git
cd FarmSense-All

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
pnpm db:push

# Start development server
pnpm dev
```

### **Local Development with Docker**

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api/trpc
```

## 📊 Domain-Specific Decision Logic

Each of the 11 domains follows the unified recommendation framework with states: NOW (0–2 hours), SOON (3–7 hours), LATER (8–16 hours), WAIT (paused), and MONITOR (observation).

Context flags include WEATHER_DELAY, LABOR_CONSTRAINT, EQUIPMENT_CONSTRAINT, CAPACITY_CONSTRAINT, and MATERIALS_CONSTRAINT. Severity overlays include EMERGENCY for critical risks requiring human confirmation.

## 🔧 API Reference

Get a recommendation for a specific domain via POST /api/trpc/domains.getRecommendation with domain, fieldId, and inputs. Confirm an emergency recommendation via POST /api/trpc/domains.confirmEmergency with auditLogId.

See `FarmSense_Keyless_API_Mapping.md` for the complete 332+ metric dictionary and API reference.

## 📈 KPI Tracking

Each domain tracks relevant performance indicators: Planning (`operational_readiness`), Field Prep (`soil_health_index`, `operational_delay_risk`, `stress_avoidance_potential`), Planting (`planting_window_optimization`), Irrigation (`water_efficiency`, `stress_avoidance`, `water_savings_potential`), Nutrient (`nutrient_use_efficiency`), Pest/Weed (`crop_health_protection`), Harvest (`harvest_readiness`), Processing (`throughput_efficiency`), Packaging (`inventory_turnover_potential`), Warehousing (`post_harvest_loss_reduction`), and Logistics (`dispatch_efficiency`).

## 🧪 Testing

Run the comprehensive test suite with `pnpm test`. Test coverage includes 55+ backend tests for decision engine, irrigation control, and LLM analysis, plus Python engine validation tests and integration tests for domain engines.

## 📚 Documentation

Comprehensive documentation is included: ARCHITECTURE.md (complete system design), DEPLOYMENT.md (production deployment), DEPLOYMENT_GUIDE.md (step-by-step), INTEGRATION_GUIDE.md (Python engine integration), FarmSense_Keyless_API_Mapping.md (332+ metrics and API reference), PROJECT_SUMMARY.md (high-level overview), and QUICK_REFERENCE.md (developer reference).

## 🔐 Security & Compliance

- **Deterministic Logic**: No AI inference, all decisions are rule-based and auditable
- **Full Audit Trail**: Every decision logged with complete reconstruction capability
- **Emergency Confirmation**: Critical decisions require human sign-off
- **Data Validation**: Multi-layer input validation and normalization
- **Environment-Based Config**: Secrets managed via environment variables
- **OAuth Integration**: Manus OAuth for secure authentication

## 🚢 Deployment

**Development**: `pnpm dev`  
**Production Build**: `pnpm build && pnpm start`  
**Docker Deployment**: `docker-compose -f docker-compose.prod.yml up -d`

See `DEPLOYMENT_GUIDE.md` for detailed production deployment instructions.

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

See CONTRIBUTING.md for contribution guidelines.

## 📞 Support

For issues, feature requests, or questions: check existing documentation in `/docs`, review the API reference in `FarmSense_Keyless_API_Mapping.md`, or file an issue on GitHub with detailed information.

## 🎓 Learning Resources

- **For Developers**: Start with `ARCHITECTURE.md` and `QUICK_REFERENCE.md`
- **For Operations**: See `DEPLOYMENT_GUIDE.md` and domain-specific documentation
- **For Strategic Planning**: Review `PROJECT_SUMMARY.md` and strategic documentation
- **For API Integration**: Consult `FarmSense_Keyless_API_Mapping.md`

## 🏆 Key Achievements

✅ **11 Operational Domains** - Complete crop lifecycle coverage  
✅ **Deterministic Decision-Making** - No black-box AI, full auditability  
✅ **Advanced UI/UX** - Robotics, map view, idle mode, responsive design  
✅ **Production-Ready Backend** - 25+ tRPC procedures, real-time service  
✅ **Python Engine Integration** - Subprocess bridge for deterministic logic  
✅ **Comprehensive Documentation** - Architecture, deployment, API reference  
✅ **332+ Metrics** - Standardized KPI dictionary for compliance  
✅ **55+ Tests** - Comprehensive test coverage  
✅ **Strategic IP** - Patent-ready architecture with defensive moat  

---

**FarmSense-All: Where precision agriculture meets deterministic automation.**

Built with ❤️ for modern farming operations.
