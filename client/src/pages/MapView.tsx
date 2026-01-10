import React, { useState } from 'react';
import { Map as MapIcon, Layers, Navigation, Tractor, Droplets, Radio, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface MapAsset {
  id: string;
  type: 'robot' | 'tractor' | 'sensor' | 'water';
  name: string;
  status: 'active' | 'idle' | 'warning';
  x: number;
  y: number;
}

export const MapView: React.FC<{ onSelectAsset: (asset: any) => void }> = ({ onSelectAsset }) => {
  const [assets] = useState<MapAsset[]>([
    { id: 'r1', type: 'robot', name: 'Robot 07', status: 'active', x: 35, y: 45 },
    { id: 't1', type: 'tractor', name: 'Smart Tractor A', status: 'idle', x: 65, y: 30 },
    { id: 's1', type: 'sensor', name: 'Soil Node 12', status: 'active', x: 20, y: 70 },
    { id: 'w1', type: 'water', name: 'Valve Main', status: 'warning', x: 80, y: 60 },
  ]);

  return (
    <div className="relative w-full h-[calc(100vh-160px)] md:h-[calc(100vh-100px)] bg-slate-200 rounded-[32px] overflow-hidden border-4 border-white shadow-inner">
      {/* Map Background (Simulated) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-80" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Field Boundaries (Simulated) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path d="M 100 100 L 400 150 L 350 450 L 50 400 Z" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" />
        <path d="M 450 100 L 800 120 L 750 350 L 420 380 Z" fill="rgba(59, 130, 246, 0.1)" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" />
      </svg>

      {/* Assets */}
      {assets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => onSelectAsset(asset)}
          className="absolute group transition-transform hover:scale-110 active:scale-95"
          style={{ left: `${asset.x}%`, top: `${asset.y}%` }}
        >
          <div className={clsx(
            "p-2 rounded-xl shadow-lg border-2 flex items-center justify-center transition-colors",
            asset.status === 'active' ? "bg-green-500 border-white text-white" :
            asset.status === 'warning' ? "bg-red-500 border-white text-white" :
            "bg-white border-slate-200 text-slate-600"
          )}>
            {asset.type === 'robot' && <Navigation size={18} />}
            {asset.type === 'tractor' && <Tractor size={18} />}
            {asset.type === 'sensor' && <Radio size={18} />}
            {asset.type === 'water' && <Droplets size={18} />}
          </div>
          
          {/* Label */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {asset.name}
          </div>
        </button>
      ))}

      {/* Map Controls */}
      <div className="absolute top-6 right-6 flex flex-col gap-2">
        <button className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg text-slate-600 hover:text-green-600 transition-colors">
          <Layers size={20} />
        </button>
        <button className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg text-slate-600 hover:text-green-600 transition-colors">
          <Maximize2 size={20} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Alert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Idle</span>
          </div>
        </div>
      </div>
    </div>
  );
};
