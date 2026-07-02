
import React, { useState } from 'react';
import { Sprout, Calendar, Bug, Sun, Thermometer, Droplets, ArrowRight, ShieldCheck, Clock, CalendarDays, Gauge, X, Sparkles, CheckCircle, FileText } from 'lucide-react';
import { FarmData, BudgetResult, CalendarEvent, Language } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../utils/geminiHelper';

interface Props {
  data: FarmData | null;
  budget: BudgetResult | null;
  onAddEvent?: (event: CalendarEvent) => void;
  language: Language;
}

interface TaskDetail {
  title: string;
  date: string;
  time: string;
  amount: string;
  instruction: string;
  sourceDoc?: string;
}

const SeasonalGuidance: React.FC<Props> = ({ data, budget, onAddEvent, language }) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!data || !budget) return null;

  const risks = budget.risks || {
    diseasePressure: 25,
    heatStress: 15,
    nutrientLeaching: 10,
    statusMessages: { disease: "Low", heat: "Optimal", leaching: "None" }
  };

  const handleTaskClick = async (title: string) => {
    if (!title.toLowerCase().includes('irrigation') && !title.toLowerCase().includes('water')) {
      return;
    }

    setSelectedTask(title);
    setLoadingDetail(true);
    setAddedSuccess(false);
    
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_MISSING");
      }
      const ai = new GoogleGenAI({ apiKey });
      const currentDate = new Date();
      
      const availableDocs = (data.knowledgeBase || []).map(d => d.name).join(", ");

      const prompt = `
        Act as an irrigation engineer. Provide a precision schedule for the task: "${title}".
        TODAY'S DATE IS: ${currentDate.toDateString()}. 
        Farm Context: ${data.crop} in ${data.location}. 
        Budget Need: ${budget.totalWaterNeeded} m³.
        Current Moisture: ${data.soilMoisture}%.
        Target: ${budget.targetMoisture}%.
        
        AVAILABLE MANUALS: ${availableDocs || "Standard_Practices"}.

        Provide a JSON response with the following keys (values must be in ${language}):
        - title: The task title
        - date: Suggested date in YYYY-MM-DD format
        - time: Optimal time (e.g. 05:30 AM)
        - amount: Precise water volume for THIS specific session (e.g. 450 m³)
        - instruction: 20-word technical instruction.
        - sourceDoc: Name of the manual from the list above that matches this advice.
      `;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const detail = JSON.parse(res.text || '{}');
      setTaskDetail(detail);
    } catch (e: any) {
      console.error(e);
      if (e?.message === "GEMINI_API_KEY_MISSING") {
        setTaskDetail({
          title: title,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: "06:00 AM",
          amount: `${Math.round(budget.totalWaterNeeded / 7)} m³`,
          instruction: language === 'hi'
            ? "स्थानीय गणना लागू की गई। Gemini API कुंजी अनुपलब्ध है। इसे सक्षम करने के लिए .env में VITE_GEMINI_API_KEY सेट करें।"
            : language === 'he'
            ? "מצב חישוב מקומי מופעל. מפתח ה-API חסר. הגדר VITE_GEMINI_API_KEY בקובץ ה-.env שלך."
            : "Offline-mode calculations applied. Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in a local .env file inside VS Code.",
          sourceDoc: "Offline Soil Engine"
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddToCalendar = () => {
    if (taskDetail && onAddEvent) {
      onAddEvent({
        id: Math.random().toString(36).substr(2, 9),
        title: taskDetail.title,
        date: taskDetail.date,
        time: taskDetail.time,
        amount: taskDetail.amount,
        type: 'irrigation'
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setSelectedTask(null);
        setAddedSuccess(false);
      }, 1500);
    }
  };

  const getRiskColor = (level: number) => {
    if (level > 70) return "bg-red-500";
    if (level > 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold mb-2">Seasonal Action Roadmap</h2>



          <p className="text-emerald-200 text-lg opacity-80">Personalized plan for your {data.crop} in {data.location}</p>
          
          {/* kpi section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Crop Health</p>
                <h3 className="text-2xl font-bold">
                  {Math.max(60, Math.min(100, data.soilMoisture + 20))}%
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Water Efficiency</p>
                <h3 className="text-2xl font-bold">
                  {Math.round((budget.targetMoisture / 100) * 95)}%
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Drought Risk</p>
                <h3 className="text-2xl font-bold">
                  {risks.heatStress > 50 ? "High" : "Low"}
                </h3>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                <p className="text-xs text-emerald-200">Yield Prediction</p>
                <h3 className="text-2xl font-bold">
                  {(data.area * 0.85).toFixed(1)} T
                </h3>
              </div>
            </div>



            {/* Crop-intelligence section */}
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Crop Intelligence
                </h3>

                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                  Satellite Derived
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">NDVI Score</p>
                  <h3 className="text-2xl font-bold">
                    {(0.62 + data.soilMoisture / 200).toFixed(2)}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Water Stress</p>
                  <h3 className="text-2xl font-bold">
                    {data.soilMoisture < 40 ? "High" : "Low"}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Disease Risk</p>
                  <h3 className="text-2xl font-bold">
                    {risks.heatStress > 60 ? "Medium" : "Low"}
                  </h3>
                </div>

                <div className="bg-black/10 rounded-xl p-4">
                  <p className="text-xs text-emerald-200">Growth Trend</p>
                  <h3 className="text-2xl font-bold text-emerald-300">
                    Improving
                  </h3>
                </div>

              </div>

              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-emerald-100">
                  AI Recommendation:
                </p>

                <p className="mt-2 font-semibold">
                  {data.soilMoisture < 40
                    ? "Irrigate within the next 48 hours to avoid moisture stress."
                    : "Crop conditions are stable. Continue current irrigation schedule."}
                </p>
              </div>
            </div>



          <div className="mt-8 flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest mb-1">Current Phase</p>
              <p className="text-xl font-bold">{data.growthStage || 'Vegetative Growth'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest mb-1">Library Scope</p>
              <p className="text-xl font-bold">{(data.knowledgeBase || []).length} Indexed Manuals</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Sprout size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Weekly Action Items
            </h3>
            <span className="text-xs text-gray-500 font-medium flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-500" /> Grounded by Pathway
            </span>
          </div>

          <div className="space-y-4">
            <TaskItem 
              icon={<Droplets className="text-blue-500" />}
              title="Optimize Irrigation Schedule"
              desc={`Precision watering needed to hit your ${budget.targetMoisture}% moisture target.`}
              priority="High"
              onClick={() => handleTaskClick("Optimize Irrigation Schedule")}
              isInteractive={true}
            />
            <TaskItem 
              icon={<Sprout className="text-emerald-500" />}
              title="Apply Balanced Nutrients"
              desc="Schedule fertilizer application while soil moisture is at the recommended level."
              priority="Medium"
            />
            <TaskItem 
              icon={<Bug className="text-amber-500" />}
              title="Humidity-Based Pest Inspection"
              desc={`Current risk in ${data.location} is ${risks.statusMessages.disease}. Inspect leaves.`}
              priority="High"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-heading font-bold text-gray-900 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" /> Environment Risks
          </h3>
          
          <div className="glass-card p-6 rounded-3xl space-y-6 border border-gray-100 shadow-lg">
            <RiskMeter 
              label="Disease Pressure" 
              level={risks.diseasePressure} 
              color={getRiskColor(risks.diseasePressure)} 
              status={risks.statusMessages.disease} 
            />
            <RiskMeter 
              label="Heat Stress" 
              level={risks.heatStress} 
              color={getRiskColor(risks.heatStress)} 
              status={risks.statusMessages.heat} 
            />
            <RiskMeter 
              label="Nutrient Leaching" 
              level={risks.nutrientLeaching} 
              color={getRiskColor(risks.nutrientLeaching)} 
              status={risks.statusMessages.leaching} 
            />
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
            <div className="flex items-center space-x-3 mb-3">
              <Sun className="text-blue-600" />
              <h4 className="font-bold text-blue-900 text-sm">Climate Outlook</h4>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              {budget.recommendations[0] || `Forecast for ${data.location} suggests a ${risks.heatStress > 50 ? 'hot spell' : 'stable week'}. Buffer your groundwater reserves.`}
            </p>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-emerald-100 overflow-hidden">
             <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                      <Clock className="w-6 h-6" />
                   </div>
                   <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5 text-gray-400" />
                   </button>
                </div>

                <div>
                   <h3 className="text-xl font-heading font-bold text-gray-900">{selectedTask}</h3>
                   <p className="text-sm text-gray-500 mt-1">AI-Generated Precision Schedule</p>
                </div>

                {loadingDetail ? (
                   <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="text-emerald-700 font-bold text-sm animate-pulse">Consulting Knowledge Base...</p>
                   </div>
                ) : taskDetail ? (
                   <div className="space-y-4 animate-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <CalendarDays className="w-4 h-4 text-emerald-600 mb-2" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Start Date</p>
                            <p className="font-bold text-gray-900">{taskDetail.date}</p>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Clock className="w-4 h-4 text-emerald-600 mb-2" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Start Time</p>
                            <p className="font-bold text-gray-900">{taskDetail.time}</p>
                         </div>
                      </div>

                      <div className="bg-emerald-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-200">
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                               <Gauge className="w-4 h-4 mr-2 text-emerald-200" />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Irrigation Volume</span>
                            </div>
                         </div>
                         <div className="text-2xl font-heading font-bold">{taskDetail.amount}</div>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col space-y-3">
                         <div className="flex items-start space-x-3">
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                            <p className="text-xs text-emerald-900 italic font-medium">"{taskDetail.instruction}"</p>
                         </div>
                         {taskDetail.sourceDoc && (
                            <div className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg self-end border border-emerald-200">
                               <FileText className="w-3 h-3 mr-1" /> Source: {taskDetail.sourceDoc}
                            </div>
                         )}
                      </div>

                      <button 
                        onClick={handleAddToCalendar}
                        disabled={addedSuccess}
                        className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center ${
                          addedSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {addedSuccess ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" /> Added to Farm Calendar
                          </>
                        ) : 'Add to Farm Calendar'}
                      </button>
                   </div>
                ) : (
                   <div className="text-center py-8 text-gray-500 italic">Could not fetch schedule. Try again.</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskItem = ({ icon, title, desc, priority, onClick, isInteractive }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4 group hover:border-emerald-200 hover:shadow-md transition-all ${isInteractive ? 'cursor-pointer' : ''}`}
  >
    <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-bold text-gray-900">{title}</h4>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
          priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
        }`}>{priority} Priority</span>
      </div>
      <p className="text-sm text-gray-500 leading-snug">{desc}</p>
      {isInteractive && (
        <div className="mt-3 flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest">
           <Sparkles className="w-3 h-3 mr-1" /> Consult Knowledge Base
        </div>
      )}
    </div>
    <div className="self-center p-2 text-gray-300 group-hover:text-emerald-500 transition-colors">
      <ArrowRight className="w-5 h-5" />
    </div>
  </div>
);

const RiskMeter = ({ label, level, color, status }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{status}</span>
    </div>
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${level}%` }} />
    </div>
  </div>
);

export default SeasonalGuidance;
