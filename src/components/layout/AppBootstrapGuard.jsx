import React from 'react';
import { useSession } from '@/hooks/useSession.js';
import useHydrated from '@/hooks/useHydrated.js';
import FullScreenLoader from './FullScreenLoader.jsx';

export default function AppBootstrapGuard({ children }) {
  const { isLoading } = useSession();
  const hydrated = useHydrated();

  if (isLoading || !hydrated) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
