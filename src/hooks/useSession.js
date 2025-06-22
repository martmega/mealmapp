import { useState, useEffect, useCallback } from 'react';
import { supabase, initializeSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';

export function useSession() {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshSession = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setLoading(true);
      initializeSupabase(newSession);
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [refreshSession]);

  return { session, loading, refreshSession, handleSignOut };
}
