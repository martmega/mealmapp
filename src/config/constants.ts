export const SUPABASE_PROJECT_URL = "https://bunolnhegwzhxqxymmet.supabase.co";
export const SUPABASE_AUTH_URL = `${SUPABASE_PROJECT_URL}/auth/v1`;
export const SUPABASE_STORAGE_URL = `${SUPABASE_PROJECT_URL}/storage/v1`;

export const SUPABASE_BUCKETS = {
  recipes: "recipe-images",
  avatars: "avatars",
} as const;
