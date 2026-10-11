import { create } from 'zustand';
import { MISSIONS, PROPOSALS, WATCHLISTS } from './data/seed';
import type { EnrichmentProposal, ResearchMission, ResearchSpec, Watchlist } from './data/types';

export type SelKind = 'entity' | 'source' | 'observation' | 'change' | 'evidence' | 'conflict' | 'mission' | 'dataset' | 'run' | 'node';
export interface Sel { kind: SelKind; id: string }
export type ExploreMode = 'overview' | 'table' | 'entities' | 'relationships' | 'map' | 'evidence' | 'sources';
export type Handoff = { kind: 'map' | 'report' | 'workflow'; label: string; datasetId?: string; changeId?: string } | null;

interface S {
  leftOpen: boolean; rightOpen: boolean; setPane: (p: Partial<Pick<S, 'leftOpen' | 'rightOpen'>>) => void;
  sel: Sel | null; select: (s: Sel | null, openRight?: boolean) => void;
  /** Rótulo de contexto enviado ao Copilot do shell. */
  context: string; setContext: (c: string) => void;
  resolved: Record<string, 'a' | 'b'>; resolve: (id: string, pick: 'a' | 'b') => void;
  proposals: Record<string, EnrichmentProposal['status']>; setProposal: (id: string, s: EnrichmentProposal['status']) => void;
  missions: ResearchMission[]; addMission: (name: string, template: string, spec: ResearchSpec) => string;
  watchlists: Watchlist[]; addWatchlist: (w: Omit<Watchlist, 'id'>) => string;
  explore: { query: string; phase: 'idle' | 'running' | 'done'; mode: ExploreMode; deep: boolean }; setExplore: (p: Partial<S['explore']>) => void;
  evidenceView: { evidenceId: string; verified: boolean } | null; openEvidence: (id: string) => void; closeEvidence: () => void; verifyEvidence: () => void;
  compare: string[]; setCompare: (ids: string[]) => void;
  handoff: Handoff; setHandoff: (h: Handoff) => void;
  challenged: Record<string, boolean>; challenge: (id: string) => void;
  paused: Record<string, boolean>; togglePause: (id: string) => void;
  toasts: { id: number; text: string }[]; toast: (text: string) => void;
}
let tid = 0;
export const useDs = create<S>((set, get) => ({
  leftOpen: true, rightOpen: false, setPane: (p) => set(p),
  sel: null, select: (sel, openRight = true) => set(openRight && sel ? { sel, rightOpen: true } : { sel }),
  context: 'Discovery Studio', setContext: (context) => set({ context }),
  resolved: {}, resolve: (id, pick) => set((s) => ({ resolved: { ...s.resolved, [id]: pick } })),
  proposals: Object.fromEntries(PROPOSALS.map((p) => [p.id, p.status])), setProposal: (id, st) => set((s) => ({ proposals: { ...s.proposals, [id]: st } })),
  missions: MISSIONS, addMission: (name, template, spec) => {
    const id = `m${get().missions.length + 1}`;
    const m: ResearchMission = { id, name, template, spec, status: 'active', lastRunMin: 0, nextRun: spec.frequency === 'One time' ? '—' : 'Tomorrow 08:00', entities: spec.entities.length, sourcesMonitored: spec.sources.length * 6, observations: 0, changesWeek: 0, entityIds: [] };
    set((s) => ({ missions: [...s.missions, m] })); return id;
  },
  watchlists: WATCHLISTS, addWatchlist: (w) => { const id = `w${get().watchlists.length + 1}`; set((s) => ({ watchlists: [...s.watchlists, { ...w, id }] })); return id; },
  explore: { query: '', phase: 'idle', mode: 'overview', deep: false }, setExplore: (p) => set((s) => ({ explore: { ...s.explore, ...p } })),
  evidenceView: null, openEvidence: (evidenceId) => set({ evidenceView: { evidenceId, verified: false } }), closeEvidence: () => set({ evidenceView: null }),
  verifyEvidence: () => set((s) => (s.evidenceView ? { evidenceView: { ...s.evidenceView, verified: true } } : {})),
  compare: ['powerbi', 'tableau', 'qlik'], setCompare: (compare) => set({ compare }),
  handoff: null, setHandoff: (handoff) => set({ handoff }),
  challenged: {}, challenge: (id) => set((s) => ({ challenged: { ...s.challenged, [id]: true } })),
  paused: {}, togglePause: (id) => set((s) => ({ paused: { ...s.paused, [id]: !s.paused[id] } })),
  toasts: [], toast: (text) => { const id = ++tid; set((s) => ({ toasts: [...s.toasts, { id, text }] })); setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800); },
}));
