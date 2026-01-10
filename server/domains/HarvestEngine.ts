import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class HarvestEngine extends BaseEngine {
  constructor() {
    super(DomainType.HARVEST);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const maturityIndex = this.getMetricValue(currentMetrics, 'maturity_index', 0);
    const precipForecast = this.getMetricValue(currentMetrics, 'precipitation_forecast', 0);
    const storageReady = this.getMetricValue(currentMetrics, 'storage_ready', 1) === 1;
    const equipmentAvailable = this.getMetricValue(currentMetrics, 'equipment_available', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      harvest_efficiency: 0,
      quality_preservation: 100
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!equipmentAvailable) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Harvesting equipment unavailable.");
    } else if (!storageReady) {
      contextFlags.push(ContextFlag.CAPACITY_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Storage facilities not ready for harvest.");
    } else if (precipForecast > 10) {
      contextFlags.push(ContextFlag.WEATHER_DELAY);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`High precipitation forecast (${precipForecast}mm) during harvest window.`);
      predictedNext = BaseRecommendation.SOON;
    } else if (maturityIndex > 90) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Crop maturity (${maturityIndex}%) reached. Optimal harvest window open.`);
      kpis.harvest_efficiency = 100;
      predictedNext = BaseRecommendation.WAIT;
    } else if (maturityIndex > 75) {
      base = BaseRecommendation.SOON;
      thresholdsApproaching.push("Crop approaching full maturity");
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
    }

    const explainability = {
      inputsUsed: ['maturity_index', 'precipitation_forecast', 'storage_ready', 'equipment_available'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Maturity progression', 'Weather windows'],
      cropStage: 'MATURITY'
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
