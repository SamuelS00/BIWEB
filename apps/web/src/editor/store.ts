import { create } from 'zustand';
import { produce, type Draft } from 'immer';
import type { Filter } from '../data/types';
import { makeComp, newPage, uid, type Comp, type CompType, type Page, type ReportDoc } from './doc';
import { useLibrary } from './library';
import { filtersFromComp } from '../viz/filterOps';

/**
 * Store central do editor. O documento é imutável (immer): cada alteração gera um passo de histórico rotulado.
 * Estado transitório de arrastar/redimensionar NÃO passa por aqui até o drop (ver Canvas).
 */
export type RightTab = 'build' | 'data' | 'visual' | 'interactions' | 'rules' | 'ai';
interface Step { doc: ReportDoc; label: string; tx?: string; pageId: string }
export interface Cross { source: string; table: string; field: string; value: unknown; label: string; mode?: 'filter' | 'highlight' }
/** Per-widget changes made while reading a report (filters, sort, table view). They never touch the saved document. */
export interface ViewOverride { filters?: Filter[]; props?: Record<string, unknown>; asTable?: boolean }
export interface Toast { id: number; text: string; tone: 'success' | 'info' | 'danger'; action?: { label: string; run: () => void } }

interface EditorState {
  doc: ReportDoc | null;
  past: Step[]; future: Step[];
  pageId: string; selection: string[]; mode: 'edit' | 'preview'; zoom: number; fit: boolean;
  clipboard: Comp[] | null; rightTab: RightTab; interactive: string | null; focusComp: string | null;
  saveState: 'saved' | 'saving'; savedAt: number | null;
  flash: Record<string, number>; toasts: Toast[]; layoutAnim: number;
  // estado de execução (não entra no undo): filtros/slicers, cross-filter, drill, elemento selecionado em mapa/3D
  filterValues: Record<string, unknown[]>; cross: Cross | null; drill: Record<string, unknown[]>; picked: { comp: string; kind: string; id: string } | null; view: Record<string, ViewOverride>; returnTo: { page: string; label: string } | null;

