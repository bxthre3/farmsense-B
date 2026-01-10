import React, { useState } from 'react';
import { Tractor, Cpu, Battery, Zap, Settings, ShieldCheck, Box, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface Robot {
  id: string;
  name: string;
  type: 'Robot' | 'Tractor' | 'Sorter';
  status: 'Operational' | 'Maintenance' | 'Charging';
  battery: number;
  module: string;
  utilization: number;
}

export const Robotics: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'spatial'>('list');
  const [robots] = useState<Robot[]>([
    { id: 'R07', name: 'Robot 07', type: 'Robot', status: 'Operational', battery: 84, module: 'Precision Seeder v2', utilization: 92 },
    { id: 'T01', name: 'Smart Tractor A', type: 'Tractor', status: 'Charging', battery: 12, module: 'Heavy Duty Plow', utilization: 45 },
    { id: 'S03', name: 'Sorter Table 3', type: 'Sorter', status: 'Operational', battery: 100, module: 'Optical Grade v4', utilization: 98 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Fleet Management</h2>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('list')}
            className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
          >
            List
          </button>
          <button 
            onClick={() => setViewMode('spatial')}
            className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all", viewMode === 'spatial' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
          >
            Spatial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {robots.map((robot) => (
          <div key={robot.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "p-4 rounded-2xl text-white shadow-lg",
                  robot.status === 'Operational' ? "bg-green-600 shadow-green-100" : "bg-slate-400 shadow-slate-100"
                )}>
                  <Tractor size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{robot.name}</h3>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{robot.type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Battery size={12} className={robot.battery < 20 ? "text-red-500" : "text-green-500"} />
                      {robot.battery}%
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Cpu size={12} />
                      {robot.status}
                    </div>
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Settings size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Box size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Module</span>
                  </div>
                  <button className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                    <RefreshCw size={10} /> Swap
                  </button>
                </div>
                <div className="text-sm font-black text-slate-900">{robot.module}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-3">
                  <Zap size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Utilization</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${robot.utilization}%` }} />
                  </div>
                  <span className="text-sm font-black text-slate-900">{robot.utilization}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <ShieldCheck size={14} className="text-green-600" />
                  Safety: Nominal
                </div>
              </div>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-colors">
                Assign Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
