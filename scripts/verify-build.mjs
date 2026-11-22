import { readdir, readFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
const files = await filesIn('dist');
const htmlFiles = files.filter((file) => extname(file) === '.html');
const site = 'https://silverpalaceguide.com';
const failures = [];
const isPreview = process.env.PREVIEW_NOINDEX === '1' || (process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH !== 'main');
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = '/' + file.replace(/^dist\//, '').replace(/index\.html$/, '');
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = script[1];
    const inertData = /\btype=["']application\/(?:ld\+)?json["']/i.test(attributes);
    if (!/\bsrc=["']/i.test(attributes) && !inertData && script[2].trim()) {
      failures.push(`${route}: executable inline script would be blocked by the Pages CSP`);
    }
  }
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
    assert.ok(html.includes(`property="og:image" content="${site}/images/social/default-${locale}.jpg"`), `${file}: missing localized OG image`);
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `${file}: missing Twitter large-image card`);
  }
  if (/working draft|This draft must never|PRIVATE_(?:HINT|CLUE|ANSWER)_SENTINEL|fixture-case|fixture-route|fixture-character/.test(html)) failures.push(`${route}: draft leaked`);
}
assert.ok(!files.some((file) => file.includes('/beginner-guide/')), 'Draft route generated');
for (const file of files.filter((file) => file.endsWith('.pf_fragment'))) {
  const fragment = gunzipSync(await readFile(file)).toString();
  assert.ok(!/PRIVATE_(?:HINT|CLUE|ANSWER)_SENTINEL|spg(?:hint|clue|answer)zzqx|fixture-(?:case|route|character)/.test(fragment), `${file}: private or spoiler content in search index`);
}
const sitemap = (await Promise.all(files.filter((file) => /sitemap.*\.xml$/.test(file)).map((file) => readFile(file, 'utf8')))).join('');
assert.ok(!sitemap.includes('/search/'), 'Noindex search routes in sitemap');
for (const locale of ['en', 'ja']) {
  assert.ok(sitemap.includes(`/${locale}/characters/`), 'Substantive character directory missing from sitemap');
  const roster = await readFile(`dist/${locale}/characters/index.html`, 'utf8');
  assert.equal(roster.includes('name="robots" content="noindex'), isPreview, 'Character indexing does not match the deployment environment');
  assert.equal((roster.match(/data-profile-card/g) || []).length, 20, 'Character dossier missing');
}
const sourceIds = new Set(JSON.parse(await readFile('src/data/sources.json', 'utf8')).map((source) => source.id));
for (const term of JSON.parse(await readFile('src/data/glossary.json', 'utf8'))) assert.ok(term.kind === 'site-interface' || sourceIds.has(term.sourceId), `Unknown glossary source: ${term.id}`);
for (const file of files.filter((file) => /\.(?:js|json)$/.test(file) && !file.includes('/pagefind/'))) {
  const source = await readFile(file, 'utf8');
  assert.ok(!/PRIVATE_(?:HINT|CLUE|ANSWER)_SENTINEL|fixture-(?:case|route|character|material)/.test(source), `${file}: private data bundled`);
}
for (const locale of ['en', 'ja']) {
  const bytes = await readFile(`dist/images/social/default-${locale}.jpg`);
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Social image must be JPEG');
  let found = false;
  for (let offset = 2; offset < bytes.length;) {
    const marker = bytes[offset + 1];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) { assert.equal(bytes.readUInt16BE(offset + 5), 630); assert.equal(bytes.readUInt16BE(offset + 7), 1200); found = true; break; }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  assert.ok(found, 'Social image dimensions not found');
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: CSP-compatible scripts, internal assets/links, language, canonical, draft exclusion, sitemap and terminology sources.`);
