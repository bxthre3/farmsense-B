import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class PlantingEngine extends BaseEngine {
  constructor() {
    super(DomainType.PLANTING);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const soilTemp = this.getMetricValue(currentMetrics, 'soil_temp', 0);
    const seedReady = this.getMetricValue(currentMetrics, 'seed_ready', 1) === 1;
    const laborAvailable = this.getMetricValue(currentMetrics, 'labor_available', 1) === 1;
    const precipForecast = this.getMetricValue(currentMetrics, 'precipitation_forecast', 0);

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      planting_efficiency: 0,
      germination_risk: 0
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!seedReady) {
      contextFlags.push(ContextFlag.MATERIALS_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Seed stock not ready for planting.");
    } else if (!laborAvailable) {
      contextFlags.push(ContextFlag.LABOR_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Planting labor unavailable.");
    } else if (soilTemp < 7) {
      contextFlags.push(ContextFlag.WEATHER_DELAY);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`Soil temperature (${soilTemp}°C) is below the 7°C minimum for potato planting.`);
      predictedNext = BaseRecommendation.SOON;
      kpis.germination_risk = 100;
    } else if (soilTemp >= 10 && precipForecast < 2) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Optimal conditions: Soil temp (${soilTemp}°C) and low precipitation forecast.`);
      kpis.planting_efficiency = 100;
      predictedNext = BaseRecommendation.WAIT;
    } else if (soilTemp >= 7) {
      base = BaseRecommendation.SOON;
      thresholdsCrossed.push(`Soil temperature (${soilTemp}°C) is approaching optimal levels.`);
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
    }

    const explainability = {
      inputsUsed: ['soil_temp', 'seed_ready', 'labor_available', 'precipitation_forecast'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Soil temperature trends', 'Weather forecast'],
      cropStage: 'PLANTING'
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
