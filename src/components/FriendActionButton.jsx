import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, UserX, UserCheck, MessageCircle } from 'lucide-react';

export default function FriendActionButton({ session, profileUserId, initialStatus, relationshipId: initialRelId, onStatusChange }) {
  const [status, setStatus] = useState(initialStatus);
  const [relId, setRelId] = useState(initialRelId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateState = (newStatus, newId) => {
    setStatus(newStatus);
    setRelId(newId);
    onStatusChange && onStatusChange(newStatus, newId);
  };

  const handleAction = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      if (status === 'not_friends') {
        const { data, error } = await supabase
          .from('user_relationships')
          .insert({ requester_id: session.user.id, addressee_id: profileUserId, status: 'pending' })
          .select()
          .single();
        if (error) throw error;
        updateState('pending_them', data.id);
        toast({ title: 'Demande envoyée' });
      } else if (status === 'pending_me') {
        const { error } = await supabase
          .from('user_relationships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', relId);
        if (error) throw error;
        updateState('friends', relId);
        toast({ title: 'Demande acceptée' });
      } else if (status === 'pending_them' || status === 'friends') {
        const { error } = await supabase.from('user_relationships').delete().eq('id', relId);
        if (error) throw error;
        updateState('not_friends', null);
        toast({ title: status === 'friends' ? 'Ami supprimé' : 'Demande annulée' });
      }
    } catch (err) {
      console.error('Friend action error:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.user.id === profileUserId) return null;

  let content;
  if (loading) {
    content = (
      <Button disabled className="mt-4 w-40">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
      </Button>
    );
  } else {
    switch (status) {
      case 'friends':
        content = (
          <Button onClick={handleAction} variant="secondary" className="mt-4 w-40">
            <UserX className="mr-2 h-4 w-4" /> Retirer l&apos;ami
          </Button>
        );
        break;
      case 'pending_them':
        content = (
          <Button onClick={handleAction} variant="outline" className="mt-4 w-40">
            <MessageCircle className="mr-2 h-4 w-4" /> Demande envoyée
          </Button>
        );
        break;
      case 'pending_me':
        content = (
          <Button onClick={handleAction} variant="default" className="mt-4 w-40">
            <UserCheck className="mr-2 h-4 w-4" /> Accepter la demande
          </Button>
        );
        break;
      default:
        content = (
          <Button onClick={handleAction} variant="default" className="mt-4 w-40">
            <UserPlus className="mr-2 h-4 w-4" /> Ajouter en ami
          </Button>
        );
    }
  }

  return content;
}
