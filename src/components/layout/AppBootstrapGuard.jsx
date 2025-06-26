import React from 'react';
import { useSession } from '@/hooks/useSession.js';
import useHydrated from '@/hooks/useHydrated.js';
import LoadingScreen from './LoadingScreen.jsx';

export default function AppBootstrapGuard({ children }) {
  const { loading } = useSession();
  const hydrated = useHydrated();

  if (loading || !hydrated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
