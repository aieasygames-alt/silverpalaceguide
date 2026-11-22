import { access, copyFile, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, isAbsolute, join, relative, sep } from 'node:path';
import { z } from 'astro/zod';
import sharp from 'sharp';
import { caseSchema, routeSchema, characterSchema, materialSchema, evidenceSchema, stableId, type Publication } from '../../src/lib/game-schema';
import { validateGameReferences, validatePublicationSet } from '../../src/lib/publication-check';
import { captureTemplate, manifestTemplate, costCheckTemplate, type CaptureKind } from './capture-template';

const text = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Invalid calendar date');
const webUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Use an HTTPS URL without credentials');
const sourceSchema = z.object({
  id: stableId, title: text, url: webUrl, publisher: text, checkedAt: date,
  kind: z.enum(['gameplay-record', 'official-website', 'official-social', 'official-press-release']),
  facts: z.array(text).min(1), limitations: text, assets: text, publishedAt: date.optional(),
  server: text.optional(), build: text.optional(), capturedAt: date.optional(),
}).strict();
const manifestSchema = z.object({
  schemaVersion: z.literal(1).optional(), id: stableId, kind: z.enum(['case', 'route', 'interval']),
  status: z.enum(['awaiting-capture', 'captured', 'reproduced', 'ready-for-review']),
  server: text.nullable(), build: text.nullable(), capturedAt: date.nullable(),
  englishName: text.nullable(), japaneseName: text.nullable(),
  nameSources: z.array(z.object({ locale: z.enum(['en', 'ja']), url: webUrl }).strict()),
  recording: text.nullable(), reproducedAt: date.nullable(),
  reviewedAt: z.object({ en: date.nullable(), ja: date.nullable(), spoilers: date.nullable() }).strict().optional(),
  unresolved: z.array(text),
}).strict();
const bundleSchema = z.object({
  cases: z.array(caseSchema.strict()), routes: z.array(routeSchema.strict()),
  characters: z.array(characterSchema.strict()), materials: z.array(materialSchema.strict()),
  images: z.array(evidenceSchema.strict()), sources: z.array(sourceSchema),
}).strict();
const cost = z.object({ materialId: stableId, amount: z.number().int().min(0).max(1_000_000_000) }).strict();
const costCheckSchema = z.object({
  intervalId: stableId, coverageNote: text,
  steps: z.array(z.object({
    from: z.number().int().nonnegative(), to: z.number().int().positive(),
    imageIds: z.array(stableId).min(1), costs: z.array(cost).min(1),
  }).strict()).min(1),
  independentTotals: z.array(cost).min(1),
}).strict();
export type CaptureBundle = z.infer<typeof bundleSchema>;
type Bundle = CaptureBundle;
export interface CaptureIssue { path: string; message: string; }
export interface CaptureReport {
  package: string; readyForReview: boolean; issues: CaptureIssue[];
  counts: { entries: number; images: number; materials: number };
  costTotals: Array<{ materialId: string; amount: number }>;
}
export interface CaptureContext { projectRoot: string; captureRoot: string; }
const isWithin = (root: string, path: string) => { const rest = relative(root, path); return rest === '' || (!rest.startsWith(`..${sep}`) && rest !== '..' && !isAbsolute(rest)); };
async function confined(root: string, path: string) {
  const actualRoot = await realpath(root), actual = await realpath(path);
  if (!isWithin(actualRoot, actual)) throw new Error('Path must stay inside its capture directory; symlink escapes are rejected');
  return actual;
}
async function readJson(file: string): Promise<unknown> { return JSON.parse(await readFile(file, 'utf8')); }
const stringify = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
function parse<T>(schema: z.ZodType<T>, value: unknown, prefix: string, issues: CaptureIssue[]): T | undefined {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  for (const issue of parsed.error.issues) issues.push({ path: [prefix, ...issue.path].join('.'), message: issue.message });
}

