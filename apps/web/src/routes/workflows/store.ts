import { create } from 'zustand';
import { applyOps, autoLayout, decide as decideRun, diffDocs, fastForward, retryNode, startRun, stepRun } from './engine';
import type { Run } from './engine';
import { respond } from './copilot';
import type { Msg } from './copilot';
import { cloneDeep, seedWorkflows } from './seeds';
import { GRID, defaultCfg, makeNode, newId, snap } from './model';
import type { Cfg, Doc, WEdge, WGroup, WNode, Workflow } from './model';

export type Mode = 'monitor' | 'edit';
export type View = 'draft' | 'published';
const KEY = 'biweb.workflows.v2';
export const docOf = (w: Workflow): Doc => ({ nodes: w.nodes, edges: w.edges, groups: w.groups, vars: w.vars });
/** Documento visível: o rascunho ou a versão publicada (somente leitura). */
export const viewDoc = (w: Workflow, v: View): Workflow => (v === 'published' && w.published ? { ...w, ...w.published } : w);
export const dirtyCount = (w: Workflow) => (w.published ? diffDocs(w.published, docOf(w)).length : 0);

interface Hist { past: Doc[]; future: Doc[] }
interface S {
  wfs: Workflow[]; id: string; mode: Mode; view: View;
  sel: string[]; selEdge: string | null; groupSel: string | null;
  hist: Record<string, Hist>; clip: { nodes: WNode[]; edges: WEdge[] } | null;
  runs: Record<string, Run[]>; pick: Record<string, number | null>; speed: number; nextId: number;
  chat: Record<string, Msg[]>; activeProposal: string | null; focus: string[]; toast: string | null;
  cur: () => Workflow;
  open: (id: string) => void; setMode: (m: Mode) => void; setView: (v: View) => void;
  select: (ids: string[], add?: boolean) => void; selectEdge: (id: string | null) => void; selectGroup: (id: string | null) => void;
  begin: () => void; patch: (fn: (d: Doc) => Doc) => void; commit: (fn: (d: Doc) => Doc) => void; undo: () => void; redo: () => void;
  addNode: (kind: string, x: number, y: number) => string; addNodeAuto: (kind: string) => string;
  connect: (from: string, port: string | undefined, to: string) => void; removeSel: () => void; duplicate: () => void; copy: () => void; paste: (at?: { x: number; y: number }) => void;
  group: (name?: string) => void; ungroup: (gid: string) => void; collapse: (gid: string) => void; layout: () => void;
  setNode: (id: string, p: Partial<WNode>) => void; setCfg: (id: string, c: Cfg) => void; setVar: (key: string, v: string) => void; setMeta: (p: Partial<Workflow>) => void;
  publish: (note: string) => void; restore: (v: number) => void;
  addWorkflow: (w: Workflow) => void; replaceDoc: (d: Doc, meta?: Partial<Workflow>) => void;
  run: (test?: boolean) => void; tick: (dt: number) => void; retry: (node: string) => void; decide: (node: string, route: string) => void; pickRun: (id: number | null) => void; setSpeed: (n: number) => void;
  pushMsg: (m: Msg) => void; ask: (text: string) => void; applyProposal: (msgId: string) => void; discardProposal: (msgId: string) => void; hover: (ids: string[]) => void; flash: (t: string | null) => void;
}

function seedRuns(wfs: Workflow[]): { runs: Record<string, Run[]>; nextId: number } {
  const runs: Record<string, Run[]> = {}, now = Date.now();
  wfs.forEach((w, i) => {
    const list: Run[] = [];
    // execuções antigas rodaram quando a conversão de datas ainda tolerava valores inválidos
    const healed = { ...w, nodes: w.nodes.map((n) => (n.id === 'dates' ? { ...n, cfg: { ...n.cfg, onInvalid: 'Quarentena' } } : n)) };
    const mk = (id: number, ago: number, opts: { stop?: boolean; live?: number; healed?: boolean } = {}) => {
      const e = opts.healed ? healed : w;
      let r = { ...startRun(e, id, w.schedule ? `Agenda · ${w.schedule}` : w.kind === 'realtime' ? 'Evento em tempo real' : 'Manual', now - ago), wf: w.id };
      if (opts.live != null) { for (let c = 0; c < opts.live * 10; c++) r = stepRun(e, r, 0.1); return r; }
      r = fastForward(e, r, 600, { stopWhenPaused: opts.stop });
      return r;
    };
    if (w.id === 'ingestao') list.push(mk(18423, 5000, { live: 17 }), mk(18422, 86400e3, { healed: true }), mk(18421, 2 * 86400e3), mk(18420, 3 * 86400e3, { healed: true }));
    else if (w.id === 'aprovacao') list.push(mk(18365, 7 * 60e3, { stop: true }), mk(18364, 3 * 86400e3), mk(18363, 6 * 86400e3));
    else list.push(mk(18300 + i * 10 + 2, (3 + i) * 3600e3), mk(18300 + i * 10 + 1, (27 + i) * 3600e3), mk(18300 + i * 10, (51 + i) * 3600e3));
    runs[w.id] = list;
  });
  return { runs, nextId: 18424 };
}

