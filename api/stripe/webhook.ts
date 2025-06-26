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
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Invalid Stripe signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "invoice.paid":
        const session: any = event.data.object;
        const userId: string | undefined = session.client_reference_id;
        const email: string | undefined =
          session.customer_email || session.customer_details?.email;
        let id = userId;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        if (!id && email) {
          const { data, error } = await supabase
            .from("public_user_view")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (error) {
            console.error("Error fetching user:", error.message);
          }
          id = data?.id as string | undefined;
        }

        if (id) {
          if (session.mode === "subscription") {
            const { error } = await supabase.auth.admin.updateUserById(id, {
              app_metadata: { subscription_tier: "premium" },
            });
            if (error) {
              console.error("Supabase update error:", error.message);
              return new Response("Supabase update failed", { status: 500 });
            }
          } else if (session.mode === "payment" && session.metadata?.credits_type) {
            const column =
              session.metadata.credits_type === "text" ? "text_credits" : "image_credits";
            const increment =
              session.metadata.credits_type === "text" ? 10 : 5;
            const { data: row, error: fetchErr } = await supabase
              .from("ia_credits")
              .select(column)
              .eq("user_id", id)
              .maybeSingle();
            if (fetchErr) {
              console.error("ia_credits fetch error:", fetchErr.message);
            }
            const current = row?.[column] ?? 0;
            const { error: upsertErr } = await supabase.from("ia_credits").upsert(
              {
                user_id: id,
                [column]: current + increment,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
            if (upsertErr) {
              console.error("ia_credits upsert error:", upsertErr.message);
            }
          }
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
