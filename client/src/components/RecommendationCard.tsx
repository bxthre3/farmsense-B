import React, { useState } from 'react';
import { AlertTriangle, Clock, Info, ChevronDown, ChevronUp, ShieldCheck, Activity, Zap, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReasoningStep {
  step: string;
  observation: string;
  implication: string;
  confidence: number;
}

interface HardenedMetric {
  metricType: string;
  value: number;
  unit: string;
  integrityScore: number;
  isAnomalous: boolean;
  hardeningNotes: string[];
}

interface ScenarioOutcome {
  scenario: string;
  predictedKPIs: Record<string, number>;
  riskScore: number;
  confidence: number;
}

interface SafetyInterlock {
  id: string;
  condition: string;
  isTripped: boolean;
  severity: 'BLOCK' | 'WARN';
  message: string;
}

interface Recommendation {
  domain: string;
  baseRecommendation: string;
  urgencyLevel: string;
  displayColor: string;
  explainability: {
    thresholdsCrossed: string[];
    reasoningChain: ReasoningStep[];
    hardenedMetrics: Record<string, HardenedMetric>;
    dataIntegrityScore: number;
    scenarios: ScenarioOutcome[];
    safetyInterlocks: SafetyInterlock[];
  };
  confidence: number;
}

interface Props {
  recommendation: Recommendation;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-red-50 border-red-200 text-red-900';
      case 'ORANGE': return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'YELLOW': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'BLUE': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'GREEN': return 'bg-green-50 border-green-200 text-green-900';
      case 'CYAN': return 'bg-cyan-50 border-cyan-200 text-cyan-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getIcon = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return <AlertTriangle className="text-red-600" size={24} />;
      case 'HIGH': return <Clock className="text-orange-600" size={24} />;
      case 'MEDIUM': return <Clock className="text-yellow-600" size={24} />;
      default: return <Info className="text-blue-600" size={24} />;
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 transition-all active:scale-[0.98] md:hover:shadow-lg overflow-hidden",
      getColorClasses(recommendation.displayColor)
    )}>
      {/* Header - Large Touch Target */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 md:p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/60 rounded-xl shadow-sm">
              {getIcon(recommendation.urgencyLevel)}
            </div>
            <div>
              <span className="font-black text-[10px] tracking-widest uppercase opacity-60 block">{recommendation.domain}</span>
              <span className="text-lg font-black leading-tight">{recommendation.baseRecommendation}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 border border-current/10 text-[9px] font-black uppercase tracking-wider">
              <ShieldCheck size={10} className="text-green-600" />
              <span>Hardened</span>
            </div>
            {isExpanded ? <ChevronUp size={20} className="opacity-40" /> : <ChevronDown size={20} className="opacity-40" />}
          </div>
        </div>
        
        <p className="text-sm font-bold leading-snug mb-4">
          {recommendation.explainability.thresholdsCrossed[0] || 'Conditions are within normal parameters.'}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-current/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tighter">
              <Activity size={14} className="opacity-50" />
              <span>Conf: {(recommendation.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tighter">
              <ShieldCheck size={14} className="text-green-600" />
              <span>Integrity: {(recommendation.explainability.dataIntegrityScore * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </button>

      {/* Intelligence Stack (Expanded) */}
      {isExpanded && (
        <div className="bg-white/60 border-t border-current/10 p-5 md:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Reasoning Chain */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1.5">
              <Zap size={14} /> Reasoning Chain
            </h4>
            <div className="space-y-4">
              {recommendation.explainability.reasoningChain.map((step, idx) => (
                <div key={idx} className="relative pl-5 border-l-2 border-current/20 space-y-1">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-current" />
                  <div className="text-xs font-black">{step.step}</div>
                  <div className="text-[11px] font-bold opacity-60 italic leading-tight">Observed: {step.observation}</div>
                  <div className="text-[11px] font-black leading-tight">Implication: {step.implication}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What-If Scenarios */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1.5">
              <Activity size={14} /> Predictive Scenarios
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {recommendation.explainability.scenarios?.map((scenario, idx) => (
                <div key={idx} className="bg-white/80 p-3 rounded-xl border border-current/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black uppercase tracking-tight">{scenario.scenario}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                      scenario.riskScore < 0.3 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      Risk: {(scenario.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 opacity-70">
                    {Object.entries(scenario.predictedKPIs).map(([kpi, val]) => (
                      <div key={kpi} className="flex justify-between text-[10px] font-bold">
                        <span className="capitalize">{kpi.replace(/_/g, ' ')}</span>
                        <span>{val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Interlocks */}
          {recommendation.explainability.safetyInterlocks?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Safety Interlocks
              </h4>
              {recommendation.explainability.safetyInterlocks.map((lock, idx) => (
                <div key={idx} className={cn(
                  "p-3 rounded-xl border flex items-start gap-3",
                  lock.severity === 'BLOCK' ? "bg-red-100 border-red-200 text-red-900" : "bg-yellow-100 border-yellow-200 text-yellow-900"
                )}>
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight">{lock.condition}</div>
                    <div className="text-[11px] font-bold opacity-80 leading-tight">{lock.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
