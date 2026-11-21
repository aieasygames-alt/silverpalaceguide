import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortage, validatePlan } from '../src/lib/planner.ts';
import { validateNotes } from '../src/lib/progress.ts';

test('shortages match hand-worked costs and never become negative', () => {
  assert.equal(shortage(120, 35), 85);
  assert.equal(shortage(120, 120), 0);
  assert.equal(shortage(120, 200), 0);
  assert.equal(shortage(0, 0), 0);
  for (const value of [-1, NaN, Infinity, .5, 1_000_000_001]) assert.throws(() => shortage(value, 0));
});
const valid = () => ({ type: 'spg-material-plan', schemaVersion: 1, rows: [{ id: 'mat-1', name: 'A material', required: 120, owned: 35 }] });
test('material backups round-trip and preserve a zero requirement', () => {
  assert.deepEqual(validatePlan(JSON.parse(JSON.stringify(valid()))), valid());
  const plan = valid(); plan.rows[0].required = 0;
  assert.equal(validatePlan(plan).rows[0].required, 0);
});
test('missing material quantities are rejected, never interpreted as zero', () => {
  const plan = valid();
  const { required, ...incomplete } = plan.rows[0];
  assert.throws(() => validatePlan({ ...plan, rows: [incomplete] }));
  assert.throws(() => validatePlan({ ...plan, schemaVersion: 2 }));
  assert.throws(() => validatePlan({ ...plan, type: 'spg-field-notes' }));
});
test('duplicate normalized material names cannot deduct one inventory twice', () => {
  const plan = valid();
  plan.rows.push({ ...plan.rows[0], id: 'mat-2', name: ' A MATERIAL ' });
  assert.throws(() => validatePlan(plan), /duplicate/);
  assert.throws(() => validatePlan({ ...valid(), rows: Array(51).fill(valid().rows[0]) }));
});
test('field-note backups preserve stable IDs and checked state', () => {
  const notes = { type: 'spg-field-notes', schemaVersion: 1, items: [{ id: 'note-1', text: 'Check the east door', done: true }, { id: 'note-2', text: 'Return after the next task', done: false }] };
  assert.deepEqual(validateNotes(JSON.parse(JSON.stringify(notes))), notes);
  assert.throws(() => validateNotes({ ...notes, items: [notes.items[0], notes.items[0]] }));
  assert.throws(() => validateNotes({ ...notes, items: [{ ...notes.items[0], done: 'true' }] }));
});
test('untrusted notebook files reject oversized and malformed entries', () => {
  assert.throws(() => validateNotes({ type: 'spg-field-notes', schemaVersion: 1, items: [{ id: 'x', text: '', done: false }] }));
  assert.throws(() => validateNotes({ type: 'spg-field-notes', schemaVersion: 1, items: [{ id: '../../oops', text: 'Note', done: false }] }));
  assert.throws(() => validateNotes(null));
  assert.throws(() => validatePlan({ ...valid(), rows: [{ ...valid().rows[0], name: 'x'.repeat(61) }] }));
});
