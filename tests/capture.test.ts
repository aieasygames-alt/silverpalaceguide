import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { captureTemplate } from '../scripts/lib/capture-template';
import { createCapture, inspectCapture, prepareCapture, parseEvidenceCsv, reportMarkdown, type CaptureBundle } from '../scripts/lib/capture';

// Synthetic recordings, names, quantities and pictures exercise the intake pipeline only.
// They never enter src/data, public assets, a page route or the search index.
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
const headers = 'file,sha256,source_url_or_record,server,build,captured_at,spoiler_safe_hint_answer,alt_en,alt_ja\n';
async function recordedPackage(kind: 'case' | 'route' | 'interval', t: test.TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'spg-capture-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const context = { projectRoot: root, captureRoot: join(root, 'artifacts/private/captures') };
  await mkdir(join(root, 'src/data'), { recursive: true });
  await mkdir(join(root, 'docs/capture-kit'), { recursive: true });
  await writeFile(join(root, 'docs/capture-kit', `${kind}.md`), '# Synthetic capture template\n');
  const official = { id: 'example-official', kind: 'official-website' as const, title: 'Example official names', url: 'https://example.test/names', publisher: 'Test publisher', checkedAt: '2026-11-22', facts: ['Synthetic localized names'], limitations: 'Test fixture only', assets: 'None' };
  for (const name of ['cases', 'routes', 'characters', 'materials', 'sources', 'evidence-images']) await writeFile(join(root, 'src/data', `${name}.json`), json(name === 'sources' ? [official] : []));
  const id = `example-${kind}`, name = `${kind}-${id}`;
  const directory = await createCapture(context, kind, id);
  const manifest = { schemaVersion: 1, id, kind, status: 'ready-for-review', server: 'Test server', build: 'test-build-01', capturedAt: '2026-11-21', englishName: 'Example EN', japaneseName: '例の日本語名', nameSources: ['en', 'ja'].map(locale => ({ locale, url: official.url })), recording: 'https://example.test/recording', reproducedAt: '2026-11-22', reviewedAt: { en: '2026-11-22', ja: '2026-11-22', spoilers: '2026-11-22' }, unresolved: [] };
  const bundle: CaptureBundle = { cases: [], routes: [], characters: [], materials: [], images: [], sources: [{ id: 'example-record', kind: 'gameplay-record', title: 'Synthetic record', url: manifest.recording, publisher: 'Test recorder', checkedAt: '2026-11-22', facts: ['Synthetic behavior only'], limitations: 'Not game evidence', assets: 'Synthetic image', server: manifest.server, build: manifest.build, capturedAt: manifest.capturedAt }] };
  const image = { id: 'example-safe', src: '/images/evidence/example-safe.png', width: 2, height: 2, alt: { en: 'A safe, "synthetic" image', ja: '安全なテスト画像' }, spoiler: 'safe' as const, sourceId: 'example-record', server: manifest.server, build: manifest.build, checkedAt: '2026-11-22' };
  bundle.images.push(image);
  for (const locale of ['en', 'ja'] as const) {
    const base = { id: `${locale}/${id}`, translationId: id, slug: id, locale, title: locale === 'en' ? manifest.englishName : manifest.japaneseName, summary: 'Synthetic summary', status: 'draft' as const, verification: 'gameplay-verified' as const, revision: 1, sourceRevision: 1, checkedRevision: 1, checkedAt: '2026-11-22', updatedAt: '2026-11-22', server: manifest.server, build: manifest.build, sourceIds: ['example-record'], prerequisites: [] };
    if (kind === 'case') bundle.cases.push({ ...base, safeImageIds: [image.id], stages: [{ id: 'first', title: 'Example stage', objective: 'Example objective', clueIds: ['example-clue'], hints: [{ text: 'A synthetic nudge', imageIds: [image.id] }, { text: 'A synthetic clue', imageIds: [] }, { text: 'A synthetic answer', imageIds: [] }] }] });
    if (kind === 'route') bundle.routes.push({ ...base, area: 'Example area', start: 'Example start', completion: 'Example finish', safeImageIds: [image.id], steps: [{ id: 'first', title: 'Example step', instruction: 'Example instruction', checklistText: 'Example checklist item', imageIds: [image.id] }] });
    if (kind === 'interval') bundle.characters.push({ ...base, characterId: 'example-person', intervals: [{ id, label: 'Example interval', from: 1, to: 3, costsComplete: true, costs: [{ materialId: 'example-metal', amount: 30 }, { materialId: 'example-coin', amount: 0 }] }] });
  }
  if (kind === 'interval') {
    bundle.materials = [{ id: 'example-metal', name: { en: 'Example metal', ja: 'テスト金属' } }, { id: 'example-coin', name: { en: 'Example currency', ja: 'テスト通貨' } }];
    await writeFile(join(directory, 'cost-check.json'), json({ intervalId: id, coverageNote: 'Synthetic inventory covers metal and currency; zero is explicitly recorded.', steps: [{ from: 1, to: 2, imageIds: [image.id], costs: [{ materialId: 'example-metal', amount: 12 }, { materialId: 'example-coin', amount: 0 }] }, { from: 2, to: 3, imageIds: [image.id], costs: [{ materialId: 'example-metal', amount: 18 }, { materialId: 'example-coin', amount: 0 }] }], independentTotals: [{ materialId: 'example-metal', amount: 30 }, { materialId: 'example-coin', amount: 0 }] }));
  }
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#567854' } }).png().toBuffer();
  await writeFile(join(directory, 'assets/example-safe.png'), png);
  const row = ['assets/example-safe.png', createHash('sha256').update(png).digest('hex'), manifest.recording, manifest.server, manifest.build, manifest.capturedAt, 'safe', image.alt.en, image.alt.ja];
  await writeFile(join(directory, 'evidence.csv'), headers + row.map(csvCell).join(',') + '\n');
  await writeFile(join(directory, 'manifest.json'), json(manifest));
  await writeFile(join(directory, 'content.json'), json(bundle));
  return { root, context, directory, name, bundle, manifest };
}

