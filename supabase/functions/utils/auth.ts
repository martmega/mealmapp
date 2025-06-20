import { getSupabaseUser } from "https://deno.land/x/supabase_auth_helpers/deno/mod.ts";

export async function requireAuth(req: Request) {
  const { user, error } = await getSupabaseUser(req);
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }
  return user;
}
