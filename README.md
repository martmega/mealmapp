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

## Zod example script

Run the following command to execute `scripts/test-zod.ts`:

```bash
npx ts-node scripts/test-zod.ts
```


## Price estimation

Recipe prices are estimated with OpenAI only when required. A new estimate is
requested when a recipe is created or when its ingredients or base servings
change during editing. Existing estimates are reused otherwise.

## 🔐 Configuration des variables d'environnement

La clé `OPENAI_API_KEY` doit être fournie uniquement aux fonctions côté serveur.

- **Vercel** : ajoutez `OPENAI_API_KEY` dans les variables d'environnement du projet pour les routes API Node.js.
- **Supabase** : renseignez `OPENAI_API_KEY` dans *Project Settings > Functions > Environment Variables* pour les fonctions Deno.

Cette clé ne doit jamais être exposée au client ; n'utilisez donc pas de préfixe `VITE_`.

# ENV
OPENAI_API_KEY=sk-...

