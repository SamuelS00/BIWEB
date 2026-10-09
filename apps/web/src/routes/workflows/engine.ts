import { NODE_H, NODE_W, catOf, defaultCfg, kindOf, newId, simOf, snap } from './model';
import type { Doc, NState, WEdge, WNode, Workflow } from './model';

/* ───────────── Execução simulada ───────────── */
export interface NodeRun {
  state: NState; t0?: number; t1?: number; dur: number; progress: number;
  rowsIn: number; rowsOut: number; bytes: number; bpr: number; attempts: number; route?: string;
  err?: { reason: string; rows: number; hint: string }; warn?: string;
}
export interface LogEntry { t: number; level: 'info' | 'warn' | 'error'; node?: string; msg: string }
export type RunStatus = 'running' | 'success' | 'failed' | 'paused' | 'warning';
export interface Run {
  id: number; wf: string; trigger: string; startedAt: number; clock: number; status: RunStatus; done: boolean; test?: boolean;
  nodes: Record<string, NodeRun>; log: LogEntry[];
}
type Env = Pick<Workflow, 'nodes' | 'edges' | 'bpr'>;

export function startRun(wf: Env, id: number, trigger: string, startedAt = Date.now(), test = false): Run {
  const nodes: Record<string, NodeRun> = {};
  for (const n of wf.nodes) nodes[n.id] = { state: 'waiting', dur: simOf(n).dur, progress: 0, rowsIn: 0, rowsOut: 0, bytes: 0, bpr: wf.bpr, attempts: 0 };
  return { id, wf: '', trigger, startedAt, clock: 0, status: 'running', done: false, test, nodes, log: [{ t: 0, level: 'info', msg: `Execução #${id} iniciada · ${trigger}` }] };
}

const edgeState = (wf: Env, run: Run, e: WEdge): 'pending' | 'active' | 'inactive' | 'blocked' => {
  const src = run.nodes[e.from], sn = wf.nodes.find((n) => n.id === e.from);
  if (!src || !sn || e.back) return 'inactive';
  if (src.state === 'waiting' || src.state === 'running' || src.state === 'paused') return 'pending';
  if (src.state === 'skipped') return 'inactive';
  if (src.state === 'failed') return e.err ? 'active' : 'blocked';
  if (e.err) return 'inactive';
  const k = kindOf(sn.kind), ports = k.ports;
  if (!ports || ports.length < 2 || k.fanout) return 'active';
  return (e.port ?? ports[0]?.id) === src.route ? 'active' : 'inactive';
};
/** Aresta carregando dados/atividade neste momento (usada para animar o fluxo). */
export const edgeFlow = (wf: Env, run: Run | undefined, e: WEdge): 'idle' | 'flowing' | 'done' | 'skipped' | 'blocked' => {
  if (!run) return 'idle';
  const s = edgeState(wf, run, e), to = run.nodes[e.to];
  if (s === 'inactive') return 'skipped';
  if (s === 'blocked') return 'blocked';
  if (s === 'pending') return 'idle';
  return to?.state === 'running' ? 'flowing' : to?.state === 'waiting' || to?.state === 'paused' ? 'idle' : 'done';
};

function finish(run: Run, wf: Env) {
  const all = Object.entries(run.nodes), live = all.some(([, r]) => r.state === 'running');
  const paused = all.some(([, r]) => r.state === 'paused');
  const unhandled = all.filter(([id, r]) => r.state === 'failed' && !wf.edges.some((e) => e.from === id && e.err));
  if (live) { run.status = 'running'; return; }
  if (paused) { run.status = 'paused'; return; }
  run.done = true;
  run.status = unhandled.length ? 'failed' : all.some(([, r]) => r.state === 'warning' || r.state === 'failed') ? 'warning' : 'success';
  run.log.push({ t: run.clock, level: run.status === 'failed' ? 'error' : run.status === 'warning' ? 'warn' : 'info', msg: run.status === 'failed' ? 'Execução interrompida por falha' : run.status === 'warning' ? 'Execução concluída com avisos' : 'Execução concluída com sucesso' });
}

