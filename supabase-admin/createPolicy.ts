import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const [table, name, ...rest] = process.argv.slice(2);
const definition = rest.join(' ');

if (!table || !name || !definition) {
  console.error('Usage: tsx createPolicy.ts <table> <policyName> <definition>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const query = `create policy "${name}" on ${table} ${definition};`;

async function main() {
  const res = await fetch(`${url}/postgres/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Policy creation failed:', data.message || JSON.stringify(data));
    process.exit(1);
  }

  console.log('Policy created successfully');
}

main();
