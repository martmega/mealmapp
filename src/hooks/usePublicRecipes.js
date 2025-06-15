import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabasePaginated } from './useSupabasePaginated';

export function usePublicRecipes(session) {
  const queryFn = useCallback(
    (limit, offset) => {
      let query = supabase
        .from('recipes')
        .select(
          `id, name, description, image_url, servings, calories, tags, visibility, user_id, author:public_users(id, username, avatar_url)`
        )
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (session?.user?.id) {
        query = query.neq('user_id', session.user.id);
      }
      return query;
    },
    [session]
  );

  const { data, loadMore, loading, hasMore } = useSupabasePaginated(queryFn, {
    deps: [session?.user?.id],
    limit: 12,
  });

  const formatted = useMemo(
    () => data.map((r) => ({ ...r, user: r.author })),
    [data]
  );

  return { recipes: formatted, loadMore, loading, hasMore };
}
