/**
 * Contratos do BIWEB Discovery Engine (BDE). Só tipos: o protótipo não tem backend.
 * Regra de ouro: o BDE descobre; o LDE confia depois de validar; o BCE constrói a partir de contratos; o Copilot explica e orquestra.
 */
export type Level = 'high' | 'medium' | 'low';
export type Authority = 'PRIMARY' | 'SECONDARY' | 'REFERENCE' | 'DISCOVERY';
export type SourceType = 'Official Website' | 'Documentation' | 'Pricing Page' | 'Open Data' | 'Government' | 'News' | 'RSS' | 'Public API' | 'Repository' | 'Document' | 'Public Database';
export type EntityType = 'Organization' | 'Product' | 'Service' | 'Technology' | 'Location' | 'Market' | 'Regulation' | 'Publication' | 'Event';
export type Frequency = 'One time' | 'Daily' | 'Weekly' | 'Monthly';
export type BlockReason = 'robots' | 'policy' | 'rate-limit' | 'auth-required' | 'unavailable' | 'removed';

/** Confiança decomposta (0–100 por componente). O número agregado deriva destes, nunca é digitado. */
export interface Confidence { authority: number; freshness: number; corroboration: number; extraction: number; entityMatch: number; contradictions: 'none' | 'minor' | 'major' }

export interface SourcePolicy { access: 'Public' | 'Authorized'; robots: 'Respected'; rateLimit: string; retentionDays: number; license: string; attribution: 'Required' | 'Not required'; personalData: 'Restricted' | 'None' }
export interface SourceDescriptor {
  id: string; name: string; url: string; type: SourceType; authority: Authority; health: 'healthy' | 'degraded' | 'blocked'; blocked?: BlockReason;
  lastCheckedMin: number; observedSince: string; snapshots: number; changes: number; usedBy: string[]; policy: SourcePolicy; entityId?: string; originalOf?: string;
}
export interface FetchSnapshot { id: string; sourceId: string; at: string; lines: string[]; note?: string }
export interface ExternalDocument { id: string; name: string; kind: 'PDF' | 'HTML' | 'JSON' | 'API' | 'RSS' | 'CSV'; sourceId: string; pages?: number; extracted: { field: string; value: string }[] }

export interface EvidenceRef { id: string; sourceId: string; role: 'Primary' | 'Secondary'; strength: Level; kind: 'web' | 'pdf' | 'structured'; excerpt: string; locator: string; capturedAt: string; snapshotId?: string }
export type Evidence = EvidenceRef;
export interface ObservationVersion { at: string; value: string; evidenceId?: string }
export interface Observation {
  id: string; subjectId: string; subject: string; claim: string; value: string; observedAt: string; sourceId: string; evidenceIds: string[]; confidence: Confidence;
  status: 'confirmed' | 'needs-verification' | 'conflicted' | 'superseded'; extraction: 'Structured HTML' | 'Unstructured text' | 'Document' | 'API record'; corroboration: number; history: ObservationVersion[]; missionId?: string; aiNote?: string;
}
export interface EvidencePack { id: string; claim: string; subjectId: string; evidence: string[]; firstObserved: string; lastConfirmed: string; contradictions: string }

export interface EntityCandidate {
  id: string; name: string; type: EntityType; aliases: string[]; website?: string; confidence: number; verified: boolean; since: string; lastConfirmedMin: number;
  hq?: string; industry?: string; products: string[]; integrations: string[]; locations: number; geo?: { lat: number; lon: number }; sources: number; evidenceCoverage: number;
  missionIds: string[]; resolution?: { canonical: string; names: string[]; evidence: string[]; match: number; ambiguous?: boolean };
}
export interface Relationship { from: string; to: string; kind: 'offers' | 'integrates' | 'operates in' | 'announced' | 'competes with' | 'partners with' }

export type ChangeKind = 'Pricing changed' | 'Capability added' | 'Integration added' | 'Documentation updated' | 'Location changed' | 'Product renamed' | 'Feature removed';
export interface ChangeEvent {
  id: string; kind: ChangeKind; entityId: string; entity: string; scope: string; before: string; after: string; semantic: string; detectedMin: number; sourceId: string;
  evidenceIds: string[]; confidence: Level; category: 'Pricing' | 'Product' | 'Documentation' | 'News'; missionId: string; important: boolean; observationId?: string; snapshotIds?: [string, string];
}
export interface Conflict {
  id: string; entityId: string; entity: string; field: string; a: { label: string; value: string; updated: string; sourceId: string }; b: { label: string; value: string; updated: string; sourceId: string };
  recommended: 'a' | 'b'; reason: string;
}
export interface ResearchSpec { objective: string; entities: string[]; sources: string[]; extract: string[]; frequency: Frequency; deliver: string; minEvidence?: number; preferredSource?: string; confidenceThreshold?: number }
export interface ResearchMission {
  id: string; name: string; template: string; spec: ResearchSpec; status: 'active'; lastRunMin: number; nextRun: string; entities: number; sourcesMonitored: number; observations: number; changesWeek: number; entityIds: string[];
}
export interface Watchlist { id: string; name: string; entityIds: string[]; sources: number; frequency: Frequency; monitors: string[]; missionId: string }
export interface DiscoveryResult { id: string; query: string; found: number; high: number; medium: number; review: number; entityIds: string[] }
export interface EnrichmentProposal {
  id: string; internalEntity: string; match: number; current: { field: string; value: string }[];
  proposed: { field: string; value: string; sourceId: string; confidence: number; observed: string; policy: string }[]; status: 'proposed' | 'sent' | 'applied';
}
export interface ResearchDataset { id: string; name: string; version: number; companies: number; fields: number; coverage: number; changesSinceLast: number; missionId: string; geo: boolean; updated: string }
export interface Run { id: string; name: string; missionId: string; started: string; durationS: number; evaluated: number; relevant: number; documents: number; entities: number; observations: number; conflicts: number; stage: number }
export type DiscoverySection = 'overview' | 'explore' | 'missions' | 'watchlists' | 'entities' | 'sources' | 'observations' | 'changes' | 'evidence' | 'datasets' | 'conflicts' | 'policies' | 'runs' | 'settings';
