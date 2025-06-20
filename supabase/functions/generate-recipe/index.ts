import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.subscription_tier !== "premium") {
    return new Response(
      JSON.stringify({ error: "Premium only" }),
      { status: 403, headers: corsHeaders }
    );
  }

  const { prompt } = await req.json();

  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
