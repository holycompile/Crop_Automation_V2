
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Droplets, Thermometer, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
// Added Language to imports
import { FarmAlert, FarmData, Language } from '../types';
import { getGeminiApiKey } from '../utils/geminiHelper';

interface Props {
  alert: FarmAlert | null;
  farmData: FarmData | null;
  onClose: () => void;
  // Added language prop
  language: Language;
}

// Added language to destructuring
const AIModal: React.FC<Props> = ({ alert, farmData, onClose, language }) => {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alert && farmData) {
      handleGetAIAdvice();
    }
  }, [alert]);

  const handleGetAIAdvice = async () => {
    setLoading(true);
    setResponse("");
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setResponse(language === 'hi'
          ? "मुझे खेद है! मुझे आपका Gemini API Key नहीं मिला। अपनी स्थानीय .env फ़ाइल में VITE_GEMINI_API_KEY=your_actual_key सेट करें।"
          : language === 'he'
          ? "מצטער! מפתח ה-API של Gemini חסר. הגדר VITE_GEMINI_API_KEY בקובץ ה-.env שלך."
          : "Your Gemini API Key is missing. Please create a local .env file with VITE_GEMINI_API_KEY=your_actual_key inside VS Code to get live AI advice here."
        );
        setLoading(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      // Updated prompt to respect language
      const prompt = `
        The farmer received a CRITICAL ALERT: "${alert?.message}".
        Farm Context: ${farmData?.crop} in ${farmData?.location}. 
        Soil Moisture: ${farmData?.soilMoisture}%.
        Provide a 3-step actionable mitigation plan for this specific alert. 
        Be concise, professional, and helpful. Use simple formatting.
        IMPORTANT: Provide the response in ${language}.
      `;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setResponse(res.text || "I'm having trouble analyzing this right now. Please check your irrigation manually.");
    } catch (e) {
      setResponse("AI is currently unavailable. Please follow standard protocols.");
    } finally {
      setLoading(false);
    }
  };

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-2xl font-heading font-bold">AI Resolution Strategy</h2>
          <p className="text-emerald-100 opacity-80 text-sm mt-1">Analyzing Alert: "{alert.message}"</p>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-emerald-800 font-medium animate-pulse">AgroFlow AI is calculating mitigation steps...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <h3 className="text-emerald-900 font-bold flex items-center mb-3">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Recommended Actions
                </h3>
                <div className="prose prose-emerald text-sm text-emerald-800 leading-relaxed whitespace-pre-line">
                  {response}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center space-x-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-xs">
                  <span>Execute Sync</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="flex items-center justify-center py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all text-xs">
                  Dismiss Alert
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          Advice based on local ${farmData?.location} weather grounding.
        </div>
      </div>
    </div>
  );
};

export default AIModal;
