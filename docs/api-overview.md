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
| `api/webhooks/stripe` | Updates subscription metadata after Stripe events and grants credits based on the purchased product. |

## `/api/webhooks/stripe`

This endpoint processes Stripe webhook events. When a Checkout session is completed, the webhook expects the session metadata to contain the following fields:

- `user_id` – the Supabase user identifier
- `product_id` – the Stripe product that was purchased

The function fetches the product from Stripe and reads its `credit_amount` metadata. This value determines how many credits are added to the user's account. Each successful purchase is stored in the `ia_credit_purchases` table and processed event IDs are saved in the `stripe_events` table to avoid duplicate handling.
