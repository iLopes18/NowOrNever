import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Users, Zap, Calendar as CalIcon, Clock as ClockIcon, Home, Settings, Share2, ArrowRight } from 'lucide-react';
import { usePlanRoom } from '../hooks/usePlanRoom';
import { auth } from '../lib/firebase';
import IdentityModal from './IdentityModal';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useStats } from '../App';
import { useSettings } from './SettingsProvider';
import SettingsBar from './SettingsBar';

interface Props {
  accessCode: string;
}

export default function PlanView({ accessCode }: Props) {
  const navigate = useNavigate();
  const { setStats } = useStats();
  const { t, locale } = useSettings();
  const { plan, participants, loading, error, joinPlan, toggleAvailability } = usePlanRoom(accessCode);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const myPart = participants.find(p => p.id === auth.currentUser?.uid);
  
  const heatmap = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      p.availability.forEach(slot => {
        counts[slot] = (counts[slot] || 0) + 1;
      });
    });
    return counts;
  }, [participants]);

  const topOptions = useMemo(() => {
    return Object.entries(heatmap)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 3)
      .map(([slot, count]) => ({
        slot,
        count,
        percent: participants.length > 0 ? Math.round(((count as number) / participants.length) * 100) : 0
      }));
  }, [heatmap, participants.length]);

  useEffect(() => {
    if (topOptions.length > 0) {
      const statsStr = topOptions.map((opt, i) => `${i + 1}. ${opt.slot} (${opt.percent}%)`).join(' | ');
      setStats(`${t('plan.consensus')}: ${statsStr}`);
    } else {
      setStats(t('plan.consensus'));
    }
  }, [topOptions, setStats, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Zap className="text-neon-cyan animate-pulse" size={48} />
      </div>
    );
  }

  if (error === 'PLAN_NOT_FOUND' || error === 'PLAN_EXPIRED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <SettingsBar />
        <h1 className="text-4xl font-display font-black mb-4">
          {error === 'PLAN_EXPIRED' ? t('plan.expiredTitle') : t('plan.notFoundTitle')}
        </h1>
        <p className="text-current opacity-60 mb-8 max-w-sm">
          {error === 'PLAN_EXPIRED' 
            ? t('plan.expiredDesc') 
            : t('plan.notFoundDesc')}
        </p>
        <button onClick={() => navigate('/')} className="px-6 py-4 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)]">
          {t('plan.createBtn')}
        </button>
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // Simple toast could be added here
  };

  const rejoinAsLocal = (id: string) => {
     localStorage.setItem(`plan_uid_${accessCode}`, id);
     window.location.reload(); // Quick way to reset all states
  };

  const joinPlanWrapped = (name: string) => {
    if (auth.currentUser) {
      localStorage.setItem(`plan_uid_${accessCode}`, auth.currentUser.uid);
      joinPlan(name);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SettingsBar />
      {/* Sidebar - Who's In */}
      <aside className="w-80 border-r border-current/10 bg-current/5 overflow-y-auto hidden lg:flex flex-col">
        <div className="p-8 border-b border-current/10">
          <div className="flex items-center gap-4 mb-6">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-lg"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="flex items-center justify-between flex-1">
              <h2 className="text-4xl font-display font-black">{t('plan.whosIn')}</h2>
              <button onClick={() => navigate('/')} className="p-2 hover:bg-current/10 rounded-lg text-current opacity-40 hover:text-neon-cyan transition-all">
                <Home size={20} />
              </button>
            </div>
          </div>
          <p className="text-[10px] font-mono text-current opacity-40 uppercase tracking-widest px-1">
            {participants.length} {t('plan.active')}
          </p>
        </div>
        
        <div className="p-4 space-y-2">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-current/5 transition-all group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-current/20 to-current/5 border border-current/10 flex items-center justify-center font-bold text-xs">
                {p.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.displayName}</p>
                <p className="text-[10px] text-current opacity-30 uppercase font-black tracking-tighter">
                  {p.id === localStorage.getItem(`plan_uid_${accessCode}`) ? t('plan.you') : t('plan.participant')}
                </p>
              </div>
              {p.availability.length > 0 && (
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_#00f2ff]" />
              )}
            </div>
          ))}
        </div>

        <nav className="mt-auto p-4 space-y-2 border-t border-current/10">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 p-4 text-xs font-bold uppercase tracking-widest text-current opacity-40 hover:text-current hover:bg-current/5 rounded-2xl transition-all">
            <Home size={18} /> {t('plan.mainScreen')}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto p-8 pt-12">
          {/* Mobile Home Nav */}
          <button onClick={() => navigate('/')} className="lg:hidden mb-8 flex items-center gap-2 text-[10px] font-black uppercase text-current opacity-40 tracking-widest hover:text-neon-cyan">
             <Home size={14} /> {t('plan.backToMain')}
          </button>

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 inline-block",
                plan?.type === 'day' ? "bg-neon-cyan/20 text-neon-cyan" : "bg-neon-purple/20 text-neon-purple"
              )}>
                {plan?.type === 'day' ? t('plan.consensus') : t('plan.available')}
              </span>
              <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tighter">
                {plan?.type === 'day' 
                  ? (plan?.config.dates && plan.config.dates.length > 1 
                      ? `${format(new Date(plan.config.dates[0]), 'MMM d', { locale })} — ${format(new Date(plan.config.dates[plan.config.dates.length - 1]), 'MMM d', { locale })}`
                      : plan?.config.dates?.[0] || t('plan.schedule')) 
                  : t('plan.monthlyPlanner')}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-inherit/5 border border-current/10 rounded-xl px-4 py-2 flex items-center gap-3">
                <span className="text-[10px] font-mono text-current opacity-40 uppercase">{t('plan.codeLabel')}</span>
                <span className="font-bold tracking-widest font-mono text-neon-cyan">{accessCode}</span>
              </div>
              <button 
                onClick={copyLink}
                className="p-3 bg-neon-cyan text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,242,255,0.2)]"
              >
                <Share2 size={20} />
              </button>
            </div>
          </header>

          {/* Grid Area */}
          <div className="glass rounded-3xl p-8 mb-12">
             {plan?.type === 'month' ? (
                <MonthPlanner 
                   months={plan?.config.months || []}
                   heatmap={heatmap}
                   myAvailability={myPart?.availability || []}
                   participantsCount={participants.length}
                   onToggle={toggleAvailability}
                   onShowParticipants={setSelectedSlot}
                />
             ) : (
                <DayPlanner 
                   dates={plan?.config.dates || []}
                   timeStart={plan?.config.timeStart || '00:00'}
                   timeEnd={plan?.config.timeEnd || '23:30'}
                   heatmap={heatmap}
                   myAvailability={myPart?.availability || []}
                   participantsCount={participants.length}
                   onToggle={toggleAvailability}
                   onShowParticipants={setSelectedSlot}
                />
             )}
          </div>

          {/* Top Options Bar */}
          <section>
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-current opacity-30 mb-6">{t('plan.consensus')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topOptions.length > 0 ? topOptions.map((opt, i) => (
                <button 
                  key={opt.slot} 
                  onClick={() => setSelectedSlot(opt.slot)}
                  className="p-4 rounded-2xl bg-inherit border border-current/10 flex flex-col justify-between text-left hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all group"
                >
                  <div>
                    <div className="text-[10px] font-bold text-current opacity-40 uppercase mb-2">#{i+1} {t('plan.optionLabel')}</div>
                    <div className="text-xl font-bold font-mono text-neon-cyan mb-1">{opt.slot}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{opt.count} {t('plan.available')}</span>
                    <span className="text-sm font-black text-neon-green">{opt.percent}% {t('plan.match')}</span>
                  </div>
                </button>
              )) : (
                <div className="col-span-3 py-12 text-center text-current opacity-20 italic">
                  {t('plan.tapToSee')}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {selectedSlot && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-page/95 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="max-w-md w-full bg-current/5 border border-current/10 rounded-3xl p-8 glass shadow-2xl relative"
             >
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-current/10 rounded-full transition-colors"
                >
                  <Zap size={20} className="rotate-45" />
                </button>

                <div className="mb-8">
                  <div className="text-[10px] font-black uppercase tracking-widest text-neon-cyan mb-2">{t('plan.availabilityFor')}</div>
                  <h3 className="text-3xl font-display font-black">
                    {selectedSlot.includes('_') 
                      ? (() => {
                          const [d, t] = selectedSlot.split('_');
                          return `${format(new Date(d), 'EEE, d MMM', { locale })} @ ${t}`;
                        })()
                      : format(new Date(selectedSlot), selectedSlot.length <= 7 ? 'MMMM yyyy' : 'EEEE, d MMMM', { locale })
                    }
                  </h3>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                   {participants.filter(p => p.availability.includes(selectedSlot)).map(p => (
                     <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-current/5 border border-current/5">
                        <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/20 flex items-center justify-center font-bold text-neon-cyan text-xs">
                          {p.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold">{p.displayName}</span>
                        <div className="ml-auto w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_#39ff14]" />
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="w-full mt-8 py-4 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {t('plan.gotIt')}
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!localStorage.getItem(`plan_uid_${accessCode}`) && (
          <IdentityModal 
            participants={participants}
            onJoin={joinPlanWrapped} 
            onPickExisting={rejoinAsLocal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthPlanner({ months, heatmap, myAvailability, participantsCount, onToggle, onShowParticipants }: any) {
  const { t, locale } = useSettings();
  const [activeMonthStr, setActiveMonthStr] = React.useState(months[0]);
  
  const currentMonthDate = useMemo(() => new Date(activeMonthStr + '-01'), [activeMonthStr]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonthDate);
    const end = endOfMonth(currentMonthDate);
    return eachDayOfInterval({ start, end });
  }, [currentMonthDate]);

  return (
    <div className="space-y-8">
      {months.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {months.map((m: string) => (
            <button
              key={m}
              onClick={() => setActiveMonthStr(m)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeMonthStr === m ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.3)]" : "bg-inherit/5 text-current opacity-50 border border-current/10"
              )}
            >
              {format(new Date(m + '-01'), 'MMMM yyyy', { locale })}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-display font-black uppercase">{format(currentMonthDate, 'MMMM yyyy', { locale })}</h4>
        <div className="flex gap-4 text-[10px] uppercase font-bold text-current opacity-40">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-inherit border border-current/10" /> {t('plan.empty')}</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-purple/40" /> {t('plan.popular')}</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-green" /> {t('plan.match')}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {t('plan.weekDays.short').split(',').map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-current opacity-20 uppercase py-2">{d}</div>
        ))}
        {/* Fill start gap */}
        {Array.from({ length: currentMonthDate.getDay() }).map((_, i) => (
          <div key={`gap-${i}`} className="aspect-square opacity-0" />
        ))}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = heatmap[dateStr] || 0;
          const isSelected = myAvailability.includes(dateStr);
          const intensity = participantsCount > 0 ? count / participantsCount : 0;
          const isWinner = intensity === 1 && participantsCount > 1;

          return (
            <div key={dateStr} className="relative aspect-square">
              <button
                onClick={() => onToggle(dateStr)}
                className={cn(
                  "w-full h-full group relative rounded-xl p-2 text-left transition-all overflow-hidden",
                  isSelected ? "border-2 border-neon-purple/50" : "border border-current/5",
                  isWinner ? "bg-neon-green shadow-[0_0_20px_rgba(57,255,20,0.4)] text-black" : "bg-current/5 hover:bg-current/10"
                )}
              >
                {!isWinner && count > 0 && (
                  <div 
                    className="absolute inset-x-0 bottom-0 bg-neon-purple/30 transition-all duration-500" 
                    style={{ height: `${intensity * 100}%` }} 
                  />
                )}
                <span className={cn("relative z-10 text-sm font-bold", isWinner ? "text-black" : (isSelected ? "text-neon-purple" : "text-current opacity-80"))}>
                  {format(day, 'd')}
                </span>
              </button>
              {count > 0 && (
                <button 
                  onClick={() => onShowParticipants(dateStr)}
                  className={cn("absolute top-2 right-2 text-[8px] font-black z-10 px-1 rounded hover:bg-current/10 transition-colors", isWinner ? "text-black" : "text-neon-purple")}
                >
                  {count}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayPlanner({ dates, timeStart, timeEnd, heatmap, myAvailability, participantsCount, onToggle, onShowParticipants }: any) {
  const { t, locale } = useSettings();
  const [activeDate, setActiveDate] = React.useState(dates[0]);
  
  const slots = useMemo(() => {
    const s = [];
    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);
    
    let currentH = startH;
    let currentM = startM;
    
    while (currentH < endH || (currentH === endH && currentM <= endM)) {
      const time = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
      s.push(time);
      
      currentM += 30;
      if (currentM >= 60) {
        currentH += 1;
        currentM = 0;
      }
    }
    return s;
  }, [timeStart, timeEnd]);

  return (
    <div className="space-y-6">
      {dates.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((d: string) => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeDate === d ? "bg-neon-cyan text-black" : "bg-inherit/5 text-current opacity-50 border border-current/10"
              )}
            >
              {format(new Date(d), 'EEE, MMM d', { locale })}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between py-4 border-b border-current/10">
        <h4 className="flex items-center gap-2 font-mono text-xs text-current opacity-40 uppercase tracking-widest">
           <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
           {format(new Date(activeDate), 'EEEE, d MMMM', { locale })} {t('plan.consensusLabel')}
        </h4>
        <div className="flex gap-4 text-[10px] uppercase font-bold text-current opacity-40">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-inherit border border-current/10" /> {t('plan.empty')}</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-cyan/40" /> {t('plan.high')}</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-green" /> {t('plan.perfect')}</div>
        </div>
      </div>

      <div className="space-y-3 pt-6">
        {slots.map(slot => {
          const slotKey = `${activeDate}_${slot}`;
          const count = heatmap[slotKey] || 0;
          const isSelected = myAvailability.includes(slotKey);
          const intensity = participantsCount > 0 ? count / participantsCount : 0;
          const isWinner = intensity === 1 && participantsCount > 1;

          return (
            <div key={slot} className="w-full flex items-center gap-6 group">
              <div className="w-12 text-sm font-mono text-current opacity-40 group-hover:text-current group-hover:opacity-80 transition-colors">
                {slot}
              </div>
              <div className={cn(
                "flex-1 h-14 rounded-2xl relative overflow-hidden flex items-center px-6 transition-all",
                isSelected ? "border-2 border-neon-cyan/50 shadow-[inset_0_0_15px_rgba(0,242,255,0.1)]" : "border border-current/5",
                isWinner ? "bg-neon-green text-black" : "bg-inherit/5"
              )}>
                {!isWinner && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-neon-cyan/30 transition-all duration-500" 
                    style={{ width: `${intensity * 100}%` }} 
                  />
                )}
                
                <button 
                  onClick={() => onToggle(slotKey)}
                  className="absolute inset-0 z-0 h-full w-full"
                />

                <div className="relative flex-1 flex items-center justify-between z-10 pointer-events-none">
                   <div className="flex -space-x-2 pointer-events-auto">
                       {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                         <button 
                           key={i} 
                           onClick={() => onShowParticipants(slotKey)}
                           className={cn(
                             "w-6 h-6 rounded-full border-2 border-inherit flex items-center justify-center text-[8px] font-bold shadow-sm hover:scale-110 transition-transform",
                             isWinner ? "bg-black text-white" : "bg-current/20 text-current"
                           )}
                         >
                           {i === 4 && count > 5 ? `+${count-4}` : ''}
                         </button>
                       ))}
                   </div>
                   {isWinner && <div className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded">{t('plan.winner')}</div>}
                   <button 
                     onClick={() => onShowParticipants(slotKey)}
                     className={cn("font-black tracking-tight pointer-events-auto hover:underline", isWinner ? "text-black" : "text-current opacity-80")}
                   >
                      {count}/{participantsCount} <span className="text-[10px] opacity-40 uppercase">{t('plan.available')}</span>
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
