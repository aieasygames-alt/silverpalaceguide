import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cases, routes, characters, materials } from '../src/lib/game-content.ts';
import { caseSchema, characterSchema } from '../src/lib/game-schema.ts';
import { validatePublicationSet, validateGameReferences } from '../src/lib/publication-check.ts';
import { revisionStatus, validateGuideRevisions } from '../src/lib/editorial.ts';
import { addRouteNotes, routeNoteId, validateNotes, type FieldNotes } from '../src/lib/progress.ts';
import { applyMaterialPreset, validatePlan, shortage, type MaterialPlan } from '../src/lib/planner.ts';
const copy = <T>(value: T): T => structuredClone(value);
const notebook = (): FieldNotes => ({ type: 'spg-field-notes', schemaVersion: 1, items: [{ id: 'my-note', text: 'Keep my own note', done: true }] });
const additions = () => routes[0].steps.map((step) => ({ id: routeNoteId(routes[0].translationId, step.id), text: step.checklistText }));

test('adding a route twice preserves personal notes, stable IDs and completed progress', () => {
  const first = addRouteNotes(notebook(), additions());
  assert.equal(first.added, 2); first.notes.items[1].done = true;
  const second = addRouteNotes(validateNotes(JSON.parse(JSON.stringify(first.notes))), additions().map((item) => ({ ...item, text: 'Japanese label' })));
  assert.equal(second.added, 0); assert.deepEqual(second.notes, first.notes);
  assert.deepEqual(second.notes.items[0], notebook().items[0]);
});
test('over-capacity or malformed routes fail atomically without changing saved notes', () => {
  const notes = notebook();
  notes.items.push(...Array.from({ length: 198 }, (_, i) => ({ id: `note-${i}`, text: 'Personal note', done: false })));
  const before = copy(notes);
  assert.throws(() => addRouteNotes(notes, additions()), /limit/); assert.deepEqual(notes, before);
  assert.throws(() => addRouteNotes(notes, [{ id: '../../bad', text: 'Bad' }]));
  assert.throws(() => routeNoteId('A bad ID', 'step'));
});
const plan = (): MaterialPlan => ({ type: 'spg-material-plan', schemaVersion: 1, rows: [{ id: 'old-row', name: 'Test metal', required: 9, owned: 35 }] });
const catalog = [{ id: 'metal', name: 'Test metal' }, { id: 'cloth', name: 'Test cloth' }];
const costs = [{ materialId: 'metal', amount: 120 }, { materialId: 'cloth', amount: 20 }];
test('preset interval matches a hand calculation and preserves inventory on repeated application', () => {
  const original = plan();
  const first = applyMaterialPreset(original, costs, catalog);
  assert.equal(shortage(first.rows[0].required, first.rows[0].owned), 85);
  assert.equal(shortage(first.rows[1].required, first.rows[1].owned), 20);
  assert.equal(first.rows[0].owned, 35); assert.deepEqual(original, plan());
  const second = applyMaterialPreset(first, costs, catalog);
  assert.deepEqual(second, first);
  const translated = applyMaterialPreset(second, costs, [{ id: 'metal', name: 'テスト金属' }, { id: 'cloth', name: 'テスト布' }]);
  assert.equal(translated.rows[0].owned, 35); assert.equal(translated.rows[0].name, 'テスト金属');
  assert.deepEqual(validatePlan(JSON.parse(JSON.stringify(translated))), translated);
});
test('unknown costs and duplicate materials cannot produce a calculated zero or double inventory', () => {
  assert.throws(() => applyMaterialPreset(plan(), [{ materialId: 'metal', amount: null }], catalog), /incomplete/);
  assert.throws(() => applyMaterialPreset(plan(), [], catalog), /incomplete/);
  assert.throws(() => applyMaterialPreset(plan(), [costs[0], costs[0]], catalog), /duplicate/);
  assert.throws(() => applyMaterialPreset(plan(), [{ materialId: 'absent', amount: 1 }], catalog), /material/);
  assert.throws(() => applyMaterialPreset(plan(), [{ materialId: 'metal', amount: -1 }], catalog));
  assert.equal(applyMaterialPreset(plan(), [{ materialId: 'metal', amount: 0 }], catalog).rows[0].required, 0);
});
test('different localized names cannot disguise the same inventory material in backups', () => {
  const rows = [
    { id: 'one', materialId: 'metal', name: 'Test metal', required: 120, owned: 35 },
    { id: 'two', materialId: 'metal', name: 'テスト金属', required: 120, owned: 35 },
  ];
  assert.throws(() => validatePlan({ ...plan(), rows }), /duplicate/);
});
test('case hints require exactly three levels and valid calendar metadata', () => {
  const sample = copy(cases[0]);
  assert.equal(caseSchema.safeParse(sample).success, true);
  assert.equal(caseSchema.safeParse({ ...sample, checkedAt: '2026-02-31' }).success, false);
  assert.equal(caseSchema.safeParse({ ...sample, stages: [{ ...sample.stages[0], hints: sample.stages[0].hints.slice(0, 2) }] }).success, false);
  assert.equal(characterSchema.safeParse({ ...characters[0], intervals: [{ ...characters[0].intervals[0], from: 2, to: 1 }] }).success, false);
});
test('an announcement alone cannot authorize publication of invented gameplay', () => {
  const entries = copy(cases).map((entry) => ({ ...entry, title: 'A verified-looking title', status: 'published' as const, server: 'Global', build: '1.0', verification: 'gameplay-verified' as const, sourceIds: ['announcement'] }));
  assert.ok(validatePublicationSet([entries], [{ id: 'announcement', kind: 'official-press-release' }]).some((message) => message.includes('gameplay record')));
  assert.deepEqual(validatePublicationSet([entries], [{ id: 'announcement', kind: 'gameplay-record' }]), []);
  assert.ok(validatePublicationSet([[entries[0]]], [{ id: 'announcement', kind: 'gameplay-record' }]).some((message) => message.includes('counterpart')));
});
test('answer images are rejected in safe previews and lower hint levels', () => {
  const sample = copy(cases);
  const image = { id: 'answer', src: '/images/evidence/answer.jpg', width: 1600, height: 900, alt: { en: 'Answer', ja: '解答' }, spoiler: 'answer' as const, sourceId: 'source', checkedAt: '2026-11-22', server: 'Global', build: '1.0' };
  sample[0].safeImageIds = ['answer'];
  sample[0].stages[0].hints[0].imageIds = ['answer'];
  assert.equal(validateGameReferences(sample, [], [], [], [image]).filter((message) => message.includes('spoiler')).length, 2);
  sample[0].safeImageIds = []; sample[0].stages[0].hints[0].imageIds = []; sample[0].stages[0].hints[2].imageIds = ['answer'];
  assert.deepEqual(validateGameReferences(sample, [], [], [], [image]), []);
});
test('translated stable IDs, interval costs and missing references are checked', () => {
  assert.deepEqual(validateGameReferences(cases, routes, characters, materials, []), []);
  const changed = copy(routes); changed[1].steps[0].id = 'different';
  assert.ok(validateGameReferences([], changed, [], [], []).some((message) => message.includes('translated step IDs')));
  const changedCosts = copy(characters); changedCosts[1].intervals[0].costs[0].amount = 1;
  assert.ok(validateGameReferences([], [], changedCosts, materials, []).some((message) => message.includes('translated costs')));
  assert.ok(validateGameReferences([], [], characters, [], []).some((message) => message.includes('unknown material')));
});
test('English edits flag stale Japanese translation and changed gameplay verification', () => {
  const original = { locale: 'en', revision: 3, sourceRevision: 3, checkedRevision: 2 };
  const japanese = { locale: 'ja', revision: 2, sourceRevision: 2, checkedRevision: 2 };
  assert.deepEqual(revisionStatus(japanese, original), { translationOutdated: true, needsRecheck: false, sourceRevision: 3 });
  assert.equal(revisionStatus(original, original).needsRecheck, true);
  assert.equal(revisionStatus({ ...japanese, sourceRevision: 3 }, original).translationOutdated, false);
  const guide = { ...original, translationId: 'test', slug: 'test', status: 'published' };
  assert.ok(validateGuideRevisions([guide]).length);
  assert.deepEqual(validateGuideRevisions([guide, { ...guide, ...japanese }]), []);
  assert.ok(validateGuideRevisions([guide, { ...guide, ...japanese, sourceRevision: 4 }]).length);
});
