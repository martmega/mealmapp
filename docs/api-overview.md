# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/ai` | Unified AI endpoint. Supports `action` values `cost`, `description`, `format`, and `image`. |
| `api/generate-recipe` | Generates a recipe from a prompt (Premium only). |
| `api/getSignedImageUrl` | Returns a temporary signed URL for images stored in Supabase. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/credits` | `GET` returns remaining AI usage and credits, `POST` starts a Stripe Checkout session. This consolidates the old `get-ia-credits` and `purchase-credits` endpoints. |
| `api/stripe/webhook` | Deno function that updates subscription metadata after Stripe events and records credit purchases. |

Credit pack quantities are provided via the `credits_quantity` metadata sent when creating the Checkout session. The webhook uses this value to know how many credits to add when a purchase is completed. Each successful purchase is stored in the `ia_credit_purchases` table and processed event IDs are saved in the `stripe_events` table to avoid duplicate handling.
