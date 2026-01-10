import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { RecommendationCard } from '../components/RecommendationCard';
import { LayoutGrid, List, RefreshCw, MapPin, Tractor, Activity, Bell, User, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { Fields as FieldsView } from './Fields';
import { Stats as StatsView } from './Stats';
import { Settings as SettingsView } from './Settings';
import { MapView } from './MapView';
import { Robotics as RoboticsView } from './Robotics';
import { useIdleMode } from '../hooks/useIdleMode';
import { IdleModeOverlay } from '../components/IdleModeOverlay';
import { X } from 'lucide-react';

type NavItem = 'home' | 'map' | 'fields' | 'robotics' | 'stats' | 'settings';

export const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>('map');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const { isIdle, setIsIdle } = useIdleMode(120000); // 2 minutes

  const farmsQuery = trpc.farms.useQuery();
  const recommendationsQuery = trpc.domains.listAllRecommendations.useQuery({ 
    fieldId: '550e8400-e29b-41d4-a716-446655440000' 
  });

  const isLoading = farmsQuery.isLoading || recommendationsQuery.isLoading;
  const isFetching = farmsQuery.isFetching || recommendationsQuery.isFetching;

  const handleRefresh = () => {
    farmsQuery.refetch();
    recommendationsQuery.refetch();
  };

  return (
    <div className={clsx(
      "min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64 transition-opacity duration-1000",
      isIdle ? "opacity-60" : "opacity-100"
    )}>
      {isIdle && (
        <IdleModeOverlay 
          lastRecommendation={recommendationsQuery.data?.[0]?.baseRecommendation || "Optimize Irrigation Cycle"}
          nextRecommendation="Nutrient Application (Scheduled in 4h)"
          onAction={() => setIsIdle(false)}
        />
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex-col z-50">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Tractor className="text-green-500" size={28} />
            FARMSENSE
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveNav('map')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'map' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <MapIcon size={20} />
            Map View
          </button>
          <button 
            onClick={() => setActiveNav('home')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'home' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <LayoutGrid size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveNav('fields')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'fields' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <MapPin size={20} />
            Fields
          </button>
          <button 
            onClick={() => setActiveNav('robotics')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'robotics' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <Tractor size={20} />
            Robotics
          </button>
          <button 
            onClick={() => setActiveNav('stats')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'stats' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <Activity size={20} />
            Analytics
          </button>
          <button 
            onClick={() => setActiveNav('settings')}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeNav === 'settings' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-xs">DU</div>
            <div className="text-sm font-bold">Demo User</div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 md:px-8 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="md:hidden">
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
              <Tractor className="text-green-600" size={24} />
              FARMSENSE
            </h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-2xl font-black text-slate-900">
              {farmsQuery.data?.[0]?.name || 'North Field Operations'}
            </h2>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              <MapPin size={12} />
              {farmsQuery.data?.[0]?.region || 'Idaho'} • Potato Alpha-7
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            >
              <RefreshCw size={20} className={isFetching ? "animate-spin text-green-600" : ""} />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className={clsx(
        "max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-10",
        activeNav === 'map' && "max-w-none p-0 md:p-0"
      )}>
        {activeNav === 'map' && <MapView onSelectAsset={setSelectedAsset} />}
        {activeNav === 'home' && (
          <>
            {/* Mobile Farm Info Card */}
            <div className="md:hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Active Field</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-slate-900">{farmsQuery.data?.[0]?.name || 'North Field'}</div>
                  <div className="text-xs font-bold text-slate-500">{farmsQuery.data?.[0]?.region || 'Idaho'} • 450 Acres</div>
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                  Operational
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Domain Intelligence</h2>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={clsx("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={clsx("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={clsx(
                "grid gap-4 md:gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {recommendationsQuery.data?.map((rec: any) => (
                  <RecommendationCard key={rec.domain} recommendation={rec} />
                ))}
              </div>
            )}
          </>
        )}
        {activeNav === 'fields' && <FieldsView />}
        {activeNav === 'robotics' && <RoboticsView />}
        {activeNav === 'stats' && <StatsView />}
        {activeNav === 'settings' && <SettingsView />}
      </main>

      {/* Operations Dashboard Modal (Overlay) */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
          <div className="relative w-full max-w-4xl max-h-full overflow-y-auto bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 p-6 md:p-10 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setSelectedAsset(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-green-600 rounded-2xl text-white shadow-lg">
                <Tractor size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedAsset.name}</h2>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operations Dashboard • {selectedAsset.type}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Real-time Analytics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Battery</div>
                    <div className="text-xl font-black text-slate-900">84%</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Signal</div>
                    <div className="text-xl font-black text-slate-900">Strong</div>
                  </div>
                </div>
                <div className="p-6 bg-slate-900 rounded-2xl text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Active Task</div>
                  <div className="text-lg font-bold mb-2">Precision Seeding Alpha-7</div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Progress</span>
                    <span>68%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Deterministic Controls</h3>
                <div className="space-y-3">
                  <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition-colors">
                    Execute Auto-Optimization
                  </button>
                  <button className="w-full py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
                    Manual Override
                  </button>
                  <button className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors">
                    Emergency Stop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-4 py-3 flex items-center justify-between md:hidden">
        <button 
          onClick={() => setActiveNav('map')}
          className={clsx("flex flex-col items-center gap-1 transition-all", activeNav === 'map' ? "text-green-600" : "text-slate-400")}
        >
          <MapIcon size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Map</span>
        </button>
        <button 
          onClick={() => setActiveNav('home')}
          className={clsx("flex flex-col items-center gap-1 transition-all", activeNav === 'home' ? "text-green-600" : "text-slate-400")}
        >
          <LayoutGrid size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button 
          onClick={() => setActiveNav('robotics')}
          className={clsx("flex flex-col items-center gap-1 transition-all", activeNav === 'robotics' ? "text-green-600" : "text-slate-400")}
        >
          <Tractor size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Robots</span>
        </button>
        <button 
          onClick={() => setActiveNav('stats')}
          className={clsx("flex flex-col items-center gap-1 transition-all", activeNav === 'stats' ? "text-green-600" : "text-slate-400")}
        >
          <Activity size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Stats</span>
        </button>
        <button 
          onClick={() => setActiveNav('settings')}
          className={clsx("flex flex-col items-center gap-1 transition-all", activeNav === 'settings' ? "text-green-600" : "text-slate-400")}
        >
          <Settings size={20} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Setup</span>
        </button>
      </nav>
    </div>
  );
};
