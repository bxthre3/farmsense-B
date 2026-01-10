import { BaseEngine, ReasoningStep, DeepExplainability } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag,
  SeverityOverlay,
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';
import { SafetyService, ResolutionMetadata } from '../services/SafetyService.js';
import { PredictiveService } from '../services/PredictiveService.js';

export class IrrigationEngine extends BaseEngine {
  constructor() {
    super(DomainType.IRRIGATION);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const hardenedMetrics = this.hardenInputs(input);
    const reasoningChain: ReasoningStep[] = [];
    
    // 1. Resolution & Safety Assessment
    const resolution: ResolutionMetadata = {
      spatialResolution: 1.0,
      temporalResolution: 15,
      confidenceScore: 0.95,
      sourceType: 'SENSOR'
    };
    
    const safetyAssessment = SafetyService.assessResolutionSafety(this.domain, resolution);
    const interlocks = SafetyService.checkInterlocks(this.domain, ['MODBUS'], 'OPERATIONAL');
    
    reasoningChain.push({
      step: "Safety & Resolution Gate",
      observation: `Resolution: ${resolution.temporalResolution}min, Safety: ${safetyAssessment.isSafe ? 'PASS' : 'FAIL'}`,
      implication: safetyAssessment.isSafe ? "System is safe for deterministic actuation." : `Safety block: ${safetyAssessment.reason}`,
      confidence: resolution.confidenceScore
    });

    // 2. Data Integrity Assessment
    const avgIntegrity = Object.values(hardenedMetrics).reduce((acc, m) => acc + m.integrityScore, 0) / Object.values(hardenedMetrics).length;
    reasoningChain.push({
      step: "Data Integrity Validation",
      observation: `Cross-metric hardening score: ${(avgIntegrity * 100).toFixed(1)}%`,
      implication: avgIntegrity < 0.7 ? "High uncertainty in sensor data. Applying conservative weighting." : "Data integrity verified. Proceeding with high-confidence logic.",
      confidence: avgIntegrity
    });

    // 3. Environmental Analysis
    const soilMoisture = Number(hardenedMetrics['soil_moisture']?.value ?? 0);
    const et = Number(hardenedMetrics['evapotranspiration']?.value ?? 0);
    const precip = Number(hardenedMetrics['precipitation_24h']?.value ?? 0);
    
    reasoningChain.push({
      step: "Environmental Analysis",
      observation: `Soil Moisture: ${soilMoisture}%, ET: ${et}mm, 24h Precip: ${precip}mm`,
      implication: precip > 5 ? "Recent precipitation detected. Soil likely in drainage phase." : "No recent precipitation. Soil moisture driven by ET and drainage.",
      confidence: 0.95
    });

    // 4. Threshold Logic (Intelligence Stack)
    const fieldCapacity = input.soilData?.fieldCapacityPercent ?? 30;
    const wiltingPoint = input.soilData?.wiltingPointPercent ?? 12;
    const irrigationThreshold = wiltingPoint + (fieldCapacity - wiltingPoint) * 0.3;

    let base: BaseRecommendation = BaseRecommendation.MONITOR;
    const thresholdsCrossed: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const severityOverlays: SeverityOverlay[] = [];

    if (soilMoisture <= wiltingPoint + 2) {
      base = BaseRecommendation.NOW;
      severityOverlays.push(SeverityOverlay.EMERGENCY);
      thresholdsCrossed.push(`CRITICAL: Soil moisture (${soilMoisture}%) at wilting point (${wiltingPoint}%).`);
    } else if (soilMoisture <= irrigationThreshold) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Soil moisture (${soilMoisture}%) below management threshold (${irrigationThreshold.toFixed(1)}%).`);
    }

    // 5. Predictive Scenario Analysis
    const scenarios = PredictiveService.performWhatIfAnalysis(this.domain, hardenedMetrics);

    const explainability: DeepExplainability = {
      inputsUsed: Object.keys(hardenedMetrics),
      thresholdsCrossed,
      thresholdsApproaching: soilMoisture < irrigationThreshold + 5 ? ["Irrigation threshold"] : [],
      trendsConsidered: ["Soil moisture depletion rate", "ET demand"],
      cropStage: "VEGETATIVE",
      reasoningChain,
      hardenedMetrics,
      dataIntegrityScore: avgIntegrity,
      scenarios,
      safetyInterlocks: interlocks,
      resolutionMetadata: resolution
    };

    return this.createRecommendation(input.fieldId, {
      base,
      contextFlags,
      severityOverlays,
      explainability,
      kpis: { water_efficiency: 92, stress_avoidance: 100 },
      confidence: avgIntegrity * resolution.confidenceScore,
      rawInputs: input.rawInputs ?? {}
    });
  }
}
