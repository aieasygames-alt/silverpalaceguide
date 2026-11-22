import test from 'node:test';
import assert from 'node:assert/strict';
import { characterProfiles, profileSchema, profileReferenceErrors, validateProfileReferences } from '../src/lib/character-profiles';
import { characterSchema } from '../src/lib/game-schema';
import { readComparison, comparisonQuery } from '../src/lib/profile-comparison';

test('official introductions cannot silently supply progression costs or verified presets', () => {
  assert.deepEqual(profileReferenceErrors, []);
  assert.equal(profileSchema.safeParse({ ...characterProfiles[0], intervals: [{ from: 1, to: 2 }] }).success, false);
  assert.equal(characterSchema.safeParse(characterProfiles[0]).success, false);
  assert.ok(validateProfileReferences(characterProfiles, [{ id: 'official-roles-en', kind: 'gameplay-record' }]).length > 0);
});
test('profile references reject duplicate IDs and mismatched localized identities', () => {
  const p = characterProfiles[0];
  const sources = p.sourceIds.map((id) => ({ id, kind: 'official-website' }));
  assert.match(validateProfileReferences([p, p], sources).join(), /Duplicate/);
  assert.match(validateProfileReferences([{ ...p, titles: { en: ['One'], ja: ['一', '二'] } }], sources).join(), /mismatched/);
});
test('comparison links keep stable IDs, discard unknown or duplicate selections and preserve empty slots', () => {
  const valid = ['alf', 'argos'];
  assert.deepEqual(readComparison(new URLSearchParams('a=alf&b=alf&c=argos&notes=private'), valid), ['alf', '', 'argos']);
  assert.deepEqual(readComparison(new URLSearchParams('a=%3Cscript%3E&b=fixture-character'), valid), ['', '', '']);
  const query = comparisonQuery(['alf', '', 'argos']);
  assert.equal(query, '?a=alf&c=argos');
  assert.deepEqual(readComparison(new URLSearchParams(query), valid), ['alf', '', 'argos']);
  assert.equal(comparisonQuery(['', '', '']), '');
});
