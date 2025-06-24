# Meal Planner

This project uses Supabase as a backend. To run the app locally, create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ACCESS_KEYS=BETA2025
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
VITE_STANDARD_PRICE_ID=<your-standard-price-id>
VITE_PREMIUM_PRICE_ID=<your-premium-price-id>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_STANDARD_PRICE_ID=<your-standard-price-id>
STRIPE_PREMIUM_PRICE_ID=<your-premium-price-id>
```

These values are injected by Vite and used by the app at runtime.
Additional documentation is available in the [docs](docs) directory.

`STRIPE_PUBLISHABLE_KEY` is the public key used by the browser to initialize Stripe.
`STRIPE_STANDARD_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` correspond to the price identifiers for your Standard and Premium subscription plans.
You can find all three in the Stripe dashboard: the publishable key under **Developers > API keys** and the price IDs on each product's pricing page.

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

## Test recipe image

Some tests rely on a small image stored in Supabase. Upload any PNG to the
`recipe-images` bucket at `public/test-image.png`.

Example with the Supabase CLI:

```bash
supabase storage cp ./test-image.png supabase://recipe-images/public/test-image.png
```

You can also run:

```bash
npx ts-node scripts/upload-test-image.ts ./test-image.png
```

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
- `.shared-menu-active` switches the background to salmon when active.

The `MenuTabs` component uses these classes to highlight menus shared with you.

## 🔐 Configuration des variables d'environnement

La clé `OPENAI_API_KEY` doit être fournie uniquement aux fonctions côté serveur.

- **Vercel** : ajoutez `OPENAI_API_KEY` dans les variables d'environnement du projet pour les routes API Node.js.
- **Supabase** : renseignez `OPENAI_API_KEY` dans *Project Settings > Functions > Environment Variables* pour les fonctions Deno.

Cette clé ne doit jamais être exposée au client ; n'utilisez donc pas de préfixe `VITE_`.

# ENV
OPENAI_API_KEY=sk-...


## Prompt templates

Des exemples de prompts pour générer des images de recettes sont disponibles dans [prompt-templates.md](docs/prompt-templates.md).


## License

This project is released under the [MIT License](LICENSE).

