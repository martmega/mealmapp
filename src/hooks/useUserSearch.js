import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserSearch(session) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term) => {
    const trimmed = term.trim();
    const sanitized = trimmed.replace(/^@/, '');
    if (!sanitized) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from('public_users')
        .select('id, username, avatar_url, user_tag')
        .or(`username.ilike.*${sanitized}*,user_tag.ilike.*${sanitized}*`)
        .limit(10);
      if (session?.user?.id) {
        query = query.neq('id', session.user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setResults(
        data.map((u) => ({
          ...u,
          username: u.username || u.id.substring(0, 8),
        }))
      );
    } catch (err) {
      console.error('User search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { results, search, loading, clear: () => setResults([]) };
}
