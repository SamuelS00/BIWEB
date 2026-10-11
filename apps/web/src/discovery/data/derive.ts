import { CHANGES, CONFLICTS, ENTITIES, EVIDENCE, EVIDENCE_PACKS, FLOW, MISSIONS, OBSERVATIONS, OBS_WEEK, PROPOSALS, RELATIONSHIPS, SOURCES, WEEK_MIN, levelOf, score, snapshotsOf } from './seed';
import { tx } from './tx';
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
    { key: 'authority', get label() { return tx('discovery.ui.conf.authority'); }, v: c.authority, level: lv(c.authority) },
    { key: 'freshness', get label() { return tx('discovery.ui.conf.freshness'); }, v: c.freshness, level: lv(c.freshness) },
    { key: 'corroboration', get label() { return tx('discovery.ui.conf.corroboration'); }, v: c.corroboration, level: lv(c.corroboration) },
    { key: 'extraction', get label() { return tx('discovery.ui.conf.extraction'); }, v: c.extraction, level: lv(c.extraction) },
    { key: 'entityMatch', get label() { return tx('discovery.ui.conf.entityMatch'); }, v: c.entityMatch, level: lv(c.entityMatch) },
  ] as const;
}
/** Rótulos com getter: seguem o idioma ativo sem mudar a API (`LEVEL_LABEL[l]`). */
export const LEVEL_LABEL = { get high() { return tx('discovery.common.level.high'); }, get medium() { return tx('discovery.common.level.medium'); }, get low() { return tx('discovery.common.level.low'); } };
export const CONFLICT_LABEL = { get none() { return tx('discovery.common.conflict.none'); }, get minor() { return tx('discovery.common.conflict.minor'); }, get major() { return tx('discovery.common.conflict.major'); } };

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
export function ago(min: number) { if (min < 60) return tx('discovery.common.agoMin', { n: min }); if (min < 1440) return tx('discovery.common.agoHour', { n: Math.round(min / 60) }); return tx('discovery.common.agoDay', { n: Math.round(min / 1440) }); }
export function conflictValue(c: Conflict, live: DsLive) { const r = live.resolved[c.id]; return r ? c[r].value : null; }
export { snapshotsOf };
