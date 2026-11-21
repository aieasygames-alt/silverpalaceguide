import detective from '../assets/game/detective-scene.jpg';
import parlour from '../assets/game/parlour-scene.jpg';
import city from '../assets/game/city-detective.jpg';
import collage from '../assets/game/detective-collage.jpg';
import launch from '../assets/game/global-launch.jpg';

// User-supplied game imagery. Asset provenance and placements: docs/image-register.md.
export const artwork = {
  detective: {
    src: detective,
    alt: {
      en: 'A silver-haired detective in a top hat draws a blade in a shadowy city street.',
      ja: '薄暗い街路で剣を構える、シルクハットをかぶった銀髪の探偵。',
    },
  },
  parlour: {
    src: parlour,
    alt: {
      en: 'Two Silver Palace characters in an ornate parlour beside a blue sofa.',
      ja: '青いソファのある装飾的な応接室に集う、白銀の城のキャラクターたち。',
    },
  },
  city: {
    src: city,
    alt: {
      en: 'A detective outdoors in a sunlit city, with the Silver Palace wordmark.',
      ja: '陽光の差す街の探偵と、Silver Palaceのロゴ。',
    },
  },
  collage: {
    src: collage,
    alt: {
      en: 'Silver Palace promotional artwork with a detective and a golden collage of characters.',
      ja: '探偵と、金色の装飾でつながるキャラクターたちを描いた白銀の城の宣伝イラスト。',
    },
  },
  launch: {
    src: launch,
    alt: {
      en: 'Silver Palace global launch artwork announcing 14 December 2026.',
      ja: '2026年12月14日のグローバルリリースを告知する白銀の城の宣伝ビジュアル。',
    },
  },
} as const;

export type ArtworkId = keyof typeof artwork;
