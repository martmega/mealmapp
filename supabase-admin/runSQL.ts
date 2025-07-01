import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const query = process.argv.slice(2).join(' ');

if (!query) {
  console.error('Usage: tsx runSQL.ts "<SQL query>"');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

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
    console.error('SQL error:', data.message || JSON.stringify(data));
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main();
