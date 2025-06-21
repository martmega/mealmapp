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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? undefined;
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not defined");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? undefined;
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY is not defined");

  const supabase = createClient(
    supabaseUrl,
    anonKey,
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

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Missing OpenAI API key" }),
      { status: 500, headers: corsHeaders },
    );
  }

  const openai = new OpenAI({ apiKey: key });

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
