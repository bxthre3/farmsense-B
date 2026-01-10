import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class LogisticsEngine extends BaseEngine {
  constructor() {
    super(DomainType.LOGISTICS);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const orderBacklog = this.getMetricValue(currentMetrics, 'order_backlog', 0);
    const transportAvailable = this.getMetricValue(currentMetrics, 'transport_available', 1) === 1;
    const fuelCost = this.getMetricValue(currentMetrics, 'fuel_cost', 3.5);

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      delivery_efficiency: 0,
      logistics_cost_index: fuelCost > 4 ? 120 : 100
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!transportAvailable) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Transportation fleet unavailable.");
      predictedNext = BaseRecommendation.SOON;
    } else if (orderBacklog > 100) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`High order backlog (${orderBacklog}) requires immediate dispatch.`);
      kpis.delivery_efficiency = 95;
      predictedNext = BaseRecommendation.WAIT;
    } else if (orderBacklog > 50) {
      base = BaseRecommendation.SOON;
      thresholdsApproaching.push("Order backlog accumulating");
      predictedNext = BaseRecommendation.NOW;
    } else {
      base = BaseRecommendation.MONITOR;
      thresholdsApproaching.push("Monitoring order fulfillment schedule");
    }

    const explainability = {
      inputsUsed: ['order_backlog', 'transport_available', 'fuel_cost'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Order arrival rate', 'Transportation availability'],
      cropStage: 'DISTRIBUTION'
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
