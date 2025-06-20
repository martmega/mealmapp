import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { requireAuth } from "../utils/auth.ts";

serve(async (req: Request) => {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  return new Response(`Bonjour ${user.email}, accès autorisé`);
});
