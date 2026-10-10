import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { Icon, IconButton } from '@biweb/ui';
import type { IconName } from '@biweb/ui';
import { edgeFlow, fmtBytes, fmtDur, fmtN, STATE_LABEL, validate } from './engine';
import type { Run } from './engine';
import { NODE_H, NODE_W, catOf, kindOf, portsOf, snap } from './model';
import type { Cat, Doc, NState, WEdge, WGroup, WNode, Workflow } from './model';
import { useWf } from './store';

const SUB = 'grp:';
const STATE_ICON: Record<NState, IconName> = { waiting: 'clock', running: 'refresh', success: 'check', warning: 'warning', failed: 'close', paused: 'clock', skipped: 'minus' };
const portY = (n: { kind: string }, i: number, total: number) => (total < 2 ? NODE_H / 2 : (NODE_H * (i + 1)) / (total + 1));

interface Vn { id: string; x: number; y: number; name: string; kind: string; cfg: WNode['cfg']; members?: string[]; group?: WGroup; ghost?: 'new' | 'removed' | 'changed'; w: WNode }
export interface Filters { q: string; flt: string[] }
export interface GhostInfo { doc: Doc; base: Doc }

export function summaryOf(n: WNode): { dot: 'ok' | 'idle' | 'warn'; text: string } {
  const k = kindOf(n.kind), c = n.cfg, s = (v: unknown) => String(v ?? '').trim();
  if (k.cat === 'source') return s(c.conn || c.file || c.url || c.bucket || c.name) ? { dot: 'ok', text: `Conectado · ${s(c.conn || c.file || c.name || c.bucket || c.url).replace(/^https?:\/\//, '')}` } : { dot: 'warn', text: 'Configurar conexão' };
  if (n.kind === 'schedule') return { dot: 'ok', text: `${c.freq}${c.freq === 'A cada hora' ? '' : ` · ${c.at}`}` };
  if (k.cat === 'trigger') return { dot: 'ok', text: s(c.topic || c.path || c.metric || c.where || c.who || c.sev || 'Pronto') };
  if (n.kind === 'normalize' || n.kind === 'validate') return { dot: 'ok', text: `${s(c.rules).split('|').filter(Boolean).length} regras` };
  if (k.ports?.length && k.cat === 'logic') return { dot: 'ok', text: s(c.expr) || 'Definir condição' };
  if (k.cat === 'human') return { dot: 'idle', text: s(c.who || c.to || c.what) || 'Definir responsável' };
  const first = k.fields.find((f) => s(c[f.key]));
  return first ? { dot: 'ok', text: s(c[first.key]).split('|').join(', ') } : { dot: 'idle', text: k.desc.replace(/\.$/, '') };
}

/** Estado/medidas agregados de um subfluxo recolhido. */
function aggregate(run: Run | undefined, ids: string[]) {
  if (!run) return undefined;
  const rs = ids.flatMap((i) => (run.nodes[i] ? [run.nodes[i]!] : []));
  const pick = (s: NState) => rs.some((r) => r.state === s);
  const state: NState = pick('failed') ? 'failed' : pick('running') ? 'running' : pick('paused') ? 'paused' : rs.every((r) => r.state === 'skipped') ? 'skipped' : rs.every((r) => r.state === 'waiting') ? 'waiting' : rs.some((r) => r.state === 'waiting') ? 'running' : pick('warning') ? 'warning' : 'success';
  return { state, dur: rs.reduce((a, r) => a + (r.t1 && r.t0 != null ? r.t1 - r.t0 : 0), 0), rows: rs[rs.length - 1]?.rowsOut ?? 0, progress: rs.reduce((a, r) => a + (r.state === 'success' || r.state === 'warning' ? 1 : r.progress), 0) / rs.length, err: rs.find((r) => r.err)?.err, warn: rs.find((r) => r.warn)?.warn };
}

