
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Droplets, ChevronLeft, ChevronRight, Info, Plus } from 'lucide-react';
// Added Language to imports
import { CalendarEvent, Language } from '../types';

interface Props {
  events: CalendarEvent[];
  // Added language prop
  language: Language;
}

// Added language to destructuring
const CalendarTab: React.FC<Props> = ({ events, language }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Simple calendar grid logic for the selected viewDate
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => null);

  const getEventsForDay = (day: number) => {
    // Standardize the day format to match YYYY-MM-DD
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Farm Calendar</h2>
          <p className="text-gray-500 text-sm">Automated scheduling & irrigation tracking</p>
        </div>
        <div className="flex items-center bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-emerald-50 rounded-lg transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
          </button>
          <span className="mx-4 font-bold text-gray-700 min-w-[140px] text-center">{monthName} {currentYear}</span>
          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-emerald-50 rounded-lg transition-colors group"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl shadow-xl border border-emerald-100/30">
          <div className="grid grid-cols-7 mb-4 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {[...padding, ...calendarDays].map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const activeToday = day ? isToday(day) : false;
              const hasEvents = dayEvents.length > 0;
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[80px] md:min-h-[110px] p-2 rounded-2xl border transition-all relative group ${
                    !day ? 'bg-transparent border-transparent' : 
                    activeToday ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 
                    hasEvents ? 'bg-white border-blue-100 shadow-sm' :
                    'bg-white border-gray-50 hover:border-emerald-100 hover:shadow-sm'
                  }`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-bold ${activeToday ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map(e => (
                          <div 
                            key={e.id} 
                            className="bg-emerald-600 text-white text-[8px] md:text-[9px] p-1 md:px-2 rounded-lg truncate font-bold flex items-center shadow-sm"
                            title={`${e.title} - ${e.time}`}
                          >
                            <Droplets className="w-2 h-2 mr-1" /> {e.amount}
                          </div>
                        ))}
                      </div>
                      
                      {!hasEvents && day && (
                        <button className="absolute bottom-2 right-2 p-1 bg-gray-50 text-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-emerald-600">
                           <Plus size={10} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operation Timeline */}
        <div className="space-y-6">
          <h3 className="text-xl font-heading font-bold text-gray-900 flex items-center px-2">
            <Clock className="w-5 h-5 mr-2 text-emerald-600" /> Planned Ops
          </h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {events.length > 0 ? (
              events.sort((a,b) => a.date.localeCompare(b.date)).map(event => (
                <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4 border-l-4 border-l-emerald-600 transition-all hover:shadow-md">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{event.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center mt-1 font-medium">
                      <CalendarIcon className="w-3 h-3 mr-1" /> {event.date} • {event.time}
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-100">
                      Target: {event.amount}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-10 rounded-3xl text-center border-dashed border-2 border-gray-200">
                <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-xs text-gray-400 font-medium leading-relaxed">No scheduled operations.<br/>Generate a plan in Analytics to start.</p>
              </div>
            )}
          </div>

          <div className="bg-emerald-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
             <div className="relative z-10">
               <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-widest mb-2">Operation Sync</h4>
               <p className="text-xs leading-relaxed opacity-80">Syncing these events with your IoT gateway will enable autonomous irrigation pulses based on your budget.</p>
             </div>
             <CalendarIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
