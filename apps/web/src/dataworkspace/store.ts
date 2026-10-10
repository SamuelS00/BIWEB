import { create } from 'zustand';
import { ASSETS, SOURCES, type Asset, type Source } from './registry';
import { CHANGESETS, type ChangeSet, type ChangeStatus, type Enrich, ENRICHMENTS } from './ops';

export type SelKind = 'column' | 'asset' | 'source' | 'rel' | 'mapping' | 'issue' | 'lnode' | 'enrich' | 'mnode' | 'stage' | 'dataset' | 'proposal' | 'docfield';
export interface Sel { kind: SelKind; id: string; extra?: string }
export type Decision = 'accepted' | 'rejected';
export type RTab = 'inspector' | 'copilot' | 'review';
export interface Msg { id: string; role: 'user' | 'ai'; text: string; kicker?: string; card?: Card; steps?: string[] }
export type Card =
  | { t: 'normalize' } | { t: 'relationship'; relId: string; label: string } | { t: 'explain'; lines: string[]; cta?: { label: string; to: string } }
  | { t: 'lineage'; col: string } | { t: 'enrich' } | { t: 'list'; items: string[] };
export interface Toast { id: number; text: string }
export type AiMode = 'off' | 'metadata' | 'masked';
export interface ActEv { t: string; text: string; sub: string; to: string; fresh?: boolean }