/** Avança o relógio simulado em `dt` segundos. Retorna uma nova Run (imutável para o React). */
export function stepRun(wf: Env, prev: Run, dt: number): Run {
  if (prev.done) return prev;
  const run: Run = { ...prev, clock: prev.clock + dt, nodes: Object.fromEntries(Object.entries(prev.nodes).map(([k, v]) => [k, { ...v }])), log: prev.log.slice() };
  const logN = (level: LogEntry['level'], node: WNode, msg: string) => run.log.push({ t: +run.clock.toFixed(1), level, node: node.id, msg });
  for (let pass = 0; pass < wf.nodes.length + 2; pass++) {
    let changed = false;
    for (const n of wf.nodes) {
      const r = run.nodes[n.id];
      if (!r) continue;
      const sim = simOf(n), k = kindOf(n.kind);
      if (r.state === 'running') {
        r.progress = Math.min(1, (run.clock - (r.t0 ?? 0)) / Math.max(0.05, r.dur));
        if (r.progress < 1) continue;
        changed = true; r.t1 = Math.min(run.clock, (r.t0 ?? 0) + r.dur);
        if (sim.human && !r.route) { r.state = 'paused'; logN('info', n, `${n.name} aguarda decisão de uma pessoa`); continue; }
        const f = sim.fail;
        if (f && (f.fixKey ? n.cfg[f.fixKey] !== f.fixValue : r.attempts < 1)) {
          r.state = 'failed'; r.err = { reason: f.reason, rows: f.rows, hint: f.hint }; r.rowsOut = 0; r.bytes = 0;
          logN('error', n, `${n.name}: ${f.reason} · ${f.rows.toLocaleString('pt-BR')} registros afetados`); continue;
        }
        r.err = undefined; r.state = sim.warn ? 'warning' : 'success'; r.warn = sim.warn;
        r.rowsOut = sim.out != null ? sim.out : Math.round(r.rowsIn * (sim.ratio ?? 1));
        if (k.cat === 'trigger' && sim.out == null) r.rowsOut = r.rowsIn;
        r.bytes = r.rowsOut * r.bpr;
        r.route ??= sim.route ?? k.ports?.[0]?.id;
        if (sim.routeFromUpstream) { const up = wf.edges.filter((e) => e.to === n.id).map((e) => run.nodes[e.from]?.route).find(Boolean); if (up) r.route = up === 'approved' ? 'yes' : up === 'returned' ? 'no' : up; }
        logN(sim.warn ? 'warn' : 'info', n, sim.warn ? `${n.name}: ${sim.warn}` : `${n.name} concluído · ${r.rowsOut.toLocaleString('pt-BR')} ${r.rowsOut === 1 ? 'item' : 'itens'}`);
        continue;
      }
      if (r.state === 'paused' && r.route) { r.state = 'success'; r.rowsOut = Math.max(1, r.rowsIn); r.bytes = r.rowsOut * r.bpr; changed = true; continue; }
      if (r.state !== 'waiting') continue;
      const inbound = wf.edges.filter((e) => e.to === n.id && !e.back);
      if (!inbound.length) { r.state = 'running'; r.t0 = run.clock; r.rowsIn = 0; changed = true; logN('info', n, `${n.name} iniciado`); continue; }
      const st = inbound.map((e) => ({ e, s: edgeState(wf, run, e) }));
      if (st.some((x) => x.s === 'pending' || x.s === 'blocked')) continue;
      const act = st.filter((x) => x.s === 'active');
      changed = true;
      if (!act.length) { r.state = 'skipped'; logN('info', n, `${n.name} ignorado · ramo não selecionado`); continue; }
      const rows = act.map((x) => (x.e.err ? 1 : run.nodes[x.e.from]!.rowsOut));
      r.rowsIn = k.sum ? rows.reduce((a, b) => a + b, 0) : Math.max(...rows);
      r.bpr = sim.bpr ?? Math.max(...act.map((x) => run.nodes[x.e.from]!.bpr));
      r.state = 'running'; r.t0 = run.clock; r.err = undefined; r.progress = 0;
      logN('info', n, `${n.name} em execução`);
    }
    if (!changed) break;
  }
  finish(run, wf);
  return run;
}

