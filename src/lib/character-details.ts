import { z } from 'astro/zod';
import rawDetails from '../data/character-details.json';
import { characterProfiles, type CharacterProfile } from './character-profiles';
import { path, type Locale } from './i18n';

const localized = z.object({ en: z.string().trim().min(1), ja: z.string().trim().min(1) }).strict();
const id = z.string().regex(/^[a-z0-9-]+$/);
// A single bilingual edition keeps the two published versions together.
// Descriptive dossiers never accept the numerical progression model's fields.
export const characterDetailSchema = z.object({
  id,
  revision: z.number().int().positive(),
  updatedAt: z.iso.date(),
  sourceIds: z.array(id).min(1),
  description: localized,
  organization: localized,
  sections: z.array(z.object({
    id, heading: localized, paragraphs: z.array(localized).min(1),
  }).strict()).min(1),
}).strict();
export type CharacterDetail = z.infer<typeof characterDetailSchema>;
export const characterDetails = characterDetailSchema.array().parse(rawDetails);

export function validateCharacterDetails(details: CharacterDetail[], profiles: CharacterProfile[]) {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const detail of details) {
    if (ids.has(detail.id)) errors.push(`Duplicate character detail: ${detail.id}`);
    ids.add(detail.id);
    const profile = profiles.find(profile => profile.id === detail.id);
    if (!profile || profile.coverage !== 'profile') errors.push(`${detail.id}: full official profile required`);
    for (const sourceId of detail.sourceIds) {
      if (!profile?.sourceIds.includes(sourceId)) errors.push(`${detail.id}: source outside its official profile: ${sourceId}`);
    }
    if (profile && detail.updatedAt < profile.checkedAt) errors.push(`${detail.id}: edition predates source check`);
    const sections = detail.sections.map(section => section.id);
    if (new Set(sections).size !== sections.length) errors.push(`${detail.id}: duplicate section IDs`);
  }
  return errors;
}
export const characterDetailErrors = validateCharacterDetails(characterDetails, characterProfiles);

export function characterReference(id: string) {
  return characterDetails.some(detail => detail.id === id) ? `characters/${id}` : `characters#${id}`;
}

export function characterHref(locale: Locale, id: string) {
  const [suffix, anchor] = characterReference(id).split('#');
  return path(locale, suffix) + (anchor ? `#${anchor}` : '');
}
