import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getSupabase } from '@/lib/supabase';
import { acceptFriendRequest } from '@/lib/friends';
import {
  Loader2,
  UserPlus,
  UserX,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import useSessionRequired from '@/hooks/useSessionRequired';

const supabase = getSupabase();

export default function FriendActionButton({
  session,
  profileUserId,
  initialStatus,
  relationshipId: initialRelId,
  onStatusChange,
  onRequestHandled,
}) {
  const [status, setStatus] = useState(initialStatus);
  const [relId, setRelId] = useState(initialRelId);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);
  const [currentSession, setCurrentSession] = useState(session);
  const { toast } = useToast();
  useSessionRequired();

  useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  useEffect(() => {
    setStatus(initialStatus);
    setRelId(initialRelId);
  }, [initialStatus, initialRelId]);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session: fresh },
      } = await supabase.auth.getSession();
      setCurrentSession(fresh);
    };
    fetchSession();
  }, []);

  const updateState = (newStatus, newId) => {
    setStatus(newStatus);
    setRelId(newId);
    onStatusChange && onStatusChange(newStatus, newId);
  };

  const handleAction = async () => {
    if (!currentSession?.user?.id) return;
    setLoading(true);
    try {
      if (status === 'not_friends') {
        const { data: existing } = await supabase
          .from('user_relationships')
          .select('id, status')
          .or(
            `and(requester_id.eq.${currentSession.user.id},addressee_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},addressee_id.eq.${currentSession.user.id})`
          )
          .in('status', ['pending', 'accepted']);

        if (existing?.length > 0) {
          // Avoid creating duplicate relationship
          return;
        }

        const { data, error } = await supabase
          .from('user_relationships')
          .insert({
            requester_id: currentSession.user.id,
            addressee_id: profileUserId,
            status: 'pending',
          })
          .select()
          .single();
        if (error) throw error;
        updateState('pending_them', data.id);
        toast({ title: 'Demande envoyée' });
        onRequestHandled && onRequestHandled();
      } else if (status === 'pending_me') {
        await acceptFriendRequest(relId, currentSession.user.id);
        updateState('friends', relId);
        toast({ title: 'Demande acceptée' });
        onRequestHandled && onRequestHandled();
      } else if (status === 'pending_them' || status === 'friends') {
        const { error } = await supabase
          .from('user_relationships')
          .delete()
          .eq('id', relId);
        if (error) throw error;
        updateState('not_friends', null);
        toast({
          title: status === 'friends' ? 'Ami supprimé' : 'Demande annulée',
        });
        onRequestHandled && onRequestHandled();
      }
    } catch (err) {
      console.error('Friend action error:', err);
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession || currentSession.user.id === profileUserId) return null;

  let content;
  if (loading) {
    content = (
      <Button disabled className="mt-4 w-40">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
      </Button>
    );
  } else if (status === 'pending_them') {
    content = (
      <Button variant="outline" className="mt-4 w-40" disabled>
        <MessageCircle className="mr-2 h-4 w-4" /> Demande en attente
      </Button>
    );
  } else if (status === 'pending_me') {
    content = (
      <Button onClick={handleAction} variant="default" className="mt-4 w-40">
        <UserCheck className="mr-2 h-4 w-4" /> Accepter la demande
      </Button>
    );
  } else {
    const isFriend = status === 'friends';
    content = (
      <button
        onClick={handleAction}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`mt-4 flex items-center gap-2 px-4 py-1.5 rounded-md border transition-all ${isFriend ? 'bg-green-600 text-white hover:bg-red-600' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
      >
        {isFriend
          ? hover
            ? '❌ Retirer l\u2019ami'
            : '✔️ Vous êtes amis'
          : '➕ Demander en ami'}
      </button>
    );
  }

  return content;
}
