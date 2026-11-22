export type CaptureKind = 'case' | 'route' | 'interval';

export function captureTemplate(kind: CaptureKind, id: string) {
  const entries = ['en', 'ja'].map(locale => {
    const base = {
      id: `${locale}/${id}`, translationId: id, locale, slug: id,
      title: null, summary: null, status: 'draft', verification: 'unverified',
      revision: 1, sourceRevision: 1, checkedRevision: 1,
      updatedAt: null, checkedAt: null, server: null, build: null,
      sourceIds: [], prerequisites: [],
    };
    if (kind === 'case') return { ...base, safeImageIds: [], stages: [{
      id: 'first', title: null, objective: null, clueIds: [],
      hints: Array.from({ length: 3 }, () => ({ text: null, imageIds: [] })),
    }] };
    if (kind === 'route') return { ...base, area: null, start: null, completion: null,
      safeImageIds: [], steps: [{ id: 'first', title: null, instruction: null, checklistText: null, imageIds: [] }],
    };
    return { ...base, characterId: null, intervals: [{ id, label: null, from: null, to: null,
      costsComplete: false, costs: [{ materialId: null, amount: null }],
    }] };
  });
  return {
    cases: kind === 'case' ? entries : [], routes: kind === 'route' ? entries : [],
    characters: kind === 'interval' ? entries : [], materials: [], images: [], sources: [],
  };
}

export function manifestTemplate(kind: CaptureKind, id: string) {
  return {
    schemaVersion: 1, id, kind, status: 'awaiting-capture', server: null, build: null,
    capturedAt: null, englishName: null, japaneseName: null, nameSources: [],
    recording: null, reproducedAt: null,
    reviewedAt: { en: null, ja: null, spoilers: null }, unresolved: [],
  };
}

export function costCheckTemplate(id: string) {
  return {
    intervalId: id, coverageNote: null,
    steps: [{ from: null, to: null, imageIds: [], costs: [{ materialId: null, amount: null }] }],
    independentTotals: [{ materialId: null, amount: null }],
  };
}
