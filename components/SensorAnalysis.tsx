
import React, { useState, useEffect, useRef } from 'react';
import { SensorTrendChart } from './Charts';
import { 
  Activity, Droplets, Waves, CloudRain, ShieldCheck,  
  Zap, X, Scan, Sparkles, Loader2 
} from 'lucide-react';
import { FarmData, CropHealth, Language, GrowthStage } from '../types';
import { analyzeGrowthStage } from '../services/gemini';


interface Props {
  data: FarmData | null;
  health?: CropHealth;
  language: Language;
  isLive?: boolean;
  onUpdateStage?: (stage: GrowthStage) => void;
}

const SensorAnalysis: React.FC<Props> = ({ data, health, language, isLive, onUpdateStage }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [packets, setPackets] = useState<{ id: string; time: string; payload: string; status: string }[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !data) return;
    
    setIsAnalyzing(true);
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    
    const imageB64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    
    try {
      const result = await analyzeGrowthStage(imageB64, data.crop);
      if (onUpdateStage) onUpdateStage(result.stage);
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      setShowCamera(false);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let payload = '';
      if (isLive && data?.firebase) {
        const min = data.firebase.minMoisture || 40;
        const max = data.firebase.maxMoisture || 70;
        const rawEstimate = (data.soilMoisture / 100) * (max - min) + min;
        payload = `{"raw": ${rawEstimate.toFixed(1)}, "pct": "${data.soilMoisture.toFixed(1)}%"}`;
      } else {
        payload = `{"moisture": "${(Math.random() * 10 + 40).toFixed(1)}%"}`;
      }

      const newPacket = {
        id: isLive ? 'FB_NODE_01' : `0x${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}`,
        time: new Date().toLocaleTimeString(),
        payload,
        status: 'SUCCESS'
      };
      setPackets(prev => [newPacket, ...prev].slice(0, 5));
    }, isLive ? 3000 : 5000);
    return () => clearInterval(interval);
  }, [isLive, data?.soilMoisture, data?.firebase]);

  const stages: GrowthStage[] = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvest'];
  const currentStageIndex = stages.indexOf(health?.growthStage || 'Vegetative');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Phenology & Stress Analysis</h2>
        </div>
        <div className="flex items-center space-x-3">
          
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-emerald-100 shadow-xl overflow-hidden relative">
        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-8 flex items-center">
          <Scan className="w-4 h-4 mr-2" /> Crop Growth Stage
        </h3>
        <div className="relative pt-4 pb-8">
           <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
           <div className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}></div>
           
           <div className="relative flex justify-between">
              {stages.map((s, i) => (
                <div key={s} className="flex flex-col items-center group">
                   <div className={`w-4 h-4 rounded-full border-4 z-10 transition-all ${
                     i <= currentStageIndex ? 'bg-emerald-500 border-emerald-100 scale-125 shadow-lg shadow-emerald-200' : 'bg-white border-gray-200'
                   }`} />
                   <span className={`mt-3 text-[9px] font-bold uppercase tracking-tighter ${
                     i === currentStageIndex ? 'text-emerald-700 scale-110' : 'text-gray-400'
                   }`}>{s}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-card p-6 rounded-3xl border border-emerald-100 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-6 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2" />Crop Map Accuracy
            </h3>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-emerald-50" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * (data?.classificationAccuracy || 88.5)) / 100} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-900">{data?.classificationAccuracy || 88.5}%</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Kappa: {data?.kappaCoefficient || 0.82}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-6 rounded-3xl border border-gray-100 shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthMetric
            icon={<Zap className="text-amber-500"/>}
            label="NDVI"
            value={data?.ndvi?.toFixed(2) || "0.00"}
            trend="Vegetation"
          />

          <HealthMetric
            icon={<Droplets className="text-blue-500"/>}
            label="NDWI"       
            value={data?.ndwi?.toFixed(2) || "0.00"}
            trend="Water Index"
          />

          <HealthMetric
            icon={<Activity className="text-purple-500"/>}
            label="VCI"
            value={`${data?.vci?.toFixed(2) || "0.00"}`}
            trend="Vegetation"
          />

          <HealthMetric
            icon={<CloudRain className="text-emerald-500"/>}
            label="SMI"
            value={`${data?.smi?.toFixed(2) || "0.00"}`}
            trend="Stress"
          />
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg aspect-[3/4] overflow-hidden bg-slate-900 rounded-none md:rounded-3xl shadow-2xl border border-white/10">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 m-8 rounded-xl">
               <div className="absolute top-1/2 left-0 w-full h-px bg-white/20"></div>
               <div className="absolute top-0 left-1/2 w-px h-full bg-white/20"></div>
               <div className="absolute top-4 left-4 text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
                  Gemini Growth Lens v2.5
               </div>
            </div>
            <div className="absolute bottom-8 left-0 w-full flex justify-between items-center px-8">
               <button onClick={() => setShowCamera(false)} className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
               </button>
               <button 
                onClick={captureAndAnalyze}
                disabled={isAnalyzing}
                className="w-20 h-20 bg-emerald-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center hover:scale-105 transition-all"
               >
                  {isAnalyzing ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <div className="w-12 h-12 rounded-full border-2 border-white/50" />}
               </button>
               <div className="w-12" />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center">
                 <Sparkles className="w-12 h-12 text-emerald-400 mb-4 animate-bounce" />
                 <h3 className="text-xl font-bold">Analyzing Biological Phase</h3>
                 <p className="text-sm opacity-60 mt-2">Gemini is identifying crop features and measuring leaf turgor...</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-4 md:p-6 rounded-3xl shadow-lg border border-gray-100">
            <h3 className="font-heading font-bold text-gray-900 flex items-center mb-6">
              <Activity className="w-5 h-5 mr-2 text-emerald-600" /> Moisture Stress Time Series
            </h3>
            <SensorTrendChart />
          </div>
        </div>
        
      </div>
    </div>
  );
};

const HealthMetric = ({ icon, label, value, trend }: any) => (
  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-center">
    <div className="flex items-center mb-2">
      <div className="p-1.5 bg-white rounded-lg mr-2 shadow-sm">{icon}</div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</span>
    </div>
    <div className="text-lg font-bold text-gray-900">{value}</div>
    <div className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{trend}</div>
  </div>
);

const LogItem = ({ time, msg, color = 'slate' }: any) => {
  const colors: any = { slate: 'text-slate-500', emerald: 'text-emerald-600', amber: 'text-amber-600' };
  return (
    <div className="flex space-x-3 text-[10px] font-mono border-b border-gray-50 pb-3 last:border-0 last:pb-0">
      <span className="text-gray-400 shrink-0 uppercase">{time}</span>
      <span className={`${colors[color]} font-bold truncate`}>{msg}</span>
    </div>
  );
};

export default SensorAnalysis;
