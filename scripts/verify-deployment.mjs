import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [target, mode] = process.argv.slice(2);
assert.ok(target, 'Usage: npm run verify:deployment -- https://<hostname> [--preview]');
assert.ok(!mode || mode === '--preview', 'Only --preview is supported');
const base = new URL(target);
assert.ok(base.protocol === 'https:' && base.pathname === '/' && !base.search && !base.hash, 'Use an HTTPS origin without a path');
const preview = mode === '--preview';
const canonical = 'https://silverpalaceguide.com';
const glossary = JSON.parse(await readFile(new URL('../src/data/glossary.json', import.meta.url), 'utf8'));
const profiles = JSON.parse(await readFile(new URL('../src/data/character-profiles.json', import.meta.url), 'utf8'));
const expectedReferenceCount = glossary.filter(term => term.kind === 'official').length + profiles.length;

async function request(path) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  return { path, response, body: await response.text() };
}

const referenceRoutes = ['en', 'ja'].flatMap(locale => ['guides/development-updates', 'guides/game-overview', 'characters/lorin', 'guides/beginner-guide', 'guides/mystery-unveiled', 'guides/combat-basics', 'guides/curious-deductions', 'guides/morgue-street', 'tools/event-rewards', 'tools/glossary'].map(suffix => `/${locale}/${suffix}/`));
const routes = ['/', '/en/', '/ja/', '/en/search/', '/en/characters/', '/ja/characters/', '/en/tools/character-compare/', '/ja/tools/character-compare/', ...referenceRoutes, '/en/events/mystery-unveiled.ics', '/ja/events/mystery-unveiled.ics', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml', '/__deployment_check_missing__/', '/images/social/default-en.jpg', '/images/social/default-ja.jpg', '/en/cases/fixture-case/', '/en/exploration/fixture-route/', '/en/qa-preview/'];
const results = await Promise.allSettled(routes.map(request));
const failures = [];
for (let index = 0; index < results.length; index++) {
  const result = results[index];
  if (result.status === 'rejected') { failures.push(`${routes[index]}: ${result.reason.message}`); continue; }
  const { path, response, body } = result.value;
  try {
    if (path === '/') {
      assert.equal(response.status, 302);
      assert.equal(new URL(response.headers.get('location'), base).pathname, '/en/');
    } else if (path === '/__deployment_check_missing__/' || path.includes('fixture-') || path === '/en/qa-preview/') {
      assert.equal(response.status, 404, 'Missing paths must return a real 404');
      assert.ok(body.includes('Silver Palace Guide'), 'Use the custom 404 page');
    } else {
      assert.equal(response.status, 200);
    }
    if (path === '/en/' || path === '/ja/') {
      const language = path.slice(1, 3);
      assert.ok(body.includes(`<html lang="${language}">`));
      assert.ok(body.includes(`rel="canonical" href="${canonical}${path}"`));
      for (const alternate of ['en', 'ja']) {
        assert.ok(body.includes(`hreflang="${alternate}" href="${canonical}/${alternate}/"`), 'Alternate language must use the canonical domain');
      }
      assert.equal(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(body), preview, 'Indexing metadata does not match the environment');
      assert.ok(response.headers.get('content-security-policy')?.includes("script-src 'self' 'wasm-unsafe-eval'"), 'Pages CSP missing');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.ok(response.headers.get('cache-control')?.includes('no-transform'), 'HTML must prevent automatic analytics injection');
      assert.ok(!body.includes('static.cloudflareinsights.com/beacon'), 'Unexpected analytics script injected into HTML');
      assert.ok(body.includes(`property="og:image" content="${canonical}/images/social/default-${language}.jpg"`), 'Localized share image missing');
      assert.ok(body.includes('name="twitter:card" content="summary_large_image"'));
      for (const script of body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        assert.ok(/\bsrc=["']/i.test(script[1]) || /\btype=["']application\/(?:ld\+)?json["']/i.test(script[1]) || !script[2].trim(), 'Executable inline script blocked by CSP');
      }
    }
    if (path.startsWith('/images/social/')) assert.ok(response.headers.get('content-type')?.includes('image/jpeg'), 'Share image MIME type');
    if (path === '/en/search/') assert.ok(body.includes('content="noindex, follow"'));
    if (/^\/(en|ja)\/characters\/$/.test(path)) {
      assert.equal((body.match(/data-profile-card/g) || []).length, 20);
      assert.equal(body.includes('content="noindex, follow"'), preview);
    }
    if (path.includes('/tools/character-compare/')) assert.ok(body.includes('data-comparison-profile="alf"'));
    if (referenceRoutes.includes(path)) {
      assert.ok(response.headers.get('content-type')?.includes('text/html'));
      assert.ok(body.includes(`rel="canonical" href="${canonical}${path}"`));
      assert.equal(/name="robots" content="[^"]*noindex/.test(body), preview);
      if (path.includes('/tools/event-rewards/')) assert.equal((body.match(/data-reward-card=/g) || []).length, 10);
      if (path.includes('/tools/glossary/')) assert.equal((body.match(/data-term-card/g) || []).length, expectedReferenceCount);
      if (path.includes('/guides/')) {
        const contents = body.match(/<nav\b[^>]*data-guide-contents[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
        const targets = [...contents.matchAll(/href="#([^"]+)"/g)].map(match => decodeURIComponent(match[1]));
        assert.ok(targets.length > 0, 'Guide contents missing');
        for (const id of targets) assert.ok(body.includes(`id="${id}"`), 'Contents link target missing');
        assert.ok(body.includes('data-guide-next'), 'Related guide navigation missing');
      }
    }
    if (path.endsWith('.ics')) {
      assert.ok(response.headers.get('content-type')?.includes('text/calendar'), 'Calendar MIME type');
      assert.ok(response.headers.get('content-disposition')?.includes('attachment'), 'Calendar download header');
      assert.match(body, /^BEGIN:VCALENDAR\r\n/);
      assert.equal((body.match(/BEGIN:VEVENT/g) || []).length, 2);
      assert.ok(body.includes('DTSTART:20261213T155900Z') && body.includes('DTSTART:20261229T020000Z'));
    }
    if (path === '/robots.txt') {
      if (preview) assert.match(body, /User-agent: \*\s+Disallow: \//);
      else assert.ok(body.includes('Allow: /') && body.includes(`Sitemap: ${canonical}/sitemap-index.xml`));
    }
    if (path.endsWith('.xml')) {
      assert.ok(/(?:application|text)\/xml/.test(response.headers.get('content-type') || ''), 'Sitemap XML MIME type');
      assert.match(body, /^<\?xml/);
    }
    if (path === '/sitemap-index.xml') assert.ok(body.includes(`${canonical}/sitemap-0.xml`));
    if (path === '/sitemap-0.xml') {
      const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
      assert.ok(locations.includes(`${canonical}/en/`) && locations.includes(`${canonical}/ja/`), 'Sitemap must include both homepages');
      assert.ok(locations.every(location => new URL(location).origin === canonical), 'Sitemap URLs must use the canonical domain');
      for (const route of referenceRoutes) assert.ok(locations.includes(`${canonical}${route}`), `Sitemap missing ${route}`);
      assert.ok(!locations.some(location => location.endsWith('.ics')), 'Calendar files must not appear as pages');
    }
    console.log(`PASS ${path} (${response.status})`);
  } catch (error) { failures.push(`${path}: ${error.message}`); }
}
if (!preview && base.origin === canonical) {
  const paths = ['/', '/en/tools/material-planner/?ref=domain-check&locale=en', '/ja/exploration/?ref=domain-check%20ja'];
  const redirects = await Promise.allSettled(paths.flatMap(path => ['http:', 'https:'].map(async protocol => {
    const source = new URL(path, `${protocol}//www.silverpalaceguide.com`);
    const response = await fetch(source, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
    try {
      assert.equal(response.status, 301, 'WWW must return a permanent redirect');
      assert.equal(response.headers.get('location'), new URL(path, canonical).href, 'WWW must preserve the path and query string');
      return `PASS ${source.href} → ${response.headers.get('location')} (301)`;
    } finally {
      await response.body?.cancel();
    }
  })));
  for (const result of redirects) {
    if (result.status === 'rejected') failures.push(`WWW redirect: ${result.reason.message}`);
    else console.log(result.value);
  }
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Verified ${preview ? 'preview' : 'production'} deployment at ${base.origin}`);
