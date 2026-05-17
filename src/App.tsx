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
            </div>
          </StatsContext.Provider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
}


