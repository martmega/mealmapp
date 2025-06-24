import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SUPABASE_PROJECT_URL } from '../src/config/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', 'vercel.json');
const config = JSON.parse(readFileSync(file, 'utf8'));

for (const entry of config.headers || []) {
  if (entry.headers) {
    for (const header of entry.headers) {
      if (header.key === 'Content-Security-Policy') {
        header.value = header.value.replace(
          /https:\/\/[^ ]*\.supabase\.co/g,
          SUPABASE_PROJECT_URL
        );
      }
    }
  }
}

writeFileSync(file, JSON.stringify(config, null, 2));