export function decide(wf: Env, run: Run, nodeId: string, route: string): Run {
  const cur = run.nodes[nodeId];
  if (!cur) return run;
  const nodes = { ...run.nodes, [nodeId]: { ...cur, route } };
  const n = wf.nodes.find((x) => x.id === nodeId);
  const next: Run = { ...run, nodes, log: [...run.log, { t: +run.clock.toFixed(1), level: 'info', node: nodeId, msg: `${n?.name ?? 'Etapa'}: decisão registrada · ${route === 'approved' ? 'aprovado' : route === 'returned' ? 'devolvido' : route}` }] };
  return stepRun(wf, next, 0.01);
}
export function retryNode(wf: Env, run: Run, nodeId: string): Run {
  const prev = run.nodes[nodeId];
  if (!prev) return run;
  const nodes = { ...run.nodes, [nodeId]: { ...prev, state: 'running' as NState, t0: run.clock, progress: 0, attempts: prev.attempts + 1, err: undefined, t1: undefined } };
  const n = wf.nodes.find((x) => x.id === nodeId);
  return { ...run, done: false, status: 'running', nodes, log: [...run.log, { t: +run.clock.toFixed(1), level: 'info', node: nodeId, msg: `${n?.name ?? 'Etapa'}: nova tentativa ${prev.attempts + 2}` }] };
}
/** Executa em lote (instantâneo) — histórico de execuções e testes. */
export function fastForward(wf: Env, run: Run, max = 600, opts: { autoDecide?: string; stopWhenPaused?: boolean } = {}): Run {
  let r = run;
  for (let i = 0; i < max * 10 && !r.done; i++) {
    r = stepRun(wf, r, 0.1);
    if (r.status === 'paused') { if (opts.stopWhenPaused) break; for (const [id, nr] of Object.entries(r.nodes)) if (nr.state === 'paused') r = decide(wf, r, id, opts.autoDecide ?? 'approved'); }
  }
  return r;
}
export function runRecords(wf: Env, run: Run): number {
  const rows = wf.nodes.filter((n) => kindOf(n.kind).cat === 'source').map((n) => run.nodes[n.id]?.rowsOut ?? 0);
  return rows.length ? rows.reduce((a, b) => a + b, 0) : Math.max(0, ...Object.values(run.nodes).map((r) => r.rowsOut));
}
export const runDuration = (run: Run) => Math.max(...Object.values(run.nodes).map((r) => r.t1 ?? 0), run.done ? 0 : run.clock);

/* ───────────── Formatação ───────────── */
export const fmtN = (n: number) => n >= 1e6 ? `${(n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi` : n >= 1e4 ? `${Math.round(n / 1e3).toLocaleString('pt-BR')} mil` : n.toLocaleString('pt-BR');
export const fmtBytes = (b: number) => b >= 1e9 ? `${(b / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB` : b >= 1e6 ? `${Math.round(b / 1e6).toLocaleString('pt-BR')} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} kB` : `${b} B`;
export const fmtDur = (s: number) => s < 1 ? `${Math.round(s * 1000)} ms` : s < 60 ? `${s.toFixed(s < 10 ? 1 : 0).replace('.', ',')}s` : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
export const fmtClock = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour12: false });
export const STATE_LABEL: Record<NState, string> = { waiting: 'Aguardando', running: 'Executando', success: 'Concluído', warning: 'Aviso', failed: 'Falhou', paused: 'Pausado', skipped: 'Ignorado' };

