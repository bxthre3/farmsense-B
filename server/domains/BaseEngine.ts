/**
 * FarmSense Unified Platform - Base Domain Engine
 * 
 * Abstract base class for all domain engines with shared functionality
 */

import { 
  BaseRecommendation, 
  ContextFlag, 
  SeverityOverlay, 
  DomainType,
  Recommendation,
  Explainability,
  DomainEngineInput,
  NormalizedMetric
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import { HardeningService, HardenedMetric } from '../services/HardeningService.js';

export interface ReasoningStep {
  step: string;
  observation: string;
  implication: string;
  confidence: number;
}

import { ScenarioOutcome } from '../services/PredictiveService.js';
import { SafetyInterlock, ResolutionMetadata } from '../services/SafetyService.js';

export interface DeepExplainability extends Explainability {
  reasoningChain: ReasoningStep[];
  hardenedMetrics: Record<string, HardenedMetric>;
  dataIntegrityScore: number;
  scenarios: ScenarioOutcome[];
  safetyInterlocks: SafetyInterlock[];
  resolutionMetadata: ResolutionMetadata;
}

export interface EngineRecommendationParams {
  base: BaseRecommendation;
  contextFlags?: ContextFlag[];
  severityOverlays?: SeverityOverlay[];
  explainability: DeepExplainability;
  kpis: Record<string, number>;
  predictedNext?: BaseRecommendation | null;
  validDurationHours?: number;
  confidence?: number;
  rawInputs: Record<string, any>;
}

export abstract class BaseEngine {
  protected domain: DomainType;

  constructor(domain: DomainType) {
    this.domain = domain;
  }

  /**
   * Harden inputs before processing
   */
  protected hardenInputs(input: DomainEngineInput): Record<string, HardenedMetric> {
    const metricsToHarden: Record<string, NormalizedMetric> = {};
    for (const [key, metric] of Object.entries(input.currentMetrics)) {
      metricsToHarden[key] = metric as NormalizedMetric;
    }
    return HardeningService.hardenMetrics(metricsToHarden);
  }

  /**
   * Abstract method that each domain engine must implement
   */
  abstract generateRecommendation(input: DomainEngineInput): Promise<Recommendation>;

  /**
   * Calculate trend from current and previous values
   */
  protected calculateTrend(
    current: number, 
    previous: number | null, 
    rateOfChange: number | null = null
  ): "INCREASING" | "DECREASING" | "STABLE" {
    if (previous === null) {
      return "STABLE";
    }
    if (rateOfChange !== null) {
      if (rateOfChange > 0) return "INCREASING";
      if (rateOfChange < 0) return "DECREASING";
    }
    if (current < previous) return "DECREASING";
    if (current > previous) return "INCREASING";
    return "STABLE";
  }

  /**
   * Create a recommendation object with all required fields
   */
  protected createRecommendation(
    fieldId: string,
    params: EngineRecommendationParams
  ): Recommendation {
    const issuedAt = new Date();
    const validDurationHours = params.validDurationHours ?? 4;
    const validUntil = new Date(issuedAt.getTime() + validDurationHours * 60 * 60 * 1000);

    // Determine urgency level
    let urgencyLevel: Recommendation['urgencyLevel'] = "NONE";
    if (params.severityOverlays?.includes(SeverityOverlay.EMERGENCY)) {
      urgencyLevel = "CRITICAL";
    } else {
      const urgencyMap: Record<BaseRecommendation, Recommendation['urgencyLevel']> = {
        [BaseRecommendation.NOW]: "HIGH",
        [BaseRecommendation.SOON]: "MEDIUM",
        [BaseRecommendation.LATER]: "LOW",
        [BaseRecommendation.WAIT]: "NONE",
        [BaseRecommendation.MONITOR]: "INFO"
      };
      urgencyLevel = urgencyMap[params.base];
    }

    // Determine display color
    const colorMap: Record<BaseRecommendation, Recommendation['displayColor']> = {
      [BaseRecommendation.NOW]: "ORANGE",
      [BaseRecommendation.SOON]: "YELLOW",
      [BaseRecommendation.LATER]: "BLUE",
      [BaseRecommendation.WAIT]: "GREEN",
      [BaseRecommendation.MONITOR]: "CYAN"
    };
    const displayColor = params.severityOverlays?.includes(SeverityOverlay.EMERGENCY) 
      ? "RED" 
      : colorMap[params.base];

    const requiresHumanConfirmation = params.severityOverlays?.includes(SeverityOverlay.EMERGENCY) ?? false;

    return {
      id: uuidv4(),
      domain: this.domain,
      fieldId,
      issuedAt,
      validUntil,
      baseRecommendation: params.base,
      urgencyLevel,
      displayColor,
      contextFlags: params.contextFlags ?? [],
      severityOverlays: params.severityOverlays ?? [],
      requiresHumanConfirmation,
      confirmedAt: null,
      explainability: params.explainability,
      kpis: params.kpis,
      predictedNextRecommendation: params.predictedNext ?? null,
      confidence: params.confidence ?? 0.8,
      auditLogId: uuidv4(),
      rawInputs: params.rawInputs
    };
  }

  /**
   * Get metric value safely with fallback
   */
  protected getMetricValue(
    metrics: Record<string, any>,
    key: string,
    fallback: number = 0
  ): number {
    const metric = metrics[key];
    if (!metric) return fallback;
    if (typeof metric === 'number') return metric;
    if (metric.value !== undefined) return Number(metric.value);
    return fallback;
  }

  /**
   * Get metric with previous value for trend calculation
   */
  protected getMetricWithHistory(
    currentMetrics: Record<string, any>,
    historicalMetrics: Record<string, any[]> | undefined,
    key: string
  ): { current: number; previous: number | null } {
    const current = this.getMetricValue(currentMetrics, key);
    let previous: number | null = null;

    if (historicalMetrics && historicalMetrics[key] && historicalMetrics[key].length > 0) {
      const history = historicalMetrics[key];
      const lastMetric = history[history.length - 1];
      previous = typeof lastMetric === 'number' ? lastMetric : Number(lastMetric.value ?? 0);
    }

    return { current, previous };
  }

  /**
   * Calculate confidence score based on data quality
   */
  protected calculateConfidence(
    metrics: Record<string, any>,
    requiredMetrics: string[]
  ): number {
    let totalConfidence = 0;
    let count = 0;

    for (const key of requiredMetrics) {
      const metric = metrics[key];
      if (metric && metric.resolution && metric.resolution.confidenceScore !== undefined) {
        totalConfidence += metric.resolution.confidenceScore;
        count++;
      }
    }

    return count > 0 ? totalConfidence / count : 0.7; // Default to 0.7 if no confidence data
  }

  /**
   * Check if data quality is sufficient for recommendations
   */
  protected checkDataQuality(
    metrics: Record<string, any>,
    requiredMetrics: string[],
    minConfidence: number = 0.5
  ): { sufficient: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const key of requiredMetrics) {
      const metric = metrics[key];
      if (!metric) {
        issues.push(`Missing required metric: ${key}`);
        continue;
      }

      if (metric.resolution && metric.resolution.confidenceScore < minConfidence) {
        issues.push(`Low confidence for ${key}: ${metric.resolution.confidenceScore.toFixed(2)}`);
      }
    }

    return {
      sufficient: issues.length === 0,
      issues
    };
  }

  /**
   * Get domain name
   */
  getDomain(): DomainType {
    return this.domain;
  }
}
