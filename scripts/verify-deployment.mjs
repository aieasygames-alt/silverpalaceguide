import assert from 'node:assert/strict';

const [target, mode] = process.argv.slice(2);
assert.ok(target, 'Usage: npm run verify:deployment -- https://<hostname> [--preview]');
assert.ok(!mode || mode === '--preview', 'Only --preview is supported');
const base = new URL(target);
assert.ok(base.protocol === 'https:' && base.pathname === '/' && !base.search && !base.hash, 'Use an HTTPS origin without a path');
const preview = mode === '--preview';
const canonical = 'https://silverpalaceguide.com';

async function request(path) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  return { path, response, body: await response.text() };
}

const routes = ['/', '/en/', '/ja/', '/en/search/', '/en/characters/', '/robots.txt', '/sitemap-index.xml', '/__deployment_check_missing__/'];
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
    } else if (path === '/__deployment_check_missing__/') {
      assert.equal(response.status, 404, 'Missing paths must return a real 404');
      assert.ok(body.includes('Silver Palace Guide'), 'Use the custom 404 page');
    } else {
      assert.equal(response.status, 200);
    }
    if (path === '/en/' || path === '/ja/') {
      const language = path.slice(1, 3);
      assert.ok(body.includes(`<html lang="${language}">`));
      assert.ok(body.includes(`rel="canonical" href="${canonical}${path}"`));
      assert.ok(body.includes('hreflang="en"') && body.includes('hreflang="ja"'));
      assert.equal(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(body), preview, 'Indexing metadata does not match the environment');
      assert.ok(response.headers.get('content-security-policy')?.includes("script-src 'self' 'wasm-unsafe-eval'"), 'Pages CSP missing');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      for (const script of body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        assert.ok(/\bsrc=["']/i.test(script[1]) || /\btype=["']application\/(?:ld\+)?json["']/i.test(script[1]) || !script[2].trim(), 'Executable inline script blocked by CSP');
      }
    }
    if (path === '/en/search/' || path === '/en/characters/') assert.ok(body.includes('content="noindex, follow"'));
    if (path === '/robots.txt') {
      if (preview) assert.match(body, /User-agent: \*\s+Disallow: \//);
      else assert.ok(body.includes('Allow: /') && body.includes(`Sitemap: ${canonical}/sitemap-index.xml`));
    }
    if (path === '/sitemap-index.xml') assert.ok(body.includes(`${canonical}/sitemap-0.xml`));
    console.log(`PASS ${path} (${response.status})`);
  } catch (error) { failures.push(`${path}: ${error.message}`); }
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Verified ${preview ? 'preview' : 'production'} deployment at ${base.origin}`);
