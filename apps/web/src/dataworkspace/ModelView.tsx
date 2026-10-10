import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Icon, SegmentedControl } from '@biweb/ui';
import { useDw } from './store';
import { ALTERNATIVES, MODEL_GRAPHS, MODELS, type MEdge, type MNode } from './ops';
import { Canvas, type CEdge, type CNode } from './Canvas';
import { Pill, Search, Section, ViewHead, useGo } from './ui';

const W = 236, HEAD = 40, ROW = 20;
const EDGE_REL: Record<string, string> = { p1: 'r1', p2: 'r2', p3: 'r3', p4: 'r4', p5: 'r5', p6: 'r7' };
const hOf = (n: MNode, collapsed: boolean) => HEAD + (collapsed ? 0 : n.cols.length * ROW + 10 + (n.metrics ? 26 : 0));

/** Layout em camadas: entidades "folha" (referenciadas) à esquerda; quem referencia, à direita. */
function autoLayout(nodes: MNode[], edges: MEdge[], collapsed: Set<string>): Record<string, { x: number; y: number }> {
  const depth: Record<string, number> = {};
  const dpt = (id: string, seen = new Set<string>()): number => { if (depth[id] !== undefined) return depth[id]!; if (seen.has(id)) return 0; seen.add(id); const out = edges.filter((e) => e.from === id).map((e) => e.to); const d = out.length ? 1 + Math.max(...out.map((o) => dpt(o, seen))) : 0; depth[id] = d; return d; };
  nodes.forEach((n) => dpt(n.id));
  const max = Math.max(0, ...Object.values(depth));
  const cols: Record<number, MNode[]> = {};
  nodes.forEach((n) => { const lvl = max - (depth[n.id] ?? 0); (cols[lvl] ??= []).push(n); });
  const pos: Record<string, { x: number; y: number }> = {};
  Object.entries(cols).forEach(([lvl, ns]) => { let y = 20; ns.forEach((n) => { pos[n.id] = { x: 20 + Number(lvl) * (W + 90), y }; y += hOf(n, collapsed.has(n.id)) + 44; }); });
  return pos;
}

