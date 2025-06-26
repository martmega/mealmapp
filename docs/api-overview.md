# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/estimate-cost` | Uses OpenAI to estimate the total cost of a recipe. Requires authentication. |
| `api/generate-description` | Generates a short recipe description with OpenAI. |
| `api/generate-image` | Generates a DALL·E image, uploads it to Supabase and returns the file path. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/purchase-credits` | Starts a Stripe Checkout session to buy extra AI credits. |
| `api/stripe/webhook` | Deno function that updates subscription metadata after Stripe events. |
