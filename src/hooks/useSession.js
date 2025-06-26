import { useState, useEffect, useCallback } from 'react';
import { getSupabase, initializeSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';

const supabase = getSupabase();

export function useSession() {
  const [session, setSession] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      initializeSupabase(currentSession);
      setSession(currentSession);
    } catch (error) {
      initializeSupabase(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté.',
      });
      initializeSupabase(null);
      setSession(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setIsLoading(true);
      initializeSupabase(newSession);
      setSession(newSession);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [refreshSession]);

  return { session, isLoading, refreshSession, handleSignOut };
}
