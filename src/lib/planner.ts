export interface MaterialRow { id: string; name: string; materialId?: string; required: number; owned: number; }
export interface MaterialPlan { type: 'spg-material-plan'; schemaVersion: 1; rows: MaterialRow[]; }
export const PLAN_KEY = 'spg:material-plan:v1';
export const MAX_QUANTITY = 1_000_000_000;
export function shortage(required: number, owned: number) {
  if (![required, owned].every((value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_QUANTITY)) throw new Error('quantity');
  return Math.max(required - owned, 0);
}
export function validatePlan(input: unknown): MaterialPlan {
  if (!input || typeof input !== 'object') throw new Error('format');
  const data = input as Record<string, unknown>;
  if (data.type !== 'spg-material-plan' || data.schemaVersion !== 1 || !Array.isArray(data.rows) || data.rows.length > 50) throw new Error('format');
  const ids = new Set<string>();
  const names = new Set<string>();
  const materialIds = new Set<string>();
  const rows = data.rows.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('format');
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(row.id) || ids.has(row.id)) throw new Error('format');
    if (typeof row.name !== 'string' || row.name.trim().length === 0 || row.name.length > 60) throw new Error('name');
    const name = row.name.trim().normalize('NFC');
    const normalized = name.toLocaleLowerCase('en-US');
    if (names.has(normalized)) throw new Error('duplicate');
    if (typeof row.required !== 'number' || typeof row.owned !== 'number') throw new Error('quantity');
    shortage(row.required, row.owned);
    if (row.materialId !== undefined && (typeof row.materialId !== 'string' || !/^[a-z0-9-]{1,24}$/.test(row.materialId) || materialIds.has(row.materialId))) throw new Error('duplicate');
    if (typeof row.materialId === 'string') materialIds.add(row.materialId);
    names.add(normalized); ids.add(row.id);
    return { id: row.id, name, ...(typeof row.materialId === 'string' ? { materialId: row.materialId } : {}), required: row.required, owned: row.owned };
  });
  return { type: 'spg-material-plan', schemaVersion: 1, rows };
}

export interface PresetCost { materialId: string; amount: number | null; }
export interface PresetMaterial { id: string; name: string; }
export function applyMaterialPreset(input: MaterialPlan, costs: PresetCost[], materials: PresetMaterial[]): MaterialPlan {
  const plan = validatePlan(input);
  if (!costs.length || costs.some((cost) => cost.amount === null)) throw new Error('incomplete');
  const ids = new Set<string>();
  const rows: MaterialRow[] = costs.map((cost) => {
    if (!/^[a-z0-9-]{1,24}$/.test(cost.materialId) || ids.has(cost.materialId)) throw new Error('duplicate');
    ids.add(cost.materialId);
    const material = materials.find((entry) => entry.id === cost.materialId);
    if (!material) throw new Error('material');
    const matches = plan.rows.filter((row) => row.materialId === cost.materialId || (!row.materialId && row.name.normalize('NFC').toLocaleLowerCase('en-US') === material.name.normalize('NFC').toLocaleLowerCase('en-US')));
    if (matches.length > 1) throw new Error('duplicate');
    return { id: `material_${cost.materialId}`, materialId: cost.materialId, name: material.name, required: cost.amount!, owned: matches[0]?.owned ?? 0 };
  });
  // Requirement totals replace the previous interval; owned stock is never consumed here.
  return validatePlan({ ...plan, rows });
}
