import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import recipeImage from '../tests/fixtures/recipe-image.json' assert { type: 'json' };

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: ts-node scripts/upload-test-image.ts <file>');
  process.exit(1);
}

const data = fs.readFileSync(filePath);

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

const { bucket, path } = recipeImage;

async function main() {
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    upsert: true,
    contentType: 'image/png',
  });
  if (error) {
    console.error('Upload failed:', error.message);
    process.exit(1);
  }
  console.log(`Uploaded ${filePath} to ${bucket}/${path}`);
}

main();
