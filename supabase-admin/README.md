# Supabase Admin Scripts

Utility scripts for interacting with the Supabase database using the `service_role` key.

## Setup

```bash
cd supabase-admin/
npm install
cp .env.example .env.local # Fill with your keys
```

## Examples

Run arbitrary SQL:

```bash
npx tsx runSQL.ts "ALTER TABLE ia_credits ADD COLUMN debug BOOLEAN DEFAULT FALSE;"
```

Update a row in `ia_credit_purchases`:

```bash
npx tsx updateCredits.ts <rowId> <credits>
```

Create a RLS policy:

```bash
npx tsx createPolicy.ts <table> <policyName> USING (expr) WITH CHECK (expr)
```

Create or replace a view:

```bash
npx tsx createView.ts <viewName> SELECT * FROM my_table;
```

Dump a table's content:

```bash
npx tsx debugTable.ts <table>
```

All scripts read credentials from `.env.local` and will display detailed error messages on failure.
