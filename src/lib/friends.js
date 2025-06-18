import { supabase } from './supabase';

export async function acceptFriendRequest(relationshipId, userId) {
  const { error } = await supabase
    .from('user_relationships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', relationshipId)
    .eq('addressee_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return true;
}
