import { glob } from 'glob';
import fs from 'fs';

const patterns = [
  /https:\/\/[^'"`\s]+\.supabase\.co/,
  /storage\/v1/,
  /auth\/v1/,
];

async function main() {
  const files = await glob('**/*.{js,jsx,ts,tsx,json}', {
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/src/config/constants.client.ts',
      '**/api/config/constants.server.ts',
    ],
  });

  let hasHardcoded = false;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      if (
        pattern.test(content) &&
        file !== 'src/config/constants.client.ts' &&
        file !== 'api/config/constants.server.ts'
      ) {
        console.error(`Hardcoded Supabase URL found in ${file}`);
        hasHardcoded = true;
        break;
      }
    }
  }

  if (hasHardcoded) {
    console.error(
      'Supabase URLs should be defined in src/config/constants.client.ts or api/config/constants.server.ts'
    );
    process.exit(1);
  } else {
    console.log('No hardcoded Supabase URLs found.');
  }
}

main();
