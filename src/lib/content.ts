import { getCollection } from 'astro:content';
import type { Locale } from './i18n';

export async function publishedGuides(locale?: Locale) {
  const entries = await getCollection('guides', ({ data }) => data.status === 'published' && (!locale || data.locale === locale));
  return entries.sort((a, b) => a.data.order - b.data.order);
}
