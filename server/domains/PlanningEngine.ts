import { BaseEngine, ReasoningStep, DeepExplainability } from './BaseEngine.js';
import { 
  BaseRecommendation, 
  ContextFlag, 
  DomainType,
  Recommendation,
  DomainEngineInput
} from '../../shared/types.js';

export class PlanningEngine extends BaseEngine {
  constructor() {
    super(DomainType.PLANNING);
  }

  async generateRecommendation(input: DomainEngineInput): Promise<Recommendation> {
    const hardenedMetrics = this.hardenInputs(input);
    const reasoningChain: ReasoningStep[] = [];
    
    const marketDataReady = Number(hardenedMetrics['market_data_ready']?.value ?? 0) === 1;
    const budgetApproved = Number(hardenedMetrics['budget_approved']?.value ?? 0) === 1;
    const laborAvailable = Number(hardenedMetrics['labor_available']?.value ?? 1) === 1;

    reasoningChain.push({
      step: "Readiness Assessment",
      observation: `Market Data: ${marketDataReady}, Budget: ${budgetApproved}, Labor: ${laborAvailable}`,
      implication: "Evaluating operational foundation for the upcoming season.",
      confidence: 1.0
    });

    let base: BaseRecommendation = BaseRecommendation.MONITOR;
    const thresholdsCrossed: string[] = [];
    const contextFlags: ContextFlag[] = [];

    if (marketDataReady && budgetApproved && laborAvailable) {
      base = BaseRecommendation.NOW;
      thresholdsCrossed.push("All foundational planning pillars are satisfied.");
      reasoningChain.push({
        step: "Strategic Decision",
        observation: "Foundational requirements met.",
        implication: "Proceed to finalize operational plan and initiate procurement.",
        confidence: 1.0
      });
    } else if (!laborAvailable) {
      contextFlags.push(ContextFlag.LABOR_CONSTRAINT);
      base = BaseRecommendation.WAIT;
      thresholdsCrossed.push("Labor availability constraint detected.");
      reasoningChain.push({
        step: "Constraint Analysis",
        observation: "Labor shortage identified.",
        implication: "Operational plan cannot be finalized without confirmed labor capacity.",
        confidence: 0.95
      });
    } else {
      reasoningChain.push({
        step: "Strategic Decision",
        observation: "Awaiting market or budget finalization.",
        implication: "Continue monitoring external factors before committing to operational plan.",
        confidence: 0.9
      });
    }

    const explainability: DeepExplainability = {
      inputsUsed: Object.keys(hardenedMetrics),
      thresholdsCrossed,
      thresholdsApproaching: [],
      trendsConsidered: ["Market volatility", "Labor market trends"],
      cropStage: "PRE-SEASON",
      reasoningChain,
      hardenedMetrics,
      dataIntegrityScore: 1.0
    };

    return this.createRecommendation(input.fieldId, {
      base,
      contextFlags,
      explainability,
      kpis: { operational_readiness: 85 },
      confidence: 1.0,
      rawInputs: input.rawInputs ?? {}
    });
  }
}
