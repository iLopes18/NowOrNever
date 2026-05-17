import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, ArrowRight, Zap, Shield, Users, Hash as HashIcon, Plus, X } from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { generateAccessCode, cn } from '../lib/utils';
import { Plan, OperationType } from '../types';
import { handleFirestoreError } from '../App';
import { useAuth } from './AuthProvider';
import { useSettings } from './SettingsProvider';
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SettingsBar from './SettingsBar';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useSettings();
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Creation States
  const [showConfig, setShowConfig] = useState<'day' | 'month' | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([format(new Date(), 'yyyy-MM')]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:30');

  // Disable body scroll when modal is open
  React.useEffect(() => {
    if (showConfig) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfig]);

  const timeOptions = Array.from({ length: 48 }).map((_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0');
    const minutes = (i % 2 === 0 ? '00' : '30');
    return `${hours}:${minutes}`;
  });

  const toggleDate = (d: string) => {
    if (selectedDates.includes(d)) {
      setSelectedDates(selectedDates.filter(x => x !== d));
    } else {
      if (selectedDates.length < 7) setSelectedDates([...selectedDates, d].sort());
    }
  };

  const startPlan = async (type: 'day' | 'month') => {
    if (type === 'day' && selectedDates.length === 0) return;
    setCreating(true);
    const accessCode = generateAccessCode();
    
    let expiresAtDate: Date;
    if (type === 'month') {
      const lastMonthStr = selectedMonths[selectedMonths.length - 1];
      // Expiration is the 1st of the month after the last selected month
      expiresAtDate = addMonths(new Date(lastMonthStr + '-01T00:00:00'), 1);
    } else {
      const sortedDates = [...selectedDates].sort();
      const lastDateStr = sortedDates[sortedDates.length - 1];
      // Expiration is the day after the last selected date
      expiresAtDate = addDays(new Date(lastDateStr + 'T00:00:00'), 1);
    }

    const newPlan: any = {
      id: accessCode,
      type,
      creatorId: user?.uid || 'anonymous',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAtDate),
      config: type === 'month' ? {
        months: selectedMonths,
      } : {
        dates: selectedDates.sort(),
        timeStart: startTime,
        timeEnd: endTime,
      },
    };

    try {
      await setDoc(doc(db, 'plans', accessCode), newPlan);
      navigate(`/${accessCode}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `plans/${accessCode}`);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length >= 5) {
      navigate(`/${joinCode.toUpperCase()}`);
    }
  };

  // Calendar Helpers
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentViewDate)),
    end: endOfWeek(endOfMonth(currentViewDate))
  });

  return (
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-32">
      <SettingsBar />
      <header className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-12">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl sm:text-9xl font-display font-black tracking-tighter mb-4"
          >
            {t('home.title1')} <br />
            <span className="text-neon-cyan italic">{t('home.title2')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-current opacity-60 max-w-xl"
          >
            {t('home.subtitle')}
          </motion.p>
        </div>

        <form onSubmit={handleJoin} className="relative group max-w-sm w-full">
           <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-current opacity-30 mb-3 block">{t('home.joinLabel')}</label>
           <div className="relative">
              <HashIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-current opacity-20 group-focus-within:text-neon-cyan transition-colors" size={20} />
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="BK-92X"
                className="w-full bg-inherit/5 border border-current/10 rounded-2xl py-5 pl-12 pr-6 text-xl font-mono tracking-widest focus:border-neon-cyan outline-none transition-all"
              />
              <button disabled={joinCode.length < 5} type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-neon-cyan text-black rounded-lg disabled:opacity-30 transition-all">
                <ArrowRight size={20} />
              </button>
           </div>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {/* Day Mode Card */}
        <div className="relative group rounded-3xl bg-inherit/5 border border-current/10 overflow-hidden flex flex-col min-h-[460px]">
          <div className="p-10 pb-0">
            <div className="relative mb-8 p-3 w-fit rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
              <Clock size={28} />
            </div>
            <h3 className="text-5xl font-display font-black mb-4">{t('home.dayMode.title')}</h3>
            <p className="text-current opacity-40 mb-8 max-w-xs text-base leading-relaxed">
              {t('home.dayMode.desc')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showConfig === 'day' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex justify-center p-6 bg-page/90 backdrop-blur-md overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-md w-full bg-current/5 border border-current/10 rounded-3xl p-8 glass shadow-[0_0_50px_rgba(0,242,255,0.15)] my-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h4 className="text-2xl font-display font-black tracking-tight">{t('home.selectDays')}</h4>
                        <p className="text-[10px] font-mono text-current opacity-30 uppercase tracking-widest mt-1">{t('home.limit7')}</p>
                     </div>
                     <button onClick={() => setShowConfig(null)} className="p-2 hover:bg-current/10 rounded-full transition-all">
                        <X size={24} />
                     </button>
                  </div>

                   {/* Custom Mini Calendar */}
                  <div className="bg-current/10 rounded-2xl p-6 border border-current/5 mb-6">
                     <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-sm uppercase">{format(currentViewDate, 'MMMM yyyy', { locale })}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setCurrentViewDate(addMonths(currentViewDate, -1))} className="p-1 hover:text-neon-cyan transition-colors"><ChevronLeft size={20} /></button>
                          <button onClick={() => setCurrentViewDate(addMonths(currentViewDate, 1))} className="p-1 hover:text-neon-cyan transition-colors"><ChevronRight size={20} /></button>
                        </div>
                     </div>
                     <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {t('home.weekDays.short').split(',').map((d, i) => <div key={i} className="text-[8px] font-black text-current opacity-20">{d}</div>)}
                     </div>
                     <div className="grid grid-cols-7 gap-2">
                        {days.map((day, i) => {
                          const dStr = format(day, 'yyyy-MM-dd');
                          const isSelected = selectedDates.includes(dStr);
                          const isCurrentMonth = isSameMonth(day, currentViewDate);
                          const isPast = isBefore(day, startOfToday());
                          const isNextYearLimit = isBefore(addMonths(new Date(), 12), day);
                          
                          return (
                            <button
                              key={i}
                              onClick={() => !isPast && !isNextYearLimit && toggleDate(dStr)}
                              disabled={isPast || isNextYearLimit}
                              className={cn(
                                "aspect-square flex items-center justify-center text-xs font-bold rounded-xl transition-all",
                                !isCurrentMonth && "opacity-20",
                                (isPast || isNextYearLimit) && "opacity-5 cursor-not-allowed",
                                isSelected ? "bg-neon-cyan text-black font-black shadow-[0_0_15px_rgba(0,242,255,0.5)]" : "hover:bg-current/10 text-current opacity-60"
                              )}
                            >
                              {format(day, 'd', { locale })}
                            </button>
                          );
                        })}
                     </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-1">
                     <span className="text-[10px] font-mono text-current opacity-40 uppercase tracking-widest">{selectedDates.length}/7 {t('home.sync')}</span>
                     {selectedDates.length > 0 && <button onClick={() => setSelectedDates([])} className="text-[10px] text-neon-cyan hover:underline uppercase font-bold tracking-widest">{t('home.clear')}</button>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-current opacity-30 ml-1">{t('home.startTime')}</label>
                      <select 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-inherit border border-current/10 rounded-xl px-4 py-3 text-sm focus:border-neon-cyan outline-none transition-all appearance-none"
                      >
                        {timeOptions.map(t => <option key={t} value={t} className="bg-inherit text-inherit">{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-current opacity-30 ml-1">{t('home.endTime')}</label>
                      <select 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-inherit border border-current/10 rounded-xl px-4 py-3 text-sm focus:border-neon-cyan outline-none transition-all appearance-none"
                      >
                        {timeOptions.map(t => <option key={t} value={t} className="bg-inherit text-inherit">{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => startPlan('day')}
                    disabled={creating || selectedDates.length === 0}
                    className="w-full py-5 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale shadow-[0_0_30px_rgba(0,242,255,0.25)]"
                  >
                    {creating ? <Zap className="animate-spin" /> : <>{t('home.finalize')} {selectedDates.length} {t('home.daysCount')} <ArrowRight size={20} /></>}
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="p-10 pt-0 mt-auto">
                <button 
                  onClick={() => setShowConfig('day')}
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-current/5 border border-current/5 hover:border-current/20 text-current transition-all group"
                >
                  <span className="font-black uppercase tracking-widest">{t('home.openDatePicker')}</span>
                  <Plus size={24} className="group-hover:rotate-90 transition-transform text-neon-cyan" />
                </button>
              </div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-neon-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        {/* Month Mode Card */}
        <div className="relative group rounded-3xl bg-inherit/5 border border-current/10 overflow-hidden flex flex-col min-h-[460px]">
          <div className="p-10 pb-0">
            <div className="relative mb-8 p-3 w-fit rounded-xl bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
              <Calendar size={28} />
            </div>
            <h3 className="text-5xl font-display font-black mb-4">{t('home.monthMode.title')}</h3>
            <p className="text-current opacity-40 mb-8 max-w-xs text-base leading-relaxed">
              {t('home.monthMode.desc')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showConfig === 'month' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex justify-center p-6 bg-page/90 backdrop-blur-md overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-lg w-full bg-current/5 border border-current/10 rounded-3xl p-8 glass shadow-[0_0_50px_rgba(188,19,254,0.15)] my-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h4 className="text-2xl font-display font-black tracking-tight">{t('home.selectMonths')}</h4>
                        <p className="text-[10px] font-mono text-current opacity-30 uppercase tracking-widest mt-1">{t('home.multiMonth')}</p>
                     </div>
                     <button onClick={() => setShowConfig(null)} className="p-2 hover:bg-current/10 rounded-full transition-all">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
                    {Array.from({ length: 13 }).map((_, i) => {
                      const monthDate = addMonths(new Date(), i);
                      const mStr = format(monthDate, 'yyyy-MM');
                      const isSelected = selectedMonths.includes(mStr);
                      return (
                        <button 
                          key={mStr}
                          onClick={() => setSelectedMonths(prev => prev.includes(mStr) ? (prev.length > 1 ? prev.filter(x => x !== mStr) : prev) : [...prev, mStr].sort())}
                          className={cn(
                            "px-2 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-1",
                            isSelected ? "bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)]" : "bg-inherit/5 border-current/10 text-current opacity-40 hover:border-current/30"
                          )}
                        >
                          <span>{format(monthDate, 'MMM', { locale })}</span>
                          <span className="opacity-40 text-[8px]">{format(monthDate, 'yy', { locale })}</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 px-1">
                     <span className="text-[10px] font-mono text-current opacity-40 uppercase tracking-widest">{selectedMonths.length} {t('home.selectMonths')}</span>
                     <button onClick={() => setSelectedMonths([format(new Date(), 'yyyy-MM')])} className="text-[10px] text-neon-purple hover:underline uppercase font-bold tracking-widest">{t('home.reset')}</button>
                  </div>

                  <button 
                    onClick={() => startPlan('month')}
                    disabled={creating}
                    className="w-full py-5 bg-neon-purple text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(188,19,254,0.3)]"
                  >
                    {creating ? <Zap className="animate-spin" /> : <>{t('home.sync')} {selectedMonths.length} {t('home.monthsCount')} <ArrowRight size={20} /></>}
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="p-10 pt-0 mt-auto">
                <button 
                  onClick={() => setShowConfig('month')}
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-current/5 border border-current/5 hover:border-current/20 text-current transition-all group"
                >
                  <span className="font-black uppercase tracking-widest">{t('home.selectMonthsBtn')}</span>
                  <Plus size={24} className="group-hover:rotate-90 transition-transform text-neon-purple" />
                </button>
              </div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-neon-purple scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>
      </div>

      <section className="border-t border-current/10 pt-24 grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div>
            <div className="text-3xl font-display font-black mb-4">01</div>
            <h5 className="font-bold mb-2 uppercase tracking-tight">{t('home.step1.title')}</h5>
            <p className="text-sm text-current opacity-40 leading-relaxed">{t('home.step1.desc')}</p>
          </div>
          <div>
            <div className="text-3xl font-display font-black mb-4">02</div>
            <h5 className="font-bold mb-2 uppercase tracking-tight">{t('home.step2.title')}</h5>
            <p className="text-sm text-current opacity-40 leading-relaxed">{t('home.step2.desc')}</p>
          </div>
          <div>
            <div className="text-3xl font-display font-black mb-4">03</div>
            <h5 className="font-bold mb-2 uppercase tracking-tight">{t('home.step3.title')}</h5>
            <p className="text-sm text-current opacity-40 leading-relaxed">{t('home.step3.desc')}</p>
          </div>
      </section>
    </div>
  );
}
