# Meal Planner

This project uses Supabase as a backend. To run the app locally, create a `.env` file in the project root with the following variables.

Frontend (`VITE_` prefix):

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ACCESS_KEYS=BETA2025
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
VITE_STANDARD_PRICE_ID=<your-standard-price-id>
VITE_PREMIUM_PRICE_ID=<your-premium-price-id>
VITE_STRIPE_PRICE_ID_IMAGE_CREDIT=price_XXXXXX
VITE_STRIPE_PRICE_ID_TEXT_CREDIT=price_YYYYYY
```

Backend:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_STANDARD_PRICE_ID=<your-standard-price-id>
STRIPE_PREMIUM_PRICE_ID=<your-premium-price-id>
```

Values with the `VITE_` prefix are exposed to the browser via Vite. Backend variables should not be prefixed and remain private.
Additional documentation is available in the [docs](docs) directory.

All Supabase URLs used by the application are defined in
`src/config/constants.client.ts`. Any new interaction with
Supabase should import these constants instead of hard coding URLs. The buckets currently in use are
`recipe-images` and `avatars`.

`STRIPE_PUBLISHABLE_KEY` is the public key used by the browser to initialize Stripe.
`STRIPE_STANDARD_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` correspond to the price identifiers for your Standard and Premium subscription plans.
`STRIPE_SECRET_KEY` is read server-side to create checkout sessions.
`VITE_STRIPE_PRICE_ID_TEXT_CREDIT` and `VITE_STRIPE_PRICE_ID_IMAGE_CREDIT` contain the price IDs for packs of AI text and image credits. Each Stripe Price should define a `credit_amount` metadata field specifying how many credits are granted.
You can find all these values in the Stripe dashboard: the publishable key under **Developers > API keys** and the price IDs on each product's pricing page.

## Database

The `supabase/functions` directory contains SQL scripts used to configure
the database. In particular, `handle_new_user_signup.sql` defines a function
that assigns the default `standard` subscription tier to new users.

SQL migrations live under `supabase/migrations`. Run them with the Supabase CLI
when setting up the database:

```bash
supabase db execute < supabase/migrations/0001_enable_recipes_rls.sql
```

## Running tests

Install dependencies before running the test suite:

```bash
npm install
```

Then execute the Vitest suite with:

```bash
npm test
```

The tests mock external services and set required environment variables
programmatically, so no real Supabase or Stripe credentials are needed.

## Zod example script

Run the following command to execute `scripts/test-zod.ts`:

```bash
npx ts-node scripts/test-zod.ts
```

## Test recipe image

Some tests rely on a small image stored in Supabase. Upload any PNG to the
`recipe-images` bucket at `public/test-image.png`.
The bucket name corresponds to `SUPABASE_BUCKETS.recipes` from
`src/config/constants.client.ts`.

Example with the Supabase CLI:

```bash
supabase storage cp ./test-image.png supabase://recipe-images/public/test-image.png
```

You can also run:

```bash
npx ts-node scripts/upload-test-image.ts ./test-image.png
```

This helper requires `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be
set in your environment. You can copy `.env.example` to `.env` and provide
your Supabase credentials if you wish to use it.

Once uploaded, the image will be publicly available at
`https://<project-ref>.supabase.co/storage/v1/object/public/recipe-images/public/test-image.png`.
Its location is referenced in `tests/fixtures/recipe-image.json` and used by the
`SignedImage` tests.

## Price estimation

Recipe prices are estimated with OpenAI only when required. A new estimate is
requested when a recipe is created or when its ingredients or base servings
change during editing. Existing estimates are reused otherwise.

## UI helpers

Two utility classes in `src/index.css` style shared menus:

- `.shared-menu` applies mint colors.

The `MenuTabs` component uses `.shared-menu` and the
`data-[state=active]:bg-pastel-mint` utility to highlight the active shared
menu with a full green background.

## 🔐 Configuration des variables d'environnement

La clé `OPENAI_API_KEY` doit être fournie uniquement aux fonctions côté serveur.

- **Vercel** : ajoutez `OPENAI_API_KEY` dans les variables d'environnement du projet pour les routes API Node.js.
- **Supabase** : renseignez `OPENAI_API_KEY` dans _Project Settings > Functions > Environment Variables_ pour les fonctions Deno.

Cette clé ne doit jamais être exposée au client ; n'utilisez donc pas de préfixe `VITE_`.

# ENV

OPENAI_API_KEY=sk-...

## Prompt templates

Des exemples de prompts pour générer des images de recettes sont disponibles dans [prompt-templates.md](docs/prompt-templates.md).

## License

This project is released under the [MIT License](LICENSE).
