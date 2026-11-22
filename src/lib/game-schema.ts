import { z } from 'astro/zod';

export const stableId = z.string().regex(/^[a-z0-9-]+$/).max(24);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Invalid calendar date');
const text = z.string().trim().min(1);
const imageIds = z.array(stableId).default([]);
export const publication = z.object({
  id: text, translationId: stableId, locale: z.enum(['en', 'ja']), slug: stableId,
  title: text, summary: text, status: z.enum(['draft', 'published']),
  revision: z.number().int().positive(), sourceRevision: z.number().int().positive(),
  checkedRevision: z.number().int().positive(), updatedAt: date, checkedAt: date,
  server: text, build: text, verification: z.enum(['unverified', 'gameplay-verified']),
  sourceIds: z.array(stableId), prerequisites: z.array(text),
});
const hint = z.object({ text, imageIds });
export const caseSchema = publication.extend({
  safeImageIds: imageIds,
  stages: z.array(z.object({ id: stableId, title: text, objective: text, clueIds: z.array(stableId), hints: z.tuple([hint, hint, hint]) })).min(1),
});
export const routeSchema = publication.extend({
  area: text, start: text, completion: text, safeImageIds: imageIds,
  steps: z.array(z.object({ id: stableId, title: text, instruction: text, checklistText: text.max(200), imageIds })).min(1),
});
export const evidenceSchema = z.object({
  id: stableId, src: z.string().regex(/^\/images\/evidence\/[a-z0-9-]+\.(?:webp|png|jpg)$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
  alt: z.object({ en: text, ja: text }), spoiler: z.enum(['safe', 'hint', 'answer']),
  sourceId: stableId, server: text, build: text, checkedAt: date,
});
const label = z.object({ en: text.max(60), ja: text.max(60) });
export const materialSchema = z.object({ id: stableId, name: label });
export const characterSchema = publication.extend({
  characterId: stableId,
  intervals: z.array(z.object({
    id: stableId, label: text, costsComplete: z.boolean(), from: z.number().int().nonnegative(), to: z.number().int().positive(),
    // null means unknown; an explicit zero is a verified zero cost.
    costs: z.array(z.object({ materialId: stableId, amount: z.number().int().min(0).max(1_000_000_000).nullable() })).min(1),
  }).refine((interval) => interval.to > interval.from, 'Interval end must follow its start')).min(1),
});
export type GameCase = z.infer<typeof caseSchema>;
export type ExplorationRoute = z.infer<typeof routeSchema>;
export type Character = z.infer<typeof characterSchema>;
export type EvidenceImage = z.infer<typeof evidenceSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Publication = z.infer<typeof publication>;
