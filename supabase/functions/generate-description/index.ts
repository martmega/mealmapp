import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    if (!body.prompt) {
      return new Response("Missing prompt", { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: body.prompt }],
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result.choices[0].message), {
      status: 200,
    });
  } catch (err) {
    console.error("Erreur IA :", err);
    return new Response("Erreur interne", { status: 500 });
  }
});
