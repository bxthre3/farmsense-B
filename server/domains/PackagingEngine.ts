import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class PackagingEngine extends BaseEngine {
  constructor() {
    super(DomainType.PACKAGING);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const processedStock = this.getMetricValue(currentMetrics, 'processed_stock', 0);
    const packagingMaterials = this.getMetricValue(currentMetrics, 'packaging_materials', 100);
    const laborAvailable = this.getMetricValue(currentMetrics, 'labor_available', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      packaging_efficiency: 0,
      material_utilization: 0
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (packagingMaterials < 10) {
      contextFlags.push(ContextFlag.MATERIALS_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Packaging materials critically low.");
      predictedNext = BaseRecommendation.SOON;
    } else if (!laborAvailable) {
      contextFlags.push(ContextFlag.LABOR_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Packaging labor unavailable.");
    } else if (processedStock > 50) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Processed stock (${processedStock}) ready for packaging.`);
      kpis.packaging_efficiency = 100;
      kpis.material_utilization = 95;
      predictedNext = BaseRecommendation.WAIT;
    } else if (processedStock > 20) {
      base = BaseRecommendation.SOON;
      thresholdsApproaching.push("Processed stock accumulating for packaging");
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
    }

    const explainability = {
      inputsUsed: ['processed_stock', 'packaging_materials', 'labor_available'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Processing output rate', 'Packaging material inventory'],
      cropStage: 'POST-HARVEST'
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
