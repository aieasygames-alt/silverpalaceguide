import sources from '../data/sources.json';

interface SourceCheck { id: string; checkedAt: string; }
interface GuideUpdate { slug: string; updatedAt: string; sourceIds: string[]; }

// A mixed set of sources must not be presented as if all were checked today.
export function sourceCheckRange(sourceIds: string[], register: SourceCheck[] = sources) {
  if (!sourceIds.length) throw new Error('A guide needs checked sources');
  const dates = sourceIds.map(id => {
    const source = register.find(source => source.id === id);
    if (!source) throw new Error(`Unknown guide source: ${id}`);
    return source.checkedAt;
  }).sort();
  return { first: dates[0], last: dates[dates.length - 1] };
}

export function recentGuideUpdates<T extends GuideUpdate>(guides: T[], limit = 4, register: SourceCheck[] = sources) {
  return guides.map(guide => ({ guide, checked: sourceCheckRange(guide.sourceIds, register).last }))
    .sort((a, b) => b.guide.updatedAt.localeCompare(a.guide.updatedAt) || b.checked.localeCompare(a.checked) || a.guide.slug.localeCompare(b.guide.slug))
    .slice(0, Math.max(0, limit)).map(entry => entry.guide);
}
