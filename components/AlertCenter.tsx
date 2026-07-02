
import React from 'react';
import { AlertTriangle, Info, ShieldAlert, ArrowRight, BellRing, Sparkles } from 'lucide-react';
import { FarmAlert } from '../types';

interface Props {
  alerts: FarmAlert[];
  onAlertClick: (alert: FarmAlert) => void;
}

const AlertCenter: React.FC<Props> = ({ alerts, onAlertClick }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
          <BellRing className="w-3 h-3 mr-2" /> Critical Notifications
        </h3>
        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => (
          <button 
            key={alert.id}
            onClick={() => onAlertClick(alert)}
            className={`text-left relative overflow-hidden p-4 rounded-2xl border flex items-start space-x-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group animate-in slide-in-from-top-2 ${
              alert.type === 'danger' 
                ? 'bg-red-50 border-red-100' 
                : alert.type === 'warning' 
                ? 'bg-amber-50 border-amber-100' 
                : 'bg-blue-50 border-blue-100'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              alert.type === 'danger' ? 'bg-red-500 text-white' : alert.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {alert.type === 'danger' ? <ShieldAlert className="w-5 h-5" /> : alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className={`text-sm font-bold pr-6 ${
                  alert.type === 'danger' ? 'text-red-900' : alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                }`}>
                  {alert.message}
                </p>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{alert.timestamp}</span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 mr-1" /> Ask AI to Solve
                </div>
                <span className="text-[10px] text-gray-400">Click to expand</span>
              </div>
            </div>

            {/* Pulsing indicator for danger */}
            {alert.type === 'danger' && (
              <div className="absolute top-2 right-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlertCenter;
