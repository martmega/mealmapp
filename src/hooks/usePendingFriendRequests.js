import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePendingFriendRequests(session) {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!session?.user?.id) {
      setPendingCount(0);
      return;
    }
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('user_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('addressee_id', session.user.id)
        .eq('status', 'pending');
      if (error) throw error;
      setPendingCount(count || 0);
    } catch (err) {
      console.error('Error fetching pending friend requests:', err);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return { pendingCount, refreshPendingFriendRequests: fetchPending, loading };
}
