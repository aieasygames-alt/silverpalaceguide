export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export function isLocale(value: string | undefined): value is Locale { return value === 'en' || value === 'ja'; }
export const text = {
  en: {
    language: 'English', otherLanguage: '日本語', otherLocale: 'ja',
    nav: ['Case notes', 'Exploration', 'Characters', 'Tools', 'Guides'],
    search: 'Search the archive', searchShort: 'Search', menu: 'Menu', close: 'Close',
    skip: 'Skip to content', official: 'Official website',
    unofficial: 'An independent field guide', launch: 'Global launch · 14 December 2026',
    home: 'The reading room', allGuides: 'All field guides', readGuide: 'Read the guide',
    sources: 'Sources & verification', checked: 'Sources checked',
    footer: 'Made for curious detectives.',
    disclaimer: 'An unofficial, fan-made guide. Not affiliated with Silver Studio, Happy Elements or Elementa. Game names and trademarks belong to their respective owners.',
    about: 'About & editorial policy', privacy: 'Privacy & local saves',
    searchDescription: 'Find launch information, field guides and planning tools. Case solutions stay out of search previews.',
  },
  ja: {
    language: '日本語', otherLanguage: 'English', otherLocale: 'en',
    nav: ['事件ノート', '探索', 'キャラクター', 'ツール', 'ガイド'],
    search: '資料を検索', searchShort: '検索', menu: 'メニュー', close: '閉じる',
    skip: '本文へ移動', official: '公式サイト',
    unofficial: '探偵のための非公式ガイド', launch: 'グローバルリリース · 2026年12月14日',
    home: '閲覧室', allGuides: 'ガイド一覧', readGuide: 'ガイドを読む',
    sources: '出典と確認状況', checked: '出典確認日',
    footer: '好奇心を忘れない探偵たちへ。',
    disclaimer: '当サイトはファンによる非公式ガイドです。Silver Studio、Happy Elements、Elementaとは関係ありません。ゲーム名・商標の権利は各権利者に帰属します。',
    about: '運営・編集方針', privacy: 'プライバシーと保存データ',
    searchDescription: 'リリース情報、ガイド、計画ツールを検索できます。事件の解答は検索プレビューに含めません。',
  },
} as const;
export const navPaths = ['cases', 'exploration', 'characters', 'tools', 'guides'];
export function path(locale: Locale, suffix = '') { return `/${locale}/${suffix ? `${suffix.replace(/^\/+|\/+$/g, '')}/` : ''}`; }