interface S {
  technical: boolean; leftOpen: boolean; rightOpen: boolean; rTab: RTab;
  sel: Sel | null; select: (s: Sel | null, openRight?: boolean) => void;
  decisions: Record<string, Decision>; decide: (id: string, d: Decision | null) => void;
  extraSources: Source[]; extraAssets: Asset[]; addSource: (s: Source, a: Asset[]) => void;
  csStatus: Record<string, ChangeStatus>; csHistory: Record<string, { at: string; who: string; what: string }[]>; extraCs: ChangeSet[];
  setChange: (id: string, st: ChangeStatus, note: string) => void; addChangeSet: (c: ChangeSet) => void;
  enrichStatus: Record<string, Enrich['status']>; setEnrich: (id: string, st: Enrich['status']) => void;
  wizard: { open: boolean; connector?: string }; openWizard: (connector?: string) => void; closeWizard: () => void;
  ai: { mode: AiMode; rawValues: boolean; docs: 'none' | 'masked' | 'allowed'; samples: boolean }; setAi: (p: Partial<S['ai']>) => void;
  quarantine: { fixed: number; reprocessed: boolean }; fixQuarantine: () => void;
  runOverride: Record<number, string>; setRunStatus: (id: number, s: string) => void;
  live: { pct: number; rows: number; part: number }; tickLive: () => void;
  chat: Msg[]; pushChat: (m: Msg[]) => void; clearChat: () => void;
  extraActivity: ActEv[]; pushActivity: (e: ActEv) => void;
  toasts: Toast[]; toast: (text: string) => void; dismissToast: (id: number) => void;
  corrected: Record<string, string>; setCorrected: (id: string, v: string) => void; layoutLearned: boolean; learnLayout: () => void;
  mapApplied: Record<string, boolean>; setMapApplied: (id: string) => void;
  provenance: { open: boolean; kind?: string; label?: string }; showOrigin: (kind: string, label: string) => void; hideOrigin: () => void;
  mv: { mode: 'physical' | 'logical' | 'curated' | 'dimensional'; ver: 'source' | 'proposed' }; setMv: (p: Partial<S['mv']>) => void;
  toggleTech: () => void; setPane: (p: Partial<Pick<S, 'leftOpen' | 'rightOpen' | 'rTab'>>) => void;
}
const stored = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const persist = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
let toastSeq = 1;
const clock = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export const useDw = create<S>((set, get) => ({
  technical: stored('biweb.dw.technical', false), leftOpen: true, rightOpen: false, rTab: 'inspector',
  sel: null,
  select: (sel, openRight = true) => set((s) => ({ sel, ...(sel && openRight ? { rightOpen: true, rTab: 'inspector' as RTab } : {}), ...(!sel ? {} : {}), leftOpen: s.leftOpen })),
  decisions: {}, decide: (id, d) => set((s) => { const n = { ...s.decisions }; if (d) n[id] = d; else delete n[id]; return { decisions: n }; }),
  extraSources: [], extraAssets: [], addSource: (src, a) => set((s) => ({ extraSources: [...s.extraSources, src], extraAssets: [...s.extraAssets, ...a] })),
  csStatus: {}, csHistory: {}, extraCs: [],
  setChange: (id, st, note) => set((s) => ({ csStatus: { ...s.csStatus, [id]: st }, csHistory: { ...s.csHistory, [id]: [...(s.csHistory[id] ?? []), { at: clock(), who: 'Você', what: note }] } })),
  addChangeSet: (c) => set((s) => ({ extraCs: [c, ...s.extraCs] })),
  enrichStatus: {}, setEnrich: (id, st) => set((s) => ({ enrichStatus: { ...s.enrichStatus, [id]: st } })),
  wizard: { open: false }, openWizard: (connector) => set({ wizard: { open: true, connector } }), closeWizard: () => set({ wizard: { open: false } }),
  ai: { mode: 'metadata', rawValues: false, docs: 'masked', samples: false }, setAi: (p) => set((s) => ({ ai: { ...s.ai, ...p } })),
  quarantine: { fixed: 0, reprocessed: false }, fixQuarantine: () => set({ quarantine: { fixed: 811, reprocessed: true } }),
  runOverride: {}, setRunStatus: (id, st) => set((s) => ({ runOverride: { ...s.runOverride, [id]: st } })),
  live: { pct: 0.237, rows: 284000, part: 4 },
  tickLive: () => set((s) => { const pct = s.live.pct >= 1 ? 1 : Math.min(1, s.live.pct + 0.006); return { live: { pct, rows: Math.round(pct * 1200000), part: Math.min(12, Math.ceil(pct * 12)) } }; }),
  chat: [], pushChat: (m) => set((s) => ({ chat: [...s.chat, ...m] })), clearChat: () => set({ chat: [] }),
  extraActivity: [], pushActivity: (e) => set((s) => ({ extraActivity: [e, ...s.extraActivity].slice(0, 12) })),
  toasts: [], toast: (text) => { const id = toastSeq++; set((s) => ({ toasts: [...s.toasts, { id, text }] })); setTimeout(() => get().dismissToast(id), 3600); }, dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  corrected: {}, setCorrected: (id, v) => set((s) => ({ corrected: { ...s.corrected, [id]: v } })), layoutLearned: false, learnLayout: () => set({ layoutLearned: true }),
  mapApplied: {}, setMapApplied: (id) => set((s) => ({ mapApplied: { ...s.mapApplied, [id]: true } })),
  provenance: { open: false }, showOrigin: (kind, label) => set({ provenance: { open: true, kind, label } }), hideOrigin: () => set({ provenance: { open: false } }),
  mv: { mode: 'logical', ver: 'source' }, setMv: (p) => set((s) => ({ mv: { ...s.mv, ...p } })),
  toggleTech: () => { const v = !get().technical; persist('biweb.dw.technical', v); set({ technical: v }); },
  setPane: (p) => set(p),
}));

/* ───── seletores derivados ───── */
export const allSources = (extra: Source[]) => [...SOURCES, ...extra];
export const allAssets = (extra: Asset[]) => [...ASSETS, ...extra];
export const statusOf = (cs: ChangeSet, o: Record<string, ChangeStatus>): ChangeStatus => o[cs.id] ?? cs.status;
export const allChangeSets = (extra: ChangeSet[]) => [...extra, ...CHANGESETS];
export const enrichList = (o: Record<string, Enrich['status']>) => ENRICHMENTS.map((e) => ({ ...e, status: o[e.id] ?? e.status }));
export const AGO = (min: number) => (min < 1 ? 'agora' : min < 60 ? `há ${Math.round(min)} min` : min < 1440 ? `há ${Math.round(min / 60)} h` : `há ${Math.round(min / 1440)} dias`);
