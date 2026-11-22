import catalog from '../data/event-rewards.json';
import type { Locale } from './i18n';

export { catalog as rewardEvent };
export const REWARDS_KEY = 'spg:event-rewards:mystery-unveiled-2026:v1';
export const rewardSlots = catalog.items.flatMap((item) => Array.from({ length: item.copies }, (_, index) => ({
  id: `${item.id}-${index + 1}`, itemId: item.id, copy: index + 1, amount: item.amount, name: item.name,
})));
export interface RewardPlan {
  type: 'spg-event-rewards'; schemaVersion: 1; eventId: string;
  drawn: string[]; selected: string[]; claimed: boolean;
}
export function emptyRewardPlan(): RewardPlan {
  return { type: 'spg-event-rewards', schemaVersion: 1, eventId: catalog.id, drawn: [], selected: [], claimed: false };
}
export function validateRewardPlan(input: unknown): RewardPlan {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('format');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => !['type', 'schemaVersion', 'eventId', 'drawn', 'selected', 'claimed'].includes(key)) ||
    value.type !== 'spg-event-rewards' || value.schemaVersion !== 1 || value.eventId !== catalog.id || typeof value.claimed !== 'boolean') throw new Error('format');
  const readIds = (ids: unknown): string[] => {
    if (!Array.isArray(ids) || ids.length > rewardSlots.length || ids.some((id) => typeof id !== 'string' || !rewardSlots.some((slot) => slot.id === id)) || new Set(ids).size !== ids.length) throw new Error('ids');
    return [...ids];
  };
  const drawn = readIds(value.drawn), selected = readIds(value.selected);
  if (selected.length > catalog.selectionLimit || selected.some((id) => !drawn.includes(id))) throw new Error('selection');
  return { type: 'spg-event-rewards', schemaVersion: 1, eventId: catalog.id, drawn, selected, claimed: value.claimed };
}
export function setRewardDrawn(plan: RewardPlan, id: string, drawn: boolean): RewardPlan {
  const current = validateRewardPlan(plan);
  return validateRewardPlan({ ...current,
    drawn: drawn ? [...new Set([...current.drawn, id])] : current.drawn.filter((entry) => entry !== id),
    selected: drawn ? current.selected : current.selected.filter((entry) => entry !== id),
  });
}
export function setRewardSelected(plan: RewardPlan, id: string, selected: boolean): RewardPlan {
  const current = validateRewardPlan(plan);
  return validateRewardPlan({ ...current, selected: selected ? [...new Set([...current.selected, id])] : current.selected.filter((entry) => entry !== id) });
}
export function selectedRewardTotals(plan: RewardPlan) {
  const current = validateRewardPlan(plan);
  return catalog.items.map((item) => ({ ...item,
    total: rewardSlots.filter((slot) => slot.itemId === item.id && current.selected.includes(slot.id)).reduce((sum, slot) => sum + slot.amount, 0),
  })).filter((item) => item.total > 0);
}
export function eventPhase(now: number) {
  if (now < Date.parse(catalog.drawStartsAt)) return 'upcoming';
  if (now <= Date.parse(catalog.drawEndsAt)) return 'drawing';
  if (now <= Date.parse(catalog.claimEndsAt)) return 'check-claim';
  return 'ended';
}
export function rewardCalendar(locale: Locale) {
  const escape = (text: string) => text.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
  const utc = (date: string) => new Date(date).toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '');
  // RFC 5545 folds UTF-8 content lines at 75 octets without splitting a code point.
  const fold = (line: string) => {
    const lines: string[] = []; let part = '', bytes = 0;
    for (const char of line) {
      const size = new TextEncoder().encode(char).length;
      if (bytes + size > 75) { lines.push(part); part = ' '; bytes = 1; }
      part += char; bytes += size;
    }
    lines.push(part); return lines.join('\r\n');
  };
  const en = locale === 'en';
  const entries = [
    { id: 'draw-end', at: catalog.drawEndsAt, title: en ? 'Mystery Unveiled: draw deadline' : '難事件発生：抽選終了', description: en ? 'Official draw deadline. Check the event rules for updates.' : '公式ルールの抽選終了時刻。変更は公式ページをご確認ください。' },
    { id: 'claim-end', at: catalog.claimEndsAt, title: en ? 'Mystery Unveiled: reward claim deadline' : '難事件発生：報酬受け取り期限', description: en ? 'Claim manually on the official event page after claim opening. Creating a game character is required. A calendar entry does not claim rewards.' : '受け取り開始後、公式イベントページで手動受け取りが必要です。ゲーム内キャラクターの作成が必要です。カレンダーへの登録では報酬を受け取れません。' },
  ];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Silver Palace Guide//Event deadlines//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ...entries.flatMap((entry) => ['BEGIN:VEVENT', `UID:${catalog.id}-${entry.id}@silverpalaceguide.com`, 'DTSTAMP:20261122T000000Z', `DTSTART:${utc(entry.at)}`, `SUMMARY:${escape(entry.title)}`, `DESCRIPTION:${escape(entry.description)}`, `URL:${catalog.officialUrl}`, 'END:VEVENT']), 'END:VCALENDAR', ''].map(fold).join('\r\n');
}
