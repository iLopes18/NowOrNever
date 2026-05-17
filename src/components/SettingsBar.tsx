import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { useSettings } from './SettingsProvider';
import { cn } from '../lib/utils';

export default function SettingsBar() {
  const { theme, toggleTheme, language, setLanguage } = useSettings();

  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 p-1 bg-current/10 border border-current/10 rounded-full backdrop-blur-md">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-current/10 text-current opacity-60 hover:opacity-100 hover:text-neon-cyan transition-all"
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      
      <div className="w-[1px] h-4 bg-current/10 mx-1" />

      <div className="flex gap-1">
        <button
          onClick={() => setLanguage('pt')}
          className={cn(
            "px-2 py-1 rounded-full text-[10px] font-black tracking-widest transition-all",
            language === 'pt' ? "bg-neon-cyan text-black" : "text-current opacity-40 hover:opacity-100 hover:text-current"
          )}
        >
          PT
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            "px-2 py-1 rounded-full text-[10px] font-black tracking-widest transition-all",
            language === 'en' ? "bg-neon-cyan text-black" : "text-current opacity-40 hover:opacity-100 hover:text-current"
          )}
        >
          EN
        </button>
      </div>
    </div>
  );
}
