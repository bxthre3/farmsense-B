import React from 'react';
import { Zap, Clock, ShieldAlert, Tractor } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  lastRecommendation: string;
  nextRecommendation: string;
  onAction: () => void;
}

export const IdleModeOverlay: React.FC<Props> = ({ lastRecommendation, nextRecommendation, onAction }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-1000" />
      
      {/* Centered Panel */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 p-8 flex flex-col items-center text-center space-y-8 pointer-events-auto animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
          <Tractor className="text-white" size={32} />
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Recommended Action</h3>
          <button 
            onClick={onAction}
            className="text-2xl font-black text-slate-900 leading-tight hover:text-green-600 transition-colors active:scale-95"
          >
            {lastRecommendation}
          </button>
        </div>

        <div className="w-full h-px bg-slate-100" />

        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimated Next</h3>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
            <Clock size={16} className="text-slate-400" />
            {nextRecommendation}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
          <Zap size={12} className="text-yellow-500" />
          Tap to resume operations
        </div>
      </div>

      {/* Subtle Safety Badges (Header/Footer) */}
      <div className="absolute top-6 left-0 right-0 flex justify-center px-6">
        <div className="flex gap-2">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
            <ShieldAlert size={12} />
            Water Pressure Low
          </div>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
            <Tractor size={12} />
            Robot 07 Active
          </div>
        </div>
      </div>
    </div>
  );
};
