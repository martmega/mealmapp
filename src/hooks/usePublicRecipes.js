import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabasePaginated } from './useSupabasePaginated';

export function usePublicRecipes(session) {
  const queryFn = useCallback(
    async (limit, offset) => {
      let baseQuery = supabase
        .from('recipes')
        .select(
          'id, name, description, image_url, servings, calories, tags, visibility, user_id'
        )
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (session?.user?.id) {
        baseQuery = baseQuery.neq('user_id', session.user.id);
      }

      const { data: recipes, error } = await baseQuery;
      if (error) {
        return { data: [], error };
      }

      const userIds = [...new Set(recipes.map((r) => r.user_id))];
      const { data: users } = await supabase
        .from('public_users')
        .select('id, username, avatar_url, bio, user_tag, subscription_tier')
        .in('id', userIds);
      const usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

      const merged = recipes.map((r) => ({
        ...r,
        user: usersMap[r.user_id] ?? null,
      }));

      return { data: merged, error: null };
    },
    [session]
  );

  const { data, loadMore, loading, hasMore } = useSupabasePaginated(queryFn, {
    deps: [session?.user?.id],
    limit: 12,
  });

  const formatted = useMemo(() => data, [data]);

  return { recipes: formatted, loadMore, loading, hasMore };
}
