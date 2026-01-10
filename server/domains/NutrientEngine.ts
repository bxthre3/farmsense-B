import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class NutrientEngine extends BaseEngine {
  constructor() {
    super(DomainType.NUTRIENT);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const nitrogenLevel = this.getMetricValue(currentMetrics, 'nitrogen_level', 50);
    const cropStage = input.cropData ? 'VEGETATIVE' : 'UNKNOWN'; // Simplified
    const precipForecast = this.getMetricValue(currentMetrics, 'precipitation_forecast', 0);
    const equipmentAvailable = this.getMetricValue(currentMetrics, 'equipment_available', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      nutrient_use_efficiency: 0,
      environmental_impact_risk: 0
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!equipmentAvailable) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Fertilizer application equipment unavailable.");
    } else if (precipForecast > 15) {
      contextFlags.push(ContextFlag.WEATHER_DELAY);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`High precipitation forecast (${precipForecast}mm) increases leaching risk.`);
      kpis.environmental_impact_risk = 100;
      predictedNext = BaseRecommendation.SOON;
    } else if (nitrogenLevel < 30) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Nitrogen level (${nitrogenLevel} ppm) is below critical threshold for ${cropStage} stage.`);
      kpis.nutrient_use_efficiency = 95;
      predictedNext = BaseRecommendation.WAIT;
    } else if (nitrogenLevel < 45) {
      base = BaseRecommendation.SOON;
      thresholdsApproaching.push("Nitrogen levels approaching deficiency");
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
    }

    const explainability = {
      inputsUsed: ['nitrogen_level', 'precipitation_forecast', 'equipment_available'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Nutrient depletion rates', 'Weather-driven leaching risk'],
      cropStage
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
