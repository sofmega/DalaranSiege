import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.ts');
const supabaseUrl = process.env.SUPABASE_URL?.trim() || 'https://YOUR_PROJECT_REF.supabase.co';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() || '';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `export const environment = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabasePublishableKey: ${JSON.stringify(supabasePublishableKey)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)}
};
`
);
