import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, User, LogIn, Check, Users } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Participant } from '../types';
import { useSettings } from './SettingsProvider';

interface Props {
  participants: Participant[];
  onJoin: (name: string) => void;
  onPickExisting: (id: string) => void;
}

export default function IdentityModal({ participants, onJoin, onPickExisting }: Props) {
  const { user, signIn } = useAuth();
  const { t } = useSettings();
  const [name, setName] = useState('');

  // Disable body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-page/95 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full max-h-[80vh] overflow-y-auto p-8 rounded-3xl glass shadow-[0_0_50px_rgba(0,0,0,0.2)] border-current/10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-4">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-display font-black tracking-tight mb-2">{t('identity.title')}</h2>
          <p className="text-current opacity-40 text-sm">{t('home.subtitle')}</p>
        </div>

        {participants.length > 0 && (
          <div className="mb-10">
            <label className="text-[10px] font-mono uppercase tracking-widest text-current opacity-30 block mb-3 ml-1 flex items-center gap-2">
              <Users size={12} /> {t('identity.rejoin')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => onPickExisting(p.id)}
                  className="flex items-center justify-between p-4 rounded-xl bg-current/5 border border-current/5 hover:border-current/20 hover:bg-current/10 transition-all text-left group"
                >
                  <span className="font-bold">{p.displayName}</span>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-current/10"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-current opacity-20 uppercase tracking-widest">{t('identity.orCreate')}</span>
              <div className="flex-grow border-t border-current/10"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-current opacity-50 block ml-1">
              {t('identity.newName')}
            </label>
            <input 
              autoFocus={participants.length === 0}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-current/5 border border-current/10 rounded-2xl px-4 py-4 focus:border-neon-cyan outline-none transition-colors font-semibold placeholder:text-current placeholder:opacity-20"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-neon-cyan text-black font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl active:scale-95 transition-all disabled:opacity-30"
          >
            {t('identity.newBtn')} <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
