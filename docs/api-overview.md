# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/ai` | Unified AI endpoint. Supports `action` values `cost`, `description`, `format`, and `image`. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/credits` | `GET` returns remaining AI usage and credits. `POST` starts a Stripe Checkout session to buy credit packs. |
| `api/stripe/webhook` | Deno function that updates subscription metadata after Stripe events. |
