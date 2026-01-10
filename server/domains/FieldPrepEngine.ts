import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class FieldPrepEngine extends BaseEngine {
  constructor() {
    super(DomainType.FIELD_PREP);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const awc = this.getMetricValue(currentMetrics, 'awc', 100);
    const compaction = this.getMetricValue(currentMetrics, 'compaction_level', 0);
    const precipForecast = this.getMetricValue(currentMetrics, 'precipitation_forecast', 0);
    const equipmentAvailable = this.getMetricValue(currentMetrics, 'equipment_available', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      soil_health_index: 100 - compaction,
      operational_delay_risk: 0
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!equipmentAvailable) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Field preparation equipment unavailable.");
    } else if (precipForecast > 5) {
      contextFlags.push(ContextFlag.WEATHER_DELAY);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`Precipitation forecast (${precipForecast}mm) exceeds 5mm threshold for field work.`);
      kpis.operational_delay_risk = 100;
      predictedNext = BaseRecommendation.SOON;
    } else if (awc < 30 && compaction > 70) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Soil moisture (${awc}%) is low and compaction (${compaction}) is high, requiring immediate preparation.`);
      predictedNext = BaseRecommendation.WAIT;
    } else {
      base = BaseRecommendation.MONITOR;
      thresholdsApproaching.push("Monitoring soil moisture and compaction levels");
    }

    const explainability = {
      inputsUsed: ['awc', 'compaction_level', 'precipitation_forecast', 'equipment_available'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Soil moisture and compaction trends'],
      cropStage: 'PRE-PLANTING'
    };

    return this.createRecommendation(input.fieldId, {
      base,
      contextFlags,
      explainability,
      kpis,
      predictedNext,
      rawInputs: rawInputs ?? {}
    });
  }
}
