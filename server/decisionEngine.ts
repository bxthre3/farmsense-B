/**
 * FarmSense Decision Engine
 * 
 * Deterministic, rule-based decision logic for irrigation recommendations.
 * All decisions are resolution-aware and include full audit trails.
 */

import { NormalizedMetric, Field, Crop, SoilType } from "../drizzle/schema";

export type DecisionRecommendation = "IRRIGATE" | "DELAY" | "HOLD";

export interface DecisionInput {
  field: Field;
  crop: Crop | null;
  soilType: SoilType | null;
  soilMoisture: NormalizedMetric | null;
  soilTemperature: NormalizedMetric | null;
  precipitation: NormalizedMetric | null;
  evapotranspiration: NormalizedMetric | null;
  recentPrecipitation: number; // mm in last 24 hours
}

export interface ResolutionAssessment {
  soilMoistureConfidence: number;
  temperatureConfidence: number;
  precipitationConfidence: number;
  overallConfidence: number;
  dataQualityIssues: string[];
  isSafeForActuation: boolean;
}

export interface DecisionResult {
  recommendation: DecisionRecommendation;
  confidence: number;
  reasoning: string;
  recommendedDurationMinutes: number;
  recommendedFlowRatePercent: number;
  resolutionAssessment: ResolutionAssessment;
  ruleEvaluations: Record<string, boolean>;
}

/**
 * Assess the quality and confidence of available data
 */
export function assessResolution(input: DecisionInput): ResolutionAssessment {
  const issues: string[] = [];
  let soilMoistureConfidence = 0;
  let temperatureConfidence = 0;
  let precipitationConfidence = 0;

  // Soil Moisture Assessment
  if (!input.soilMoisture) {
    issues.push("No soil moisture data available");
  } else {
    soilMoistureConfidence = Number(input.soilMoisture.confidenceScore) || 0.7;
    if (soilMoistureConfidence < 0.5) {
      issues.push("Low soil moisture confidence");
    }
  }

  // Temperature Assessment
  if (!input.soilTemperature) {
    issues.push("No soil temperature data available");
  } else {
    temperatureConfidence = Number(input.soilTemperature.confidenceScore) || 0.7;
    if (temperatureConfidence < 0.5) {
      issues.push("Low temperature confidence");
    }
  }

  // Precipitation Assessment
  if (!input.precipitation) {
    issues.push("No precipitation data available");
  } else {
    precipitationConfidence = Number(input.precipitation.confidenceScore) || 0.7;
    if (precipitationConfidence < 0.5) {
      issues.push("Low precipitation confidence");
    }
  }

  const overallConfidence =
    (soilMoistureConfidence * 0.5 + temperatureConfidence * 0.2 + precipitationConfidence * 0.3);

  const isSafeForActuation = overallConfidence >= 0.6 && issues.length === 0;

  return {
    soilMoistureConfidence,
    temperatureConfidence,
    precipitationConfidence,
    overallConfidence,
    dataQualityIssues: issues,
    isSafeForActuation,
  };
}

/**
 * Main decision engine: evaluates all inputs and produces an irrigation recommendation
 */
