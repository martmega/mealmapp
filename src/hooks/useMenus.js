import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const supabase = getSupabase();

export async function fetchMenusForUser(userId) {
  if (!userId) return [];

  const { data: ownerMenus, error: ownerError } = await supabase
    .from('weekly_menus')
    .select('id, user_id, name, updated_at, is_shared')
    .eq('user_id', userId)
    .order('created_at');

  if (ownerError && ownerError.code !== 'PGRST116') {
    throw ownerError;
  }

  const { data: participantRows, error: participantError } = await supabase
    .from('menu_participants')
    .select('menu_id')
    .eq('user_id', userId);

  if (participantError && participantError.code !== 'PGRST116') {
    throw participantError;
  }

  const participantIds = (participantRows || []).map((r) => r.menu_id);
  let participantMenus = [];
  if (participantIds.length > 0) {
    const { data, error } = await supabase
      .from('weekly_menus')
      .select('id, user_id, name, updated_at, is_shared')
      .in('id', participantIds);
    if (error) throw error;
    participantMenus = data || [];
  }

  const combined = [...(ownerMenus || []), ...participantMenus];
  const unique = [];
  const seen = new Set();
  for (const m of combined) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      unique.push(m);
    }
  }

  const userIds = [...new Set(unique.map((m) => m.user_id))];
  let usersMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('public_user_view')
      .select('id, username, avatar_url')
      .in('id', userIds);
    usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
  }

  return unique.map((m) => ({
    ...m,
    owner: usersMap[m.user_id] ?? null,
    shared_by:
      m.user_id !== userId ? usersMap[m.user_id]?.username || null : null,
  }));
}

export function useMenus(session) {
  const userId = session?.user?.id;
  const { toast } = useToast();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  const storageKey = `selectedMenuId-${userId || 'guest'}`;

  const fetchMenus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await fetchMenusForUser(userId);
      setMenus(list);
    } catch (err) {
      console.error('Erreur chargement menus:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les menus: ' + err.message,
        variant: 'destructive',
      });
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    const storedId = localStorage.getItem(storageKey);
    if (storedId) {
      setSelectedMenuId(storedId);
    }
  }, [storageKey]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    if (menus.length === 0) {
      setSelectedMenuId(null);
      return;
    }
    if (!selectedMenuId || !menus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(menus[0].id);
    }
  }, [menus, selectedMenuId]);

  useEffect(() => {
    if (selectedMenuId) {
      localStorage.setItem(storageKey, selectedMenuId);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [selectedMenuId, storageKey]);

  const selectedMenu = menus.find((m) => m.id === selectedMenuId) || null;

  return {
    menus,
    loading,
    selectedMenuId,
    setSelectedMenuId,
    selectedMenu,
    refreshMenus: fetchMenus,
  };
}
