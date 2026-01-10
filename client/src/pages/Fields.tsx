import React from 'react';
import { trpc } from '../lib/trpc';
import { MapPin, Tractor, Droplets, Thermometer, Wind, Layers } from 'lucide-react';

export const Fields: React.FC = () => {
  const farmsQuery = trpc.farms.useQuery();
  const farmId = farmsQuery.data?.[0]?.id || 'demo-farm-1';
  const fieldsQuery = trpc.farms.getFields.useQuery({ farmId });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Asset Management</h2>
        <button className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm">Add Field</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {fieldsQuery.data?.map((field: any) => (
          <div key={field.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{field.name}</h3>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{field.acres} Acres • Potato Alpha-7</div>
                </div>
              </div>
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                Active
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Droplets size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Moisture</span>
                </div>
                <div className="text-lg font-black text-slate-900">18.5%</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Thermometer size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Soil Temp</span>
                </div>
                <div className="text-lg font-black text-slate-900">18.2°C</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Wind size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">ET Rate</span>
                </div>
                <div className="text-lg font-black text-slate-900">5.2mm</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Tractor size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                </div>
                <div className="text-lg font-black text-slate-900">Ready</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <MapPin size={12} />
                Idaho, USA • 43.6150, -116.2023
              </div>
              <button className="text-xs font-black text-green-600 uppercase tracking-widest hover:opacity-70 transition-opacity">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
