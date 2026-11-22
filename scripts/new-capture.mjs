import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const templates = { case: 'case.md', route: 'route.md', interval: 'interval.md' };
const [kind, id, ...extra] = process.argv.slice(2);
if (!Object.hasOwn(templates, kind ?? '') || !/^[a-z0-9][a-z0-9-]{0,23}$/.test(id ?? '') || extra.length) {
  console.error('Usage: npm run capture:new -- <case|route|interval> <stable-id (1–24 lowercase letters, digits, hyphens)>');
  process.exitCode = 1;
} else {
  const directory = resolve(projectRoot, 'artifacts/private/captures', `${kind}-${id}`);
  // A dedicated new folder prevents overwriting an existing recording or screenshot.
  const template = await readFile(join(projectRoot, 'docs/capture-kit', templates[kind]), 'utf8');
  await mkdir(resolve(projectRoot, 'artifacts/private/captures'), { recursive: true });
  try { await mkdir(directory); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.error(`Capture already exists; nothing changed: ${directory}`);
    process.exitCode = 1;
  }
  if (!process.exitCode) {
    await mkdir(join(directory, 'originals'));
    await writeFile(join(directory, 'record.md'), `稳定 ID：${id}\n采集类型：${kind}\n\n${template}`, { flag: 'wx' });
    await writeFile(join(directory, 'evidence.csv'), 'file,sha256,source_url_or_record,server,build,captured_at,spoiler_safe_hint_answer,alt_en,alt_ja\n', { flag: 'wx' });
    await writeFile(join(directory, 'manifest.json'), JSON.stringify({
      id, kind, status: 'awaiting-capture', server: null, build: null, capturedAt: null,
      englishName: null, japaneseName: null, nameSources: [], recording: null,
      reproducedAt: null, unresolved: [],
    }, null, 2) + '\n', { flag: 'wx' });
    console.log(`Created private capture package: ${directory}\nFill record.md and evidence.csv; keep originals in originals/. This does not publish game content.`);
  }
}
