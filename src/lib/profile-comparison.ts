export const COMPARISON_SLOTS = ['a', 'b', 'c'] as const;
export function readComparison(params: URLSearchParams, validIds: string[]): string[] {
  const used = new Set<string>();
  return COMPARISON_SLOTS.map((slot) => {
    const id = params.get(slot) ?? '';
    if (!validIds.includes(id) || used.has(id)) return '';
    used.add(id);
    return id;
  });
}
export function comparisonQuery(ids: string[]): string {
  const params = new URLSearchParams();
  COMPARISON_SLOTS.forEach((slot, index) => { if (ids[index]) params.set(slot, ids[index]); });
  const query = params.toString();
  return query ? `?${query}` : '';
}
