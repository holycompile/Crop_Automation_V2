
import React, { useState, useEffect } from 'react';
import { BudgetResult, FarmData, FarmAlert, Language } from '../types';
import { BudgetPieChart, SensorTrendChart } from './Charts';
import AlertCenter from './AlertCenter';
import { 
  AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Droplets, Info, 
  ExternalLink, Globe, Target, Gauge, Waves, History, RefreshCw, 
  Sparkles, TrendingUp, Zap, CloudRain, BarChart3, Activity, 
  TrendingDown, Wind, Thermometer, Cloud, FileText
} from 'lucide-react';

interface Props {
  budget: BudgetResult | null;
  farmData: FarmData | null;
  onAlertClick: (alert: FarmAlert) => void;
  language: Language;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  isIrrigating?: boolean;
  onToggleIrrigation?: (status: boolean) => void;
}

const Dashboard: React.FC<Props> = ({ 
  budget, 
  farmData, 
  onAlertClick, 
  language, 
  isRefreshing, 
  onRefresh,
  isIrrigating = false,
  onToggleIrrigation
}) => {
  const [streamDelay, setStreamDelay] = useState(22);

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-6">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
          <Droplets className="w-10 h-10 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gray-800">No Stream Active</h2>
      </div>
    );
  }

  const currentMoisture = farmData?.soilMoisture || 0;
  const weather = budget.weather || { temp: 0, humidity: 0, forecast: 'Unknown', windSpeed: 0 };
  const docCount = (farmData?.knowledgeBase || []).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-900">Pathway Intelligence Center</h2>
          <div className="flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
            <Zap className="w-3 h-3 mr-1" /> Multi-Stream Join: Active (OpenWeatherMap + IoT)
          </div>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center space-x-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl shadow-lg text-sm font-bold hover:bg-black transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync All Streams</span>
        </button>
      </div>

      <AlertCenter alerts={budget.alerts || []} onAlertClick={onAlertClick} />

      {/* Weather Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CloudRain size={120} />
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold text-blue-900 flex items-center text-sm">
              <CloudRain className="w-4 h-4 mr-2" /> Live Weather (OpenWeatherMap via Pathway)
            </h3>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase truncate max-w-[150px]">Station: {farmData?.location || 'Local'}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Humidity</p>
              <div className="text-xl font-bold text-blue-600">{weather.humidity}%</div>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Temp</p>
              <div className="text-xl font-bold text-orange-500">{weather.temp}°C</div>
            </div>
            <div className="text-center border-r border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Wind</p>
              <div className="text-xl font-bold text-gray-700">{weather.windSpeed}km/h</div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Forecast</p>
              <div className="text-sm font-bold text-emerald-600 flex items-center justify-center h-7">
                <Cloud className="w-3 h-3 mr-1" /> {weather.forecast}
              </div>
            </div>
          </div>
        </div>

        {/* Satellite Health Summary */}
        <div className="glass-card p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-center text-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto mb-2">
             <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Satellite Health</h3>
          <div className="text-xl font-heading font-bold text-blue-900 mt-1">
            {farmData?.crop || "No Crop"}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            NDVI: {farmData?.ndvi?.toFixed(2) || "0.00"} | VCI: {farmData?.vci?.toFixed(0) || "0"}%
          </p>
          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-2">
            Accuracy: {farmData?.classificationAccuracy || 88.5}%
          </p>
        </div>

        {/* Efficiency Metric */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-center text-center">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto mb-2">
             <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Irrigation Efficiency</h3>
          <div className="text-3xl font-heading font-bold text-emerald-600">{budget.efficiencyScore}%</div>
          <p className="text-[10px] text-gray-500 mt-2">Drip Method Optimization</p>
        </div>

       
      </div>

     



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-heading font-bold text-gray-900 flex items-center mb-6">
              <History className="w-5 h-5 mr-2 text-emerald-600" /> Real-Time Moisture Stream
            </h3>
            <SensorTrendChart />
          </div>
        </div>

        
          
          
        </div>
      </div>
    
  );
};

const MetricCard: React.FC<{ label: string; value: string; sub: string; icon: React.ReactNode; color: string; }> = ({ label, value, sub, icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="glass-card p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
      <div className={`p-2 rounded-lg w-fit ${colorClasses[color]} mb-2`}>{icon}</div>
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</h4>
      <div className="text-lg font-heading font-bold text-gray-900">{value}</div>
      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">{sub}</p>
    </div>
  );
};

export default Dashboard;