export function ModelView({ id }: { id?: string }) {
  const go = useGo();
  const st = useDw();
  const mid = id ?? 'sales';
  const model = MODELS.find((m) => m.id === mid) ?? MODELS[1]!;
  const demo = mid === 'sales' || mid === 'customer';
  const mode = demo ? st.mv.mode : 'curated', ver = st.mv.ver;
  const key = mode === 'logical' ? `logical:${ver}` : mode;
  const g = MODEL_GRAPHS[key]!;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);
  useEffect(() => { setPos({}); setFocus(null); setFitTick((t) => t + 1); }, [key, mid]);

  const sel = st.sel;
  const selNode = sel?.kind === 'mnode' ? sel.id : null;
  const selEdge = sel?.kind === 'rel' ? (sel.id.startsWith('m:') ? sel.id.slice(2) : Object.entries(EDGE_REL).find(([, r]) => r === sel.id)?.[0] ?? null) : null;
  const match = q.trim().toLowerCase();
  const hit = (n: MNode) => !!match && (n.title.toLowerCase().includes(match) || n.cols.some((c) => c.n.toLowerCase().includes(match)));
  const firstHit = match ? g.nodes.find(hit)?.id ?? null : null;
  const near = useMemo(() => { if (!focus) return null; const s = new Set([focus]); g.edges.forEach((e) => { if (e.from === focus) s.add(e.to); if (e.to === focus) s.add(e.from); }); return s; }, [focus, g]);

  const nodes: CNode[] = g.nodes.map((n) => ({ id: n.id, x: pos[n.id]?.x ?? n.x, y: pos[n.id]?.y ?? n.y, w: W, h: hOf(n, collapsed.has(n.id)) }));
  const edges: CEdge[] = g.edges.map((e) => {
    const rid = EDGE_REL[e.id], dec = rid ? st.decisions[rid] : undefined;
    const [a, b] = e.card.split(':');
    return { id: e.id, from: e.from, to: e.to, label: e.label, fromEnd: a, toEnd: b, dashed: e.kind === 'suggested' && dec !== 'accepted', dim: (!!near && !(near.has(e.from) && near.has(e.to))) || dec === 'rejected', tone: e.kind === 'suggested' && dec !== 'accepted' ? 'warn' : 'default', active: selEdge === e.id };
  });
  const nodeMap = new Map(g.nodes.map((n) => [n.id, n]));

  const renderNode = (nid: string) => {
    const n = nodeMap.get(nid)!, col = collapsed.has(nid);
    return (
      <div className={`dw-ent is-t-${n.tone ?? 'entity'}${selNode === nid ? ' is-sel' : ''}${hit(n) ? ' is-hit' : ''}${near && !near.has(nid) ? ' is-dim' : ''}`} onClick={() => st.select({ kind: 'mnode', id: nid, extra: key })}>
        <div className="dw-ent-h"><b>{n.title}</b>{n.sub && <small>{n.sub}</small>}
          <button type="button" aria-label={col ? `Expandir ${n.title}` : `Recolher ${n.title}`} onClick={(e) => { e.stopPropagation(); setCollapsed((s) => { const x = new Set(s); if (x.has(nid)) x.delete(nid); else x.add(nid); return x; }); }}><Icon name={col ? 'chevronRight' : 'chevronDown'} size={12} /></button>
          <button type="button" aria-label={`Focar em ${n.title}`} className={focus === nid ? 'is-on' : ''} onClick={(e) => { e.stopPropagation(); setFocus(focus === nid ? null : nid); }}><Icon name="target" size={12} /></button></div>
        {!col && <ul className="dw-ent-c">{n.cols.map((c) => <li key={c.n} className={match && c.n.toLowerCase().includes(match) ? 'is-hit' : ''}><span className="dw-ent-k">{c.flag && <Pill tone="key">{c.flag}</Pill>}</span><span className="bw-mono">{c.n}</span>{c.t && <em>{c.t}</em>}</li>)}</ul>}
        {!col && n.metrics && <div className="dw-ent-m"><span>Métricas</span>{n.metrics.map((m) => <Pill key={m} tone="sem">{m}</Pill>)}</div>}
        {col && <small className="dw-ent-n">{n.cols.length} campos</small>}
      </div>
    );
  };

  return (
    <div className="dw-view dw-view--canvas">
      <ViewHead title={model.name} sub={`${model.status} · ${model.sources} fontes${demo ? '' : ' · visão curada'}`} actions={<>
        {demo && <SegmentedControl label="Modo do modelo" value={mode} onChange={(v) => st.setMv({ mode: v })} options={[{ id: 'physical', label: 'Físico' }, { id: 'logical', label: 'Lógico' }, { id: 'curated', label: 'Curado' }, { id: 'dimensional', label: 'Dimensional' }]} />}
        {demo && mode === 'logical' && <SegmentedControl label="Versão do modelo" value={ver} onChange={(v) => st.setMv({ ver: v })} options={[{ id: 'source', label: 'Modelo de origem' }, { id: 'proposed', label: 'Modelo proposto' }]} />}
        <Button size="sm" icon="copilot" isDisabled={st.ai.mode === 'off'} onPress={() => { st.setPane({ rightOpen: true, rTab: 'copilot' }); import('./copilot').then((m) => st.pushChat([{ id: `u${Date.now()}`, role: 'user', text: 'Normalize este dataset' }, m.reply('normalize', { section: 'model', itemId: mid })])); }}>Normalizar com o Copilot</Button>
      </>} />
      <div className="dw-toolbar dw-toolbar--tight">
        <Search value={q} onChange={(v) => { setQ(v); setFocus(null); }} placeholder="Buscar entidade ou campo…" w={240} />
        <Button size="sm" variant="ghost" icon="grid" onPress={() => { setPos(autoLayout(g.nodes, g.edges, collapsed)); setFitTick((t) => t + 1); }}>Auto layout</Button>
        <Button size="sm" variant="ghost" icon="minus" onPress={() => setCollapsed(new Set(g.nodes.map((n) => n.id)))}>Recolher tudo</Button>
        <Button size="sm" variant="ghost" icon="plus" onPress={() => setCollapsed(new Set())}>Expandir tudo</Button>
        {focus && <Button size="sm" variant="ghost" icon="close" onPress={() => setFocus(null)}>Sair do foco</Button>}
        <span className="flex-1" />
        <span className="dw-legend"><i className="is-solid" />declarado / aceito<i className="is-dash" />sugerido</span>
      </div>
      <div className={`dw-canvas-wrap${mode === 'logical' && ver === 'proposed' ? ' is-proposed' : ''}`}>
        <Canvas key={key} label={`Diagrama do modelo ${model.name}`} nodes={nodes} edges={edges} renderNode={renderNode} fitKey={`${key}${fitTick}${collapsed.size}`} focusId={firstHit}
          onMove={(nid, x, y) => setPos((p) => ({ ...p, [nid]: { x, y } }))} onBackground={() => st.select(null, false)}
          selectedEdge={selEdge} onEdge={(eid) => { const rid = EDGE_REL[eid]; st.select({ kind: 'rel', id: rid ?? `m:${eid}` }); }} />
      </div>
      {demo && mode === 'logical' && (
        <div className="dw-rationale">
          {ver === 'source' ? (
            <><div><b>Modelo de origem</b><span>sales_raw · 53 colunas. Cliente, produto e região se repetem em cada linha de pedido.</span></div><Button size="sm" variant="primary" onPress={() => st.setMv({ ver: 'proposed' })}>Ver modelo proposto</Button></>
          ) : (
            <><div><b>Modelo proposto · racional</b><span>5 entidades separam o que muda de forma independente: Customer, Order, Order Item, Product, Region. Remove ~38% de valores duplicados e dá integridade ao relacionamento Order → Customer.</span></div>
              <Button size="sm" onPress={() => st.select({ kind: 'proposal', id: 'p' })}>Ver proposta</Button><Button size="sm" variant="primary" onPress={() => go('/data/changes/CS-184')}>Revisar ChangeSet</Button></>
          )}
        </div>
      )}
      {demo && mode === 'logical' && ver === 'proposed' && (
        <Section title="Alternativas de modelagem" hint="avaliação qualitativa, sem medição de custo real">
          <div className="dw-alts">{ALTERNATIVES.map((a) => (
            <div key={a.id} className={`dw-alt${a.rec ? ' is-rec' : ''}`}><b>{a.name}{a.rec && <Badge tone="accent">Recomendado</Badge>}</b><dl><dt>Melhor para</dt><dd>{a.best}</dd><dt>Complexidade</dt><dd>{a.complexity}</dd><dt>Redundância</dt><dd>{a.redundancy}</dd><dt>Junções</dt><dd>{a.joins}</dd><dt>Consumo</dt><dd>{a.use}</dd></dl></div>))}</div>
        </Section>
      )}
    </div>
  );
}
