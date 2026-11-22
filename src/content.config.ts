import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { caseSchema, routeSchema, characterSchema } from './lib/game-schema';
import { z } from 'astro/zod';
import sources from './data/sources.json';

const sourceIds = new Set(sources.map((source) => source.id));
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    translationId: z.string(),
    locale: z.enum(['en', 'ja']),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    summary: z.string(),
    category: z.enum(['preparation', 'field-notes', 'tools']),
    status: z.enum(['draft', 'published']),
    verification: z.enum(['official-announcement', 'editorial']),
    gameVersion: z.string(),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    revision: z.number().int().positive(),
    sourceRevision: z.number().int().positive(),
    sourceIds: z.array(z.string().refine((id) => sourceIds.has(id), 'Unknown source ID')).min(1),
    order: z.number(),
  }),
});
export const collections = {
  guides,
  cases: defineCollection({ loader: file('./src/data/cases.json'), schema: caseSchema }),
  routes: defineCollection({ loader: file('./src/data/routes.json'), schema: routeSchema }),
  characters: defineCollection({ loader: file('./src/data/characters.json'), schema: characterSchema }),
};
