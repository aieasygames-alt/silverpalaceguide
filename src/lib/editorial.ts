export interface Revision { locale: string; revision: number; sourceRevision: number; checkedRevision?: number; }
export function revisionStatus(entry: Revision, original?: Revision) {
  return {
    translationOutdated: entry.locale !== 'en' && !!original && entry.sourceRevision < original.revision,
    needsRecheck: entry.checkedRevision !== undefined && entry.checkedRevision < entry.revision,
    sourceRevision: original?.revision ?? entry.revision,
  };
}

interface GuideRevision extends Revision { translationId: string; slug: string; status: string; }
export function validateGuideRevisions(entries: GuideRevision[]) {
  const errors: string[] = [];
  for (const entry of entries) {
    const original = entries.find((candidate) => candidate.locale === 'en' && candidate.translationId === entry.translationId);
    if (!original || entry.sourceRevision > original.revision || (entry.locale === 'en' && entry.sourceRevision !== entry.revision)) errors.push(`${entry.locale}/${entry.slug}: invalid source revision`);
    if (entry.status === 'published' && !entries.some((candidate) => candidate.translationId === entry.translationId && candidate.locale !== entry.locale && candidate.slug === entry.slug && candidate.status === 'published')) errors.push(`${entry.locale}/${entry.slug}: missing published counterpart`);
  }
  return errors;
}