/** RFC 4180 quoting, including commas/newlines and escaped quotes. No guessing malformed rows. */
export function parseEvidenceCsv(source: string) {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Unexpected quote in evidence.csv');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ''; closed = false;
      if (char !== ',') { if (row.some(Boolean)) rows.push(row); row = []; if (char === '\r' && source[i + 1] === '\n') i++; }
    } else { if (closed) throw new Error('Unexpected text after quoted CSV field'); field += char; }
  }
  if (quoted) throw new Error('Unclosed quoted field in evidence.csv');
  if (field || row.length) { row.push(field); if (row.some(Boolean)) rows.push(row); }
  const header = rows.shift() ?? [];
  const required = ['file', 'sha256', 'source_url_or_record', 'server', 'build', 'captured_at', 'spoiler_safe_hint_answer', 'alt_en', 'alt_ja'];
  if (JSON.stringify(header) !== JSON.stringify(required)) throw new Error('evidence.csv header does not match the capture template');
  return rows.map((values, index) => {
    if (values.length !== header.length) throw new Error(`evidence.csv row ${index + 2}: wrong column count`);
    return Object.fromEntries(header.map((key, i) => [key, values[i]]));
  });
}

export async function createCapture(context: CaptureContext, kind: CaptureKind, id: string) {
  if (!['case', 'route', 'interval'].includes(kind) || !/^[a-z0-9][a-z0-9-]{0,23}$/.test(id)) throw new Error('Use case|route|interval and a 1–24 character lowercase stable ID');
  await mkdir(context.captureRoot, { recursive: true });
  await confined(context.projectRoot, context.captureRoot);
  const target = join(context.captureRoot, `${kind}-${id}`);
  const template = await readFile(join(context.projectRoot, 'docs/capture-kit', `${kind}.md`), 'utf8');
  // Write the template before reserving the destination; never replace an existing folder.
  const temporary = await mkdtemp(join(context.captureRoot, '.new-'));
  try {
    await mkdir(join(temporary, 'originals')); await mkdir(join(temporary, 'assets'));
    await writeFile(join(temporary, 'record.md'), `稳定 ID：${id}\n采集类型：${kind}\n\n${template}`, { flag: 'wx' });
    await writeFile(join(temporary, 'evidence.csv'), 'file,sha256,source_url_or_record,server,build,captured_at,spoiler_safe_hint_answer,alt_en,alt_ja\n', { flag: 'wx' });
    await writeFile(join(temporary, 'manifest.json'), stringify(manifestTemplate(kind, id)), { flag: 'wx' });
    await writeFile(join(temporary, 'content.json'), stringify(captureTemplate(kind, id)), { flag: 'wx' });
    if (kind === 'interval') await writeFile(join(temporary, 'cost-check.json'), stringify(costCheckTemplate(id)), { flag: 'wx' });
    // Reserve the name without replacing even an existing empty directory.
    await mkdir(target);
    for (const entry of await readdir(temporary)) await rename(join(temporary, entry), join(target, entry));
    return target;
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

async function loadCatalog(context: CaptureContext) {
  const names = ['cases', 'routes', 'characters', 'materials', 'sources', 'images'] as const;
  const entries = await Promise.all(names.map(async name => [name, await readJson(join(context.projectRoot, 'src/data', `${name === 'images' ? 'evidence-images' : name}.json`))] as const));
  return Object.fromEntries(entries) as Pick<Bundle, typeof names[number]>;
}
function mergedById<T extends { id: string }>(existing: T[], incoming: T[], label: string, issues: CaptureIssue[]) {
  const seen = new Set<string>(), merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) issues.push({ path: label, message: `Duplicate ID: ${item.id}` });
    seen.add(item.id);
    const previous = existing.find(other => other.id === item.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(item)) issues.push({ path: label, message: `Existing ID has different data: ${item.id}` });
    if (!previous) merged.push(item);
  }
  return merged;
}

