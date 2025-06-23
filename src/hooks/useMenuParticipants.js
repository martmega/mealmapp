import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

export function useMenuParticipants(menuId) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!menuId) {
        setParticipants([]);
        return;
      }

      const { data: rows, error } = await supabase
        .from('menu_participants')
        .select('user_id')
        .eq('menu_id', menuId);

      if (error) {
        console.error('Error fetching menu participants:', error);
        setParticipants([]);
        return;
      }

      const ids = (rows || []).map((r) => r.user_id);
      if (ids.length === 0) {
        setParticipants([]);
        return;
      }

      const { data: users } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url')
        .in('id', ids);

      setParticipants(users || []);
    };

    fetchParticipants();
  }, [menuId]);

  return participants;
}
