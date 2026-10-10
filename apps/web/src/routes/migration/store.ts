import { create } from 'zustand';
import { DEMO_ID, HISTORY, PROJECTS, RECON } from './analysis';
import type { HistoryEntry, Msg, PlatformId, Project, ProjState, Strategy, TabId } from './model';
import { PLATFORMS } from './model';
import { respond } from './copilot';
export type { Msg, Op, Proposal, ProjState, TabId } from './model';
export { effectiveStrategy, pendingReview, readiness, strategyCounts } from './derive';

export const TABS: { id: TabId; label: string; group: string }[] = [
  { id: 'overview', label: 'Visão geral', group: 'Entender' }, { id: 'inventory', label: 'Inventário', group: 'Entender' }, { id: 'blueprint', label: 'Blueprint', group: 'Entender' },
  { id: 'data', label: 'Modelo de dados', group: 'Dados' }, { id: 'semantics', label: 'Semântica', group: 'Dados' },
  { id: 'compat', label: 'Compatibilidade', group: 'Avaliar' }, { id: 'mappings', label: 'Mapeamentos', group: 'Avaliar' },
  { id: 'reconstruct', label: 'Reconstrução', group: 'Reconstruir' },
  { id: 'validation', label: 'Validação', group: 'Validar' },
  { id: 'publish', label: 'Publicação', group: 'Publicar' }, { id: 'bridge', label: 'Bridge', group: 'Publicar' },
];
export type RightTab = 'inspector' | 'deps' | 'copilot';

const initState = (demo: boolean): ProjState => ({
  strategies: demo ? { 'rep:netmap': 'modernize', 'vz:exec:overview:6': 'fidelity' } : {}, review: {}, insights: {}, mappings: {}, proposals: {}, suggestions: {},
  recon: Object.fromEntries(RECON.map((r) => [r.id, demo ? r.initial : 0])), excluded: [], bridge: {}, checks: demo ? 999 : 0, checksResolved: {},
  published: false, version: 0, analysisV: demo ? 3 : 1, analyzed: demo ? 'há 8 min' : 'agora', history: demo ? HISTORY : [], chat: [],
});

interface Store {
  projects: Project[];
  ps: Record<string, ProjState>;
  analyzing: Record<string, boolean>;
  tab: TabId; sel: string; rightOpen: boolean; rightTab: RightTab; pid: string; flashMsg: string | null;
  open: (id: string) => void; set: (p: Partial<Pick<Store, 'tab' | 'sel' | 'rightOpen' | 'rightTab'>>) => void;
  cur: () => ProjState;
  patch: (fn: (s: ProjState) => Partial<ProjState>) => void;
  create: (p: { name: string; platform: PlatformId; workspace: string; strategy: Strategy; scope: Project['scope']; objects: number }) => string;
  startAnalysis: (id: string) => void; finishAnalysis: (id: string) => void;
  setStrategy: (id: string, v: Strategy | null) => void; setProjectStrategy: (id: string, v: Strategy) => void;
  decideReview: (id: string, v: 'accepted' | 'rejected' | null) => void;
  decideInsight: (id: string, v: 'applied' | 'ignored' | null) => void;
  decideMapping: (id: string, v: 'confirmed' | 'rejected' | null) => void;
  decideProposal: (id: string, v: 'accepted' | 'rejected' | 'review') => void;
  decideSuggestion: (id: string, v: 'accepted' | 'ignored' | null) => void;
  reconstruct: (id: string) => void; setRecon: (id: string, n: number) => void;
  toggleScope: (ids: string[], on: boolean) => void;
  decideBridge: (id: string, v: 'reviewed' | 'applied') => void;
  runValidation: () => void; resolveCheck: (id: string) => void;
  publish: () => void;
  ask: (text: string) => void; applyProposal: (msgId: string) => void; discardProposal: (msgId: string) => void;
  flash: (m: string) => void;
  addHistory: (e: Omit<HistoryEntry, 'id'>) => void;
}

