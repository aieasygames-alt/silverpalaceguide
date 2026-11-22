export interface NoteItem { id: string; text: string; done: boolean; }
export interface FieldNotes { type: 'spg-field-notes'; schemaVersion: 1; items: NoteItem[]; }
export const NOTES_KEY = 'spg:field-notes:v1';
export function validateNotes(input: unknown): FieldNotes {
  if (!input || typeof input !== 'object') throw new Error('format');
  const data = input as Record<string, unknown>;
  if (data.type !== 'spg-field-notes' || data.schemaVersion !== 1 || !Array.isArray(data.items) || data.items.length > 200) throw new Error('format');
  const ids = new Set<string>();
  const items = data.items.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('format');
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(item.id) || ids.has(item.id)) throw new Error('format');
    if (typeof item.text !== 'string' || !item.text.trim() || item.text.length > 200 || typeof item.done !== 'boolean') throw new Error('format');
    ids.add(item.id);
    return { id: item.id, text: item.text.trim(), done: item.done };
  });
  return { type: 'spg-field-notes', schemaVersion: 1, items };
}

export interface RouteNote { id: string; text: string; }
export function routeNoteId(routeId: string, stepId: string) {
  if (![routeId, stepId].every((id) => /^[a-z0-9-]{1,24}$/.test(id))) throw new Error('route-id');
  return `route_${routeId}_${stepId}`;
}
export function addRouteNotes(notes: FieldNotes, additions: RouteNote[]): { notes: FieldNotes; added: number } {
  const current = validateNotes(notes);
  // Validate everything before modifying a saved notebook. Existing text/done values win.
  const incoming = validateNotes({ type: 'spg-field-notes', schemaVersion: 1, items: additions.map((item) => ({ ...item, done: false })) });
  const ids = new Set(current.items.map((item) => item.id));
  const fresh = incoming.items.filter((item) => !ids.has(item.id));
  if (current.items.length + fresh.length > 200) throw new Error('limit');
  return { notes: { ...current, items: [...current.items, ...fresh] }, added: fresh.length };
}
