import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { acceptFriendRequest } from '@/lib/friends';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  UserX,
  UserCheck,
  Users,
  MailQuestion,
  MessageSquare,
  UserCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog.jsx';

export default function FriendsTab({ session, userProfile, onRequestsChange }) {
  const { toast } = useToast();
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingFriends(true);
    try {
      const { data: relationships, error } = await supabase
        .from('user_relationships')
        .select('*')
        .or(
          `requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`
        );

      if (error) throw error;

      const uniqueMap = {};
      for (const rel of relationships) {
        const key = [rel.requester_id, rel.addressee_id].sort().join('-');
        if (!uniqueMap[key] || uniqueMap[key].status !== 'accepted') {
          uniqueMap[key] = rel;
        }
      }
      const uniqueRelationships = Object.values(uniqueMap);

      const userIds = [
        ...new Set(
          uniqueRelationships.flatMap((rel) => [
            rel.requester_id,
            rel.addressee_id,
          ])
        ),
      ];
      const { data: users } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url, subscription_tier')
        .in('id', userIds);
      const usersById = Object.fromEntries((users || []).map((u) => [u.id, u]));

      const data = uniqueRelationships.map((rel) => ({
        ...rel,
        requester: usersById[rel.requester_id] ?? { id: rel.requester_id },
        addressee: usersById[rel.addressee_id] ?? { id: rel.addressee_id },
      }));

      const pendingReceived = data.filter(
        (r) => r.status === 'pending' && r.addressee.id === session.user.id
      );
      const pendingSent = data.filter(
        (r) => r.status === 'pending' && r.requester.id === session.user.id
      );
      const acceptedFriends = data
        .filter((r) => r.status === 'accepted')
        .map((r) => {
          const friendProfile =
            r.requester.id === session.user.id ? r.addressee : r.requester;
          return {
            ...friendProfile,
            username:
              friendProfile.username || friendProfile.id.substring(0, 8),
            relationship_id: r.id,
          };
        });

      setReceivedRequests(
        pendingReceived.map((r) => ({
          ...r.requester,
          username: r.requester.username || r.requester.id.substring(0, 8),
          relationship_id: r.id,
        }))
      );
      setSentRequests(
        pendingSent.map((r) => ({
          ...r.addressee,
          username: r.addressee.username || r.addressee.id.substring(0, 8),
          relationship_id: r.id,
        }))
      );
      setFriends(acceptedFriends);
    } catch (error) {
      console.error('Error fetching friends/requests:', error);
      toast({
        title: 'Erreur Amis',
        description: "Impossible de charger les informations d'amis.",
        variant: 'destructive',
      });
    } finally {
      setLoadingFriends(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);

  const handleFriendRequest = async (relationshipId, action) => {
    setActionLoading(true);
    try {
      if (action === 'accept') {
        await acceptFriendRequest(relationshipId, session.user.id);
        toast({
          title: 'Demande acceptée',
          description: 'Vous êtes maintenant amis !',
        });
      } else if (action === 'decline') {
        const { error } = await supabase
          .from('user_relationships')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', relationshipId)
          .eq('addressee_id', session.user.id);
        if (error) throw error;
        toast({ title: 'Demande refusée' });
      }
      fetchFriendsAndRequests();
      onRequestsChange && onRequestsChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de traiter la demande d'ami: " + error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async (relationshipId) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('id', relationshipId)
        .eq('status', 'accepted');
      if (error) throw error;
      toast({ title: 'Ami supprimé' });
      fetchFriendsAndRequests();
      onRequestsChange && onRequestsChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'ami: " + error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingFriends) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-pastel-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {receivedRequests.length > 0 && (
        <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
          <h3 className="text-xl font-semibold text-pastel-text/80 mb-4 flex items-center">
            <MailQuestion className="w-5 h-5 mr-2 text-pastel-accent" />
            Demandes reçues ({receivedRequests.length})
          </h3>
          <ul className="space-y-3">
            {receivedRequests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-md shadow-sm gap-3"
              >
                <Link
                  to={`/app/profile/${req.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {req.avatar_url ? (
                    <img
                      src={req.avatar_url}
                      alt={req.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-pastel-muted-foreground" />
                  )}
                  <span className="font-medium">{req.username}</span>
                </Link>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={() =>
                      handleFriendRequest(req.relationship_id, 'accept')
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading && (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    )}{' '}
                    <UserCheck className="w-4 h-4 mr-1" /> Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() =>
                      handleFriendRequest(req.relationship_id, 'decline')
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading && (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    )}{' '}
                    <UserX className="w-4 h-4 mr-1" /> Refuser
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
          <h3 className="text-xl font-semibold text-pastel-text/80 mb-4 flex items-center">
            <MailQuestion className="w-5 h-5 mr-2 text-pastel-accent" />
            Demandes envoyées ({sentRequests.length})
          </h3>
          <ul className="space-y-3">
            {sentRequests.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-md shadow-sm gap-3"
              >
                <Link
                  to={`/app/profile/${req.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {req.avatar_url ? (
                    <img
                      src={req.avatar_url}
                      alt={req.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-pastel-muted-foreground" />
                  )}
                  <span className="font-medium">{req.username}</span>
                </Link>
                <Button size="sm" variant="outline" disabled>
                  <MessageSquare className="w-4 h-4 mr-1" /> Demande en attente
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {friends.length > 0 && (
        <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
          <h3 className="text-xl font-semibold text-pastel-text/80 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-pastel-tertiary" />
            Mes Amis ({friends.length})
          </h3>
          <ul className="space-y-3">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-md shadow-sm gap-3"
              >
                <Link
                  to={`/app/profile/${friend.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-pastel-muted-foreground" />
                  )}
                  <span className="font-medium">{friend.username}</span>
                </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-100 hover:text-red-700"
                      disabled={actionLoading}
                    >
                      {actionLoading && (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      )}{' '}
                      <UserX className="w-4 h-4 mr-1" /> Supprimer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Supprimer {friend.username} de vos amis ?
                      </DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir supprimer {friend.username} de
                        votre liste d'amis ? Cette action est irréversible.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Annuler</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleRemoveFriend(friend.relationship_id)
                        }
                        disabled={actionLoading}
                      >
                        {actionLoading && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}{' '}
                        Confirmer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            ))}
          </ul>
        </div>
      )}

      {receivedRequests.length === 0 &&
        sentRequests.length === 0 &&
        friends.length === 0 && (
          <div className="text-center py-10 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-pastel-border" />
            <p className="text-xl text-pastel-muted-foreground mb-2">
              Votre cercle d'amis est vide pour le moment.
            </p>
            <p className="text-pastel-text/70">
              Utilisez l'onglet "Découvrir" pour rechercher des utilisateurs et
              envoyer des demandes d'amis !
            </p>
          </div>
        )}
    </div>
  );
}
