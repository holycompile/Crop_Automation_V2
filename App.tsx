
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FarmerProfile from './components/FarmerProfile';
import SensorAnalysis from './components/SensorAnalysis';
import VoiceAssistant from './components/VoiceAssistant';
import SeasonalGuidance from './components/SeasonalGuidance';
import CalendarTab from './components/CalendarTab';
import AIModal from './components/AIModal';
import VideoGenerator from './components/VideoGenerator';

import SatelliteMap from './components/SatelliteMap';
import { NavigationTab, FarmData, BudgetResult, FarmAlert, CalendarEvent, Language, GrowthStage } from './types';
import { calculateWaterBudget } from './services/gemini';
import { subscribeToMoisture } from './services/firebase';
import { Bell, Wifi } from 'lucide-react';
import { translations } from './translations';

import { getFarmData } from './services/agroflowService';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.PROFILE);
  const [isSetup, setIsSetup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [budgetResult, setBudgetResult] = useState<BudgetResult | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<FarmAlert | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isIrrigating, setIsIrrigating] = useState(false);
  
  const firebaseUnsubscribeRef = useRef<(() => void) | null>(null);

  const t = (key: string) => translations[language][key] || key;
  const isRTL = language === 'he';

  // Live irrigation moisture simulation loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isIrrigating && farmData) {
      timer = setInterval(() => {
        setFarmData(prev => {
          if (!prev) return null;
          const target = budgetResult?.targetMoisture || 80;
          if (prev.soilMoisture >= target) {
            setIsIrrigating(false);
            return prev;
          }
          return {
            ...prev,
            soilMoisture: Math.min(target, Number((prev.soilMoisture + 1.2).toFixed(1)))
          };
        });
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isIrrigating, farmData, budgetResult?.targetMoisture]);

  // Handle updates to profile fields triggered via Agent
  const handleUpdateFarmProfile = async (updatedFields: Partial<FarmData>) => {
    if (!farmData) return;
    const mergeData = { ...farmData, ...updatedFields };
    setFarmData(mergeData);
    setIsProcessing(true);
    try {
      const result = await calculateWaterBudget(mergeData, language);
      setBudgetResult(result);
    } catch (err) {
      console.error("Agent profile update failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isSetup) setActiveTab(NavigationTab.DASHBOARD);
    else setActiveTab(NavigationTab.PROFILE);
  }, [isSetup]);

  useEffect(() => {
    if (farmData?.firebase?.enabled) {
      firebaseUnsubscribeRef.current?.();
      firebaseUnsubscribeRef.current = subscribeToMoisture(farmData.firebase, (newMoisture) => {
        setFarmData(prev => prev ? { ...prev, soilMoisture: newMoisture } : null);
        setIsLive(true);
      });
    } else {
      firebaseUnsubscribeRef.current?.();
      setIsLive(false);
    }
    return () => firebaseUnsubscribeRef.current?.();
  }, [farmData?.firebase?.enabled, farmData?.firebase?.databaseURL]);

  const handleUpdateStage = async (stage: GrowthStage) => {
    if (!farmData) return;
    const newData = { ...farmData, growthStage: stage };
    setIsProcessing(true);
    try {
      const satellite = await getFarmData(newData.location, newData.crop, stage);
      const mergedData = {
        ...newData,
        lat: satellite.lat,
        lon: satellite.lon,
        ndvi: satellite.ndvi,
        ndwi: satellite.ndwi,
        evi: satellite.evi,
        vci: satellite.vci,
        smi: satellite.smi,
        stress: satellite.stress,
        classificationAccuracy: satellite.classificationAccuracy,
        kappaCoefficient: satellite.kappaCoefficient,
        cropMap: satellite.cropMap,
        stressMap: satellite.stressMap,
        irrigationMap: satellite.irrigationMap
      };
      setFarmData(mergedData);
      const result = await calculateWaterBudget(mergedData, language);
      setBudgetResult(result);
    } catch (err) {
      console.error("Failed to update growth stage telemetry:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = async (data: FarmData) => {
    setIsProcessing(true);
    setBudgetResult(null);

    try {
        const satellite = await getFarmData(
          data.location,
          data.crop,
          data.growthStage || 'Vegetative'
        );

        const mergedData = {
            ...data,
            lat: satellite.lat,
            lon: satellite.lon,
            ndvi: satellite.ndvi,
            ndwi: satellite.ndwi,
            evi: satellite.evi,
            vci: satellite.vci,
            smi: satellite.smi,
            stress: satellite.stress,
            classificationAccuracy: satellite.classificationAccuracy,
            kappaCoefficient: satellite.kappaCoefficient,
            cropMap: satellite.cropMap,
            stressMap: satellite.stressMap,
            irrigationMap: satellite.irrigationMap
        };

        setFarmData(mergedData);

        const result = await calculateWaterBudget(
            mergedData,
            language
        );

        setBudgetResult(result);
        setIsSetup(true);

    } catch (err) {
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRefreshBudget = async () => {
    if (!farmData) return;
    setIsProcessing(true);
    try {
      const result = await calculateWaterBudget(farmData, language);
      setBudgetResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 ${isRTL ? 'font-hebrew' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isSetup={isSetup} farmerName={farmData?.farmerName} language={language} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0">
        <header className="h-16 md:h-20 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div>
              <h1 className="text-lg md:text-xl font-heading font-bold text-gray-900 capitalize leading-none">
                {t(activeTab)}
              </h1>
              <div className="flex items-center mt-1">
                <p className="text-[10px] md:text-xs text-gray-400">
                  {isSetup ? `${farmData?.farmName || 'Farm'} Monitoring Active` : 'Define your farm to begin'}
                </p>
                {isLive && (
                  <span className="ml-2 flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                    <Wifi className="w-2 h-2 mr-1" /> LIVE ESP32
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Global Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  language === 'en' 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  language === 'hi' 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('he')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  language === 'he' 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                עברית
              </button>
            </div>

            <div className="w-10 h-10">
              <VoiceAssistant 
                inlineTrigger 
                farmData={farmData} 
                budgetResult={budgetResult} 
                language={language} 
                onToggleIrrigation={setIsIrrigating}
                isIrrigating={isIrrigating}
                onAddCalendarEvent={(evt) => setCalendarEvents(prev => [...prev, evt])}
                onUpdateFarmProfile={handleUpdateFarmProfile}
                onChangeLanguage={setLanguage}
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-emerald-600">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === NavigationTab.PROFILE && (
            <FarmerProfile onSave={handleSaveProfile} initialData={farmData} isSaving={isProcessing} language={language} />
          )}
          {activeTab === NavigationTab.DASHBOARD && isSetup && (
            <>
              <SatelliteMap farmData={farmData} />
              <Dashboard
                budget={budgetResult}
                farmData={farmData}
                onAlertClick={setSelectedAlert}
                language={language}
                isRefreshing={isProcessing}
                onRefresh={handleRefreshBudget}
                isIrrigating={isIrrigating}
                onToggleIrrigation={setIsIrrigating}
              />
            </>
          )}
          {activeTab === NavigationTab.SENSORS && isSetup && (
            <SensorAnalysis data={farmData} health={budgetResult?.cropHealth} language={language} isLive={isLive} onUpdateStage={handleUpdateStage} />
          )}
          {activeTab === NavigationTab.INSIGHTS && isSetup && (
            <SeasonalGuidance data={farmData} budget={budgetResult} onAddEvent={(e) => setCalendarEvents(p => [...p, e])} language={language} />
          )}
          {activeTab === NavigationTab.VIDEO && isSetup && (
            <VideoGenerator farmData={farmData} language={language} />
          )}
          {activeTab === NavigationTab.CALENDAR && isSetup && (
            <CalendarTab events={calendarEvents} language={language} />
          )}
        </div>
      </main>
      {selectedAlert && <AIModal alert={selectedAlert} farmData={farmData} onClose={() => setSelectedAlert(null)} language={language} />}
    </div>
  );
};

export default App;