test('new packages retain unknowns and cannot overwrite an existing recording, including an empty folder', async t => {
  for (const kind of ['case', 'route', 'interval'] as const) {
    const content = captureTemplate(kind, 'new-record');
    const entry = [...content.cases, ...content.routes, ...content.characters][0];
    assert.equal(entry.title, null); assert.equal(entry.checkedAt, null);
    assert.equal(entry.status, 'draft'); assert.equal(entry.verification, 'unverified');
  }
  const sample = await recordedPackage('case', t);
  const before = await readFile(join(sample.directory, 'manifest.json'), 'utf8');
  await assert.rejects(createCapture(sample.context, 'case', 'example-case'), /EEXIST/);
  assert.equal(await readFile(join(sample.directory, 'manifest.json'), 'utf8'), before);
  await mkdir(join(sample.context.captureRoot, 'case-empty'));
  await assert.rejects(createCapture(sample.context, 'case', 'empty'), /EEXIST/);
  assert.ok(!(await readdir(sample.context.captureRoot)).some(name => name.startsWith('.new-')));
});

test('legacy empty packages report missing fields without modifying files or inventing content', async t => {
  const sample = await recordedPackage('case', t);
  const legacy = { ...sample.manifest, schemaVersion: undefined, reviewedAt: undefined, server: null, build: null, recording: null, capturedAt: null, reproducedAt: null, status: 'awaiting-capture' };
  await writeFile(join(sample.directory, 'manifest.json'), json(legacy));
  await rm(join(sample.directory, 'content.json'));
  const before = await readFile(join(sample.directory, 'manifest.json'), 'utf8');
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.equal(report.readyForReview, false);
  assert.ok(report.issues.some(issue => issue.path === 'manifest.recording'));
  assert.ok(report.issues.some(issue => issue.path === 'content.json'));
  await assert.rejects(prepareCapture(sample.context, sample.name), /incomplete/);
  assert.equal(await readFile(join(sample.directory, 'manifest.json'), 'utf8'), before);
  assert.ok(!(await readdir(sample.directory)).includes('review'));
});