/* ───────────── Layout automático (camadas, esquerda → direita) ───────────── */
export const COL = NODE_W + 40, ROW = NODE_H + 32;
export function autoLayout(doc: Pick<Doc, 'nodes' | 'edges'>, origin = { x: 0, y: 0 }): Record<string, { x: number; y: number }> {
  const layer: Record<string, number> = {}, ids = doc.nodes.map((n) => n.id);
  const preds = (id: string) => doc.edges.filter((e) => e.to === id && !e.back).map((e) => e.from);
  const visit = (id: string, seen: Set<string>): number => {
    if (layer[id] != null) return layer[id];
    if (seen.has(id)) return 0;
    seen.add(id);
    return (layer[id] = Math.max(-1, ...preds(id).map((p) => visit(p, seen))) + 1);
  };
  ids.forEach((id) => visit(id, new Set()));
  const cols: string[][] = [];
  for (const id of ids) (cols[layer[id] ?? 0] ??= []).push(id);
  const y: Record<string, number> = {};
  cols.forEach((col, ci) => {
    if (!col) return;
    const want = (id: string) => { const p = preds(id).filter((q) => y[q] != null); return p.length ? p.reduce((a, q) => a + (y[q] ?? 0), 0) / p.length : ids.indexOf(id) * 0.001; };
    col.sort((a, b) => want(a) - want(b));
    let last = -Infinity;
    col.forEach((id) => { y[id] = Math.max(want(id), last + ROW); last = y[id]; });
  });
  const minY = Math.min(...Object.values(y), 0);
  return Object.fromEntries(ids.map((id) => [id, { x: snap(origin.x + (layer[id] ?? 0) * COL), y: snap(origin.y + (y[id] ?? 0) - minY) }]));
}

/* ───────────── Validação ───────────── */
export interface Issue { level: 'error' | 'warn'; node?: string; msg: string }
export function validate(doc: Doc): Issue[] {
  const out: Issue[] = [];
  if (!doc.nodes.length) return [{ level: 'error', msg: 'O fluxo está vazio.' }];
  if (!doc.nodes.some((n) => kindOf(n.kind).cat === 'trigger')) out.push({ level: 'error', msg: 'Falta um gatilho: o fluxo não tem como iniciar.' });
  for (const n of doc.nodes) {
    const k = kindOf(n.kind), ins = doc.edges.filter((e) => e.to === n.id), outs = doc.edges.filter((e) => e.from === n.id);
    if (k.cat !== 'trigger' && !ins.length) out.push({ level: 'error', node: n.id, msg: `${n.name} não tem entrada conectada.` });
    if (k.cat !== 'output' && k.cat !== 'action' && k.cat !== 'human' && !outs.length) out.push({ level: 'warn', node: n.id, msg: `${n.name} não tem saída conectada.` });
    for (const p of k.ports ?? []) if ((k.ports?.length ?? 0) > 1 && !k.fanout && !outs.some((e) => (e.port ?? k.ports![0]!.id) === p.id)) out.push({ level: 'warn', node: n.id, msg: `${n.name}: o caminho “${p.label}” não leva a lugar nenhum.` });
    for (const f of k.fields) if (f.type === 'text' && ['conn', 'url', 'file', 'table', 'object'].includes(f.key) && !String(n.cfg[f.key] ?? '').trim() && k.cat !== 'trigger') out.push({ level: 'warn', node: n.id, msg: `${n.name}: preencha “${f.label}”.` });
  }
  const state: Record<string, number> = {};
  const cyc = (id: string): boolean => { if (state[id] === 1) return true; if (state[id] === 2) return false; state[id] = 1; const r = doc.edges.filter((e) => e.from === id && !e.back).some((e) => cyc(e.to)); state[id] = 2; return r; };
  if (doc.nodes.some((n) => cyc(n.id))) out.push({ level: 'error', msg: 'O fluxo contém um ciclo. Use o nó “Repetir” para laços.' });
  return out;
}

