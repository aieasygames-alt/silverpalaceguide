import { access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { cases, routes, characters, materials, evidenceImages } from '../src/lib/game-content';
import { validatePublicationSet, validateGameReferences } from '../src/lib/publication-check';
import sources from '../src/data/sources.json';
import { characterProfiles, profileReferenceErrors } from '../src/lib/character-profiles';
import { characterDetailErrors } from '../src/lib/character-details';
import { referenceErrors } from '../src/lib/references';
import { rewardEvent, rewardSlots } from '../src/lib/event-rewards';
const errors = [...validatePublicationSet([cases, routes, characters], sources), ...validateGameReferences(cases, routes, characters, materials, evidenceImages), ...profileReferenceErrors, ...characterDetailErrors, ...referenceErrors];
for (const id of rewardEvent.sourceIds) {
  if (!sources.some(source => source.id === id && source.kind === 'official-website')) errors.push(`Event reward rules: unknown official source ${id}`);
}
if (rewardSlots.length !== 10 || rewardEvent.selectionLimit !== 6 || new Set(rewardSlots.map(slot => slot.id)).size !== rewardSlots.length) errors.push('Event reward pool or claim limit differs from the checked rules');
if (!(Date.parse(rewardEvent.drawStartsAt) < Date.parse(rewardEvent.drawEndsAt) && Date.parse(rewardEvent.drawEndsAt) < Date.parse(rewardEvent.claimEndsAt))) errors.push('Invalid official event deadline order');
for (const profile of characterProfiles) {
  for (const id of profile.portraitIds) {
    try { await access(`src/assets/characters/${id}.png`); } catch { errors.push(`Profile ${profile.id}: missing portrait ${id}`); }
  }
}
for (const image of evidenceImages) {
  if (!sources.some((source) => source.id === image.sourceId && source.kind === 'gameplay-record')) errors.push(`Image ${image.id}: gameplay source required`);
  try { await access(`public${image.src}`); } catch { errors.push(`Image ${image.id}: missing file`); }
}
assert.equal(errors.length, 0, errors.join('\n'));
console.log('Game content verified: publication evidence, bilingual revisions/IDs, costs and spoiler-safe images.');
