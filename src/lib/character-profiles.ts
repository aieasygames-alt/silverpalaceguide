import { z } from 'astro/zod';
import rawProfiles from '../data/character-profiles.json';
import sources from '../data/sources.json';
import { stableId } from './game-schema';
const bilingual = z.object({ en: z.string().trim().min(1), ja: z.string().trim().min(1) }).strict();
// Official introductions have their own scope. They never become progression presets.
export const profileSchema = z.object({
  id: stableId, name: bilingual,
  titles: z.object({ en: z.array(z.string().min(1)).min(1), ja: z.array(z.string().min(1)).min(1) }).strict(),
  summary: bilingual, equipment: bilingual.nullable(), combat: bilingual.nullable(),
  coverage: z.enum(['profile', 'introduction']), portraitIds: z.array(stableId).min(1),
  sourceIds: z.array(stableId).min(1), checkedAt: z.iso.date(),
}).strict();
export type CharacterProfile = z.infer<typeof profileSchema>;
export const characterProfiles = profileSchema.array().parse(rawProfiles);
export function validateProfileReferences(profiles: CharacterProfile[], register: { id: string; kind: string }[]) {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const profile of profiles) {
    if (ids.has(profile.id)) errors.push(`Duplicate character profile: ${profile.id}`);
    ids.add(profile.id);
    if (profile.titles.en.length !== profile.titles.ja.length || profile.titles.en.length !== profile.portraitIds.length) errors.push(`${profile.id}: mismatched localized identities`);
    for (const id of profile.sourceIds) {
      if (!register.some((source) => source.id === id && source.kind === 'official-website')) errors.push(`${profile.id}: official website source required: ${id}`);
    }
  }
  return errors;
}
export const profileReferenceErrors = validateProfileReferences(characterProfiles, sources);
