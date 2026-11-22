import { getCollection } from 'astro:content';
import { validateGuideRevisions } from './editorial';
import type { Locale } from './i18n';

export async function publishedGuides(locale?: Locale) {
  const all = await getCollection('guides');
  const errors = validateGuideRevisions(all.map((entry) => entry.data));
  if (errors.length) throw new Error(errors.join('\n'));
  const entries = all.filter(({ data }) => data.status === 'published' && (!locale || data.locale === locale));
  return entries.sort((a, b) => a.data.order - b.data.order);
}
