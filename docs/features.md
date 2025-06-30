# Application Features

## Authentication
- Uses Supabase Auth for sign up and login.
- Session tokens are passed to API routes and Supabase client.

## Recipes
- CRUD operations on personal recipes.
- Estimated price and calories management.
- Image uploads and prompts for realistic pictures.

## Menu Planner
- Weekly menu stored in the `weekly_menus` table.
- Menu specific preferences stored in `weekly_menu_preferences`.
- Calculates total cost and calories per week.

## AI Features
- OpenAI integration for recipe generation, description writing, cost estimation and image generation.
- Usage of these features is limited via the `ia_usage` table based on subscription tier.
- Additional paid credits are tracked in the `ia_credits` table.
- Completed purchases are logged in the `ia_credit_purchases` table.
- Processed Stripe event IDs are stored in the `stripe_events` table to prevent duplicate credit grants.

## Social
- Friend requests stored in `user_relationships` allow sharing recipes among friends.

## Stripe Subscriptions
- Checkout handled via Stripe to unlock `premium` tiers.
- Webhook updates user metadata when payment succeeds.

## Access Keys
- Invitation keys stored in `access_keys` to grant special roles or beta access.
