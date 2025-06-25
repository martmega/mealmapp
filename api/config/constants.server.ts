export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const SUPABASE_BUCKETS = {
  recipes: 'recipe-images',
  avatars: 'avatars',
} as const;
