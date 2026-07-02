
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Film, Sparkles, Wand2, Loader2, Play, AlertCircle, Info, 
  Monitor, Smartphone, Download, Share2, History, ChevronRight 
} from 'lucide-react';
import { Language, FarmData, VideoVisual } from '../types';
import { translations } from '../translations';
import { getGeminiApiKey } from '../utils/geminiHelper';

interface Props {
  language: Language;
  farmData: FarmData | null;
}

const REASSURING_MESSAGES = [
  "Consulting agricultural physics models...",
  "Simulating plant growth patterns...",
  "Rendering environmental light for your location...",
  "Stitching frames for fluid motion...",
  "Optimizing fluid dynamics for irrigation visualization...",
  "Finalizing your educational visual...",
  "Almost there, gathering biological metadata..."
];

const VideoGenerator: React.FC<Props> = ({ language, farmData }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [gallery, setGallery] = useState<VideoVisual[]>([]);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => translations[language][key] || key;

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      // Assuming window.aistudio is globally available
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } catch (e) {
      console.error("API Key check error", e);
    }
  };

  const handleOpenSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      // guidelines: proceed immediately after triggering openSelectKey
      setHasApiKey(true);
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    let messageIdx = 0;
    setStatusMessage(REASSURING_MESSAGES[0]);
    
    const interval = setInterval(() => {
      messageIdx = (messageIdx + 1) % REASSURING_MESSAGES.length;
      setStatusMessage(REASSURING_MESSAGES[messageIdx]);
    }, 15000);

    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_MISSING");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt}. Style: photorealistic agricultural education, high quality, detailed foliage, natural lighting.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // We append the key to the download link as per guidelines
        const videoUrl = `${downloadLink}&key=${apiKey}`;
        
        const newVisual: VideoVisual = {
          id: Math.random().toString(36).substr(2, 9),
          prompt: prompt,
          url: videoUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        
        setGallery(prev => [newVisual, ...prev]);
        setPrompt('');
      } else {
        throw new Error("Video generation failed to return a link.");
      }

    } catch (err: any) {
      console.error("Video Gen Error:", err);
      if (err?.message?.includes("Requested entity was not found.")) {
        setHasApiKey(false);
        setError("API Key session expired. Please select your key again.");
      } else {
        setError("Visual laboratory is currently busy. Please try again in a few minutes.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">{t('videoLab')}</h2>
          <p className="text-gray-500 text-sm mt-1">Grounded Visual Simulation for Farmers</p>
        </div>
        {!hasApiKey && (
          <button 
            onClick={handleOpenSelectKey}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all font-bold text-sm border border-amber-200"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{t('selectKey')}</span>
          </button>
        )}
      </div>

      {!hasApiKey ? (
        <div className="glass-card p-10 rounded-[2.5rem] border border-amber-100 shadow-xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">{t('billingRequired')}</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {t('billingDesc')} Visit the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-amber-600 underline">billing documentation</a> for details.
          </p>
          <button 
            onClick={handleOpenSelectKey}
            className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all"
          >
            {t('selectKey')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">{t('videoPrompt')}</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A 3D animation showing how drip irrigation delivers water directly to wheat roots in dry soil..."
                  className="w-full h-32 p-4 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all text-gray-800"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
                    aspectRatio === '16:9' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-100'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs font-bold">Landscape (16:9)</span>
                </button>
                <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
                    aspectRatio === '9:16' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-bold">Portrait (9:16)</span>
                </button>
              </div>

              <button 
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center space-x-3 transition-all ${
                  isGenerating ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{statusMessage}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>{t('generateVideo')}</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-heading font-bold text-gray-900 flex items-center px-2">
                <History className="w-5 h-5 mr-2 text-emerald-600" /> {t('visualGallery')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gallery.length > 0 ? gallery.map(visual => (
                  <div key={visual.id} className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden group hover:shadow-xl transition-all">
                    <div className="aspect-video bg-black relative">
                      <video 
                        src={visual.url} 
                        controls 
                        className="w-full h-full object-cover"
                        poster={visual.thumbnail}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-800 font-medium line-clamp-2 italic mb-3">"{visual.prompt}"</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>{visual.timestamp}</span>
                        <div className="flex items-center space-x-3">
                           <button className="hover:text-emerald-600 transition-colors"><Download size={14} /></button>
                           <button className="hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="md:col-span-2 py-16 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <Film className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-sm text-gray-400 font-medium">No videos generated yet.<br/>Describe a scene to begin educational visualization.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <Sparkles className="absolute -top-6 -right-6 w-32 h-32 text-emerald-500/10 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-heading font-bold flex items-center">
                  <Play className="w-5 h-5 mr-2 text-emerald-400" />
                  The Veo Engine
                </h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  AgroFlow leverages Gemini's high-fidelity video generation to visualize crop outcomes before you plant.
                </p>
                <ul className="space-y-3">
                  <FeatureItem text="Hyper-realistic growth simulations" />
                  <FeatureItem text="Weather pattern impact visuals" />
                  <FeatureItem text="Irrigation failure scenarios" />
                </ul>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-emerald-100 shadow-lg">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <Info className="w-3 h-3 mr-1" /> Tech Spec
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Model</span>
                  <span className="text-emerald-700">Veo-3.1-Fast</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Latency</span>
                  <span className="text-emerald-700">~1-3 mins</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Resolution</span>
                  <span className="text-emerald-700">720p / 1080p</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center text-xs font-medium text-emerald-200">
    <ChevronRight className="w-3 h-3 mr-2 text-emerald-400" />
    {text}
  </li>
);

export default VideoGenerator;
