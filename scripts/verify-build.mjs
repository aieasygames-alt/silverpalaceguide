import { readdir, readFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
const files = await filesIn('dist');
const htmlFiles = files.filter((file) => extname(file) === '.html');
const site = 'https://silverpalaceguide.com';
const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = '/' + file.replace(/^dist\//, '').replace(/index\.html$/, '');
  for (const match of html.matchAll(/<(?:a|link|script|img)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const target = match[1].replaceAll('&amp;', '&');
    const url = new URL(target, site + route);
    if (url.origin !== site) continue;
    const pathname = decodeURIComponent(url.pathname);
    const output = join('dist', pathname, pathname.endsWith('/') ? 'index.html' : '');
    try { await access(output); }
    catch { failures.push(`${route} → missing ${pathname}`); }
  }
  if (/^dist\/(en|ja)\//.test(file)) {
    const locale = file.split('/')[1];
    assert.ok(html.includes(`<html lang="${locale}">`), `${file}: wrong language`);
    assert.ok(html.includes(`rel="canonical" href="${site}${route}"`), `${file}: wrong canonical`);
  }
  if (html.includes('working draft') || html.includes('This draft must never')) failures.push(`${route}: draft leaked`);
}
assert.ok(!files.some((file) => file.includes('/beginner-guide/')), 'Draft route generated');
const sitemap = (await Promise.all(files.filter((file) => /sitemap.*\.xml$/.test(file)).map((file) => readFile(file, 'utf8')))).join('');
assert.ok(!sitemap.includes('/characters/') && !sitemap.includes('/search/'), 'Noindex routes in sitemap');
const sourceIds = new Set(JSON.parse(await readFile('src/data/sources.json', 'utf8')).map((source) => source.id));
for (const term of JSON.parse(await readFile('src/data/glossary.json', 'utf8'))) assert.ok(term.kind === 'site-interface' || sourceIds.has(term.sourceId), `Unknown glossary source: ${term.id}`);
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: internal assets/links, language, canonical, draft exclusion, sitemap and terminology sources.`);
