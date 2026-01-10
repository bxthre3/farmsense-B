/**
 * FarmSense Unified Platform - Shared Types
 * 
 * Core type definitions shared between server and client
 */

// ============================================================================
// Base Recommendation Types
// ============================================================================

export enum BaseRecommendation {
  NOW = "NOW",       // Immediate action required
  SOON = "SOON",     // Action needed within hours
  LATER = "LATER",   // Action needed within days
  WAIT = "WAIT",     // Conditions not suitable, wait
  MONITOR = "MONITOR" // Observe without action
}

export enum ContextFlag {
  WEATHER_DELAY = "WEATHER_DELAY",
  LABOR_CONSTRAINT = "LABOR_CONSTRAINT",
  EQUIPMENT_CONSTRAINT = "EQUIPMENT_CONSTRAINT",
  CAPACITY_CONSTRAINT = "CAPACITY_CONSTRAINT",
  MATERIALS_CONSTRAINT = "MATERIALS_CONSTRAINT"
}

export enum SeverityOverlay {
  EMERGENCY = "EMERGENCY"
}

export enum DomainType {
  PLANNING = "PLANNING",
  FIELD_PREP = "FIELD_PREP",
  PLANTING = "PLANTING",
  IRRIGATION = "IRRIGATION",
  NUTRIENT = "NUTRIENT",
  PEST_WEED = "PEST_WEED",
  HARVEST = "HARVEST",
  PROCESSING = "PROCESSING",
  PACKAGING = "PACKAGING",
  WAREHOUSING = "WAREHOUSING",
  LOGISTICS = "LOGISTICS"
}

// ============================================================================
// Explainability Structure
// ============================================================================

export interface Explainability {
  inputsUsed: string[];
  thresholdsCrossed: string[];
  thresholdsApproaching: string[];
  trendsConsidered: string[];
  cropStage: string;
}

// ============================================================================
// Recommendation Interface
// ============================================================================

export interface Recommendation {
  id: string;
  domain: DomainType;
  fieldId: string;
  issuedAt: Date;
  validUntil: Date;
  baseRecommendation: BaseRecommendation;
  urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "INFO";
  displayColor: "RED" | "ORANGE" | "YELLOW" | "BLUE" | "GREEN" | "CYAN" | "WHITE";
  contextFlags: ContextFlag[];
  severityOverlays: SeverityOverlay[];
  requiresHumanConfirmation: boolean;
  confirmedAt: Date | null;
  explainability: Explainability;
  kpis: Record<string, number>;
  predictedNextRecommendation: BaseRecommendation | null;
  confidence: number;
  auditLogId: string;
  rawInputs: Record<string, any>;
}

// ============================================================================
// Resolution Metadata
// ============================================================================

export interface ResolutionMetadata {
  temporalResolution: number; // minutes
  spatialResolution: number; // meters
  confidenceScore: number; // 0.0 to 1.0
  sourceResolution: string;
  aggregationMethod: string;
}

// ============================================================================
// Metric Types
// ============================================================================

export interface NormalizedMetric {
  id: string;
  timestamp: Date;
  fieldId: string;
  metricType: string;
  value: number;
  unit: string;
  resolution: ResolutionMetadata;
  dataQualityFlags: string[];
}

// ============================================================================
// Control Types
// ============================================================================

export enum ControlProtocol {
  MODBUS_TCP = "MODBUS_TCP",
  MQTT = "MQTT",
  GPIO = "GPIO",
  HTTP = "HTTP",
  MANUAL = "MANUAL"
}

export enum ExecutionMode {
  DRY_RUN = "DRY_RUN",
  SIMULATION = "SIMULATION",
  ACTUAL = "ACTUAL"
}

export interface ControlCommand {
  equipmentId: string;
  commandType: string;
  executionMode: ExecutionMode;
  parameters: Record<string, any>;
  durationMinutes?: number;
  flowRatePercent?: number;
}

export interface ControlAction {
  id: string;
  timestamp: Date;
  equipmentId: string;
  command: ControlCommand;
  validationStatus: "PASSED" | "FAILED";
  executionStatus: "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED";
  equipmentResponse: Record<string, any> | null;
  auditTrailId: string;
}

// ============================================================================
// Farm and Field Types
// ============================================================================

export interface Farm {
  id: string;
  name: string;
  region: string;
  totalAcres: number;
  latitude: number;
  longitude: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  acres: number;
  cropTypeId: string | null;
  soilTypeId: string | null;
  boundaries: any; // GeoJSON
  equipmentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Crop {
  id: string;
  name: string;
  waterRequirementMmPerDay: number;
  rootDepthCm: number;
  growthStageDays: Record<string, number>;
  optimalTempRangeC: { min: number; max: number };
}

export interface SoilType {
  id: string;
  name: string;
  textureClass: string;
  fieldCapacityPercent: number;
  wiltingPointPercent: number;
  bulkDensity: number;
  hydraulicConductivity: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  controlProtocol: ControlProtocol;
  networkConfig: Record<string, any>;
  operationalStatus: "OPERATIONAL" | "OFFLINE" | "MAINTENANCE";
  fieldId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Domain Engine Input Types
// ============================================================================

export interface DomainEngineInput {
  fieldId: string;
  currentMetrics: Record<string, NormalizedMetric>;
  historicalMetrics?: Record<string, NormalizedMetric[]>;
  fieldData: Field;
  cropData: Crop | null;
  soilData: SoilType | null;
  equipmentData: Equipment[];
  manualOverrides?: Record<string, any>;
}

// ============================================================================
// LLM Analysis Types
// ============================================================================

export interface HistoricalPattern {
  domain: DomainType;
  pattern: string;
  confidence: number;
  timeRange: { start: Date; end: Date };
  recommendation: string;
}

export interface SeasonalOptimization {
  domain: DomainType;
  optimization: string;
  expectedBenefit: string;
  implementationSteps: string[];
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  dataSources: string[];
  timestamp: Date;
}
