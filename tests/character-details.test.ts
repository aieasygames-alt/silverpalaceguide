import test from 'node:test';
import assert from 'node:assert/strict';
import { characterProfiles } from '../src/lib/character-profiles';
import { characterDetails, characterDetailSchema, characterDetailErrors, validateCharacterDetails, characterHref } from '../src/lib/character-details';

test('dossiers require a full known profile, attributable sources and unique reading targets', () => {
  assert.deepEqual(characterDetailErrors, []);
  const detail = characterDetails[0];
  assert.match(validateCharacterDetails([{ ...detail, id: 'not-a-profile' }], characterProfiles).join(), /full official profile/);
  assert.match(validateCharacterDetails([{ ...detail, id: 'morgane' }], characterProfiles).join(), /full official profile/);
  assert.match(validateCharacterDetails([{ ...detail, sourceIds: ['unverified-build'] }], characterProfiles).join(), /source outside/);
  assert.match(validateCharacterDetails([detail, detail], characterProfiles).join(), /Duplicate/);
  assert.match(validateCharacterDetails([{ ...detail, sections: [detail.sections[0], detail.sections[0]] }], characterProfiles).join(), /duplicate section/);
});

test('one bilingual dossier edition requires both languages and rejects gameplay preset fields', () => {
  const detail = characterDetails[0];
  assert.equal(characterDetailSchema.safeParse({ ...detail, description: { en: 'Only English' } }).success, false);
  assert.equal(characterDetailSchema.safeParse({ ...detail, intervals: [{ from: 1, to: 2 }] }).success, false);
  assert.match(validateCharacterDetails([{ ...detail, updatedAt: '2026-01-01' }], characterProfiles).join(), /predates/);
});

test('published details resolve in both languages while every other stable profile keeps its directory anchor', () => {
  for (const locale of ['en', 'ja'] as const) {
    for (const profile of characterProfiles) {
      const hasDetail = characterDetails.some(detail => detail.id === profile.id);
      assert.equal(characterHref(locale, profile.id), hasDetail ? `/${locale}/characters/${profile.id}/` : `/${locale}/characters/#${profile.id}`);
    }
  }
});
