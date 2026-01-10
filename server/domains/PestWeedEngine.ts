import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class PestWeedEngine extends BaseEngine {
  constructor() {
    super(DomainType.PEST_WEED);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const pestPressure = this.getMetricValue(currentMetrics, 'pest_pressure', 0);
    const diseaseRisk = this.getMetricValue(currentMetrics, 'disease_risk_index', 0);
    const windSpeed = this.getMetricValue(currentMetrics, 'wind_speed', 0);
    const equipmentAvailable = this.getMetricValue(currentMetrics, 'equipment_available', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      pest_control_efficacy: 0,
      application_safety_score: 100 - (windSpeed > 15 ? 100 : 0)
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!equipmentAvailable) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Spraying equipment unavailable.");
    } else if (windSpeed > 20) {
      contextFlags.push(ContextFlag.WEATHER_DELAY);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`Wind speed (${windSpeed} km/h) exceeds safety threshold for spraying.`);
      predictedNext = BaseRecommendation.SOON;
    } else if (diseaseRisk > 80 || pestPressure > 70) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Critical risk: Disease index (${diseaseRisk}) or pest pressure (${pestPressure}) exceeded thresholds.`);
      kpis.pest_control_efficacy = 90;
      predictedNext = BaseRecommendation.WAIT;
    } else if (diseaseRisk > 60 || pestPressure > 50) {
      base = BaseRecommendation.SOON;
      thresholdsApproaching.push("Pest or disease levels approaching intervention thresholds");
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
    }

    const explainability = {
      inputsUsed: ['pest_pressure', 'disease_risk_index', 'wind_speed', 'equipment_available'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Pest population growth', 'Disease environmental suitability'],
      cropStage: 'GROWING'
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
