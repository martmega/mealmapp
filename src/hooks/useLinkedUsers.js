import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';

export function useLinkedUsers(userProfile, preferences, setPreferences) {
  const { toast } = useToast();
  const [newLinkedUserEmail, setNewLinkedUserEmail] = useState('');
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  const fetchLinkedUserRecipes = useCallback(
    async (userId, userName) => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*, author:public_users(id, username, avatar_url, user_tag)')
          .eq('user_id', userId)
          .or('visibility.eq.public,visibility.eq.friends_only');

        if (error) throw error;
        return Array.isArray(data)
          ? data.map((r) => ({
              ...r,
              user: r.author,
              author: r.author?.username || r.author?.user_tag || 'Ami',
              sourceUserId: userId,
            }))
          : [];
      } catch (error) {
        console.error(`Error fetching recipes for user ${userName} (${userId}):`, error);
        toast({
          title: 'Erreur',
          description: `Impossible de charger les recettes de ${userName}.`,
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  const handleToggleCommonMenu = async () => {
    const newEnabledState = !preferences.commonMenuSettings.enabled;
    let newLinkedUsers = preferences.commonMenuSettings.linkedUsers || [];
    let newLinkedUserRecipes = [];

    if (newEnabledState && newLinkedUsers.length === 0 && userProfile?.id) {
      newLinkedUsers = [
        {
          id: userProfile.id,
          name: userProfile.username || 'Moi',
          ratio: 100,
          isOwner: true,
        },
      ];
    }

    if (newEnabledState && newLinkedUsers.length > 0) {
      for (const user of newLinkedUsers) {
        if (user?.id && user.id !== userProfile?.id) {
          const fetchedRecipes = await fetchLinkedUserRecipes(user.id, user.name);
          newLinkedUserRecipes.push(...fetchedRecipes);
        }
      }
    }

    setPreferences((prev) => ({
      ...prev,
      commonMenuSettings: {
        ...prev.commonMenuSettings,
        enabled: newEnabledState,
        linkedUsers: newLinkedUsers,
        linkedUserRecipes: newLinkedUserRecipes,
      },
    }));
  };

  const handleLinkedUserRatioChange = (index, newRatioStr) => {
    const newRatio = parseInt(newRatioStr, 10);
    if (isNaN(newRatio)) return;

    const updatedUsers = [...(preferences.commonMenuSettings.linkedUsers || [])];
    if (updatedUsers[index]) {
      updatedUsers[index].ratio = Math.max(0, Math.min(100, newRatio));
    }

    setPreferences((prev) => ({
      ...prev,
      commonMenuSettings: {
        ...prev.commonMenuSettings,
        linkedUsers: updatedUsers,
      },
    }));
  };

  const handleAddLinkedUser = async () => {
    if (!newLinkedUserEmail.trim() || !userProfile?.id) {
      toast({
        title: 'Email requis',
        description: "Veuillez entrer l'email de l'utilisateur à lier.",
        variant: 'destructive',
      });
      return;
    }
    if (newLinkedUserEmail.trim().toLowerCase() === userProfile.email?.toLowerCase()) {
      toast({
        title: 'Erreur',
        description: 'Vous ne pouvez pas vous lier à vous-même.',
        variant: 'destructive',
      });
      return;
    }
    setIsLinkingUser(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('public_users')
        .select('id, username, user_tag')
        .eq('email', newLinkedUserEmail.trim().toLowerCase())
        .single();

      if (usersError) throw usersError;
      if (!usersData) throw new Error('Utilisateur introuvable.');

      const peerUser = usersData;

      const currentLinkedUsers = preferences.commonMenuSettings.linkedUsers || [];
      if (currentLinkedUsers.some((u) => u.id === peerUser.id)) {
        toast({
          title: 'Déjà lié',
          description: 'Cet utilisateur est déjà dans votre liste.',
          variant: 'default',
        });
        setIsLinkingUser(false);
        setNewLinkedUserEmail('');
        return;
      }

      const { error: linkError } = await supabase
        .from('user_relationships')
        .upsert(
          {
            requester_id: userProfile.id,
            addressee_id: peerUser.id,
            status: 'accepted',
          },
          { onConflict: 'requester_id, addressee_id' }
        );

      if (linkError && linkError.code !== '23505') {
        console.warn('Error creating/upserting relationship for menu link:', linkError);
      }

      const peerUsername = peerUser.username || peerUser.user_tag || peerUser.id.substring(0, 8);
      const newLinkedUserEntry = {
        id: peerUser.id,
        name: peerUsername,
        ratio: 0,
        isOwner: false,
      };

      const fetchedRecipes = await fetchLinkedUserRecipes(peerUser.id, peerUsername);
      const currentLinkedUserRecipes = preferences.commonMenuSettings.linkedUserRecipes || [];

      setPreferences((prev) => ({
        ...prev,
        commonMenuSettings: {
          ...prev.commonMenuSettings,
          linkedUsers: [...currentLinkedUsers, newLinkedUserEntry],
          linkedUserRecipes: [...currentLinkedUserRecipes, ...fetchedRecipes],
        },
      }));
      toast({
        title: 'Utilisateur lié',
        description: `${peerUsername} a été ajouté à votre menu commun.`,
      });
      setNewLinkedUserEmail('');
    } catch (error) {
      console.error('Error linking user:', error);
      toast({
        title: 'Erreur de liaison',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLinkingUser(false);
    }
  };

  const handleRemoveLinkedUser = async (userIdToRemove) => {
    if (!userProfile?.id || !userIdToRemove) return;
    try {
      setPreferences((prev) => ({
        ...prev,
        commonMenuSettings: {
          ...prev.commonMenuSettings,
          linkedUsers: (prev.commonMenuSettings.linkedUsers || []).filter((u) => u.id !== userIdToRemove),
          linkedUserRecipes: (prev.commonMenuSettings.linkedUserRecipes || []).filter(
            (r) => r.sourceUserId !== userIdToRemove
          ),
        },
      }));
      toast({
        title: 'Lien supprimé',
        description: "L'utilisateur a été retiré du menu commun.",
      });
    } catch (error) {
      console.error('Error unlinking user:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le lien: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchInitialLinks = async () => {
      if (!userProfile?.id || !preferences.commonMenuSettings.enabled) return;

      try {
        const { data: friendsData, error: friendsError } = await supabase
          .from('user_relationships')
          .select(
            'requester_id, addressee_id, requester:public_users!user_relationships_requester_id_fkey(id, username, user_tag), addressee:public_users!user_relationships_addressee_id_fkey(id, username, user_tag)'
          )
          .eq('status', 'accepted')
          .or(`requester_id.eq.${userProfile.id},addressee_id.eq.${userProfile.id}`);

        if (friendsError) throw friendsError;

        const linkedUserDetails = friendsData
          .map((rel) => {
            const friendProfile =
              rel.requester_id === userProfile.id ? rel.addressee : rel.requester;
            if (!friendProfile) return null;
            return {
              id: friendProfile.id,
              name: friendProfile.username || friendProfile.user_tag || friendProfile.id.substring(0, 8),
              ratio: 0,
              isOwner: false,
            };
          })
          .filter(Boolean);

        const validLinkedUsers = linkedUserDetails.filter((u) => u && u.id);
        const ownerUserEntry = {
          id: userProfile.id,
          name: userProfile.username || 'Moi',
          ratio: validLinkedUsers.length > 0 ? 50 : 100,
          isOwner: true,
        };

        if (validLinkedUsers.length > 0) {
          const remainingRatio = 100 - ownerUserEntry.ratio;
          const ratioPerUser = Math.floor(remainingRatio / validLinkedUsers.length);
          validLinkedUsers.forEach((u) => {
            if (u) u.ratio = ratioPerUser;
          });
          const remainder = remainingRatio % validLinkedUsers.length;
          if (remainder > 0 && validLinkedUsers[0]) validLinkedUsers[0].ratio += remainder;
        }

        const allLinkedUsersSetup = [ownerUserEntry, ...validLinkedUsers];
        let allLinkedUserRecipes = [];

        for (const user of allLinkedUsersSetup) {
          if (user?.id && user.id !== userProfile.id) {
            const fetchedRecipes = await fetchLinkedUserRecipes(user.id, user.name);
            allLinkedUserRecipes.push(...fetchedRecipes);
          }
        }

        setPreferences((prev) => ({
          ...prev,
          commonMenuSettings: {
            ...prev.commonMenuSettings,
            linkedUsers: allLinkedUsersSetup.filter((u) => u && u.id),
            linkedUserRecipes: allLinkedUserRecipes.filter((r) => r && r.id),
          },
        }));
      } catch (error) {
        console.error('Error fetching initial user links:', error);
      }
    };

    if (preferences.commonMenuSettings.enabled) {
      fetchInitialLinks();
    }
  }, [userProfile?.id, userProfile?.username, preferences.commonMenuSettings.enabled, fetchLinkedUserRecipes]);

  return {
    newLinkedUserEmail,
    setNewLinkedUserEmail,
    isLinkingUser,
    handleAddLinkedUser,
    handleToggleCommonMenu,
    handleLinkedUserRatioChange,
    handleRemoveLinkedUser,
  };
}
