import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? undefined;
if (!supabaseUrl) throw new Error("SUPABASE_URL is not defined");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
if (!supabaseServiceKey)
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });

console.log("Stripe webhook handler initialized");

serve(async (req) => {
  console.log("Webhook request received");

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) {
    return new Response("Missing OpenAI API key", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Event validated: ${event.type}`);
  } catch (err) {
    console.error("Invalid Stripe signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "invoice.paid"
  ) {
    const session: any = event.data.object;
    const email = session.customer_email;
    console.log(`Processing session for ${email}`);
    if (email) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await supabase.auth.admin.updateUserByEmail(email, {
        user_metadata: { subscription_tier: "premium", is_premium: true },
      });
      if (error) {
        console.error("Supabase update error", error.message);
        return new Response("Supabase error", { status: 500 });
      }
      console.log("User updated successfully");
    } else {
      console.log("No email found in session");
    }
  }

  return new Response("OK", { status: 200 });
});