let n = 0; const uid = (p: string) => `${p}${Date.now().toString(36)}${n++}`;
export const useMig = create<Store>((set, get) => ({
  projects: PROJECTS, ps: { [DEMO_ID]: initState(true) }, analyzing: {}, tab: 'overview', sel: 'rep:exec', rightOpen: true, rightTab: 'inspector', pid: DEMO_ID, flashMsg: null,
  open: (id) => set((s) => ({ pid: id, ps: s.ps[id] ? s.ps : { ...s.ps, [id]: initState(id === DEMO_ID) }, tab: 'overview', sel: id === DEMO_ID ? 'rep:exec' : '', rightTab: 'inspector' })),
  set: (p) => set(p),
  cur: () => get().ps[get().pid] ?? initState(false),
  patch: (fn) => set((s) => { const cur = s.ps[s.pid] ?? initState(false); return { ps: { ...s.ps, [s.pid]: { ...cur, ...fn(cur) } } }; }),
  create: (p) => {
    const id = uid('mp_');
    const proj: Project = { id, name: p.name, platform: p.platform, workspace: p.workspace, status: 'analyzing', statusNote: 'Analisando', phase: 'source', objects: p.objects, objectsLabel: PLATFORMS.find((x) => x.id === p.platform)?.nouns.reports ?? 'itens', progress: 0, owner: 'Samuel Souto', activity: 'agora · conectando', lastAnalyzed: 'em andamento', strategy: p.strategy, detail: p.platform === 'powerbi' ? 'full' : 'summary', scope: p.scope, mix: { native: 0, equivalent: 0, redesign: 0, review: 0 } };
    set((s) => ({ projects: [proj, ...s.projects], ps: { ...s.ps, [id]: initState(false) }, pid: id, tab: 'overview', sel: '', analyzing: { ...s.analyzing, [id]: true } }));
    return id;
  },
  startAnalysis: (id) => set((s) => ({ analyzing: { ...s.analyzing, [id]: true } })),
  finishAnalysis: (id) => set((s) => {
    const cur = s.ps[id] ?? initState(false), v = cur.history.length ? cur.analysisV + 1 : cur.analysisV;
    const entry: HistoryEntry = { id: uid('h'), v: `v${v}`, title: v > 1 ? `Re-análise v${v}` : `Análise v${v}`, detail: 'Inventário, blueprint e compatibilidade atualizados.', when: 'agora', kind: 'analysis' };
    return { analyzing: { ...s.analyzing, [id]: false }, ps: { ...s.ps, [id]: { ...cur, analysisV: v, analyzed: 'agora', history: [entry, ...cur.history], recon: cur.recon } },
      projects: s.projects.map((p) => p.id === id ? { ...p, status: p.status === 'analyzing' ? 'review' : p.status, statusNote: p.status === 'analyzing' ? 'Análise concluída' : p.statusNote, phase: p.phase === 'source' ? 'understand' : p.phase, progress: Math.max(p.progress, 18), lastAnalyzed: 'agora', activity: 'agora · análise concluída', mix: p.mix.native ? p.mix : { native: 71, equivalent: 19, redesign: 8, review: 2 } } : p) };
  }),
  setProjectStrategy: (id, v) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, strategy: v } : p) })),
  setStrategy: (id, v) => get().patch((s) => { const x = { ...s.strategies }; if (v) x[id] = v; else delete x[id]; return { strategies: x }; }),
  decideReview: (id, v) => get().patch((s) => { const x = { ...s.review }; if (v) x[id] = v; else delete x[id]; return { review: x }; }),
  decideInsight: (id, v) => get().patch((s) => { const x = { ...s.insights }; if (v) x[id] = v; else delete x[id]; return { insights: x }; }),
  decideMapping: (id, v) => get().patch((s) => { const x = { ...s.mappings }; if (v) x[id] = v; else delete x[id]; return { mappings: x }; }),
  decideProposal: (id, v) => get().patch((s) => ({ proposals: { ...s.proposals, [id]: v } })),
  decideSuggestion: (id, v) => get().patch((s) => { const x = { ...s.suggestions }; if (v) x[id] = v; else delete x[id]; return { suggestions: x }; }),
  setRecon: (id, nn) => get().patch((s) => ({ recon: { ...s.recon, [id]: nn } })),
  reconstruct: (id) => {
    const start = get().cur().recon[id] ?? 0; if (start >= 100) return;
    let v = Math.min(start, 8);
    get().setRecon(id, Math.max(v, 4));
    const t = setInterval(() => { v = Math.min(100, v + 9 + (v % 7)); get().setRecon(id, v); if (v >= 100) { clearInterval(t); get().addHistory({ v: '', title: 'Reconstrução concluída', detail: RECON.find((r) => r.id === id)?.name ?? id, when: 'agora', kind: 'reconstruction' }); } }, 260);
  },
  toggleScope: (ids, on) => get().patch((s) => ({ excluded: on ? s.excluded.filter((x) => !ids.includes(x)) : [...new Set([...s.excluded, ...ids])] })),
  decideBridge: (id, v) => get().patch((s) => ({ bridge: { ...s.bridge, [id]: v } })),
  runValidation: () => {
    get().patch(() => ({ checks: 0 }));
    const t = setInterval(() => { const c = get().cur().checks; if (c >= 32) { clearInterval(t); get().addHistory({ v: '', title: 'Validação executada', detail: '32 comparações concluídas.', when: 'agora', kind: 'validation' }); return; } get().patch((s) => ({ checks: s.checks + 1 })); }, 90);
  },
  resolveCheck: (id) => get().patch((s) => ({ checksResolved: { ...s.checksResolved, [id]: 'accepted' } })),
  publish: () => { get().patch((s) => ({ published: true, version: s.version + 1 })); get().addHistory({ v: `v${get().cur().version}`, title: `Publicado v${get().cur().version}`, detail: 'Relatórios, mapas, fluxos e modelos publicados no BIWEB.', when: 'agora', kind: 'publish' }); set((s) => ({ projects: s.projects.map((p) => p.id === s.pid ? { ...p, status: 'completed', statusNote: 'Publicado', phase: 'publish', progress: 100, activity: 'agora · publicado' } : p) })); },
  addHistory: (e) => get().patch((s) => ({ history: [{ ...e, id: uid('h') }, ...s.history] })),
  flash: (m) => { set({ flashMsg: m }); setTimeout(() => { if (get().flashMsg === m) set({ flashMsg: null }); }, 3200); },
  ask: (text) => {
    const { sel } = get(), user: Msg = { id: uid('m'), role: 'user', text, ctx: sel };
    get().patch((s) => ({ chat: [...s.chat, user] })); get().set({ rightOpen: true, rightTab: 'copilot' });
    /* a resposta chega logo depois da pergunta, como num assistente de verdade */
    setTimeout(() => { const reply = respond(text, sel, get()); get().patch((s) => ({ chat: [...s.chat, ...(reply ? [reply] : [])] })); if (reply?.focus?.[0]) get().set({ sel: reply.focus[0] }); }, 450);
  },
  discardProposal: (msgId) => get().patch((s) => ({ chat: s.chat.map((m) => m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status: 'discarded' } } : m) })),
  applyProposal: (msgId) => {
    const m = get().cur().chat.find((x) => x.id === msgId); if (!m?.proposal || m.proposal.status !== 'pending') return;
    const st = get();
    for (const op of m.proposal.ops) {
      if (op.t === 'strategy') st.setStrategy(op.id, op.value);
      else if (op.t === 'recon') st.reconstruct(op.id);
      else if (op.t === 'review') st.decideReview(op.id, op.value);
      else if (op.t === 'suggestion') st.decideSuggestion(op.id, 'accepted');
      else if (op.t === 'mapping') st.decideMapping(op.id, 'confirmed');
      else if (op.t === 'insight') st.decideInsight(op.id, 'applied');
      else if (op.t === 'tab') st.set({ tab: op.tab, ...(op.select ? { sel: op.select } : {}) });
    }
    get().patch((s) => ({ chat: s.chat.map((x) => x.id === msgId && x.proposal ? { ...x, proposal: { ...x.proposal, status: 'applied' } } : x) }));
    st.flash('Aplicado ao projeto. Tudo fica no histórico de migração.');
  },
}));

