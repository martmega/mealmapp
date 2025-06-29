# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/ai` | Handles AI tasks like description generation, image creation, cost estimation and instruction formatting based on the `action` query parameter (`description`, `image`, `cost`, `format`). Requires authentication. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/purchase-credits` | Starts a Stripe Checkout session to buy extra AI credits. |
| `api/buy-ia-credits` | Alias for `api/purchase-credits`. |
| `api/stripe/webhook` | Deno function that updates subscription metadata after Stripe events. |
