import React, { createContext, useContext, useEffect, useState } from 'react';
import { enUS, ptBR } from 'date-fns/locale';

type Theme = 'dark' | 'light';
type Language = 'pt' | 'en';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  locale: any;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'home.title1': 'Now or',
    'home.title2': 'Never',
    'home.subtitle': 'Fast tracking, zero friction. High-speed scheduling for the moments that matter. Pick a perspective and sync up in seconds.',
    'home.joinLabel': 'Join a Plan',
    'home.dayMode.title': 'Day Mode',
    'home.dayMode.desc': 'Precision planning. Select up to 7 specific dates to find the perfect block.',
    'home.monthMode.title': 'Month Mode',
    'home.monthMode.desc': 'Long-term alignment. Pick multiple months to discover that perfect free window.',
    'home.howItWorks': 'How it works',
    'home.step1.title': 'Pick a Mode',
    'home.step1.desc': 'Choose between immediate action or long-term alignment.',
    'home.step2.title': 'Invite Group',
    'home.step2.desc': 'Send your code to the group. Zero friction, no accounts.',
    'home.step3.title': 'Sync Up',
    'home.step3.desc': 'See the live heatmap grow. Find the consensus instantly.',
    'home.selectDays': 'Select Days',
    'home.limit7': 'Up to 7 days allowed',
    'home.startTime': 'Start Time',
    'home.endTime': 'End Time',
    'home.finalize': 'FINALIZE',
    'home.selectMonths': 'Select Months',
    'home.multiMonth': 'Multi-month alignment',
    'home.sync': 'SYNC',
    'home.reset': 'Reset',
    'home.clear': 'Clear',
    'plan.whosIn': "Who's In",
    'plan.active': 'Active Now',
    'plan.mainScreen': 'Main Screen',
    'plan.consensus': 'Consensus',
    'plan.available': 'Available',
    'plan.empty': 'Empty',
    'plan.high': 'High',
    'plan.perfect': 'Perfect Match',
    'plan.popular': 'Popular',
    'plan.match': 'Match',
    'plan.winner': 'Winner',
    'plan.copyLink': 'Copy Link',
    'plan.expiredTitle': 'Plan Expired',
    'plan.notFoundTitle': 'Plan Not Found',
    'plan.expiredDesc': 'This plan has reached its expiration date and is no longer accessible.',
    'plan.notFoundDesc': 'This access code is invalid or the plan has been deleted.',
    'plan.createBtn': 'Create New Plan',
    'identity.title': 'Identify Yourself',
    'identity.rejoin': 'Rejoin as:',
    'identity.orCreate': 'or create new',
    'identity.newName': 'New Display Name',
    'identity.newBtn': "I'M NEW",
    'home.openDatePicker': 'Open Date Picker',
    'home.selectMonthsBtn': 'Select Months',
    'home.daysCount': 'DAYS',
    'home.monthsCount': 'MONTHS',
    'home.weekDays.short': 'S,M,T,W,T,F,S',
    'plan.backToMain': 'Back to Main',
    'plan.codeLabel': 'Code',
    'plan.optionLabel': 'OPTION',
    'plan.tapToSee': 'Tap slots to see who else is free',
    'plan.monthlyPlanner': 'Monthly Planner',
    'plan.consensusLabel': 'Consensus',
    'plan.weekDays.short': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
    'plan.you': 'YOU (LOCAL)',
    'plan.participant': 'PARTICIPANT',
    'plan.schedule': 'Schedule',
    'plan.availabilityFor': 'Availability for',
    'plan.gotIt': 'Got it',
  },
  pt: {
    'home.title1': 'Agora ou',
    'home.title2': 'Nunca',
    'home.subtitle': 'Agendamento rápido, zero fricção. Sincronização de alta velocidade para os momentos que importam. Escolha uma perspetiva e alinhe em segundos.',
    'home.joinLabel': 'Entrar num Plano',
    'home.dayMode.title': 'Modo Dia',
    'home.dayMode.desc': 'Planeamento de precisão. Escolha até 7 datas específicas para encontrar o bloco perfeito.',
    'home.monthMode.title': 'Modo Mês',
    'home.monthMode.desc': 'Alinhamento a longo prazo. Escolha vários meses para descobrir a janela livre ideal.',
    'home.howItWorks': 'Como funciona',
    'home.step1.title': 'Escolha um Modo',
    'home.step1.desc': 'Escolha entre ação imediata ou alinhamento a longo prazo.',
    'home.step2.title': 'Convide o Grupo',
    'home.step2.desc': 'Envie o seu código ao grupo. Sem contas, sem complicações.',
    'home.step3.title': 'Sincronize',
    'home.step3.desc': 'Veja o mapa de calor crescer. Encontre o consenso instantaneamente.',
    'home.selectDays': 'Selecionar Dias',
    'home.limit7': 'Máximo de 7 dias permitido',
    'home.startTime': 'Hora Início',
    'home.endTime': 'Hora Fim',
    'home.finalize': 'FINALIZAR',
    'home.selectMonths': 'Selecionar Meses',
    'home.multiMonth': 'Alinhamento multi-mês',
    'home.sync': 'SINCRO',
    'home.reset': 'Reset',
    'home.clear': 'Limpar',
    'plan.whosIn': 'Quem Está',
    'plan.active': 'Ativos Agora',
    'plan.mainScreen': 'Ecrã Principal',
    'plan.consensus': 'Consenso',
    'plan.available': 'Disponíveis',
    'plan.empty': 'Vazio',
    'plan.high': 'Alto',
    'plan.perfect': 'Perfeito',
    'plan.popular': 'Popular',
    'plan.match': 'Combina',
    'plan.winner': 'Vencedor',
    'plan.copyLink': 'Copiar Link',
    'plan.expiredTitle': 'Plano Expirado',
    'plan.notFoundTitle': 'Não Encontrado',
    'plan.expiredDesc': 'Este plano atingiu a data de validade e já não está acessível.',
    'plan.notFoundDesc': 'Este código é inválido ou o plano foi eliminado.',
    'plan.createBtn': 'Criar Novo Plano',
    'identity.title': 'Identifique-se',
    'identity.rejoin': 'Reentrar como:',
    'identity.orCreate': 'ou criar novo',
    'identity.newName': 'Novo Nome de Exibição',
    'identity.newBtn': 'SOU NOVO',
    'home.openDatePicker': 'Abrir Seletor de Datas',
    'home.selectMonthsBtn': 'Selecionar Meses',
    'home.daysCount': 'DIAS',
    'home.monthsCount': 'MESES',
    'home.weekDays.short': 'D,S,T,Q,Q,S,S',
    'plan.backToMain': 'Voltar ao Início',
    'plan.codeLabel': 'Código',
    'plan.optionLabel': 'OPÇÃO',
    'plan.tapToSee': 'Toque nos horários para ver quem está livre',
    'plan.monthlyPlanner': 'Planeador Mensal',
    'plan.consensusLabel': 'Consenso',
    'plan.weekDays.short': 'Dom,Seg,Ter,Qua,Qui,Sex,Sáb',
    'plan.you': 'TU (LOCAL)',
    'plan.participant': 'PARTICIPANTE',
    'plan.schedule': 'Agenda',
    'plan.availabilityFor': 'Disponibilidade para',
    'plan.gotIt': 'Entendido',
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const locale = language === 'pt' ? ptBR : enUS;

  return (
    <SettingsContext.Provider value={{ theme, language, toggleTheme, setLanguage, t, locale }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
