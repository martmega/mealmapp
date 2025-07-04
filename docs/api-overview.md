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
| `api/create-shared-menu` | Creates a weekly menu. Pass `is_shared` to share with `participant_ids`. |
| `api/webhooks/stripe` | Node function that validates Stripe signatures, updates `ia_credits`, and logs purchases. |

## `/api/create-shared-menu`

Request body fields:

- `user_id` (string) – owner of the menu
- `name` (string) – menu name
- `menu_data` (object, optional)
- `participant_ids` (string[], optional)
- `is_shared` (boolean, optional, defaults to `false`)

Menu preferences are not created automatically. Configure the
`weekly_menu_preferences` row separately after the menu is created.

## Stripe webhook

The `/api/webhooks/stripe` endpoint handles payment events from Stripe. Credit
pack checkout sessions **must** include `user_id` and `product_id` metadata
fields. The webhook retrieves the associated Price record to read the
`credit_amount` and `credits_type` metadata, then increments the corresponding
column (`text_credits` or `image_credits`) in `ia_credits`. Each successful
purchase is stored in the `ia_credit_purchases` table and the event ID is saved
in `stripe_events` to avoid duplicate processing.
