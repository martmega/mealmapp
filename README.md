# Meal Planner

This project uses Supabase as a backend. To run the app locally, create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ACCESS_KEYS=BETA2025
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

These values are injected by Vite and used by the app at runtime.

## Database

The `supabase/functions` directory contains SQL scripts used to configure
the database. In particular, `handle_new_user_signup.sql` defines a function
that assigns the default `standard` subscription tier to new users.

## Running tests

Execute the following command to run the Vitest suite:

```bash
npm run test
```

## Price estimation

Recipe prices are estimated with OpenAI only when required. A new estimate is
requested when a recipe is created or when its ingredients or base servings
change during editing. Existing estimates are reused otherwise.
