import React from 'react';
import { Settings as SettingsIcon, Shield, Bell, Database, Cpu, Globe, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">System Configuration</h2>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Intelligence Stack</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deterministic Engine Controls</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-900">Cross-Metric Hardening</div>
              <div className="text-[10px] font-bold text-slate-400">Validate sensor data integrity</div>
            </div>
            <div className="w-10 h-5 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-900">Safety Interlocks</div>
              <div className="text-[10px] font-bold text-slate-400">Block conflicting protocol commands</div>
            </div>
            <div className="w-10 h-5 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-slate-900">Extreme Explainability</div>
              <div className="text-[10px] font-bold text-slate-400">Expose full reasoning chains</div>
            </div>
            <div className="w-10 h-5 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Data Sources</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">API & Sensor Integrations</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {['OpenWeatherMap', 'Sentinel-2 Satellite', 'SoilGrid API', 'Local Modbus Gateway'].map((source, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700">{source}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Connected</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Security</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access & Protocol Safety</p>
          </div>
        </div>
        <div className="p-5">
          <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-sm">
            Reset System Interlocks
          </button>
        </div>
      </div>
    </div>
  );
};
