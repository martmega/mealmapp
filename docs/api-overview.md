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
| `api/webhooks/stripe` | Node function that validates Stripe signatures, updates `ia_credits`, and logs purchases. |

Credit pack purchases include `user_id` and `product_id` in the session metadata. The webhook fetches the Price metadata to determine the `credit_amount` and `credits_type` values, then upserts the proper column in `ia_credits`. Each successful purchase is stored in the `ia_credit_purchases` table and processed event IDs are saved in the `stripe_events` table to avoid duplicate handling.
