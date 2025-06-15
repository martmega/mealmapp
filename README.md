# Mealmapp

This project requires some environment variables to connect to Supabase.
Create a `.env` file at the project root with the following keys:

```
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anonymous key>
```

These variables are consumed at build time via `import.meta.env`.