test('a complete bilingual case/route prepares only draft JSON and reviewed assets, never public data or originals', async t => {
  for (const kind of ['case', 'route'] as const) {
    const sample = await recordedPackage(kind, t);
    await writeFile(join(sample.directory, 'originals/account-recording.txt'), 'private recording metadata');
    const before = await readFile(join(sample.root, 'src/data/cases.json'), 'utf8');
    const { report } = await inspectCapture(sample.context, sample.name);
    assert.deepEqual(report.issues, []);
    const destination = await prepareCapture(sample.context, sample.name);
    const data = JSON.parse(await readFile(join(destination, 'data', kind === 'case' ? 'cases.json' : 'routes.json'), 'utf8'));
    assert.deepEqual(data.map((entry: { status: string }) => entry.status), ['draft', 'draft']);
    assert.deepEqual((await readdir(destination)).sort(), ['README.md', 'data', 'public', 'report.json']);
    assert.equal(await readFile(join(sample.root, 'src/data/cases.json'), 'utf8'), before);
    assert.ok((await readFile(join(destination, 'public/images/evidence/example-safe.png'))).equals(await readFile(join(sample.directory, 'assets/example-safe.png'))));
    await assert.rejects(prepareCapture(sample.context, sample.name), /already exists/);
  }
});

test('a claimed ready flag cannot bypass missing gameplay scope, bilingual stages or spoiler boundaries', async t => {
  const sample = await recordedPackage('case', t);
  sample.bundle.cases[1].stages[0].id = 'different';
  sample.bundle.cases[0].stages[0].hints[0].imageIds = ['example-answer'];
  sample.bundle.images.push({ ...sample.bundle.images[0], id: 'example-answer', spoiler: 'answer' });
  sample.bundle.sources[0].build = 'another-build';
  await writeFile(join(sample.directory, 'content.json'), json(sample.bundle));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.equal(report.readyForReview, false);
  assert.ok(report.issues.some(issue => issue.message.includes('stage/clue IDs differ')));
  assert.ok(report.issues.some(issue => issue.message.includes('spoiler')));
  assert.ok(report.issues.some(issue => issue.message.includes('matching server')));
  assert.ok(!reportMarkdown(report).includes('A synthetic answer'), 'reports list paths and checks, not hint bodies');
});

test('actual image hashes, dimensions and capture scope are checked rather than trusting the ledger', async t => {
  const sample = await recordedPackage('route', t);
  sample.bundle.images[0].width = 999;
  await writeFile(join(sample.directory, 'content.json'), json(sample.bundle));
  const csv = await readFile(join(sample.directory, 'evidence.csv'), 'utf8');
  await writeFile(join(sample.directory, 'evidence.csv'), csv.replace(/[a-f0-9]{64}/, '0'.repeat(64)));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.ok(report.issues.some(issue => issue.message.includes('SHA-256')));
  assert.ok(report.issues.some(issue => issue.message.includes('dimensions')));
});

test('capture paths and asset/recording symlinks cannot escape their private directories', async t => {
  const sample = await recordedPackage('case', t);
  await assert.rejects(inspectCapture(sample.context, '../case-example-case'), /folder name/);
  await symlink(sample.root, join(sample.context.captureRoot, 'case-escape'));
  await assert.rejects(inspectCapture(sample.context, 'case-escape'), /symlink escapes/);
  const original = await readFile(join(sample.directory, 'assets/example-safe.png'));
  await writeFile(join(sample.root, 'outside.png'), original);
  await rm(join(sample.directory, 'assets/example-safe.png'));
  await symlink(join(sample.root, 'outside.png'), join(sample.directory, 'assets/example-safe.png'));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.ok(report.issues.some(issue => issue.message.includes('symlink escapes')));
});

test('symlinked capture roots, asset directories and original directories are rejected', async t => {
  const sample = await recordedPackage('case', t);
  const otherRoot = await mkdtemp(join(tmpdir(), 'spg-capture-outside-'));
  t.after(() => rm(otherRoot, { recursive: true, force: true }));
  const link = join(sample.root, 'linked-captures');
  await symlink(otherRoot, link);
  await assert.rejects(inspectCapture({ ...sample.context, captureRoot: link }, sample.name), /symlink escapes/);
  const image = await readFile(join(sample.directory, 'assets/example-safe.png'));
  await writeFile(join(otherRoot, 'example-safe.png'), image);
  await writeFile(join(otherRoot, 'recording.txt'), 'External recording');
  await rm(join(sample.directory, 'assets'), { recursive: true });
  await rm(join(sample.directory, 'originals'), { recursive: true });
  await symlink(otherRoot, join(sample.directory, 'assets'));
  await symlink(otherRoot, join(sample.directory, 'originals'));
  sample.manifest.recording = 'originals/recording.txt';
  await writeFile(join(sample.directory, 'manifest.json'), json(sample.manifest));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.ok(report.issues.some(issue => issue.path === 'manifest.recording' && issue.message.includes('symlink escapes')));
  assert.ok(report.issues.some(issue => issue.path === 'images.example-safe' && issue.message.includes('symlink escapes')));
  await assert.rejects(prepareCapture(sample.context, sample.name), /incomplete/);
});

