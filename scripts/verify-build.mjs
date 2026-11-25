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
const draftRoutes = [];
for (const file of await filesIn('src/content/guides')) {
  const markdown = await readFile(file, 'utf8');
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  if (!/^status:\s*draft\s*$/m.test(frontmatter)) continue;
  const locale = frontmatter.match(/^locale:\s*(en|ja)\s*$/m)?.[1];
  const slug = frontmatter.match(/^slug:\s*([a-z0-9-]+)\s*$/m)?.[1];
  assert.ok(locale && slug, `${file}: draft metadata missing`);
  draftRoutes.push(`/${locale}/guides/${slug}/`);
}
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
  if (/^\/(en|ja)\/guides\/[^/]+\/$/.test(route)) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${route}: duplicate element IDs`);
    const contents = html.match(/<nav\b[^>]*data-guide-contents[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(contents, `${route}: missing article contents`);
    const targets = [...contents.matchAll(/href="#([^"]+)"/g)].map(match => decodeURIComponent(match[1]));
    assert.ok(targets.length > 0, `${route}: empty article contents`);
    assert.equal(new Set(targets).size, targets.length, `${route}: repeated contents target`);
    for (const target of targets) assert.ok(ids.includes(target), `${route}: missing contents target ${target}`);
    const headings = [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]).filter(id => id !== 'guide-next-title');
    assert.deepEqual(targets, headings, `${route}: contents must follow every article section in order`);
    const related = html.match(/<section\b[^>]*data-guide-next[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
    const relatedLinks = [...related.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(relatedLinks).size, 3, `${route}: three distinct related guides required`);
    assert.ok(relatedLinks.every(target => target.startsWith(`/${route.split('/')[1]}/guides/`) && target !== route), `${route}: related guides must be local and different from the current page`);
  }
}
for (const route of draftRoutes) assert.ok(!files.includes(`dist${route}index.html`), `Draft route generated: ${route}`);
for (const file of files.filter((file) => file.endsWith('.pf_fragment'))) {
  const fragment = gunzipSync(await readFile(file)).toString();
  assert.ok(!/PRIVATE_(?:HINT|CLUE|ANSWER)_SENTINEL|spg(?:hint|clue|answer)zzqx|fixture-(?:case|route|character)/.test(fragment), `${file}: private or spoiler content in search index`);
}
const sitemap = (await Promise.all(files.filter((file) => /sitemap.*\.xml$/.test(file)).map((file) => readFile(file, 'utf8')))).join('');
assert.ok(!sitemap.includes('/search/'), 'Noindex search routes in sitemap');
for (const route of draftRoutes) assert.ok(!sitemap.includes(route), `Draft in sitemap: ${route}`);
for (const locale of ['en', 'ja']) {
  assert.ok(sitemap.includes(`/${locale}/characters/`), 'Substantive character directory missing from sitemap');
  const roster = await readFile(`dist/${locale}/characters/index.html`, 'utf8');
  assert.equal(roster.includes('name="robots" content="noindex'), isPreview, 'Character indexing does not match the deployment environment');
  assert.equal((roster.match(/data-profile-card/g) || []).length, 20, 'Character dossier missing');
  for (const suffix of ['guides/development-updates', 'guides/beginner-guide', 'guides/mystery-unveiled', 'guides/combat-basics', 'guides/curious-deductions', 'guides/morgue-street', 'tools/event-rewards', 'tools/glossary']) {
    const route = `/${locale}/${suffix}/`;
    assert.ok(sitemap.includes(`<loc>${site}${route}</loc>`), `${route}: missing from sitemap`);
    const html = await readFile(`dist${route}index.html`, 'utf8');
    assert.equal(/name="robots" content="[^"]*noindex/.test(html), isPreview, `${route}: wrong indexing policy`);
  }
  const guideDirectory = await readFile(`dist/${locale}/guides/index.html`, 'utf8');
  const recentSection = guideDirectory.match(/<section\b[^>]*data-recent-guides[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const recentLinks = [...recentSection.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(recentLinks).size, 4, 'Four distinct recent guide entries required');
  assert.ok(recentLinks.every(href => href.startsWith(`/${locale}/guides/`)), 'Recent entries must retain their language');
  assert.ok((recentSection.match(/<time\b/g) || []).length >= 8, 'Recent entries need separate article and source dates');
  const calendar = await readFile(`dist/${locale}/events/mystery-unveiled.ics`, 'utf8');
  assert.match(calendar, /^BEGIN:VCALENDAR\r\n/);
  assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(calendar.includes('DTSTART:20261213T155900Z') && calendar.includes('DTSTART:20261229T020000Z'), 'Calendar deadlines must use the official UTC instants');
  assert.ok(!sitemap.includes(`/${locale}/events/mystery-unveiled.ics`), 'Calendar downloads must not be indexed as pages');
}
const sourceIds = new Set(JSON.parse(await readFile('src/data/sources.json', 'utf8')).map((source) => source.id));
const dossierIds = JSON.parse(await readFile('src/data/character-details.json', 'utf8')).map(detail => detail.id);
for (const locale of ['en', 'ja']) {
  const directory = await readFile(`dist/${locale}/characters/index.html`, 'utf8');
  const comparison = await readFile(`dist/${locale}/tools/character-compare/index.html`, 'utf8');
  const glossary = await readFile(`dist/${locale}/tools/glossary/index.html`, 'utf8');
  const planner = await readFile(`dist/${locale}/tools/material-planner/index.html`, 'utf8');
  const overviewRoute = `/${locale}/guides/game-overview/`;
  assert.ok(sitemap.includes(`<loc>${site}${overviewRoute}</loc>`), 'Game overview missing from sitemap');
  assert.ok((await readFile(`dist/${locale}/index.html`, 'utf8')).includes(`href="${overviewRoute}"`), 'Home must link to the overview');
  for (const id of dossierIds) {
    const route = `/${locale}/characters/${id}/`;
    const html = await readFile(`dist${route}index.html`, 'utf8');
    assert.ok(sitemap.includes(`<loc>${site}${route}</loc>`), `${route}: missing from sitemap`);
    assert.equal(/name="robots" content="[^"]*noindex/.test(html), isPreview, `${route}: wrong indexing policy`);
    assert.ok(html.includes(`data-character-detail="${id}"`), `${route}: missing dossier content`);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${route}: duplicate reading targets`);
    const contents = html.match(/<nav\b[^>]*class="dossier-contents"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const targets = [...contents.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    assert.ok(targets.length > 0 && targets.every(target => ids.includes(target)), `${route}: broken contents`);
    for (const source of [directory, comparison, glossary]) assert.ok(source.includes(`href="${route}"`), `${route}: missing directory/tool entry`);
    assert.ok(planner.includes(`data-profile-href="${route}"`), `${route}: missing planner reference`);
    assert.ok(directory.includes(`id="${id}"`), `${route}: old directory anchor removed`);
    for (const language of ['en', 'ja']) assert.ok(html.includes(`hreflang="${language}" href="${site}/${language}/characters/${id}/"`), `${route}: missing language counterpart`);
  }
  const generatedIds = htmlFiles.filter(file => new RegExp(`^dist/${locale}/characters/[^/]+/index\\.html$`).test(file)).map(file => file.split('/')[3]);
  assert.deepEqual(generatedIds.sort(), [...dossierIds].sort(), 'Only eligible dossiers may generate character detail routes');
}
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
