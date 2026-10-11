import { CHANGES, CONFLICTS, ENTITIES, EVIDENCE, EVIDENCE_PACKS, FLOW, MISSIONS, OBSERVATIONS, OBS_WEEK, PROPOSALS, RELATIONSHIPS, SOURCES, WEEK_MIN, levelOf, score, snapshotsOf } from './seed';
import type { ChangeEvent, Confidence, Conflict, EnrichmentProposal, EntityCandidate, Evidence, Observation, SourceDescriptor } from './types';

export const entityById = (id: string): EntityCandidate | undefined => ENTITIES.find((e) => e.id === id);
export const sourceById = (id: string): SourceDescriptor | undefined => SOURCES.find((s) => s.id === id);
export const evidenceById = (id: string): Evidence | undefined => EVIDENCE.find((e) => e.id === id);
export const observationById = (id: string): Observation | undefined => OBSERVATIONS.find((o) => o.id === id);
export const changeById = (id: string): ChangeEvent | undefined => CHANGES.find((c) => c.id === id);
export const packById = (id: string) => EVIDENCE_PACKS.find((p) => p.id === id);
export const packForChange = (c: ChangeEvent) => EVIDENCE_PACKS.find((p) => p.evidence.some((e) => c.evidenceIds.includes(e)));
export const observationsOf = (entityId: string) => OBSERVATIONS.filter((o) => o.subjectId === entityId);
export const changesOf = (entityId: string) => CHANGES.filter((c) => c.entityId === entityId).sort((a, b) => a.detectedMin - b.detectedMin);
export const relationsOf = (entityId: string) => RELATIONSHIPS.filter((r) => r.from === entityId || r.to === entityId);
export const inWeek = (c: ChangeEvent) => c.detectedMin < WEEK_MIN;

export const confidenceOf = (o: Observation) => score(o.confidence);
/** Linhas do detalhamento: rótulo, nível e valor de cada componente. */
export function breakdown(c: Confidence) {
  const lv = (v: number) => levelOf(v);
  return [
    { key: 'authority', label: 'Source authority', v: c.authority, level: lv(c.authority) },
    { key: 'freshness', label: 'Freshness', v: c.freshness, level: lv(c.freshness) },
    { key: 'corroboration', label: 'Corroboration', v: c.corroboration, level: lv(c.corroboration) },
    { key: 'extraction', label: 'Extraction', v: c.extraction, level: lv(c.extraction) },
    { key: 'entityMatch', label: 'Entity match', v: c.entityMatch, level: lv(c.entityMatch) },
  ] as const;
}
export const LEVEL_LABEL = { high: 'High', medium: 'Medium', low: 'Low' } as const;
export const CONFLICT_LABEL = { none: 'None', minor: 'Minor', major: 'Major' } as const;

/** Estado variável da UI que muda números exibidos em várias telas. */
export interface DsLive { resolved: Record<string, 'a' | 'b'>; proposals: Record<string, EnrichmentProposal['status']>; extraMissions: number }
export function stats(live: DsLive) {
  const openConflicts = CONFLICTS.filter((c) => !live.resolved[c.id]).length;
  const openProposals = PROPOSALS.filter((p) => (live.proposals[p.id] ?? p.status) === 'proposed').length;
  return {
    missions: MISSIONS.length + live.extraMissions, sources: SOURCES.length, observationsWeek: OBS_WEEK, changesWeek: CHANGES.filter(inWeek).length,
    conflicts: openConflicts, proposals: openProposals, flow: FLOW,
  };
}
export const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
export function ago(min: number) { if (min < 60) return `${min} min ago`; if (min < 1440) return `${Math.round(min / 60)} h ago`; return `${Math.round(min / 1440)} d ago`; }
export function conflictValue(c: Conflict, live: DsLive) { const r = live.resolved[c.id]; return r ? c[r].value : null; }
export { snapshotsOf };
