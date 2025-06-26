import { useCallback, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useSupabasePaginated } from './useSupabasePaginated';

const supabase = getSupabase();

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
      // The discovery section should include public recipes from the
      // current user as well, so we no longer exclude them here.

      const { data: recipes, error } = await baseQuery;
      if (error) {
        return { data: [], error };
      }

      const userIds = [...new Set(recipes.map((r) => r.user_id))];
      const { data: users } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url, bio, subscription_tier')
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
