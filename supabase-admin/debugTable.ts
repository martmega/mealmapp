import { supabase } from './supabase.js';

const table = process.argv[2];

if (!table) {
  console.error('Usage: tsx debugTable.ts <table>');
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error('Read failed:', error.message);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main();
