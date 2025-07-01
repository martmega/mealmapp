import { supabase } from './supabase.js';

const [id, credits] = process.argv.slice(2);
const amount = parseInt(credits || '', 10);

if (!id || Number.isNaN(amount)) {
  console.error('Usage: tsx updateCredits.ts <rowId> <credits>');
  process.exit(1);
}

async function main() {
  const { error } = await supabase
    .from('ia_credit_purchases')
    .update({ credits_amount: amount })
    .eq('id', id);

  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }

  console.log('Row updated successfully');
}

main();
