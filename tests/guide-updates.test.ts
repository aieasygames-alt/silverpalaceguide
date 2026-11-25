import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceCheckRange, recentGuideUpdates } from '../src/lib/guide-updates';

const sources = [{ id: 'old', checkedAt: '2026-11-22' }, { id: 'new', checkedAt: '2026-11-24' }];
test('source dates retain the whole range rather than imply a full recheck', () => {
  assert.deepEqual(sourceCheckRange(['new', 'old', 'new'], sources), { first: '2026-11-22', last: '2026-11-24' });
  assert.deepEqual(sourceCheckRange(['old'], sources), { first: '2026-11-22', last: '2026-11-22' });
  assert.throws(() => sourceCheckRange(['missing'], sources), /Unknown/);
  assert.throws(() => sourceCheckRange([], sources), /checked sources/);
});

test('recent edits respect editorial date, source-check ties and stable URLs without changing the reading order', () => {
  const guides = [
    { slug: 'z', updatedAt: '2026-11-24', sourceIds: ['old'] },
    { slug: 'b', updatedAt: '2026-11-24', sourceIds: ['new'] },
    { slug: 'a', updatedAt: '2026-11-24', sourceIds: ['old', 'new'] },
    { slug: 'c', updatedAt: '2026-11-23', sourceIds: ['new'] },
  ];
  assert.deepEqual(recentGuideUpdates(guides, 3, sources).map(guide => guide.slug), ['a', 'b', 'z']);
  assert.deepEqual(guides.map(guide => guide.slug), ['z', 'b', 'a', 'c']);
  assert.deepEqual(recentGuideUpdates(guides, 0, sources), []);
});
