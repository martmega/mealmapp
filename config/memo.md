# Environment and Supabase Configuration

This memo documents all environment variables used by the project, especially those related to Supabase.

## Supabase variables

| Variable | Description | Usage | Visible in Vercel? | Code source | Important notes |
| --- | --- | --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL | ✅ Frontend & `/api` | ✅ Yes | `import.meta.env.VITE_SUPABASE_URL` | Must be present in Vercel variables |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | ✅ Frontend only | ✅ Yes | `import.meta.env.VITE_SUPABASE_ANON_KEY` | Never use on secured backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key with full rights | ✅ Backend only | ✅ Yes | `process.env.SUPABASE_SERVICE_ROLE_KEY` | Never expose to frontend |

## Shared constants

The file `src/config/constants.client.ts` stores constants for the frontend. These constants rely on `import.meta.env` variables and **must not** be imported in `api/` functions because Vercel would fail to build the API routes.

For `/api/` functions, declare or import constants in `api/_shared/constants.ts` instead, as previously fixed by Codex.

## Examples

```ts
// ✅ Frontend usage
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;
```

```ts
// ✅ API usage (ex: /api/ai.ts)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

```ts
// ✅ Constants utilisables côté API
export const SUPABASE_BUCKETS = {
  recipes: 'recipe-images',
  avatars: 'avatars',
} as const;
```

## Résumé

Centralising these references avoids naming, import or scope errors between frontend and backend. Ensure all required variables exist in Vercel and are kept out of the client when marked as backend only.
