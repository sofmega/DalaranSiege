import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = resolve(frontendRoot, '..', 'backend', 'src', 'main', 'resources', 'data');
const siteOrigin = 'https://dalaran-siege.vercel.app';

const [items, heroes] = await Promise.all([
  readJson(resolve(dataRoot, 'items.json')),
  readJson(resolve(dataRoot, 'heroes.json'))
]);

const paths = [
  '/',
  '/?view=items',
  '/compositions',
  ...items.map((item) => `/items/${encodeURIComponent(item.id)}`),
  ...heroes.map((hero) => `/heroes/${encodeURIComponent(hero.id)}/build`)
];

const urls = paths
  .map((path) => `  <url><loc>${escapeXml(new URL(path, siteOrigin).toString())}</loc></url>`)
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

await writeFile(resolve(frontendRoot, 'public', 'sitemap.xml'), sitemap, 'utf8');
console.log(`Generated sitemap with ${paths.length} URLs.`);

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
