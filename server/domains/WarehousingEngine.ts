import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class WarehousingEngine extends BaseEngine {
  constructor() {
    super(DomainType.WAREHOUSING);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const storageTemp = this.getMetricValue(currentMetrics, 'storage_temp', 4);
    const storageHumidity = this.getMetricValue(currentMetrics, 'storage_humidity', 90);
    const capacityUsed = this.getMetricValue(currentMetrics, 'capacity_used', 0);

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      storage_quality_index: 100,
      capacity_utilization: capacityUsed
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (storageTemp > 8 || storageTemp < 2) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Storage temperature (${storageTemp}°C) out of optimal range (2-8°C).`);
      kpis.storage_quality_index = 60;
      predictedNext = BaseRecommendation.MONITOR;
    } else if (storageHumidity < 85) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Storage humidity (${storageHumidity}%) below optimal 85-95% range.`);
      kpis.storage_quality_index = 80;
      predictedNext = BaseRecommendation.MONITOR;
    } else if (capacityUsed > 95) {
      contextFlags.push(ContextFlag.CAPACITY_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`Warehouse capacity (${capacityUsed}%) nearly full.`);
      predictedNext = BaseRecommendation.SOON;
    } else {
      base = BaseRecommendation.MONITOR;
      thresholdsApproaching.push("Monitoring storage environmental conditions");
    }

    const explainability = {
      inputsUsed: ['storage_temp', 'storage_humidity', 'capacity_used'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Environmental stability', 'Inventory turnover'],
      cropStage: 'STORAGE'
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
