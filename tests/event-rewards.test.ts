import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyRewardPlan, validateRewardPlan, setRewardDrawn, setRewardSelected, selectedRewardTotals, rewardCalendar, eventPhase, REWARDS_KEY } from '../src/lib/event-rewards';
import { matchesReference } from '../src/lib/reference-search';
import { referenceErrors, referenceTerms } from '../src/lib/references';

test('separate copies occupy separate claim slots and sum the actual event quantity', () => {
  let plan = emptyRewardPlan();
  for (const id of ['ounce-1', 'ounce-2', 'science-volume-i-1', 'science-volume-i-2']) {
    plan = setRewardSelected(setRewardDrawn(plan, id, true), id, true);
  }
  assert.equal(plan.selected.length, 4);
  assert.deepEqual(selectedRewardTotals(plan).map(item => [item.id, item.total]), [['science-volume-i', 20], ['ounce', 40000]]);
  const reduced = setRewardDrawn(plan, 'ounce-2', false);
  assert.equal(reduced.selected.length, 3);
  assert.equal(selectedRewardTotals(reduced).find(item => item.id === 'ounce')!.total, 20000);
  assert.equal(plan.selected.length, 4, 'the previous immutable plan survives');
});
test('only drawn entries can be selected and a seventh selection cannot change the previous plan', () => {
  let plan = emptyRewardPlan();
  assert.throws(() => setRewardSelected(plan, 'ounce-1', true));
  const ids = ['curiosity-mystery-1', 'simulation-shot-1', 'science-volume-i-1', 'paper-bookmark-1', 'heros-instinct-1', 'ounce-1', 'ounce-2'];
  for (const id of ids) plan = setRewardDrawn(plan, id, true);
  for (const id of ids.slice(0, 6)) plan = setRewardSelected(plan, id, true);
  assert.throws(() => setRewardSelected(plan, ids[6], true));
  assert.equal(plan.selected.length, 6);
  assert.deepEqual(setRewardSelected(plan, ids[0], true), plan, 'checking again does not duplicate the entry');
});
test('reward backups round trip without accepting unrelated or corrupt data', () => {
  const plan = {...setRewardSelected(setRewardDrawn(emptyRewardPlan(), 'simulation-shot-1', true), 'simulation-shot-1', true), claimed: true};
  assert.deepEqual(validateRewardPlan(JSON.parse(JSON.stringify(plan))), plan);
  for (const invalid of [null, [], {...plan, drawn:['unknown']}, {...plan, drawn:['simulation-shot-1','simulation-shot-1']}, {...plan, selected:['ounce-1']}, {...plan, eventId:'another-event'}, {...plan, claimed:'yes'}, {...plan, unexpected:123}, {type:'spg-field-notes',schemaVersion:1,items:[]}]) assert.throws(() => validateRewardPlan(invalid));
  assert.notEqual(REWARDS_KEY, 'spg:material-plan:v1');
  assert.notEqual(REWARDS_KEY, 'spg:field-notes:v1');
});
test('closed draws do not imply a known claim opening and the claim deadline expires', () => {
  assert.equal(eventPhase(Date.parse('2026-10-30T00:00:00Z')), 'upcoming');
  assert.equal(eventPhase(Date.parse('2026-11-22T00:00:00Z')), 'drawing');
  assert.equal(eventPhase(Date.parse('2026-12-13T16:00:00Z')), 'check-claim');
  assert.equal(eventPhase(Date.parse('2026-12-29T02:00:01Z')), 'ended');
});
test('calendar has only the two known deadlines in UTC and respects UTF-8 content-line limits', () => {
  for (const locale of ['en','ja'] as const) {
    const calendar = rewardCalendar(locale);
    assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 2);
    assert.ok(calendar.includes('DTSTART:20261213T155900Z'));
    assert.ok(calendar.includes('DTSTART:20261229T020000Z'));
    assert.ok(!calendar.includes('DTSTART:20261214'), 'no invented game-launch hour');
    assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
    for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line,'utf8') <= 75);
    const unfolded = calendar.replace(/\r\n /g,'');
    assert.ok(unfolded.includes(locale === 'en' ? 'A calendar entry does not claim rewards.' : 'カレンダーへの登録では報酬を受け取れません。'));
  }
});
test('reference matching works across full-width text, apostrophes and Japanese names', () => {
  assert.ok(matchesReference('ＰＡＲＲＩＥＳ', 'Parries パリィ'));
  assert.ok(matchesReference("hero's", 'Hero’s Instinct 英雄の本能'));
  assert.ok(matchesReference('フウ', 'Alf (Maid) フウ・メイド'));
  assert.ok(matchesReference('charged skill', 'Charged Skill チャージスキル'));
  assert.ok(!matchesReference('nonexistent', 'Evidence Board 捜査ボード'));
  assert.ok(matchesReference('  ', 'anything'));
  assert.deepEqual(referenceErrors, []);
  assert.ok(referenceTerms.some(term => term.en === 'Casual Mode' && term.ja === 'シンプルモード'));
});
