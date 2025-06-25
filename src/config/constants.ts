export const SUPABASE_PROJECT_URL = "https://bunolnhegwzhxqxymmet.supabase.co";
export const SUPABASE_AUTH_URL = `${SUPABASE_PROJECT_URL}/auth/v1`;
export const SUPABASE_STORAGE_URL = `${SUPABASE_PROJECT_URL}/storage/v1`;

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const SUPABASE_BUCKETS = {
  recipes: "recipe-images",
  avatars: "avatars",
} as const;