/* ───────────── Diferenças entre versões ───────────── */
export function diffDocs(a: Doc, b: Doc): string[] {
  const out: string[] = [], am = new Map(a.nodes.map((n) => [n.id, n])), bm = new Map(b.nodes.map((n) => [n.id, n]));
  for (const n of b.nodes) {
    const o = am.get(n.id);
    if (!o) { out.push(`+ Nó “${n.name}” (${kindOf(n.kind).label})`); continue; }
    if (o.name !== n.name) out.push(`~ Nó renomeado: “${o.name}” → “${n.name}”`);
    for (const key of new Set([...Object.keys(o.cfg), ...Object.keys(n.cfg)])) if (String(o.cfg[key] ?? '') !== String(n.cfg[key] ?? '')) out.push(`~ “${n.name}” · ${key}: ${String(o.cfg[key] ?? '—')} → ${String(n.cfg[key] ?? '—')}`);
  }
  for (const n of a.nodes) if (!bm.has(n.id)) out.push(`− Nó “${n.name}” (${kindOf(n.kind).label})`);
  const ek = (d: Doc, e: WEdge) => `${d.nodes.find((n) => n.id === e.from)?.name ?? e.from} → ${d.nodes.find((n) => n.id === e.to)?.name ?? e.to}`;
  const as = new Set(a.edges.map((e) => ek(a, e) + (e.port ?? ''))), bs = new Set(b.edges.map((e) => ek(b, e) + (e.port ?? '')));
  for (const e of b.edges) if (!as.has(ek(b, e) + (e.port ?? ''))) out.push(`+ Conexão ${ek(b, e)}`);
  for (const e of a.edges) if (!bs.has(ek(a, e) + (e.port ?? ''))) out.push(`− Conexão ${ek(a, e)}`);
  return out;
}

/* ───────────── Operações (usadas pelo Copilot e pelas otimizações) ───────────── */
export type Op =
  | { t: 'add'; node: WNode; after?: string; before?: string; port?: string; label?: string }
  | { t: 'link'; from: string; to: string; port?: string; label?: string; err?: boolean }
  | { t: 'cfg'; id: string; cfg?: Record<string, string | number | boolean>; name?: string }
  | { t: 'remove'; id: string }
  | { t: 'layout' };

export function applyOps(doc: Doc, ops: Op[]): Doc {
  let nodes = doc.nodes.map((n) => ({ ...n, cfg: { ...n.cfg } })), edges = doc.edges.map((e) => ({ ...e })), groups = doc.groups.map((g) => ({ ...g, nodes: [...g.nodes] }));
  for (const op of ops) {
    if (op.t === 'add') {
      const node = { ...op.node, cfg: { ...op.node.cfg } };
      const ref = nodes.find((n) => n.id === (op.after ?? op.before));
      if (ref && op.after) {
        const outs = edges.filter((e) => e.from === ref.id && !e.err && (op.port == null || (e.port ?? 'out') === op.port));
        nodes.forEach((n) => { if (n.x > ref.x) n.x += COL; });
        node.x = ref.x + COL; node.y = ref.y;
        outs.forEach((e) => { e.from = node.id; e.port = undefined; });
        edges.push({ id: newId('e'), from: ref.id, to: node.id, port: op.port, label: op.label });
      } else if (ref && op.before) {
        nodes.forEach((n) => { if (n.x >= ref.x) n.x += COL; });
        node.x = ref.x; node.y = ref.y;
        edges.filter((e) => e.to === ref.id).forEach((e) => { e.to = node.id; });
        edges.push({ id: newId('e'), from: node.id, to: ref.id });
      }
      nodes.push(node);
    } else if (op.t === 'link') {
      if (!edges.some((e) => e.from === op.from && e.to === op.to && e.port === op.port)) edges.push({ id: newId('e'), from: op.from, to: op.to, port: op.port, label: op.label, err: op.err });
    } else if (op.t === 'cfg') {
      nodes = nodes.map((n) => (n.id === op.id ? { ...n, name: op.name ?? n.name, cfg: { ...n.cfg, ...op.cfg } } : n));
    } else if (op.t === 'remove') {
      const ins = edges.filter((e) => e.to === op.id), outs = edges.filter((e) => e.from === op.id);
      edges = edges.filter((e) => e.to !== op.id && e.from !== op.id);
      for (const i of ins) for (const o of outs) if (!i.err) edges.push({ id: newId('e'), from: i.from, to: o.to, port: i.port, label: i.label });
      nodes = nodes.filter((n) => n.id !== op.id);
      groups = groups.map((g) => ({ ...g, nodes: g.nodes.filter((x) => x !== op.id) }));
    } else if (op.t === 'layout') {
      const pos = autoLayout({ nodes, edges }, { x: Math.min(...nodes.map((n) => n.x)), y: Math.min(...nodes.map((n) => n.y)) });
      nodes = nodes.map((n) => ({ ...n, ...pos[n.id] }));
    }
  }
  return { ...doc, nodes, edges, groups: groups.filter((g) => g.nodes.length) };
}