export async function inspectCapture(context: CaptureContext, name: string) {
  if (!/^(case|route|interval)-[a-z0-9][a-z0-9-]{0,23}$/.test(name)) throw new Error('Use a capture folder name, such as case-resurrection-mystery');
  await confined(context.projectRoot, context.captureRoot);
  const directory = await confined(context.captureRoot, join(context.captureRoot, name));
  const issues: CaptureIssue[] = [];
  const report: CaptureReport = { package: name, readyForReview: false, issues, counts: { entries: 0, images: 0, materials: 0 }, costTotals: [] };
  const issue = (path: string, message: string) => issues.push({ path, message });
  async function json(file: string) { try { return await readJson(await confined(directory, join(directory, file))); } catch (error) { issue(file, error instanceof Error ? error.message : 'Cannot read file'); return undefined; } }
  const manifest = parse(manifestSchema, await json('manifest.json'), 'manifest', issues);
  const bundle = parse(bundleSchema, await json('content.json'), 'content', issues);
  if (!manifest) return { report, directory };
  if (`${manifest.kind}-${manifest.id}` !== name) issue('manifest.id', 'ID/kind must match the folder name');
  for (const key of ['server', 'build', 'capturedAt', 'englishName', 'japaneseName', 'recording', 'reproducedAt'] as const) if (manifest[key] === null) issue(`manifest.${key}`, 'Required before editorial review; keep unknown values null');
  if (manifest.status !== 'ready-for-review') issue('manifest.status', 'Set ready-for-review only after recording, reproduction and bilingual review');
  for (const locale of ['en', 'ja', 'spoilers'] as const) if (!manifest.reviewedAt?.[locale]) issue(`manifest.reviewedAt.${locale}`, 'Record completion of this editorial check');
  if (manifest.unresolved.length) issue('manifest.unresolved', `${manifest.unresolved.length} unresolved item(s) remain`);
  if (manifest.capturedAt && manifest.reproducedAt && manifest.reproducedAt < manifest.capturedAt) issue('manifest.reproducedAt', 'Reproduction cannot precede capture');
  for (const at of Object.values(manifest.reviewedAt ?? {})) if (at && manifest.reproducedAt && at < manifest.reproducedAt) issue('manifest.reviewedAt', 'Editorial review cannot precede reproduction');
  if (manifest.recording) {
    if (/^https:/i.test(manifest.recording)) { if (!webUrl.safeParse(manifest.recording).success) issue('manifest.recording', 'Invalid recording URL'); }
    else try {
      if (!manifest.recording.startsWith('originals/')) throw new Error('Local recordings belong in originals/');
      await confined(directory, join(directory, 'originals'));
      const file = await confined(join(directory, 'originals'), join(directory, manifest.recording));
      if (!(await stat(file)).isFile() || !(await stat(file)).size) throw new Error('Recording must be a nonempty file');
    } catch (error) { issue('manifest.recording', (error as Error).message); }
  }
  if (!bundle) return { report, directory };
  if (/PRIVATE_(?:HINT|CLUE|ANSWER)_SENTINEL|fixture-(?:case|route|character|material)|spg(?:hint|clue|answer)zzqx/.test(JSON.stringify(bundle))) issue('content', 'Development fixtures cannot become capture evidence');
  const catalog = await loadCatalog(context);
  const sources = mergedById(catalog.sources, bundle.sources, 'content.sources', issues);
  const materials = mergedById(catalog.materials, bundle.materials, 'content.materials', issues);
  for (const image of bundle.images) if (catalog.images.some(existing => existing.id === image.id)) issue(`images.${image.id}`, 'An existing evidence ID cannot be overwritten by a first-capture package');
  const group = manifest.kind === 'case' ? bundle.cases : manifest.kind === 'route' ? bundle.routes : bundle.characters;
  const allEntries = [...bundle.cases, ...bundle.routes, ...bundle.characters];
  report.counts = { entries: allEntries.length, images: bundle.images.length, materials: bundle.materials.length };
  if (group.length !== 2 || allEntries.length !== 2 || new Set(group.map(entry => entry.locale)).size !== 2) issue('content', 'A package must contain exactly one English/Japanese pair of its declared kind');
  for (const locale of ['en', 'ja'] as const) {
    const names = manifest.nameSources.filter(source => source.locale === locale);
    if (!names.some(nameSource => sources.some(source => source.url === nameSource.url && ['official-website', 'official-social'].includes(source.kind)))) issue(`manifest.nameSources.${locale}`, 'Register the official localized name source URL');
  }
  for (const entry of allEntries) {
    if (entry.translationId !== manifest.id || entry.slug !== manifest.id) issue(entry.id, 'Route and translation ID must match this capture ID');
    if (entry.status !== 'draft') issue(`${entry.id}.status`, 'Capture content must remain draft; this command never publishes');
    if (entry.title !== (entry.locale === 'en' ? manifest.englishName : manifest.japaneseName)) issue(`${entry.id}.title`, 'Title must match the bilingual manifest');
    if (entry.server !== manifest.server || entry.build !== manifest.build) issue(`${entry.id}.scope`, 'Entry scope differs from the capture');
    if (entry.checkedRevision !== entry.revision) issue(`${entry.id}.checkedRevision`, 'Current revision must have been reproduced');
    if (entry.checkedAt < (manifest.reproducedAt ?? '') || entry.updatedAt < (manifest.capturedAt ?? '')) issue(`${entry.id}.dates`, 'Entry dates cannot precede capture/reproduction');
    if (entry.locale === 'ja' && entry.sourceRevision !== group.find(other => other.locale === 'en')?.revision) issue(`${entry.id}.sourceRevision`, 'Japanese content must match the current English revision');
    const previous = [...catalog.cases, ...catalog.routes, ...catalog.characters].find(other => other.id === entry.id);
    if (previous) issue(entry.id, 'An existing content ID cannot be overwritten by a first-capture package');
    const gameplay = entry.sourceIds.map(id => sources.find(source => source.id === id)).filter(source => source?.kind === 'gameplay-record');
    if (!gameplay.some(source => source?.server === manifest.server && source.build === manifest.build && source.capturedAt === manifest.capturedAt)) issue(`${entry.id}.sourceIds`, 'A gameplay record with matching server, build and capture date is required');
  }
  const proposed = (entries: Publication[]) => entries.map(entry => ({ ...entry, status: 'published' as const }));
  validatePublicationSet([proposed(bundle.cases), proposed(bundle.routes), proposed(bundle.characters)], sources).forEach(message => issue('publication', message));
  validateGameReferences(bundle.cases, bundle.routes, bundle.characters, materials, bundle.images).forEach(message => issue('references', message));
  if (manifest.kind !== 'interval') {
    for (const entry of [...bundle.cases, ...bundle.routes]) if (!entry.safeImageIds.length) issue(`${entry.id}.safeImageIds`, 'Include a safe starting/context image');
    for (const entry of bundle.cases) for (const stage of entry.stages) if (!stage.hints.some(hint => hint.imageIds.length)) issue(`${entry.id}.${stage.id}`, 'Link at least one recorded image for each stage');
    for (const entry of bundle.routes) for (const step of entry.steps) if (!step.imageIds.length) issue(`${entry.id}.${step.id}`, 'Link a recorded image for each route step');
  }
  const assetFiles = new Map<string, string>();
  let rows: ReturnType<typeof parseEvidenceCsv> = [];
  try { rows = parseEvidenceCsv(await readFile(await confined(directory, join(directory, 'evidence.csv')), 'utf8')); }
  catch (error) { issue('evidence.csv', (error as Error).message); }
  for (const row of rows) {
    if (!/^assets\/[a-z0-9-]+\.(png|jpg|webp)$/.test(row.file)) { issue('evidence.csv.file', 'Only reviewed images in assets/ can enter a review bundle'); continue; }
    const output = `/images/evidence/${basename(row.file)}`;
    if (assetFiles.has(output)) { issue('evidence.csv.file', `Duplicate asset: ${row.file}`); continue; }
    assetFiles.set(output, join(directory, row.file));
  }
  for (const image of bundle.images) {
    const file = assetFiles.get(image.src), row = rows.find(item => `/images/evidence/${basename(item.file)}` === image.src);
    if (!file || !row) { issue(`images.${image.id}`, 'Missing reviewed asset/evidence.csv row'); continue; }
    if (image.server !== manifest.server || image.build !== manifest.build || row.server !== manifest.server || row.build !== manifest.build || row.captured_at !== manifest.capturedAt) issue(`images.${image.id}`, 'Image or evidence row has a different capture scope');
    if (image.checkedAt < (manifest.capturedAt ?? '') || !allEntries.every(entry => entry.sourceIds.includes(image.sourceId))) issue(`images.${image.id}`, 'Image source/date does not match the bilingual entries');
    const imageSource = sources.find(source => source.id === image.sourceId);
    if (imageSource?.kind !== 'gameplay-record' || imageSource.server !== manifest.server || imageSource.build !== manifest.build || imageSource.capturedAt !== manifest.capturedAt) issue(`images.${image.id}`, 'Image needs a gameplay record with matching capture scope');
    if (row.spoiler_safe_hint_answer !== image.spoiler || row.alt_en !== image.alt.en || row.alt_ja !== image.alt.ja) issue(`images.${image.id}`, 'Spoiler level/alt text differs from evidence.csv');
    if (row.source_url_or_record !== manifest.recording && row.source_url_or_record !== imageSource?.url) issue(`images.${image.id}`, 'Evidence row must identify the declared recording or gameplay source URL');
    try {
      await confined(directory, join(directory, 'assets'));
      const actual = await confined(join(directory, 'assets'), file);
      const bytes = await readFile(actual), metadata = await sharp(bytes, { limitInputPixels: 60_000_000 }).metadata();
      if (createHash('sha256').update(bytes).digest('hex') !== row.sha256) issue(`images.${image.id}`, 'SHA-256 differs from the recorded asset');
      if (metadata.width !== image.width || metadata.height !== image.height) issue(`images.${image.id}`, 'Actual image dimensions differ');
      const expected = image.src.endsWith('.jpg') ? 'jpeg' : image.src.endsWith('.png') ? 'png' : 'webp';
      if (metadata.format !== expected) issue(`images.${image.id}`, 'Image extension does not match its format');
      if (metadata.exif || metadata.xmp || metadata.iptc) issue(`images.${image.id}`, 'Remove identifying image metadata from the reviewed asset');
      try { await access(join(context.projectRoot, 'public', image.src)); issue(`images.${image.id}`, 'An existing public image path cannot be overwritten'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    } catch (error) { issue(`images.${image.id}`, (error as Error).message); }
  }
  if (rows.length !== bundle.images.length) issue('evidence.csv', 'Every reviewed row must map to exactly one content image');
  if (manifest.kind === 'interval') {
    if (new Set(bundle.characters.map(entry => entry.characterId)).size !== 1) issue('content.characters.characterId', 'English/Japanese intervals must refer to the same character');
    const checked = parse(costCheckSchema, await json('cost-check.json'), 'cost-check', issues);
    const entry = bundle.characters.find(item => item.locale === 'en');
    if (!entry || entry.intervals.length !== 1) issue('content.characters', 'Capture one complete interval at a time');
    if (checked && entry?.intervals.length === 1) {
      const interval = entry.intervals[0];
      if (!interval.costsComplete || interval.costs.some(item => item.amount === null)) issue('costsComplete', 'All costs, including currencies, must be known and independently checked');
      if (checked.intervalId !== interval.id) issue('cost-check.intervalId', 'Interval ID differs');
      const ids = interval.costs.map(item => item.materialId).sort(), totals = new Map(ids.map(id => [id, 0]));
      let position = interval.from;
      for (const [index, step] of checked.steps.entries()) {
        if (step.from !== position || step.to <= step.from) issue(`cost-check.steps.${index}`, 'Steps must cover the interval in order without gaps or overlaps');
        position = step.to;
        if (JSON.stringify(step.costs.map(item => item.materialId).sort()) !== JSON.stringify(ids)) issue(`cost-check.steps.${index}.costs`, 'Record every material at every step, including verified zero costs');
        for (const item of step.costs) totals.set(item.materialId, (totals.get(item.materialId) ?? 0) + item.amount);
        for (const id of step.imageIds) if (!bundle.images.some(image => image.id === id)) issue(`cost-check.steps.${index}.imageIds`, `Missing cost evidence: ${id}`);
      }
      if (position !== interval.to) issue('cost-check.steps', 'Steps do not end at the target interval');
      if (JSON.stringify(checked.independentTotals.map(item => item.materialId).sort()) !== JSON.stringify(ids)) issue('cost-check.independentTotals', 'Independent totals must list every material exactly once');
      for (const item of interval.costs) if (totals.get(item.materialId) !== item.amount || checked.independentTotals.find(total => total.materialId === item.materialId)?.amount !== item.amount) issue(`cost-check.${item.materialId}`, 'Step sum, independent total and preset quantity must agree');
      report.costTotals = [...totals].map(([materialId, amount]) => ({ materialId, amount }));
    }
  }
  report.readyForReview = issues.length === 0;
  return { report, directory, bundle, assetFiles };
}

export function reportMarkdown(report: CaptureReport) {
  return `# ${report.package}\n\n${report.readyForReview ? 'READY FOR EDITORIAL REVIEW — this is not a publication or factual-verification certificate.' : 'INCOMPLETE — no content was staged or published.'}\n\nEntries: ${report.counts.entries}; images: ${report.counts.images}; materials: ${report.counts.materials}.\n\n` +
    (report.issues.length ? report.issues.map(issue => `- ${issue.path.replace(/[\r\n]/g, ' ')}: ${issue.message.replace(/[\r\n]/g, ' ')}`).join('\n') : 'Structural, source-scope, image and cost checks passed. Review the actual recording, bilingual wording and spoiler boundaries before publishing.') + '\n';
}

export async function prepareCapture(context: CaptureContext, name: string) {
  const result = await inspectCapture(context, name);
  if (!result.report.readyForReview || !result.bundle) throw new Error(`Capture is incomplete (${result.report.issues.length} issues). Run capture:check; no bundle was written.`);
  const destination = join(result.directory, 'review');
  try { await access(destination); throw new Error('review/ already exists; previous review was not overwritten. Use a new capture ID for a new recording.'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const temporary = await mkdtemp(join(result.directory, '.review-'));
  try {
    await mkdir(join(temporary, 'data')); await mkdir(join(temporary, 'public/images/evidence'), { recursive: true });
    for (const [key, entries] of Object.entries(result.bundle)) await writeFile(join(temporary, 'data', key === 'images' ? 'evidence-images.json' : `${key}.json`), stringify(entries), { flag: 'wx' });
    for (const image of result.bundle.images) {
      const file = result.assetFiles!.get(image.src)!;
      await copyFile(await confined(join(result.directory, 'assets'), file), join(temporary, 'public', image.src));
    }
    await writeFile(join(temporary, 'report.json'), stringify(result.report), { flag: 'wx' });
    await writeFile(join(temporary, 'README.md'), reportMarkdown(result.report) + '\nOnly draft data and reviewed assets are included. Original recordings, manifest, private notes and CSV ledger are excluded. Merge by ID using docs/content-workflow.md; do not replace an entire existing data file.\n', { flag: 'wx' });
    // Re-read assets and metadata before finalizing, so an edit during preparation fails closed.
    const rechecked = await inspectCapture(context, name);
    if (!rechecked.report.readyForReview || stringify(rechecked.bundle) !== stringify(result.bundle)) throw new Error('Capture changed during preparation; retry after review');
    for (const image of result.bundle.images) {
      const source = await readFile(result.assetFiles!.get(image.src)!);
      const copied = await readFile(join(temporary, 'public', image.src));
      if (!source.equals(copied)) throw new Error('Image changed during preparation');
    }
    await rename(temporary, destination);
    return destination;
  } catch (error) { await rm(temporary, { recursive: true, force: true }); throw error; }
}

export async function captureStatus(context: CaptureContext) {
  try {
    await confined(context.projectRoot, context.captureRoot);
    const directories = await readdir(context.captureRoot, { withFileTypes: true });
    const packages = directories.filter(entry => (entry.isDirectory() || entry.isSymbolicLink()) && /^(case|route|interval)-/.test(entry.name)).sort((a,b) => a.name.localeCompare(b.name));
    const results = await Promise.allSettled(packages.map(async entry => (await inspectCapture(context, entry.name)).report));
    return results.map((result, index) => result.status === 'fulfilled' ? result.value : { package: packages[index].name, error: (result.reason as Error).message });
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}
