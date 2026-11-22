import { z } from 'astro/zod';
import glossary from '../data/glossary.json';
import sources from '../data/sources.json';
import { characterProfiles } from './character-profiles';
const bilingual = z.object({ en: z.string().min(1), ja: z.string().min(1) });
const schema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), en: z.string().min(1), ja: z.string().min(1), kind: z.enum(['official','site-interface']),
  sourceId: z.string().nullable(), sourceIds: z.array(z.string()).optional(), checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(['combat','investigation','places','event','items','characters']).optional(), guide: z.string().regex(/^(guides|tools)\/[a-z0-9-]+$/).optional(), definition: bilingual.optional(),
}).strict();
const terms = z.array(schema).parse(glossary);
export const referenceTerms = [
  ...terms.filter((term) => term.kind === 'official').map((term) => ({ ...term,
    category: term.category ?? 'places', guide: term.guide ?? 'guides/launch-preparation',
    sourceIds: term.sourceIds ?? [term.sourceId!], definition: term.definition ?? {en:'The official localized game title.',ja:'ゲームの公式ローカライズ名。'},
  })),
  ...characterProfiles.map((profile) => ({ id:`character-${profile.id}`, en:profile.name.en, ja:profile.name.ja,
    category:'characters', guide:`characters#${profile.id}`, sourceIds:profile.sourceIds, checkedAt:profile.checkedAt,
    definition:profile.summary,
  })),
];
export const referenceErrors = referenceTerms.flatMap((term, index) => [
  ...(referenceTerms.slice(0,index).some(other => other.id === term.id) ? [`Duplicate reference ${term.id}`] : []),
  ...term.sourceIds.filter(id => !sources.some(source => source.id === id && source.kind === 'official-website')).map(id => `Reference ${term.id}: invalid official source ${id}`),
]);