/* ───────────── Otimizações sugeridas ───────────── */
export interface Optimization { id: string; title: string; detail: string; pct: number; nodes: string[]; ops: Op[] }
export function optimizations(wf: Pick<Workflow, 'nodes' | 'edges' | 'kind'>): Optimization[] {
  const out: Optimization[] = [], total = wf.nodes.reduce((a, n) => a + simOf(n).dur, 0) || 1;
  const anc = (id: string, seen = new Set<string>()): Set<string> => { for (const e of wf.edges.filter((x) => x.to === id)) if (!seen.has(e.from)) { seen.add(e.from); anc(e.from, seen); } return seen; };
  const dup = ['normalize', 'dedupe', 'validate', 'convert'];
  for (const k of dup) {
    const same = wf.nodes.filter((n) => n.kind === k);
    for (let i = 0; i < same.length; i++) for (let j = i + 1; j < same.length; j++) {
      const a = same[i], b = same[j];
      if (!a || !b) continue;
      const rA = String(a.cfg.rules ?? ''), rB = String(b.cfg.rules ?? '');
      const overlap = rA && rB && rA.split('|').some((r) => rB.split('|').includes(r));
      if ((anc(b.id).has(a.id) || anc(a.id).has(b.id)) && (overlap || k === 'dedupe')) out.push({ id: `dup-${a.id}-${b.id}`, title: 'Processamento redundante', detail: `“${a.name}” e “${b.name}” aplicam ${k === 'dedupe' ? 'a mesma deduplicação' : 'regras de normalização equivalentes'}. Manter só a primeira.`, pct: Math.max(6, Math.round((simOf(b).dur / total) * 100)), nodes: [a.id, b.id], ops: [{ t: 'remove', id: b.id }] });
    }
  }
  for (const n of wf.nodes) if (kindOf(n.kind).cat === 'source' && n.cfg.mode === 'Completa' && wf.kind !== 'realtime') out.push({ id: `inc-${n.id}`, title: 'Carga incremental', detail: `“${n.name}” relê a tabela inteira a cada execução. Ler só o que mudou desde a última marca-d’água.`, pct: Math.max(10, Math.round((simOf(n).dur / total) * 100 * 0.7)), nodes: [n.id], ops: [{ t: 'cfg', id: n.id, cfg: { mode: 'Incremental', watermark: 'atualizado_em' } }] });
  for (const f of wf.nodes.filter((n) => n.kind === 'filter')) {
    const heavy = [...anc(f.id)].map((id) => wf.nodes.find((n) => n.id === id)!).find((n) => ['join', 'normalize', 'aggregate'].includes(n.kind));
    if (heavy) out.push({ id: `flt-${f.id}`, title: 'Filtrar antes de processar', detail: `“${f.name}” descarta ~54% das linhas, mas vem depois de “${heavy.name}”. Mover o filtro para antes reduz o volume processado.`, pct: Math.round((simOf(heavy).dur / total) * 54), nodes: [f.id, heavy.id], ops: [{ t: 'remove', id: f.id }, { t: 'add', node: { ...f, id: newId('n'), name: f.name }, before: heavy.id }] });
  }
  return out.slice(0, 4);
}