export function makeDecision(input: DecisionInput): DecisionResult {
  const ruleEvaluations: Record<string, boolean> = {};
  const resolutionAssessment = assessResolution(input);

  // Rule 1: Insufficient data quality
  ruleEvaluations.insufficientData = resolutionAssessment.dataQualityIssues.length > 0;
  if (ruleEvaluations.insufficientData) {
    return {
      recommendation: "HOLD",
      confidence: 0.3,
      reasoning: `Insufficient data quality: ${resolutionAssessment.dataQualityIssues.join(", ")}. System cannot safely make irrigation decisions.`,
      recommendedDurationMinutes: 0,
      recommendedFlowRatePercent: 0,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Extract metric values
  const soilMoisturePercent = input.soilMoisture ? Number(input.soilMoisture.value) : null;
  const soilTempC = input.soilTemperature ? Number(input.soilTemperature.value) : null;
  const precipMm = input.precipitation ? Number(input.precipitation.value) : 0;
  const etMm = input.evapotranspiration ? Number(input.evapotranspiration.value) : 0;

  // Get soil thresholds
  const fieldCapacity = input.soilType ? Number(input.soilType.fieldCapacityPercent) : 30;
  const wiltingPoint = input.soilType ? Number(input.soilType.wiltingPointPercent) : 12;
  const availableWater = fieldCapacity - wiltingPoint;
  const irrigationThreshold = wiltingPoint + availableWater * 0.3; // Irrigate at 30% available water
  const holdThreshold = wiltingPoint + availableWater * 0.5; // Hold if above 50% available water

  // Rule 2: Recent precipitation sufficient
  ruleEvaluations.recentPrecipitation = precipMm >= 10;
  if (ruleEvaluations.recentPrecipitation) {
    return {
      recommendation: "DELAY",
      confidence: 0.85,
      reasoning: `Recent precipitation of ${precipMm}mm is sufficient. Delaying irrigation to allow soil moisture to stabilize.`,
      recommendedDurationMinutes: 0,
      recommendedFlowRatePercent: 0,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Rule 3: Soil moisture critically low
  ruleEvaluations.criticallyLow = soilMoisturePercent !== null && soilMoisturePercent <= wiltingPoint;
  if (ruleEvaluations.criticallyLow) {
    return {
      recommendation: "IRRIGATE",
      confidence: 0.95,
      reasoning: `Soil moisture at ${soilMoisturePercent}% is at or below wilting point (${wiltingPoint}%). Immediate irrigation required to prevent crop stress.`,
      recommendedDurationMinutes: 120,
      recommendedFlowRatePercent: 100,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Rule 4: Soil moisture below irrigation threshold
  ruleEvaluations.belowThreshold = soilMoisturePercent !== null && soilMoisturePercent <= irrigationThreshold;
  if (ruleEvaluations.belowThreshold) {
    // Check ET demand
    ruleEvaluations.highETDemand = etMm > 4;
    if (ruleEvaluations.highETDemand) {
      const durationMinutes = Math.min(180, Math.max(60, Math.round(etMm * 10)));
      return {
        recommendation: "IRRIGATE",
        confidence: 0.80,
        reasoning: `Soil moisture at ${soilMoisturePercent}% is below irrigation threshold (${irrigationThreshold}%). High evapotranspiration demand (${etMm}mm/day) indicates crop water need.`,
        recommendedDurationMinutes: durationMinutes,
        recommendedFlowRatePercent: 80,
        resolutionAssessment,
        ruleEvaluations,
      };
    }

    return {
      recommendation: "DELAY",
      confidence: 0.70,
      reasoning: `Soil moisture at ${soilMoisturePercent}% is approaching irrigation threshold (${irrigationThreshold}%). Monitoring ET demand before irrigation decision.`,
      recommendedDurationMinutes: 0,
      recommendedFlowRatePercent: 0,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Rule 5: Soil moisture adequate
  ruleEvaluations.aboveThreshold = soilMoisturePercent !== null && soilMoisturePercent > holdThreshold;
  if (ruleEvaluations.aboveThreshold) {
    return {
      recommendation: "HOLD",
      confidence: 0.85,
      reasoning: `Soil moisture at ${soilMoisturePercent}% is above hold threshold (${holdThreshold}%). Soil has adequate water; irrigation not needed.`,
      recommendedDurationMinutes: 0,
      recommendedFlowRatePercent: 0,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Rule 6: Soil temperature too low for irrigation
  ruleEvaluations.temperatureTooLow = soilTempC !== null && soilTempC < 10;
  if (ruleEvaluations.temperatureTooLow) {
    return {
      recommendation: "HOLD",
      confidence: 0.75,
      reasoning: `Soil temperature at ${soilTempC}°C is too low for optimal irrigation. Delaying until soil warms.`,
      recommendedDurationMinutes: 0,
      recommendedFlowRatePercent: 0,
      resolutionAssessment,
      ruleEvaluations,
    };
  }

  // Default: Hold until more data available
  return {
    recommendation: "HOLD",
    confidence: 0.50,
    reasoning: "Insufficient data to make a confident irrigation decision. Monitoring conditions.",
    recommendedDurationMinutes: 0,
    recommendedFlowRatePercent: 0,
    resolutionAssessment,
    ruleEvaluations,
  };
}

/**
 * Validate an irrigation control action before execution
 */
export interface ControlValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateControlAction(
  recommendation: DecisionResult,
  equipmentStatus: string,
  recentActions: Array<{ status: string; timestamp: Date }>
): ControlValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check equipment status
  if (equipmentStatus !== "operational") {
    errors.push(`Equipment status is ${equipmentStatus}, not operational`);
  }

  // Check resolution safety
  if (!recommendation.resolutionAssessment.isSafeForActuation) {
    errors.push("Data resolution insufficient for safe actuation");
  }

  // Check confidence threshold
  if (recommendation.confidence < 0.6) {
    warnings.push(`Low confidence recommendation (${recommendation.confidence})`);
  }

  // Check for rapid successive actions
  const recentAction = recentActions[0];
  if (recentAction && recentAction.status === "COMPLETED") {
    const timeSinceLastAction = Date.now() - recentAction.timestamp.getTime();
    if (timeSinceLastAction < 300000) { // 5 minutes
      warnings.push("Recent irrigation action detected; verify before repeating");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
