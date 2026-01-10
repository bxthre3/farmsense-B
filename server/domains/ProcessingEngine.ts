import { BaseEngine } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class ProcessingEngine extends BaseEngine {
  constructor() {
    super(DomainType.PROCESSING);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const { currentMetrics, rawInputs } = input;

    const incomingVolume = this.getMetricValue(currentMetrics, 'incoming_volume', 0);
    const processingCapacity = this.getMetricValue(currentMetrics, 'processing_capacity', 100);
    const equipmentStatus = this.getMetricValue(currentMetrics, 'equipment_status', 1) === 1;

    const thresholdsCrossed: string[] = [];
    const thresholdsApproaching: string[] = [];
    const contextFlags: ContextFlag[] = [];
    const kpis: Record<string, number> = {
      processing_efficiency: 0,
      throughput_rate: 0
    };

    let base: BaseRecommendation;
    let predictedNext: BaseRecommendation = BaseRecommendation.WAIT;

    if (!equipmentStatus) {
      contextFlags.push(ContextFlag.EQUIPMENT_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Processing line equipment maintenance required.");
    } else if (incomingVolume > processingCapacity) {
      contextFlags.push(ContextFlag.CAPACITY_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push(`Incoming volume (${incomingVolume}) exceeds processing capacity (${processingCapacity}).`);
      kpis.throughput_rate = processingCapacity;
    } else if (incomingVolume > 0 && incomingVolume <= processingCapacity) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push(`Processing line ready for incoming volume (${incomingVolume}).`);
      kpis.processing_efficiency = 100;
      kpis.throughput_rate = incomingVolume;
      predictedNext = BaseRecommendation.WAIT;
    } else {
      base = BaseRecommendation.MONITOR;
      thresholdsApproaching.push("Awaiting incoming harvest volume");
    }

    const explainability = {
      inputsUsed: ['incoming_volume', 'processing_capacity', 'equipment_status'],
      thresholdsCrossed,
      thresholdsApproaching,
      trendsConsidered: ['Harvest arrival schedule', 'Processing line uptime'],
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
