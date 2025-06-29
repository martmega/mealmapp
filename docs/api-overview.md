# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/ai` | Unified AI endpoint. Handles `action` values `cost`, `description`, `format`, and `image`. Replaces older recipe and formatting endpoints. |
| `api/getSignedImageUrl` | Returns a short-lived signed URL for an image in Supabase Storage. |
| `api/credits` | `GET` returns remaining IA usage and credits (formerly `get-ia-credits`). `POST` starts a Stripe Checkout session to buy credit packs. |
| `api/purchase-credits` | Alias of `POST api/credits` for backwards compatibility. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/stripe/webhook` | Deno function that updates subscription metadata after Stripe events. |
