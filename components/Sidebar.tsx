
import React from 'react';
import { LayoutDashboard, UserCircle, Activity, LineChart, Sprout, Calendar, Film } from 'lucide-react';
import { NavigationTab, Language } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isSetup: boolean;
  farmerName?: string;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isSetup, farmerName, language }) => {
  const t = (key: string) => translations[language][key] || key;
  const isRTL = language === 'he';

  const allItems = [
    { id: NavigationTab.PROFILE, label: t('profile'), icon: UserCircle, public: true },
    { id: NavigationTab.DASHBOARD, label: t('Dashboard'), icon: LayoutDashboard, public: false },
    { id: NavigationTab.SENSORS, label: t('sensors'), icon: Activity, public: false },
    { id: NavigationTab.INSIGHTS, label: t('analytics'), icon: LineChart, public: false },
    { id: NavigationTab.VIDEO, label: t('videoLab'), icon: Film, public: false },
    { id: NavigationTab.CALENDAR, label: t('calendar'), icon: Calendar, public: false },
  ];

  const visibleItems = isSetup ? allItems : allItems.filter(i => i.public);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full w-64 bg-emerald-900 text-white transition-all duration-300 flex-shrink-0">
        <div className="p-6 flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">{t('appTitle')}</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center p-4 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-950/20' 
                  : 'text-emerald-300 hover:bg-emerald-800 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className="mx-4 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {isSetup && (
          <div className="p-6 border-t border-emerald-800">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white shrink-0">
                {farmerName?.charAt(0) || 'F'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{farmerName || 'Farmer'}</p>
                <p className="text-xs text-emerald-400">{t('proFarmer')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center justify-around px-2 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'text-emerald-600' 
                : 'text-gray-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
