import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

export function useFriendsList(session) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!session?.user?.id) return;
      const { data: relationships, error } = await supabase
        .from('user_relationships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);
      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }
      const ids = [
        ...new Set(
          relationships.map((r) =>
            r.requester_id === session.user.id ? r.addressee_id : r.requester_id
          )
        ),
      ];
      if (ids.length === 0) {
        setFriends([]);
        return;
      }
      const { data: users } = await supabase
        .from('public_user_view')
        .select('id, username')
        .in('id', ids);
      setFriends(users || []);
    };
    fetchFriends();
  }, [session]);

  return friends;
}
