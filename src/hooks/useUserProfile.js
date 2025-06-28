import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';
import { DEFAULT_MENU_PREFS } from '@/lib/defaultPreferences.js';

const supabase = getSupabase();

export function useUserProfile(session) {
  const [userProfile, setUserProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const DEFAULT_AVATAR_URL = '/img/placeholder-avatar.png';

  const fetchUserProfile = useCallback(async () => {
    const defaultProfileBase = {
      subscription_tier: 'non-authenticated',
      username: 'Visiteur',
      user_tag: '',
      avatar_url: DEFAULT_AVATAR_URL,
      bio: '',
      access_keys: [],
      preferences: { ...DEFAULT_MENU_PREFS },
    };

    if (session === null || !session?.user?.id) {
      setUserProfile({ id: null, ...defaultProfileBase });
      setLoading(false);
      return { id: null, ...defaultProfileBase };
    }
    if (session === undefined) {
      setLoading(true);
      return undefined;
    }

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url, bio, subscription_tier')
        .eq('id', session.user.id)
        .single();

      console.log('Subscription tier:', profile?.subscription_tier);

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn(
          'Warning fetching public_users profile:',
          profileError.message,
          profileError.details,
          profileError.hint
        );
      }

      const appMetadata = session.user.app_metadata || {};
      const userMetadata =
        session.user.raw_user_meta_data || session.user.user_metadata || {};

      let finalProfileData = {
        id: session.user.id,
        username: profile?.username || userMetadata.username || 'Utilisateur',
        user_tag:
          profile?.user_tag ||
          userMetadata.user_tag ||
          'user_' + session.user.id.substring(0, 8),
        avatar_url:
          profile?.avatar_url || userMetadata.avatar_url || DEFAULT_AVATAR_URL,
        bio: profile?.bio || userMetadata.bio || '',
        subscription_tier:
          profile?.subscription_tier ||
          userMetadata.subscription_tier ||
          appMetadata.subscription_tier ||
          'standard',
        access_keys: Array.isArray(userMetadata.access_keys)
          ? userMetadata.access_keys
          : [],
      };

      if (!finalProfileData.user_tag) {
        console.warn('user_tag is NULL for user', session.user.id);
      }

      const defaultPreferences = { ...DEFAULT_MENU_PREFS };
      finalProfileData.preferences = {
        ...defaultPreferences,
        ...(userMetadata.preferences || {}),
      };
      delete finalProfileData.preferences.tolerance;
      finalProfileData.preferences.commonMenuSettings = {
        ...defaultPreferences.commonMenuSettings,
        ...(userMetadata.preferences?.commonMenuSettings || {}),
        linkedUsers: Array.isArray(
          userMetadata.preferences?.commonMenuSettings?.linkedUsers
        )
          ? userMetadata.preferences.commonMenuSettings.linkedUsers
          : [],
      };

      setUserProfile(finalProfileData);
      return finalProfileData;
    } catch (error) {
      console.error('Error processing user profile:', error);
      toast({
        title: 'Erreur Profil',
        description: 'Impossible de traiter les données du profil.',
        variant: 'destructive',
      });
      const fallbackProfile = {
        id: session.user.id,
        ...defaultProfileBase,
        subscription_tier: 'standard',
        username: 'Utilisateur',
        user_tag: 'user_' + session.user.id.substring(0, 8),
        avatar_url: DEFAULT_AVATAR_URL,
        access_keys: [],
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return { userProfile, loading, refreshProfile: fetchUserProfile };
}
