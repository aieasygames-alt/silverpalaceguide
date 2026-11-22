export function normalizeReference(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
}
export function matchesReference(query: string, text: string) {
  const normalized = normalizeReference(text);
  return normalizeReference(query).split(' ').every((word) => normalized.includes(word));
}
