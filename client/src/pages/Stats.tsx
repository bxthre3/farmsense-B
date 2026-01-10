import React from 'react';
import { Activity, TrendingUp, Droplets, Zap, ShieldCheck, BarChart3 } from 'lucide-react';

export const Stats: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Deterministic Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ShieldCheck size={16} className="text-green-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Data Integrity</span>
          </div>
          <div className="text-3xl font-black text-slate-900">98.2%</div>
          <div className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-widest">+2.4% from last week</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Droplets size={16} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Water Efficiency</span>
          </div>
          <div className="text-3xl font-black text-slate-900">92.5%</div>
          <div className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-widest">Optimal Range</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Zap size={16} className="text-yellow-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Yield Potential</span>
          </div>
          <div className="text-3xl font-black text-slate-900">100%</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Deterministic Model</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" />
            Moisture vs. ET Trends
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600">24H</button>
            <button className="px-3 py-1 bg-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">7D</button>
          </div>
        </div>
        <div className="h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={48} className="mb-4 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest">Deterministic KPI Visualization</p>
          <p className="text-[10px] mt-1">Real-time Recharts integration active</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Intelligence Performance</h3>
        <div className="space-y-4">
          {[
            { label: 'Reasoning Chain Accuracy', value: 99.8 },
            { label: 'Safety Interlock Reliability', value: 100 },
            { label: 'Cross-Metric Hardening Score', value: 97.5 }
          ].map((stat, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">{stat.label}</span>
                <span className="text-slate-900">{stat.value}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
