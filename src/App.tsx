/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { SettingsProvider } from './components/SettingsProvider';
import Home from './components/Home';
import PlanView from './components/PlanView';
import { OperationType, FirestoreErrorInfo } from './types';
import { auth } from './lib/firebase';

const StatsContext = createContext({
  stats: 'Plan it now. Or never.',
  setStats: (s: string) => {},
});

export const useStats = () => useContext(StatsContext);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function PlanRoute() {
  const { code } = useParams();
  if (!code) return <Home />;
  return <PlanView accessCode={code.toUpperCase()} />;
}

export default function App() {
  const [stats, setStats] = useState('Plan it now. Or never.');

  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <StatsContext.Provider value={{ stats, setStats }}>
            <div className="min-h-screen font-sans">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/:code" element={<PlanRoute />} />
              </Routes>
              
              <footer className="fixed bottom-0 left-0 right-0 h-12 border-t border-current/10 bg-current/80 backdrop-blur-md flex items-center px-6 z-50 overflow-hidden opacity-80">
                <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono tracking-wider overflow-hidden">
                <div className="flex items-center gap-2 text-neon-cyan">
                   <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_#00f2ff]" />
                   LIVE SYNC ACTIVE
                </div>
                <span className="text-current opacity-20">|</span>
                <span className="text-current opacity-50 truncate">
                  {stats}
                </span>
              </div>
              <div className="ml-auto hidden sm:flex gap-6 text-[10px] uppercase font-black tracking-widest text-current opacity-20">
                <span className="hover:text-current opacity-40 cursor-pointer">Privacy</span>
                <span className="hover:text-current opacity-40 cursor-pointer">Terms</span>
              </div>
            </footer>
          </div>
        </StatsContext.Provider>
      </AuthProvider>
    </SettingsProvider>
  </Router>
  );
}