/* ───────────── Explicação em linguagem natural ───────────── */
export function explain(wf: Pick<Workflow, 'name' | 'nodes' | 'edges'>): { summary: string; steps: string[] } {
  const order: WNode[] = [], seen = new Set<string>();
  const roots = wf.nodes.filter((n) => !wf.edges.some((e) => e.to === n.id));
  const walk = (n: WNode) => { if (seen.has(n.id)) return; seen.add(n.id); order.push(n); wf.edges.filter((e) => e.from === n.id && !e.back).forEach((e) => { const t = wf.nodes.find((x) => x.id === e.to); if (t) walk(t); }); };
  roots.forEach(walk);
  const cats = new Set(order.map((n) => kindOf(n.kind).cat));
  const steps = order.map((n) => {
    const k = kindOf(n.kind), ports = k.ports && k.ports.length > 1 && !k.fanout;
    const outs = wf.edges.filter((e) => e.from === n.id);
    const extra = ports ? ` Se verdadeiro segue por “${wf.nodes.find((x) => x.id === outs.find((e) => (e.port ?? k.ports![0]!.id) === k.ports![0]!.id)?.to)?.name ?? '—'}”, senão por “${wf.nodes.find((x) => x.id === outs.find((e) => e.port === k.ports![1]!.id)?.to)?.name ?? '—'}”.` : k.fanout ? ` Os ${outs.length} ramos rodam em paralelo.` : '';
    return `${n.name} ${k.verb}.${extra}`;
  });
  const first = order[0], datas = order.filter((n) => ['source', 'data'].includes(kindOf(n.kind).cat)).length;
  const bits = [first ? `O fluxo “${wf.name}” ${kindOf(first.kind).verb}` : `O fluxo “${wf.name}” ainda está vazio`];
  if (datas) bits.push(`trata ${datas} etapas de dados`);
  if (cats.has('ai')) bits.push('usa IA para analisar ou decidir');
  if (cats.has('human')) bits.push('inclui uma etapa feita por pessoas');
  if (cats.has('action')) bits.push('dispara ações em outros sistemas');
  const last = order[order.length - 1];
  return { summary: `${bits.join(', ')}${last && last !== first ? ` e termina em “${last.name}”` : ''}.`, steps };
}

export const sourceKinds = (wf: Pick<Workflow, 'nodes'>) => wf.nodes.filter((n) => kindOf(n.kind).cat === 'source');
export { catOf, defaultCfg };

/* ───────────── Agenda ───────────── */
const DOW = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
/** Próxima execução de um gatilho de agenda, em texto. */
export function nextRun(cfg: Record<string, string | number | boolean>, from = new Date()): { when: string; in: string } {
  const [h, m] = String(cfg.at ?? '06:00').split(':').map(Number), d = new Date(from);
  const freq = String(cfg.freq);
  if (freq === 'A cada hora') { d.setHours(d.getHours() + 1, 0, 0, 0); }
  else if (freq === 'Cron / avançado') { return { when: `conforme “${cfg.cron}”`, in: '' }; }
  else {
    d.setHours(h || 0, m || 0, 0, 0);
    if (freq === 'Semanal') { d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7)); if (d <= from) d.setDate(d.getDate() + 7); }
    else if (d <= from) d.setDate(d.getDate() + 1);
  }
  const mins = Math.max(1, Math.round((d.getTime() - from.getTime()) / 60000)), hh = Math.floor(mins / 60);
  const day = d.toDateString() === from.toDateString() ? 'hoje' : d.getTime() - from.getTime() < 36e5 * 36 && d.getDate() !== from.getDate() && d.getDate() - from.getDate() === 1 ? 'amanhã' : `${DOW[d.getDay()]} ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  return { when: `${day} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, in: hh >= 24 ? `em ${Math.floor(hh / 24)} d ${hh % 24} h` : hh ? `em ${hh} h ${mins % 60} min` : `em ${mins} min` };
}