type Pt = readonly [number, number];
/** Polilinha com cantos arredondados (usada nos retornos de laço). */
function roundedPath(pts: Pt[], r = 12): string {
  const [p0, ...rest] = pts, last = pts[pts.length - 1];
  if (!p0 || !last) return '';
  let d = `M${p0[0]},${p0[1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]!, [x, y] = pts[i]!, [nx, ny] = pts[i + 1]!;
    const la = Math.hypot(px - x, py - y) || 1, lb = Math.hypot(nx - x, ny - y) || 1, a = Math.min(r, la / 2), b = Math.min(r, lb / 2);
    d += ` L${x + ((px - x) / la) * a},${y + ((py - y) / la) * a} Q${x},${y} ${x + ((nx - x) / lb) * b},${y + ((ny - y) / lb) * b}`;
  }
  void rest;
  return `${d} L${last[0]},${last[1]}`;
}
function edgeGeom(a: Vn, b: Vn, e: WEdge, fromPort: number, fromTotal: number) {
  const x1 = a.x + NODE_W, y1 = a.y + portY(a, fromPort, fromTotal), x2 = b.x, y2 = b.y + NODE_H / 2;
  if (e.back || x2 < x1 + 24) {
    const yb = Math.max(a.y, b.y) + NODE_H + 28;
    return { d: roundedPath([[x1, y1], [x1 + 24, y1], [x1 + 24, yb], [x2 - 24, yb], [x2 - 24, y2], [x2, y2]]), lx: (x1 + x2) / 2, ly: yb, sx: x1 + 40, sy: y1 };
  }
  const dx = Math.max(48, (x2 - x1) / 2), c1 = x1 + dx, c2 = x2 - dx;
  const at = (t: number): [number, number] => { const u = 1 - t; return [u * u * u * x1 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t ** 3 * x2, u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y2]; };
  const m = at(0.5), s = at(0.18);
  return { d: `M${x1},${y1} C${c1},${y1} ${c2},${y2} ${x2},${y2}`, lx: m[0], ly: m[1], sx: s[0], sy: s[1] };
}

export function Canvas({ wf, run, mode, editable, ghost, filters, follow, onFilters, onFollow }: { wf: Workflow; run?: Run; mode: 'monitor' | 'edit'; editable: boolean; ghost: GhostInfo | null; filters: Filters; follow: boolean; onFilters: (f: Filters) => void; onFollow: (v: boolean) => void }) {
  const st = useWf();
  const { sel, selEdge, groupSel, focus } = st;
  const ref = useRef<HTMLDivElement>(null), minimapRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 40, y: 40, z: 0.85 });
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [drag, setDrag] = useState<null | { kind: string }>(null);
  const [marquee, setMarquee] = useState<null | { x1: number; y1: number; x2: number; y2: number }>(null);
  const [wire, setWire] = useState<null | { from: string; port?: string; x: number; y: number; sx: number; sy: number }>(null);
  const [space, setSpace] = useState(false);
  const lastGhost = useRef<GhostInfo | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (ghost) { lastGhost.current = ghost; return; }
    const previous = lastGhost.current;
    if (!previous) return;
    lastGhost.current = null;
    const baseIds = new Set(previous.base.nodes.map((n) => n.id));
    const ids = new Set(previous.doc.nodes.filter((n) => !baseIds.has(n.id) && wf.nodes.some((w) => w.id === n.id)).map((n) => n.id));
    if (!ids.size) return;
    setActivated(ids);
    const timer = window.setTimeout(() => setActivated(new Set()), 850);
    return () => window.clearTimeout(timer);
  }, [ghost, wf]);
  const viewRef = useRef(view); viewRef.current = view;
  const doc: Doc & { id?: string } = ghost?.doc ?? wf;
  const issues = useMemo(() => (mode === 'edit' ? validate(wf) : []), [wf, mode]);

  /* ───── nós visíveis (subfluxos recolhidos viram um cartão) ───── */
  const { nodes, rep, byId } = useMemo(() => {
    const hidden = new Map<string, WGroup>();
    doc.groups.forEach((g) => { if (g.collapsed) g.nodes.forEach((id) => hidden.set(id, g)); });
    const baseIds = new Set(ghost?.base.nodes.map((n) => n.id));
    const baseMap = new Map(ghost?.base.nodes.map((n) => [n.id, n]));
    const list: Vn[] = [];
    const all = ghost ? [...doc.nodes, ...ghost.base.nodes.filter((b) => !doc.nodes.some((n) => n.id === b.id))] : doc.nodes;
    for (const n of all) {
      if (hidden.has(n.id)) continue;
      const g: Vn['ghost'] = !ghost ? undefined : !baseIds.has(n.id) ? 'new' : !doc.nodes.some((x) => x.id === n.id) ? 'removed' : JSON.stringify(baseMap.get(n.id)?.cfg) !== JSON.stringify(n.cfg) ? 'changed' : undefined;
      list.push({ id: n.id, x: n.x, y: n.y, name: n.name, kind: n.kind, cfg: n.cfg, ghost: g, w: n });
    }
    doc.groups.filter((g) => g.collapsed).forEach((g) => {
      const ms = doc.nodes.filter((n) => g.nodes.includes(n.id));
      if (!ms.length) return;
      const changed = !!ghost && ms.some((m) => JSON.stringify(baseMap.get(m.id)?.cfg) !== JSON.stringify(m.cfg));
      list.push({ id: SUB + g.id, x: Math.min(...ms.map((m) => m.x)), y: Math.min(...ms.map((m) => m.y)), name: g.name, kind: 'subflow', cfg: {}, members: g.nodes, group: g, w: ms[0]!, ghost: changed ? 'changed' : undefined });
    });
    const rep = (id: string) => { const g = hidden.get(id); return g ? SUB + g.id : id; };
    return { nodes: list, rep, byId: new Map(list.map((n) => [n.id, n])) };
  }, [doc, ghost]);

  const edges = useMemo(() => {
    const seen = new Set<string>(), out: (WEdge & { f: string; t: string; ghost?: boolean })[] = [];
    const baseKeys = new Set(ghost?.base.edges.map((e) => `${e.from}>${e.to}:${e.port ?? ''}`));
    for (const e of doc.edges) {
      const f = rep(e.from), t = rep(e.to);
      if (f === t || !byId.has(f) || !byId.has(t)) continue;
      const key = `${f}>${t}:${e.port ?? ''}`; if (seen.has(key)) continue; seen.add(key);
      out.push({ ...e, f, t, ghost: !!ghost && !baseKeys.has(`${e.from}>${e.to}:${e.port ?? ''}`) });
    }
    return out;
  }, [doc, rep, byId, ghost]);

  const bounds = useMemo(() => {
    if (!nodes.length) return { x: 0, y: 0, w: NODE_W, h: NODE_H };
    const x0 = Math.min(...nodes.map((n) => n.x)), y0 = Math.min(...nodes.map((n) => n.y)), x1 = Math.max(...nodes.map((n) => n.x + NODE_W)), y1 = Math.max(...nodes.map((n) => n.y + NODE_H));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, [nodes]);

  /* ───── enquadramento ───── */
  const fit = useCallback((minZ = 0.5) => {
    const el = ref.current, w = el?.clientWidth || size.w, h = el?.clientHeight || size.h, pad = 56;
    const z = Math.min(1, Math.max(minZ, Math.min((w - pad * 2) / bounds.w, (h - pad * 2) / bounds.h)));
    const fits = (w - pad * 2) / bounds.w >= z - 0.001;
    setView({ z, x: fits ? (w - bounds.w * z) / 2 - bounds.x * z : pad - bounds.x * z, y: (h - bounds.h * z) / 2 - bounds.y * z });
  }, [bounds, size]);
  const first = useRef<string>('');
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight }); return () => ro.disconnect(); }, []);
  useEffect(() => {
    if (first.current === wf.id || size.w <= 0) return;
    first.current = wf.id; fit(0.45);
    // fluxo largo: abre centrado no ponto de atenção (falha, execução ou pausa) em vez de no início
    const hot = run && ['failed', 'running', 'paused'].map((s) => Object.entries(run.nodes).find(([, r]) => r.state === s)?.[0]).find(Boolean);
    const n = hot ? byId.get(rep(hot)) : undefined;
    if (n && (size.w - 112) / bounds.w < 0.45) setView({ z: 0.8, x: size.w / 2 - (n.x + NODE_W / 2) * 0.8, y: size.h / 2 - (n.y + NODE_H / 2) * 0.8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wf.id, size.w, fit]);
  useEffect(() => { if (st.toast) { const t = setTimeout(() => useWf.getState().flash(null), 4200); return () => clearTimeout(t); } }, [st.toast]);
  const zoomTo = (z: number, cx = size.w / 2, cy = size.h / 2) => setView((v) => { const nz = Math.min(1.6, Math.max(0.25, z)); return { z: nz, x: cx - ((cx - v.x) / v.z) * nz, y: cy - ((cy - v.y) / v.z) * nz }; });

  /* Seguir execução: mantém o nó em execução à vista. */
  const runningId = run && Object.entries(run.nodes).find(([, r]) => r.state === 'running' || r.state === 'paused')?.[0];
  useEffect(() => {
    if (!follow || !runningId) return;
    const n = byId.get(rep(runningId)); if (!n) return;
    const v = viewRef.current, sx = n.x * v.z + v.x, sy = n.y * v.z + v.y;
    if (sx < 80 || sx + NODE_W * v.z > size.w - 80 || sy < 60 || sy + NODE_H * v.z > size.h - 60) setView({ ...v, x: size.w / 2 - (n.x + NODE_W / 2) * v.z, y: size.h / 2 - (n.y + NODE_H / 2) * v.z });
  }, [follow, runningId, byId, rep, size]);

  /* ───── interação ───── */
  const world = (e: { clientX: number; clientY: number }) => { const r = ref.current!.getBoundingClientRect(), v = viewRef.current; return { x: (e.clientX - r.left - v.x) / v.z, y: (e.clientY - r.top - v.y) / v.z }; };
  const cap = (e: RPointerEvent) => { try { ref.current?.setPointerCapture(e.pointerId); } catch { /* ok */ } };
  const gesture = useRef<null | { type: 'pan' | 'nodes' | 'marquee' | 'wire'; sx: number; sy: number; ox: number; oy: number; starts?: Record<string, { x: number; y: number }>; moved: boolean; add?: boolean; started?: boolean }>(null);

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    ref.current?.focus({ preventScroll: true });
    const t = e.target as HTMLElement, pt = world(e);
    const portEl = t.closest<HTMLElement>('[data-port-out]'), nodeEl = t.closest<HTMLElement>('[data-node]'), grpEl = t.closest<HTMLElement>('[data-group]'), edgeEl = t.closest<SVGElement>('[data-edge]');
    if (t.closest('[data-stop]')) return;
    if (portEl && editable) {
      const [from = '', port] = portEl.dataset.portOut!.split('|'), n = byId.get(from)!, ports = portsOf(n.w), pi = Math.max(0, ports.findIndex((p) => p.id === port));
      gesture.current = { type: 'wire', sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, moved: false };
      setWire({ from, port: port || undefined, x: pt.x, y: pt.y, sx: n.x + NODE_W, sy: n.y + portY(n, pi, ports.length) }); cap(e); e.preventDefault(); return;
    }
    if (e.button === 1 || space || (!nodeEl && !grpEl && !edgeEl && (mode === 'monitor' || !editable))) { gesture.current = { type: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false }; setDrag({ kind: 'pan' }); cap(e); return; }
    if (nodeEl) {
      const id = nodeEl.dataset.node!, v = byId.get(id)!;
      const members = v.members ?? [id];
      const next = e.shiftKey ? (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]) : sel.includes(id) || sel.includes(members[0] ?? '') ? sel : members;
      useWf.getState().select(next);
      if (editable && !e.shiftKey) {
        const ids = new Set(next.flatMap((x) => byId.get(x)?.members ?? [x]));
        const starts = Object.fromEntries(doc.nodes.filter((n) => ids.has(n.id)).map((n) => [n.id, { x: n.x, y: n.y }]));
        gesture.current = { type: 'nodes', sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, starts, moved: false }; setDrag({ kind: 'nodes' }); cap(e);
      }
      return;
    }
    if (grpEl) {
      const g = doc.groups.find((x) => x.id === grpEl.dataset.group); if (!g) return;
      useWf.getState().selectGroup(g.id);
      if (editable) { const starts = Object.fromEntries(doc.nodes.filter((n) => g.nodes.includes(n.id)).map((n) => [n.id, { x: n.x, y: n.y }])); gesture.current = { type: 'nodes', sx: e.clientX, sy: e.clientY, ox: 0, oy: 0, starts, moved: false }; setDrag({ kind: 'nodes' }); cap(e); }
      return;
    }
    if (edgeEl) { useWf.getState().selectEdge(edgeEl.dataset.edge!); return; }
    gesture.current = { type: 'marquee', sx: e.clientX, sy: e.clientY, ox: pt.x, oy: pt.y, moved: false, add: e.shiftKey }; cap(e);
    if (!e.shiftKey) useWf.getState().select([]);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current; if (!g) return;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) < 3) return;
    g.moved = true;
    if (g.type === 'pan') setView((v) => ({ ...v, x: g.ox + dx, y: g.oy + dy }));
    else if (g.type === 'nodes') {
      if (!g.started) { g.started = true; useWf.getState().begin(); }
      const z = viewRef.current.z;
      useWf.getState().patch((d) => ({ ...d, nodes: d.nodes.map((n) => (g.starts![n.id] ? { ...n, x: snap(g.starts![n.id]!.x + dx / z), y: snap(g.starts![n.id]!.y + dy / z) } : n)) }));
    } else if (g.type === 'marquee') {
      const p = world(e); setMarquee({ x1: g.ox, y1: g.oy, x2: p.x, y2: p.y });
      const [a, b, c, d] = [Math.min(g.ox, p.x), Math.min(g.oy, p.y), Math.max(g.ox, p.x), Math.max(g.oy, p.y)];
      const hit = nodes.filter((n) => n.x + NODE_W > a && n.x < c && n.y + NODE_H > b && n.y < d).flatMap((n) => n.members ?? [n.id]);
      useWf.getState().select(g.add ? [...new Set([...useWf.getState().sel, ...hit])] : hit);
    } else if (g.type === 'wire') { const p = world(e); setWire((w) => (w ? { ...w, x: p.x, y: p.y } : w)); }
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    const g = gesture.current; gesture.current = null; setDrag(null); setMarquee(null);
    if (g?.type === 'wire' && wire) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-node]');
      if (el && el.dataset.node !== wire.from) {
        const to = el.dataset.node!, tv = byId.get(to), fv = byId.get(wire.from);
        if (tv && fv && !tv.members && !fv.members) useWf.getState().connect(wire.from, wire.port, to);
      }
      setWire(null);
    }
    try { ref.current?.releasePointerCapture(e.pointerId); } catch { /* ok */ }
  };
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoomTo(viewRef.current.z * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const el = ref.current; el?.addEventListener('wheel', onWheel, { passive: false }); return () => el?.removeEventListener('wheel', onWheel); }, [onWheel]);

  const onKey = (e: React.KeyboardEvent) => {
    const s = useWf.getState(), mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if ((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return;
    if (k === ' ') { setSpace(true); e.preventDefault(); return; }
    if (!editable) { if (k === 'f') fit(); return; }
    if (k === 'delete' || k === 'backspace') { s.removeSel(); e.preventDefault(); }
    else if (mod && k === 'z') { (e.shiftKey ? s.redo : s.undo)(); e.preventDefault(); }
    else if (mod && k === 'y') { s.redo(); e.preventDefault(); }
    else if (mod && k === 'c') s.copy();
    else if (mod && k === 'v') s.paste();
    else if (mod && k === 'd') { s.duplicate(); e.preventDefault(); }
    else if (mod && k === 'g') { s.group(); e.preventDefault(); }
    else if (mod && k === 'a') { s.select(doc.nodes.map((n) => n.id)); e.preventDefault(); }
    else if (k === 'f') fit();
    else if (k.startsWith('arrow') && sel.length) {
      const d = k === 'arrowleft' ? [-16, 0] : k === 'arrowright' ? [16, 0] : k === 'arrowup' ? [0, -16] : [0, 16];
      s.commit((x) => ({ ...x, nodes: x.nodes.map((n) => (sel.includes(n.id) ? { ...n, x: n.x + d[0]!, y: n.y + d[1]! } : n)) })); e.preventDefault();
    }
  };

  /* ───── estado visual ───── */
  const nodeRun = (n: Vn) => (n.members ? aggregate(run, n.members) : run?.nodes[n.id]);
  const matches = (n: Vn) => {
    if (!filters.q && !filters.flt.length) return true;
    const r = nodeRun(n) as { state?: NState } | undefined, cat: Cat = n.members ? 'data' : kindOf(n.kind).cat;
    const q = !filters.q || `${n.name} ${kindOf(n.kind).label}`.toLowerCase().includes(filters.q.toLowerCase());
    const f = !filters.flt.length || filters.flt.some((x) => x === r?.state || x === cat || (x === 'data' && cat === 'source'));
    return q && f;
  };
  const dim = filters.q || filters.flt.length;
  const nodeProblems = new Map<string, string>(); issues.forEach((i) => i.node && !nodeProblems.has(i.node) && nodeProblems.set(i.node, i.msg));
  const rect = (g: WGroup) => { const ms = nodes.filter((n) => g.nodes.includes(n.id)); if (!ms.length) return null; const x0 = Math.min(...ms.map((m) => m.x)) - 20, y0 = Math.min(...ms.map((m) => m.y)) - 36, x1 = Math.max(...ms.map((m) => m.x + NODE_W)) + 20, y1 = Math.max(...ms.map((m) => m.y + NODE_H)) + 20; return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  const live = wf.kind === 'realtime';
  const flows = (e: (typeof edges)[number]) => edgeFlow(wf, run, { ...e, from: e.from, to: e.to });

  /* minimapa */
  const mm = { w: 168, h: 104 }, mb = { x: bounds.x - 80, y: bounds.y - 60, w: bounds.w + 160, h: bounds.h + 120 }, ms = Math.min(mm.w / mb.w, mm.h / mb.h);
  const mmPan = (e: RPointerEvent<SVGSVGElement>) => { const r = minimapRef.current!.getBoundingClientRect(), wx = mb.x + (e.clientX - r.left - (mm.w - mb.w * ms) / 2) / ms, wy = mb.y + (e.clientY - r.top - (mm.h - mb.h * ms) / 2) / ms; setView((v) => ({ ...v, x: size.w / 2 - wx * v.z, y: size.h / 2 - wy * v.z })); };
  const stateColor = (n: Vn) => { const s = nodeRun(n)?.state; return s === 'failed' ? 'var(--danger)' : s === 'running' ? 'var(--accent)' : s === 'success' ? 'var(--success)' : s === 'warning' ? 'var(--warning)' : s === 'paused' ? 'var(--warning)' : catOf(n.members ? 'data' : kindOf(n.kind).cat).color; };

  const FILTERS: [string, string][] = [['running', 'Executando'], ['failed', 'Falhou'], ['data', 'Dados'], ['ai', 'IA'], ['human', 'Pessoas'], ['action', 'Ação']];
  const mdl = (z: number) => `${Math.round(z * 100)}%`;
  void fmtDur;

  return (
    <div className="wf-stage">
      <div className="wf-canvasbar" role="toolbar" aria-label="Busca e filtros do canvas">
        <label className="wf-search"><Icon name="search" size={12} /><input value={filters.q} onChange={(e) => onFilters({ ...filters, q: e.target.value })} placeholder="Buscar nós" aria-label="Buscar nós" />{filters.q && <button type="button" aria-label="Limpar busca" onClick={() => onFilters({ ...filters, q: '' })}><Icon name="close" size={12} /></button>}</label>
        <div className="wf-chips" role="group" aria-label="Filtrar por estado ou tipo">
          {FILTERS.map(([id, label]) => <button key={id} type="button" className="wf-chip" aria-pressed={filters.flt.includes(id)} onClick={() => onFilters({ ...filters, flt: filters.flt.includes(id) ? filters.flt.filter((x) => x !== id) : [...filters.flt, id] })}>{label}</button>)}
        </div>
        <span className="flex-1" />
        {mode === 'monitor' && run && <label className="wf-follow"><input type="checkbox" checked={follow} onChange={(e) => onFollow(e.target.checked)} />Seguir execução</label>}
      </div>
      <div ref={ref} className={`wf-viewport ${drag ? `is-${drag.kind}` : ''} ${space ? 'is-space' : ''} ${editable ? 'is-edit' : ''}`} tabIndex={0} aria-label={`Canvas do fluxo ${wf.name}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey} onKeyUp={(e) => e.key === ' ' && setSpace(false)}
        onDragOver={(e) => { if (editable && e.dataTransfer.types.includes('application/x-biweb-node')) e.preventDefault(); }}
        onDrop={(e) => { const kind = e.dataTransfer.getData('application/x-biweb-node'); if (!kind || !editable) return; e.preventDefault(); const p = world(e); useWf.getState().addNode(kind, p.x - NODE_W / 2, p.y - NODE_H / 2); }}
        onDoubleClick={(e) => { const el = (e.target as HTMLElement).closest<HTMLElement>('[data-node]'); if (el?.dataset.node?.startsWith(SUB)) st.collapse(el.dataset.node.slice(SUB.length)); }}
        style={{ backgroundSize: `${16 * view.z}px ${16 * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px` }}>
        {!nodes.length && <div className="wf-empty"><Icon name="plus" size={20} /><b>Canvas vazio</b><span>Arraste nós da biblioteca, escolha um modelo ou descreva o fluxo para o Copilot.</span></div>}
        <div className={`wf-world ${drag?.kind === 'nodes' ? 'is-dragging' : ''} ${follow && !drag ? "is-follow" : ""}`} style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.z})` }}>
          {doc.groups.filter((g) => !g.collapsed).map((g) => { const r = rect(g); if (!r) return null; return <div key={g.id} className={`wf-group tone-${g.tone} ${groupSel === g.id ? 'is-sel' : ''}`} style={{ transform: `translate(${r.x}px,${r.y}px)`, width: r.w, height: r.h }}><div className="wf-group-head" data-group={g.id}><b>{g.name}</b><small>{g.nodes.length} nós</small><button type="button" data-stop title="Recolher em subfluxo" aria-label={`Recolher ${g.name} em subfluxo`} onClick={() => st.collapse(g.id)}><Icon name="container" size={12} /></button></div></div>; })}
          <svg className="wf-edges" width="1" height="1" aria-hidden="true">
            <defs>
              {(['default', 'active', 'done', 'err', 'sel', 'ghost'] as const).map((k) => <marker key={k} id={`wf-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1.5L9 5 1 8.5z" className={`wf-arrow wf-arrow--${k}`} /></marker>)}
            </defs>
            {edges.map((e) => {
              const a = byId.get(e.f)!, b = byId.get(e.t)!, ports = portsOf(a.w), pi = Math.max(0, ports.findIndex((p) => p.id === (e.port ?? ports[0]?.id))), g = edgeGeom(a, b, e, a.members ? 0 : pi, a.members ? 1 : ports.length > 1 && !kindOf(a.kind).fanout ? ports.length : 1);
              const fl = flows(e), isSel = selEdge === e.id, kind = isSel ? 'sel' : e.ghost ? 'ghost' : e.err ? 'err' : fl === 'flowing' ? 'active' : fl === 'done' ? 'done' : 'default';
              const srcRun = run?.nodes[e.from] ?? (a.members ? undefined : undefined), live2 = !!run && (fl === 'done' || fl === 'flowing') && srcRun && srcRun.rowsOut > 0 && !e.err;
              const rowsOut = a.members ? (aggregate(run, a.members)?.rows ?? 0) : srcRun?.rowsOut ?? 0, bytes = a.members ? 0 : srcRun?.bytes ?? 0;
              const dataLabel = mode === 'monitor' && live2 && (wf.unit === 'linhas' ? `${fmtN(rowsOut)} · ${fmtBytes(bytes || rowsOut * wf.bpr)}` : rowsOut > 1 ? `${fmtN(rowsOut)} ${wf.unit}` : '');
              const label = e.label ?? (kindOf(a.kind).ports && kindOf(a.kind).ports!.length > 1 && !kindOf(a.kind).fanout ? ports[pi]?.label : '');
              const dim2 = dim && !(matches(a) && matches(b));
              return <g key={e.id} className={`wf-edge is-${kind} ${fl === 'skipped' ? 'is-skipped' : ''} ${fl === 'blocked' ? 'is-blocked' : ''} ${live ? 'is-rt' : ''} ${dim2 ? 'is-dim' : ''}`}>
                <path d={g.d} className="wf-edge-hit" data-edge={e.id} />
                <path d={g.d} className="wf-edge-line" markerEnd={`url(#wf-arrow-${kind})`} />
                {label && <EdgeLabel x={g.sx} y={g.sy} text={label} tone={e.err ? 'err' : 'branch'} />}
                {dataLabel && <EdgeLabel x={g.lx} y={g.ly} text={dataLabel} tone="data" />}
              </g>;
            })}
            {wire && <path className="wf-wire" d={`M${wire.sx},${wire.sy} C${wire.sx + 60},${wire.sy} ${wire.x - 60},${wire.y} ${wire.x},${wire.y}`} />}
          </svg>
          {nodes.map((n) => {
            const k = n.members ? null : kindOf(n.kind), cat = catOf(k?.cat ?? 'data'), r = nodeRun(n), sum = k ? summaryOf(n.w) : { dot: 'ok' as const, text: `${n.members!.length} operações` };
            const ports = k ? portsOf(n.w) : [{ id: 'out', label: '' }], multi = ports.length > 1 && !k?.fanout, isSel = sel.includes(n.id) || (n.members && n.members.every((m) => sel.includes(m)) && sel.length > 0);
            const state = (r as { state?: NState } | undefined)?.state, issue = nodeProblems.get(n.id);
            const nr = r as import('./engine').NodeRun | undefined;
            const agg = n.members ? (r as ReturnType<typeof aggregate>) : undefined;
            const isLiveKind = live && k && (k.sim.live) && run;
            const err = nr?.err ?? agg?.err, progress = nr?.progress ?? agg?.progress ?? 0;
            let line: React.ReactNode = <><i className={`wf-dot is-${sum.dot}`} />{sum.text}</>;
            if (mode === 'monitor' && state) {
              const dur = nr?.t1 != null && nr.t0 != null ? nr.t1 - nr.t0 : agg?.dur, rows = nr?.rowsOut ?? agg?.rows ?? 0;
              line = state === 'running' ? <>Executando · {Math.round(progress * 100)}%</> : state === 'success' || state === 'warning' ? <>{dur != null ? fmtDur(dur) : ''}{rows > 1 ? ` · ${fmtN(rows)}` : ''}{nr?.warn || agg?.warn ? ' · aviso' : ''}</> : state === 'failed' ? <>{err ? `${err.rows.toLocaleString('pt-BR')} registros afetados` : 'Falhou'}</> : <>{STATE_LABEL[state]}{state === 'paused' ? ' · decisão' : ''}</>;
            }
            const pointerEvents = n.ghost === 'new' ? 'none' : undefined;
            return <div key={n.id} data-node={n.id} style={{ transform: `translate(${n.x}px,${n.y}px)`, width: NODE_W, height: NODE_H, '--cat': cat.color, pointerEvents } as React.CSSProperties}
              className={`wf-node ${n.members ? 'is-sub' : ''} ${isSel ? 'is-sel' : ''} ${state ? `st-${state}` : ''} ${n.ghost ? `is-ghost-${n.ghost}` : ''} ${activated.has(n.id) ? 'is-activated' : ''} ${dim && !matches(n) ? 'is-dim' : ''} ${focus.includes(n.id) || (n.members && n.members.some((m) => focus.includes(m))) ? 'is-focus' : ''}`}
              title={`${n.name}${issue ? ` · ${issue}` : ''}`}>
              <i className="wf-port wf-port--in" data-port-in={n.id} />
              {ports.map((p, i) => <i key={p.id} className={`wf-port wf-port--out ${multi ? 'has-label' : ''}`} data-port-out={`${n.id}|${k?.ports ? p.id : ''}`} style={{ top: portY(n, i, ports.length) - 6 }}>{multi && <b>{p.label}</b>}</i>)}
              <div className="wf-node-top"><span className="wf-node-glyph"><Icon name={n.members ? 'container' : k!.icon} size={12} /></span><span className="wf-node-type">{n.members ? 'Subfluxo' : k!.label}</span>
                {k?.beta && <em className="wf-beta">beta</em>}
                {n.ghost === 'new' && <em className="wf-beta">novo</em>}{n.ghost === 'changed' && <em className="wf-beta">alterado</em>}
                {isLiveKind ? <em className="wf-live-tag">LIVE</em> : state ? <span className={`wf-state is-${state}`} title={STATE_LABEL[state]}><Icon name={STATE_ICON[state]} size={12} /></span> : issue ? <span className="wf-state is-warning" title={issue}><Icon name="warning" size={12} /></span> : null}
              </div>
              <b className="wf-node-name">{n.name}</b>
              <small className="wf-node-line">{line}</small>
              {state === 'running' && <i className="wf-progress" style={{ width: `${Math.max(4, progress * 100)}%` }} />}
              {state === 'paused' && mode === 'monitor' && !n.members && <div className="wf-node-act" data-stop>
                {n.kind === 'approval' ? <><button type="button" onClick={() => st.decide(n.id, 'approved')}>Aprovar</button><button type="button" onClick={() => st.decide(n.id, 'returned')}>Devolver</button></> : n.kind === 'review' ? <><button type="button" onClick={() => st.decide(n.id, 'approved')}>Aprovar</button><button type="button" onClick={() => st.decide(n.id, 'returned')}>Devolver</button></> : <button type="button" onClick={() => st.decide(n.id, 'done')}>Concluir</button>}
              </div>}
              {n.members && <i className="wf-stack" aria-hidden />}
            </div>;
          })}
          {marquee && <div className="wf-marquee" style={{ left: Math.min(marquee.x1, marquee.x2), top: Math.min(marquee.y1, marquee.y2), width: Math.abs(marquee.x2 - marquee.x1), height: Math.abs(marquee.y2 - marquee.y1) }} />}
        </div>
        <div className="wf-zoom" data-stop>
          <IconButton icon="minus" label="Reduzir zoom" size="sm" onPress={() => zoomTo(view.z / 1.2)} />
          <button type="button" className="wf-zoom-n" onClick={() => zoomTo(1)} title="Voltar a 100%">{mdl(view.z)}</button>
          <IconButton icon="plus" label="Aumentar zoom" size="sm" onPress={() => zoomTo(view.z * 1.2)} />
          <IconButton icon="fit" label="Ajustar à tela" shortcut="F" size="sm" onPress={() => fit(0.35)} />
        </div>
        <svg ref={minimapRef} className="wf-minimap" width={mm.w} height={mm.h} data-stop aria-label="Minimapa do fluxo" onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); mmPan(e); }} onPointerMove={(e) => { if (e.buttons) mmPan(e); }}>
          <g transform={`translate(${(mm.w - mb.w * ms) / 2},${(mm.h - mb.h * ms) / 2}) scale(${ms}) translate(${-mb.x},${-mb.y})`}>
            {edges.map((e) => { const a = byId.get(e.f)!, b = byId.get(e.t)!; return <line key={e.id} x1={a.x + NODE_W} y1={a.y + NODE_H / 2} x2={b.x} y2={b.y + NODE_H / 2} className="wf-mm-edge" />; })}
            {nodes.map((n) => <rect key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={8} fill={stateColor(n)} opacity={sel.includes(n.id) ? 1 : 0.75} />)}
            <rect className="wf-mm-view" x={-view.x / view.z} y={-view.y / view.z} width={size.w / view.z} height={size.h / view.z} strokeWidth={2 / ms} />
          </g>
        </svg>
        {st.toast && <div className="wf-toast" role="status" data-stop>{st.toast}</div>}
        {ghost && <div className="wf-ghostbar" role="status" data-stop><Icon name="eye" size={12} />Prévia do Copilot · nada foi aplicado ainda</div>}
      </div>
    </div>
  );
}

function EdgeLabel({ x, y, text, tone }: { x: number; y: number; text: string; tone: 'branch' | 'data' | 'err' }) {
  const w = text.length * (tone === 'branch' ? 6.6 : 5.7) + 14;
  return <g className={`wf-elabel is-${tone}`} transform={`translate(${x},${y})`}><rect x={-w / 2} y={-9} width={w} height={18} rx={9} /><text textAnchor="middle" y={3.5}>{text}</text></g>;
}
