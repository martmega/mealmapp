# API Overview

All API routes are under `api/` and are deployed as serverless functions.

| Route | Description |
|-------|-------------|
| `api/access-key` | Validates invitation keys and marks them as used. |
| `api/estimate-cost` | Uses OpenAI to estimate the total cost of a recipe. Requires authentication. |
| `api/generate-description` | Generates a short recipe description with OpenAI. |
| `api/format-instructions` | Formats raw cooking instructions into clear steps using OpenAI. Requires authentication. |
| `api/generate-image` | Generates a DALL·E image, uploads it to Supabase and returns the file path. |
| `api/getSignedImageUrl` | Returns a signed URL for an image stored in Supabase. |
| `api/get-ia-credits` | Retrieves current AI usage and available credits. |
| `api/update-profile` | Updates fields in `public_user_view` for the current user. |
| `api/purchase-credits` | Starts a Stripe Checkout session to buy extra AI credits. |
| `api/stripe/webhook` | Node handler that updates subscription metadata after Stripe events. |
| `api/test-env` | Development endpoint to check environment variables. |

`api/buy-ia-credits` has been consolidated into `api/purchase-credits` and remains only as a backward-compatible alias.
