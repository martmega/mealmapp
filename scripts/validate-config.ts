import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const EXCLUDE_DIRS = new Set(['node_modules', '.git']);
const PATTERN = /https:\/\/[^\"']*\.supabase\.co|\/storage\/v1|\/auth\/v1/;

let hasError = false;

function scan(dir: string) {
  for (const file of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(file)) continue;
    const full = join(dir, file);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else if (/\.(js|jsx|ts|tsx|json)$/.test(file)) {
      if (full.endsWith(join('src', 'config', 'constants.ts'))) continue;
      const content = readFileSync(full, 'utf8');
      if (PATTERN.test(content)) {
        console.error('Hardcoded Supabase URL found in', full);
        hasError = true;
      }
    }
  }
}

scan(ROOT);

if (hasError) {
  process.exit(1);
} else {
  console.log('No hardcoded Supabase URLs found.');
}