  load: (doc: ReportDoc) => void;
  commit: (label: string, fn: (d: Draft<ReportDoc>) => void, opts?: { tx?: string; select?: string[]; flash?: string[] }) => void;
  undo: () => void; redo: () => void;
  set: (p: Partial<EditorState>) => void;
  select: (ids: string[], additive?: boolean) => void;
  page: () => Page | undefined;
  // componentes
  insert: (type: CompType, at?: { x: number; y: number }, preset?: Record<string, unknown>, opts?: { tx?: string; label?: string }) => string;
  update: (id: string, fn: (c: Draft<Comp>) => void, label?: string, tx?: string) => void;
  setRects: (rects: Record<string, { x: number; y: number; w: number; h: number }>, label: string) => void;
  remove: (ids?: string[]) => void; duplicate: (ids?: string[]) => void; copy: () => void; paste: () => void;
  order: (op: 'front' | 'back' | 'forward' | 'backward', ids?: string[]) => void;
  align: (op: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void; distribute: (axis: 'h' | 'v') => void;
  nudge: (dx: number, dy: number) => void;
  // páginas
  addPage: (name?: string) => void; duplicatePage: (id: string) => void; renamePage: (id: string, name: string) => void; movePage: (id: string, dir: -1 | 1) => void; deletePage: (id: string) => void; goPage: (id: string, carry?: Cross | null) => void;
  // execução
  setView: (compId: string, patch: Partial<ViewOverride> | null) => void; clearAll: () => void; setFilter: (compId: string, values: unknown[]) => void; setCross: (c: Cross | null) => void; filtersFor: (comp: Comp) => Filter[];
  saveNow: (label?: string) => void; toast: (t: Omit<Toast, 'id'>) => void;
}

const GRID = 8;
const snap = (v: number) => Math.round(v / GRID) * GRID;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastId = 0;

export const useEditor = create<EditorState>((set, get) => {
  const pageOf = (d: Draft<ReportDoc> | ReportDoc) => d.pages.find((p) => p.id === get().pageId) ?? d.pages[0]!;
  const sel = (ids?: string[]) => ids ?? get().selection;
  const scheduleSave = () => {
    set({ saveState: 'saving' });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { const d = get().doc; if (d) { useLibrary.getState().save(d); set({ saveState: 'saved', savedAt: Date.now() }); } }, 700);
  };
  return {
    doc: null, past: [], future: [], pageId: '', selection: [], mode: 'edit', zoom: 1, fit: true, clipboard: null, rightTab: 'build', interactive: null, focusComp: null,
    saveState: 'saved', savedAt: null, flash: {}, toasts: [], layoutAnim: 0, filterValues: {}, cross: null, drill: {}, picked: null, view: {}, returnTo: null,

    load: (doc) => set({ doc, past: [], future: [], pageId: doc.pages[0]!.id, selection: [], interactive: null, focusComp: null, filterValues: {}, cross: null, drill: {}, picked: null, view: {}, returnTo: null, saveState: 'saved', savedAt: doc.updatedAt }),
    commit: (label, fn, opts) => {
      const { doc, past, pageId } = get();
      if (!doc) return;
      const next = produce(doc, (d) => { fn(d); d.updatedAt = Date.now(); });
      const top = past[past.length - 1];
      const merge = opts?.tx && top?.tx === opts.tx;
      const flash = opts?.flash?.length ? { ...get().flash, ...Object.fromEntries(opts.flash.map((id) => [id, Date.now()])) } : get().flash;
      set({ doc: next, past: merge ? past : [...past.slice(-99), { doc, label, tx: opts?.tx, pageId }], future: [], flash, ...(opts?.select ? { selection: opts.select } : {}) });
      scheduleSave();
    },
    undo: () => {
      const { past, doc, future, pageId } = get();
      const prev = past[past.length - 1];
      if (!prev || !doc) return;
      const ids = new Set(prev.doc.pages.flatMap((p) => p.comps.map((c) => c.id)));
      set({ doc: prev.doc, past: past.slice(0, -1), future: [{ doc, label: prev.label, pageId }, ...future], selection: get().selection.filter((i) => ids.has(i)),
        pageId: prev.doc.pages.some((p) => p.id === prev.pageId) ? prev.pageId : prev.doc.pages[0]!.id });
      get().toast({ text: `Desfeito: ${prev.label}`, tone: 'info' });
      scheduleSave();
    },
    redo: () => {
      const { past, doc, future, pageId } = get();
      const nxt = future[0];
      if (!nxt || !doc) return;
      set({ doc: nxt.doc, future: future.slice(1), past: [...past, { doc, label: nxt.label, pageId }], pageId: nxt.doc.pages.some((p) => p.id === nxt.pageId) ? nxt.pageId : pageId });
      get().toast({ text: `Refeito: ${nxt.label}`, tone: 'info' });
      scheduleSave();
    },
    set: (p) => set(p),
    select: (ids, additive) => set({ selection: additive ? [...new Set([...get().selection.filter((i) => !ids.includes(i)), ...ids.filter((i) => !get().selection.includes(i))])] : ids, interactive: null }),
    page: () => { const d = get().doc; return d ? d.pages.find((p) => p.id === get().pageId) ?? d.pages[0] : undefined; },

    insert: (type, at, preset, opts) => {
      const p = get().page();
      if (!p) return '';
      const z = Math.max(0, ...p.comps.map((c) => c.z)) + 1;
      const pos = at ?? freeSpot(p, type);
      const c = makeComp(type, { x: snap(pos.x), y: snap(pos.y) }, preset, z);
      if (c.data && get().doc!.datasets[0]) c.data.dataset = get().doc!.datasets[0]!;
      c.x = Math.max(0, Math.min(p.w - c.w, c.x)); c.y = Math.max(0, c.y);
      get().commit(opts?.label ?? `Inserir ${c.name}`, (d) => { pageOf(d).comps.push(c); }, { tx: opts?.tx, select: [c.id], flash: [c.id] });
      return c.id;
    },
    update: (id, fn, label = 'Alterar propriedade', tx) => get().commit(label, (d) => { for (const pg of d.pages) { const c = pg.comps.find((x) => x.id === id); if (c) fn(c); } }, { tx: tx ?? `prop:${id}:${label}` }),
    setRects: (rects, label) => get().commit(label, (d) => { for (const c of pageOf(d).comps) { const r = rects[c.id]; if (r) Object.assign(c, r); } }),
    remove: (ids) => {
      const s = sel(ids).filter((i) => !get().page()?.comps.find((c) => c.id === i)?.locked);
      if (!s.length) return;
      get().commit(s.length > 1 ? `Excluir ${s.length} componentes` : `Excluir ${get().page()?.comps.find((c) => c.id === s[0])?.name ?? 'componente'}`, (d) => { const pg = pageOf(d); pg.comps = pg.comps.filter((c) => !s.includes(c.id)); }, { select: [] });
    },
    duplicate: (ids) => {
      const p = get().page(); const s = sel(ids);
      if (!p || !s.length) return;
      let z = Math.max(0, ...p.comps.map((c) => c.z));
      const copies = p.comps.filter((c) => s.includes(c.id)).map((c) => ({ ...structuredClone(c), id: uid(c.type), x: c.x + 24, y: c.y + 24, z: ++z, name: `${c.name} (cópia)` }));
      get().commit(copies.length > 1 ? `Duplicar ${copies.length} componentes` : `Duplicar ${copies[0]!.name.replace(' (cópia)', '')}`, (d) => { pageOf(d).comps.push(...copies); }, { select: copies.map((c) => c.id), flash: copies.map((c) => c.id) });
    },
    copy: () => { const p = get().page(); const s = get().selection; if (p && s.length) { set({ clipboard: structuredClone(p.comps.filter((c) => s.includes(c.id))) }); get().toast({ text: `${s.length > 1 ? `${s.length} componentes copiados` : 'Componente copiado'}`, tone: 'info' }); } },
    paste: () => {
      const p = get().page(); const clip = get().clipboard;
      if (!p || !clip?.length) return;
      let z = Math.max(0, ...p.comps.map((c) => c.z));
      const same = clip.some((c) => p.comps.some((x) => x.id === c.id || (x.x === c.x && x.y === c.y)));
      const copies = clip.map((c) => ({ ...structuredClone(c), id: uid(c.type), x: c.x + (same ? 24 : 0), y: c.y + (same ? 24 : 0), z: ++z }));
      get().commit(`Colar ${copies.length > 1 ? `${copies.length} componentes` : copies[0]!.name}`, (d) => { pageOf(d).comps.push(...copies); }, { select: copies.map((c) => c.id), flash: copies.map((c) => c.id) });
      set({ clipboard: copies });
    },
    order: (op, ids) => {
      const s = sel(ids); if (!s.length) return;
      const label = { front: 'Trazer para a frente', back: 'Enviar para trás', forward: 'Avançar uma camada', backward: 'Recuar uma camada' }[op];
      get().commit(label, (d) => {
        const comps = [...pageOf(d).comps].sort((a, b) => a.z - b.z);
        const moving = comps.filter((c) => s.includes(c.id)), rest = comps.filter((c) => !s.includes(c.id));
        let out: typeof comps;
        if (op === 'front') out = [...rest, ...moving];
        else if (op === 'back') out = [...moving, ...rest];
        else {
          out = [...comps];
          const idxs = out.map((c, i) => (s.includes(c.id) ? i : -1)).filter((i) => i >= 0);
          for (const i of op === 'forward' ? idxs.reverse() : idxs) { const j = i + (op === 'forward' ? 1 : -1); if (j >= 0 && j < out.length && !s.includes(out[j]!.id)) [out[i], out[j]] = [out[j]!, out[i]!]; }
        }
        out.forEach((c, i) => { c.z = i + 1; });
      });
    },
    align: (op) => {
      const p = get().page(); const s = get().selection;
      if (!p || !s.length) return;
      const cs = p.comps.filter((c) => s.includes(c.id));
      const box = cs.length === 1 ? { x: 0, y: 0, r: p.w, b: p.h } : { x: Math.min(...cs.map((c) => c.x)), y: Math.min(...cs.map((c) => c.y)), r: Math.max(...cs.map((c) => c.x + c.w)), b: Math.max(...cs.map((c) => c.y + c.h)) };
      const label = { left: 'Alinhar à esquerda', hcenter: 'Centralizar na horizontal', right: 'Alinhar à direita', top: 'Alinhar ao topo', vcenter: 'Centralizar na vertical', bottom: 'Alinhar à base' }[op];
      get().commit(label + (cs.length === 1 ? ' da página' : ''), (d) => {
        for (const c of pageOf(d).comps) {
          if (!s.includes(c.id) || c.locked) continue;
          if (op === 'left') c.x = box.x; if (op === 'right') c.x = box.r - c.w; if (op === 'hcenter') c.x = snap((box.x + box.r) / 2 - c.w / 2);
          if (op === 'top') c.y = box.y; if (op === 'bottom') c.y = box.b - c.h; if (op === 'vcenter') c.y = snap((box.y + box.b) / 2 - c.h / 2);
        }
      });
    },
    distribute: (axis) => {
      const p = get().page(); const s = get().selection;
      if (!p || s.length < 3) return;
      const cs = p.comps.filter((c) => s.includes(c.id)).sort((a, b) => (axis === 'h' ? a.x - b.x : a.y - b.y));
      const first = cs[0]!, last = cs[cs.length - 1]!;
      const total = axis === 'h' ? last.x + last.w - first.x : last.y + last.h - first.y;
      const used = cs.reduce((a, c) => a + (axis === 'h' ? c.w : c.h), 0);
      const gap = (total - used) / (cs.length - 1);
      const pos: Record<string, number> = {};
      let cur = axis === 'h' ? first.x : first.y;
      for (const c of cs) { pos[c.id] = Math.round(cur); cur += (axis === 'h' ? c.w : c.h) + gap; }
      get().commit(axis === 'h' ? 'Distribuir na horizontal' : 'Distribuir na vertical', (d) => { for (const c of pageOf(d).comps) if (pos[c.id] != null) { if (axis === 'h') c.x = pos[c.id]!; else c.y = pos[c.id]!; } });
    },
    nudge: (dx, dy) => {
      const s = get().selection; if (!s.length) return;
      get().commit('Mover com o teclado', (d) => { const pg = pageOf(d); for (const c of pg.comps) if (s.includes(c.id) && !c.locked) { c.x = Math.max(0, Math.min(pg.w - c.w, c.x + dx)); c.y = Math.max(0, c.y + dy); } }, { tx: `nudge:${s.join(',')}` });
    },

    addPage: (name) => {
      const d = get().doc; if (!d) return;
      const pg = newPage(name ?? `Página ${d.pages.length + 1}`);
      get().commit(`Criar página ${pg.name}`, (x) => { x.pages.push(pg); });
      set({ pageId: pg.id, selection: [] });
    },
    duplicatePage: (id) => {
      const d = get().doc; const src = d?.pages.find((p) => p.id === id); if (!d || !src) return;
      const pg: Page = { ...structuredClone(src), id: uid('pg'), name: `${src.name} (cópia)`, comps: src.comps.map((c) => ({ ...structuredClone(c), id: uid(c.type) })) };
      get().commit(`Duplicar página ${src.name}`, (x) => { x.pages.splice(x.pages.findIndex((p) => p.id === id) + 1, 0, pg); });
      set({ pageId: pg.id, selection: [] });
    },
    renamePage: (id, name) => get().commit(`Renomear página para ${name}`, (x) => { const p = x.pages.find((q) => q.id === id); if (p) p.name = name; }),
    movePage: (id, dir) => get().commit('Reordenar páginas', (x) => { const i = x.pages.findIndex((p) => p.id === id), j = i + dir; if (i >= 0 && j >= 0 && j < x.pages.length) [x.pages[i], x.pages[j]] = [x.pages[j]!, x.pages[i]!]; }),
    deletePage: (id) => {
      const d = get().doc; if (!d || d.pages.length < 2) return;
      const name = d.pages.find((p) => p.id === id)?.name;
      get().commit(`Excluir página ${name}`, (x) => { x.pages = x.pages.filter((p) => p.id !== id); });
      if (get().pageId === id) set({ pageId: get().doc!.pages[0]!.id, selection: [] });
    },
    goPage: (id, carry) => set({ pageId: id, selection: [], interactive: null, cross: carry ? { ...carry, mode: 'filter' } : null, picked: null, returnTo: carry ? { page: get().pageId, label: carry.label } : null }),

    setView: (compId, patch) => { const view = { ...get().view }; if (patch === null) delete view[compId]; else view[compId] = { ...view[compId], ...patch }; set({ view }); },
    clearAll: () => set({ filterValues: {}, cross: null, drill: {}, picked: null, view: {}, returnTo: null }),
    setFilter: (compId, values) => set({ filterValues: { ...get().filterValues, [compId]: values } }),
    setCross: (c) => set({ cross: c }),
    /** Filtros que valem para um componente: filtros/segmentações da página que miram nele + cross-filter + filtros locais. */
    filtersFor: (comp) => {
      const p = get().page(), doc = get().doc; const out: Filter[] = [...(doc?.filters ?? []), ...(p?.filters ?? []), ...comp.localFilters, ...(get().view[comp.id]?.filters ?? [])];
      if (!p || !comp.interactions.receive) return out;
      const scoped = (doc?.pages ?? []).flatMap((pg) => pg.comps.filter((f) => (f.type === 'filter' || f.type === 'slicer') && (pg.id === p.id || f.props.scope === 'report')));
      for (const f of scoped) {
        if (f.id === comp.id) continue;
        const vals = get().filterValues[f.id] ?? (f.props.defaultValues as unknown[] | undefined) ?? [];
        const targets = f.props.targets as 'all' | string[];
        if (!vals.length || (targets !== 'all' && !targets.includes(comp.id))) continue;
        out.push(...filtersFromComp(f, vals));
      }
      const cr = get().cross;
      if (cr && cr.source !== comp.id && cr.mode !== 'highlight') {
        const aff = p.comps.find((c) => c.id === cr.source)?.interactions.affects;
        if (!aff || aff === 'all' || aff.includes(comp.id)) out.push({ field: cr.field, op: '=', value: cr.value });
      }
      const dr = get().drill[comp.id];
      if (dr?.length && comp.interactions.drill) dr.forEach((v, i) => out.push({ field: comp.interactions.drill![i]!, op: '=', value: v }));
      return out;
    },
    saveNow: (label = 'Versão salva') => { const d = get().doc; if (!d) return; clearTimeout(saveTimer); useLibrary.getState().save(d); set({ saveState: 'saved', savedAt: Date.now() }); get().toast({ text: label, tone: 'success' }); },
    toast: (t) => { const id = ++toastId; set({ toasts: [...get().toasts.slice(-2), { ...t, id }] }); setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== id) }), t.action ? 7000 : 3200); },
  };
});

/** Primeiro espaço livre (varredura em grade) para inserir sem sobrepor. */
export function freeSpot(p: Page, type: CompType, size?: { w: number; h: number }) {
  const m = makeComp(type, { x: 0, y: 0 });
  const w = size?.w ?? m.w, h = size?.h ?? m.h;
  const hit = (x: number, y: number) => p.comps.some((c) => !c.hidden && x < c.x + c.w + 8 && x + w + 8 > c.x && y < c.y + c.h + 8 && y + h + 8 > c.y);
  for (let y = 24; y < 4000; y += 16) for (let x = 24; x + w <= p.w - 24; x += 16) if (!hit(x, y)) return { x, y };
  return { x: 24, y: 24 };
}
export const overlaps = (a: Comp, b: Comp) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
