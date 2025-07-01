import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('Missing SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!serviceRole) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

async function main() {
  const { data, error } = await supabase.from('ia_credits').select('*');
  if (error) {
    console.error('Read failed:', error.message);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main();