function load(): Workflow[] {
  const seeds = seedWorkflows();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Workflow[] | null;
    if (Array.isArray(raw) && raw.length && seeds.every((s) => raw.some((r) => r.id === s.id))) return raw;
  } catch { /* armazenamento indisponível */ }
  return seeds;
}

export const useWf = create<S>((set, get) => {
  const wfs = load(), { runs, nextId } = seedRuns(wfs);
  const upd = (fn: (w: Workflow) => Workflow) => set((s) => ({ wfs: s.wfs.map((w) => (w.id === s.id ? fn(w) : w)) }));
  const mutate = (fn: (d: Doc) => Doc) => upd((w) => ({ ...w, ...fn(docOf(w)) }));
  const push = () => { const s = get(), h = s.hist[s.id] ?? { past: [], future: [] }, w = s.cur(); set({ hist: { ...s.hist, [s.id]: { past: [...h.past.slice(-60), cloneDeep(docOf(w))], future: [] } } }); };
  const editable = () => get().mode === 'edit' && get().view === 'draft';
  return {
    wfs, id: wfs[0]!.id, mode: 'monitor', view: 'draft', sel: [], selEdge: null, groupSel: null, hist: {}, clip: null,
    runs, pick: {}, speed: 4, nextId, chat: {}, activeProposal: null, focus: [], toast: null,
    cur: () => get().wfs.find((w) => w.id === get().id) ?? get().wfs[0]!,
    open: (id) => set({ id, mode: 'monitor', sel: [], selEdge: null, groupSel: null, activeProposal: null, focus: [], view: 'draft' }),
    setMode: (mode) => set({ mode, activeProposal: null, ...(mode === 'monitor' ? { selEdge: null } : {}) }),
    setView: (view) => get().cur().published || view === 'draft' ? set({ view, ...(view === 'published' ? { mode: 'monitor' as Mode } : {}), sel: [], selEdge: null }) : undefined,
    select: (ids, add) => set((s) => ({ sel: add ? [...new Set([...s.sel, ...ids])].filter((x) => !(s.sel.includes(x) && ids.includes(x))) : ids, selEdge: null, groupSel: null })),
    selectEdge: (id) => set({ selEdge: id, sel: [], groupSel: null }),
    selectGroup: (id) => set((s) => ({ groupSel: id, selEdge: null, sel: id ? s.cur().groups.find((g) => g.id === id)?.nodes ?? [] : [] })),
    begin: () => { if (editable()) push(); },
    patch: (fn) => { if (editable()) mutate(fn); },
    commit: (fn) => { if (!editable()) return; push(); mutate(fn); },
    undo: () => { const s = get(), h = s.hist[s.id]; if (!h?.past.length) return; const prev = h.past[h.past.length - 1]; if (!prev) return; set({ hist: { ...s.hist, [s.id]: { past: h.past.slice(0, -1), future: [cloneDeep(docOf(s.cur())), ...h.future] } }, sel: [] }); mutate(() => prev); },
    redo: () => { const s = get(), h = s.hist[s.id]; if (!h?.future.length) return; const nx = h.future[0]; if (!nx) return; set({ hist: { ...s.hist, [s.id]: { past: [...h.past, cloneDeep(docOf(s.cur()))], future: h.future.slice(1) } }, sel: [] }); mutate(() => nx); },
    addNode: (kind, x, y) => { const n = makeNode(kind, x, y); get().commit((d) => ({ ...d, nodes: [...d.nodes, n] })); set({ sel: [n.id], selEdge: null }); return n.id; },
    addNodeAuto: (kind) => {
      const d = get().cur(), sel = d.nodes.find((n) => n.id === get().sel[0]);
      const x = sel ? sel.x + 216 : d.nodes.length ? Math.max(...d.nodes.map((n) => n.x)) + 216 : 0, y = sel ? sel.y : d.nodes.length ? d.nodes[d.nodes.length - 1]!.y : 96;
      const id = get().addNode(kind, x, y);
      if (sel) get().connect(sel.id, undefined, id);
      return id;
    },
    connect: (from, port, to) => {
      const w = get().cur();
      if (from === to || w.edges.some((e) => e.from === from && e.to === to && e.port === port)) return;
      const k = w.nodes.find((n) => n.id === from);
      if (!k) return;
      get().commit((d) => ({ ...d, edges: [...d.edges, { id: newId('e'), from, to, port }] }));
    },
    removeSel: () => {
      const s = get();
      if (s.selEdge) { s.commit((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== s.selEdge) })); set({ selEdge: null }); return; }
      if (!s.sel.length) return;
      const ids = new Set(s.sel);
      s.commit((d) => ({ ...d, nodes: d.nodes.filter((n) => !ids.has(n.id)), edges: d.edges.filter((e) => !ids.has(e.from) && !ids.has(e.to)), groups: d.groups.map((g) => ({ ...g, nodes: g.nodes.filter((x) => !ids.has(x)) })).filter((g) => g.nodes.length) }));
      set({ sel: [], groupSel: null });
    },
    duplicate: () => { get().copy(); get().paste({ x: 32, y: 32 }); },
    copy: () => { const s = get(), w = s.cur(), ids = new Set(s.sel); if (ids.size) set({ clip: cloneDeep({ nodes: w.nodes.filter((n) => ids.has(n.id)), edges: w.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) }) }); },
    paste: (at = { x: 32, y: 32 }) => {
      const c = get().clip; if (!c || !editable()) return;
      const map = new Map(c.nodes.map((n) => [n.id, newId('n')])), nodes = c.nodes.map((n) => ({ ...cloneDeep(n), id: map.get(n.id)!, x: snap(n.x + at.x), y: snap(n.y + at.y), name: n.name }));
      get().commit((d) => ({ ...d, nodes: [...d.nodes, ...nodes], edges: [...d.edges, ...c.edges.map((e) => ({ ...e, id: newId('e'), from: map.get(e.from)!, to: map.get(e.to)! }))] }));
      set({ sel: nodes.map((n) => n.id), clip: { nodes: c.nodes.map((n) => ({ ...n, x: n.x + at.x, y: n.y + at.y })), edges: c.edges } });
    },
    group: (name) => {
      const s = get(); if (s.sel.length < 2) return;
      const g: WGroup = { id: newId('g'), name: name ?? 'NOVO GRUPO', tone: 'accent', nodes: s.sel };
      s.commit((d) => ({ ...d, groups: [...d.groups.map((x) => ({ ...x, nodes: x.nodes.filter((n) => !s.sel.includes(n)) })).filter((x) => x.nodes.length), g] }));
      set({ groupSel: g.id });
    },
    ungroup: (gid) => { get().commit((d) => ({ ...d, groups: d.groups.filter((g) => g.id !== gid) })); set({ groupSel: null }); },
    collapse: (gid) => upd((w) => ({ ...w, groups: w.groups.map((g) => (g.id === gid ? { ...g, collapsed: !g.collapsed } : g)) })),
    layout: () => get().commit((d) => { const pos = autoLayout(d, { x: Math.min(0, ...d.nodes.map((n) => n.x)), y: Math.min(0, ...d.nodes.map((n) => n.y)) }); return { ...d, nodes: d.nodes.map((n) => ({ ...n, ...pos[n.id] })) }; }),
    setNode: (id, p) => get().commit((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...p } : n)) })),
    setCfg: (id, c) => get().commit((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, cfg: { ...n.cfg, ...c } } : n)) })),
    setVar: (key, v) => get().commit((d) => ({ ...d, vars: d.vars.map((x) => (x.key === key ? { ...x, value: v } : x)) })),
    setMeta: (p) => upd((w) => ({ ...w, ...p })),
    publish: (note) => upd((w) => {
      const v = (w.versions[0]?.v ?? 0) + 1;
      return { ...w, published: cloneDeep(docOf(w)), versions: [{ v, state: 'published', author: 'Você', at: 'agora', note: note || 'Publicação', doc: undefined }, ...w.versions.map((x, i) => ({ ...x, state: i === 0 ? ('previous' as const) : x.state, doc: x.doc ?? (i === 0 && w.published ? cloneDeep(w.published) : undefined) }))] };
    }),
    restore: (v) => { const w = get().cur(), ver = w.versions.find((x) => x.v === v); const doc = ver?.doc ?? (ver?.state === 'published' ? w.published : undefined); if (!doc) return; get().commit(() => cloneDeep(doc)); set({ view: 'draft', toast: `Versão v${v} restaurada como rascunho` }); },
    addWorkflow: (w) => set((s) => ({ wfs: [...s.wfs, w], id: w.id, mode: 'edit', view: 'draft', sel: [], runs: { ...s.runs, [w.id]: [] }, pick: { ...s.pick, [w.id]: null } })),
    replaceDoc: (d, meta) => { get().commit(() => d); if (meta) upd((w) => ({ ...w, ...meta })); },
    run: (test) => {
      const s = get(), w = viewDoc(s.cur(), s.view), id = s.nextId;
      const live = w.kind === 'realtime' ? 'Evento detectado' : w.schedule ? 'Manual · fora da agenda' : 'Manual';
      const r = { ...startRun(w, id, test ? 'Teste do rascunho' : live, Date.now(), !!test), wf: w.id };
      set({ nextId: id + 1, runs: { ...s.runs, [w.id]: [r, ...(s.runs[w.id] ?? [])].slice(0, 12) }, pick: { ...s.pick, [w.id]: id }, mode: test ? s.mode : 'monitor' });
    },
    tick: (dt) => set((s) => {
      let changed = false;
      const runs = Object.fromEntries(Object.entries(s.runs).map(([k, list]) => [k, list.map((r) => {
        if (r.done) return r;
        const w = s.wfs.find((x) => x.id === k); if (!w) return r;
        changed = true; return stepRun(w, r, dt);
      })]));
      return changed ? { runs } : {};
    }),
    retry: (node) => set((s) => { const w = s.cur(), r = (s.runs[w.id] ?? []).find((x) => x.id === s.pick[w.id]) ?? s.runs[w.id]?.[0]; if (!r || r.nodes[node]?.state !== 'failed') return {}; return { runs: { ...s.runs, [w.id]: (s.runs[w.id] ?? []).map((x) => (x.id === r.id ? retryNode(w, x, node) : x)) } }; }),
    decide: (node, route) => set((s) => { const w = s.cur(), r = (s.runs[w.id] ?? []).find((x) => x.id === s.pick[w.id]) ?? s.runs[w.id]?.[0]; if (!r) return {}; return { runs: { ...s.runs, [w.id]: (s.runs[w.id] ?? []).map((x) => (x.id === r.id ? decideRun(w, x, node, route) : x)) } }; }),
    pickRun: (id) => set((s) => ({ pick: { ...s.pick, [s.id]: id } })),
    setSpeed: (speed) => set({ speed }),
    pushMsg: (m) => set((s) => ({ chat: { ...s.chat, [s.id]: [...(s.chat[s.id] ?? []), m] }, activeProposal: m.proposal ? m.id : s.activeProposal, focus: m.focus ?? [] })),
    ask: (text) => {
      const s = get(), w = viewDoc(s.cur(), s.view), run = (s.runs[w.id] ?? []).find((r) => r.id === s.pick[w.id]) ?? s.runs[w.id]?.[0];
      const user: Msg = { id: newId('u'), role: 'user', text }, reply = respond(text, { wf: w, selection: s.sel, run });
      set({ chat: { ...s.chat, [w.id]: [...(s.chat[w.id] ?? []), user, reply] }, activeProposal: reply.proposal ? reply.id : null, focus: reply.focus ?? [] });
    },
    applyProposal: (msgId) => {
      const s = get(), msg = (s.chat[s.id] ?? []).find((m) => m.id === msgId), p = msg?.proposal; if (!p || p.status !== 'pending') return;
      const mark = (status: 'applied') => set((x) => ({ chat: { ...x.chat, [x.id]: (x.chat[x.id] ?? []).map((m) => (m.id === msgId ? { ...m, proposal: { ...m.proposal!, status } } : m)) }, activeProposal: null, focus: [] }));
      if (p.newWf) {
        if (!s.cur().nodes.length) { s.replaceDoc(docOf(p.newWf), { name: p.newWf.name, description: p.newWf.description, kind: p.newWf.kind, schedule: p.newWf.schedule, live: p.newWf.live }); mark('applied'); }
        else { mark('applied'); get().addWorkflow(p.newWf); }
        return;
      }
      if (!editable()) set({ mode: 'edit', view: 'draft' });
      get().commit((d) => applyOps(d, p.ops));
      mark('applied'); set({ toast: `${p.title} · aplicado ao rascunho. Nenhuma execução foi iniciada.` });
    },
    discardProposal: (msgId) => set((s) => ({ chat: { ...s.chat, [s.id]: (s.chat[s.id] ?? []).map((m) => (m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status: 'discarded' } } : m)) }, activeProposal: s.activeProposal === msgId ? null : s.activeProposal, focus: [] })),
    hover: (focus) => set({ focus }),
    flash: (toast) => set({ toast }),
  };
});

let timer: ReturnType<typeof setTimeout> | undefined;
useWf.subscribe((s, p) => {
  if (s.wfs === p.wfs) return;
  clearTimeout(timer);
  timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s.wfs)); } catch { /* sem armazenamento */ } }, 400);
});
export { GRID, defaultCfg };