test('reviewed assets cannot reuse evidence IDs or include identifying EXIF metadata', async t => {
  const sample = await recordedPackage('case', t);
  await writeFile(join(sample.root, 'src/data/evidence-images.json'), json([{ ...sample.bundle.images[0], src: '/images/evidence/existing.png' }]));
  const asset = join(sample.directory, 'assets/example-safe.png');
  const image = await sharp(await readFile(asset)).withExif({ IFD0: { Artist: 'Private account name' } }).png().toBuffer();
  await writeFile(asset, image);
  const csv = await readFile(join(sample.directory, 'evidence.csv'), 'utf8');
  await writeFile(join(sample.directory, 'evidence.csv'), csv.replace(/[a-f0-9]{64}/, createHash('sha256').update(image).digest('hex')));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.ok(report.issues.some(issue => issue.message.includes('existing evidence ID')));
  assert.ok(report.issues.some(issue => issue.message.includes('identifying image metadata')));
});

test('a complete interval reconciles steps, independent totals and preset costs, retaining verified zero', async t => {
  const sample = await recordedPackage('interval', t);
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.deepEqual(report.issues, []);
  assert.deepEqual(report.costTotals, [{ materialId: 'example-coin', amount: 0 }, { materialId: 'example-metal', amount: 30 }]);
  const target = await prepareCapture(sample.context, sample.name);
  const data = JSON.parse(await readFile(join(target, 'data/characters.json'), 'utf8'));
  assert.equal(data[0].intervals[0].costs.find((item: { materialId: string }) => item.materialId === 'example-coin').amount, 0);
});

test('unknown costs, mismatched manual totals and missing interval steps cannot become a preset', async t => {
  const sample = await recordedPackage('interval', t);
  sample.bundle.characters[0].intervals[0].costs[0].amount = null;
  sample.bundle.characters[1].intervals[0].costs[0].amount = null;
  sample.bundle.characters[1].characterId = 'another-person';
  await writeFile(join(sample.directory, 'content.json'), json(sample.bundle));
  const check = JSON.parse(await readFile(join(sample.directory, 'cost-check.json'), 'utf8'));
  check.independentTotals[0].amount = 31; check.steps[1].from = 3;
  await writeFile(join(sample.directory, 'cost-check.json'), json(check));
  const { report } = await inspectCapture(sample.context, sample.name);
  assert.equal(report.readyForReview, false);
  assert.ok(report.issues.some(issue => issue.message.includes('All costs')));
  assert.ok(report.issues.some(issue => issue.message.includes('gaps or overlaps')));
  assert.ok(report.issues.some(issue => issue.message.includes('must agree')));
  assert.ok(report.issues.some(issue => issue.message.includes('same character')));
  await assert.rejects(prepareCapture(sample.context, sample.name), /incomplete/);
});

test('CSV quoting round-trips commas, double quotes and multiline fields; malformed input is rejected', () => {
  const cells = ['assets/example.png', 'a'.repeat(64), 'https://example.test/recording', 'Test, server', 'build', '2026-11-22', 'safe', 'Line one\nLine "two"', '説明'];
  const [row] = parseEvidenceCsv(headers + cells.map(csvCell).join(',') + '\r\n');
  assert.equal(row.server, cells[3]); assert.equal(row.alt_en, cells[7]);
  for (const bad of [headers + '"unclosed', headers + 'a"b,c', headers + '"a"x,b', headers + 'a,b\n']) assert.throws(() => parseEvidenceCsv(bad));
});
