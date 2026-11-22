import { access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { cases, routes, characters, materials, evidenceImages } from '../src/lib/game-content';
import { validatePublicationSet, validateGameReferences } from '../src/lib/publication-check';
import sources from '../src/data/sources.json';
const errors = [...validatePublicationSet([cases, routes, characters], sources), ...validateGameReferences(cases, routes, characters, materials, evidenceImages)];
for (const image of evidenceImages) {
  if (!sources.some((source) => source.id === image.sourceId && source.kind === 'gameplay-record')) errors.push(`Image ${image.id}: gameplay source required`);
  try { await access(`public${image.src}`); } catch { errors.push(`Image ${image.id}: missing file`); }
}
assert.equal(errors.length, 0, errors.join('\n'));
console.log('Game content verified: publication evidence, bilingual revisions/IDs, costs and spoiler-safe images.');
