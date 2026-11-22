import { revisionStatus } from './editorial';
import type { Publication, GameCase, ExplorationRoute, Character, EvidenceImage, Material } from './game-schema';
interface Source { id: string; kind: string; }
export function validatePublicationSet(groups: Publication[][], sources: Source[]) {
  const errors: string[] = [];
  const gameplay = new Set(sources.filter((source) => source.kind === 'gameplay-record').map((source) => source.id));
  const allSources = new Set(sources.map((source) => source.id));
  for (const entries of groups) {
    const ids = new Set<string>(); const paths = new Set<string>();
    for (const entry of entries) {
      const key = `${entry.locale}/${entry.slug}`;
      if (ids.has(entry.id) || paths.has(key)) errors.push(`${entry.id}: duplicate ID or route`);
      ids.add(entry.id); paths.add(key);
      if (entry.id !== `${entry.locale}/${entry.translationId}`) errors.push(`${entry.id}: ID must match locale/translationId`);
      if (entry.checkedRevision > entry.revision) errors.push(`${entry.id}: checked revision is in the future`);
      if (entry.sourceIds.some((id) => !allSources.has(id))) errors.push(`${entry.id}: unknown source`);
      const original = entries.find((candidate) => candidate.locale === 'en' && candidate.translationId === entry.translationId);
      if (!original || entry.sourceRevision > original.revision || (entry.locale === 'en' && entry.sourceRevision !== entry.revision)) errors.push(`${entry.id}: invalid source revision`);
      if (entry.status !== 'published') continue;
      if (entry.verification !== 'gameplay-verified' || !entry.sourceIds.some((id) => gameplay.has(id))) errors.push(`${entry.id}: publication requires a gameplay record`);
      if (/not verified|private|fixture/i.test(`${entry.server} ${entry.build} ${entry.title}`)) errors.push(`${entry.id}: unverified metadata`);
      const peer = entries.find((candidate) => candidate.translationId === entry.translationId && candidate.locale !== entry.locale && candidate.status === 'published');
      if (!peer) errors.push(`${entry.id}: published English/Japanese counterpart required`);
      if (peer && (peer.slug !== entry.slug || peer.server !== entry.server || peer.build !== entry.build)) errors.push(`${entry.id}: counterpart route or game scope differs`);
      // Older translations are allowed with a visible warning; future revisions are not.
      revisionStatus(entry, original);
    }
  }
  return errors;
}
export function validateGameReferences(cases: GameCase[], routes: ExplorationRoute[], characters: Character[], materials: Material[], images: EvidenceImage[]) {
  const errors: string[] = [];
  function unique(ids: string[], context: string) { if (new Set(ids).size !== ids.length) errors.push(`${context}: duplicate stable IDs`); }
  unique(materials.map((entry) => entry.id), 'materials'); unique(images.map((entry) => entry.id), 'images');
  const imageMap = new Map(images.map((image) => [image.id, image]));
  const materialIds = new Set(materials.map((material) => material.id));
  function checkImages(ids: string[], entry: Publication, allowed: EvidenceImage['spoiler'][]) {
    for (const id of ids) {
      const image = imageMap.get(id);
      if (!image || !allowed.includes(image.spoiler)) { errors.push(`${entry.id}: missing image or unsafe spoiler level ${id}`); continue; }
      if (entry.status === 'published' && (!entry.sourceIds.includes(image.sourceId) || image.server !== entry.server || image.build !== entry.build)) errors.push(`${entry.id}: image evidence scope differs ${id}`);
    }
  }
  for (const entry of cases) {
    unique(entry.stages.map((stage) => stage.id), entry.id);
    checkImages(entry.safeImageIds, entry, ['safe']);
    for (const stage of entry.stages) {
      unique(stage.clueIds, `${entry.id}/${stage.id}`);
      stage.hints.forEach((hint, i) => checkImages(hint.imageIds, entry, i === 2 ? ['safe', 'hint', 'answer'] : ['safe', 'hint']));
    }
    const peer = cases.find((candidate) => candidate.translationId === entry.translationId && candidate.locale !== entry.locale);
    if (peer && JSON.stringify(entry.stages.map((stage) => [stage.id, stage.clueIds])) !== JSON.stringify(peer.stages.map((stage) => [stage.id, stage.clueIds]))) errors.push(`${entry.id}: translated stage/clue IDs differ`);
  }
  for (const entry of routes) {
    unique(entry.steps.map((step) => step.id), entry.id);
    checkImages(entry.safeImageIds, entry, ['safe']);
    entry.steps.forEach((step) => checkImages(step.imageIds, entry, ['safe', 'hint', 'answer']));
    const peer = routes.find((candidate) => candidate.translationId === entry.translationId && candidate.locale !== entry.locale);
    if (peer && JSON.stringify(entry.steps.map((step) => step.id)) !== JSON.stringify(peer.steps.map((step) => step.id))) errors.push(`${entry.id}: translated step IDs differ`);
  }
  for (const entry of characters) {
    unique(entry.intervals.map((interval) => interval.id), entry.id);
    for (const interval of entry.intervals) {
      unique(interval.costs.map((cost) => cost.materialId), `${entry.id}/${interval.id}`);
      if (interval.costsComplete && interval.costs.some((cost) => cost.amount === null)) errors.push(`${entry.id}: complete interval has unknown costs`);
      if (interval.costs.some((cost) => !materialIds.has(cost.materialId))) errors.push(`${entry.id}: unknown material`);
      // Incomplete intervals remain visibly unavailable, even on otherwise verified characters.
    }
    const peer = characters.find((candidate) => candidate.translationId === entry.translationId && candidate.locale !== entry.locale);
    if (peer && JSON.stringify(entry.intervals.map(({ label, ...data }) => data)) !== JSON.stringify(peer.intervals.map(({ label, ...data }) => data))) errors.push(`${entry.id}: translated costs differ`);
  }
  return errors;
}
