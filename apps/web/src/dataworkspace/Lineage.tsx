import { useEffect, useMemo, useState } from 'react';
import { Button, Icon, SegmentedControl, type IconName } from '@biweb/ui';
import { useDw } from './store';
import { KPI_TRACE, LEDGES, LNODES, type LKind } from './ops';
import { Canvas, type CEdge, type CNode } from './Canvas';
import { Chip, Empty, ViewHead } from './ui';

const KIND: Record<LKind, { label: string; icon: IconName }> = { source: { label: 'Fonte', icon: 'data' }, raw: { label: 'RAW', icon: 'layers' }, transform: { label: 'Transformação', icon: 'sliders' }, dataset: { label: 'Dataset', icon: 'table' }, model: { label: 'Modelo', icon: 'model' }, report: { label: 'Relatório', icon: 'report' }, map: { label: 'Mapa', icon: 'pin' }, workflow: { label: 'Fluxo', icon: 'share' }, kpi: { label: 'KPI', icon: 'kpi' } };
const FILTERS: [string, LKind[]][] = [['Fontes', ['source', 'raw']], ['Transformações', ['transform']], ['Datasets', ['dataset', 'model']], ['Relatórios', ['report', 'kpi']], ['Mapas', ['map']], ['Fluxos', ['workflow']]];
const W = 196, H = 58;

export function LineageView({ id }: { id?: string }) {
  const st = useDw();
  const [focus, setFocus] = useState<string | null>(id ?? null);
  const [dir, setDir] = useState<'up' | 'down' | 'both'>('both');
  const [depth, setDepth] = useState<1 | 2 | 3 | 0>(0);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [trace, setTrace] = useState(false);
  useEffect(() => { const f = (e: Event) => { const d = (e as CustomEvent<{ id: string; dir: 'up' | 'down' }>).detail; setFocus(d.id); setDir(d.dir); setDepth(0); }; addEventListener('biweb:dw-trace', f); return () => removeEventListener('biweb:dw-trace', f); }, []);

  const visible = useMemo(() => {
    if (!focus) return new Set(LNODES.map((n) => n.id));
    const set = new Set([focus]);
    const walk = (d: 'up' | 'down') => {
      let frontier = [focus];
      for (let i = 0; (depth === 0 || i < depth) && frontier.length; i++) {
        const next: string[] = [];
        LEDGES.forEach(([a, b]) => { const from = d === 'up' ? b : a, to = d === 'up' ? a : b; if (frontier.includes(from) && !set.has(to)) { set.add(to); next.push(to); } });
        frontier = next;
      }
    };
    if (dir !== 'down') walk('up'); if (dir !== 'up') walk('down');
    return set;
  }, [focus, dir, depth]);
  const hiddenKinds = useMemo(() => new Set(FILTERS.filter(([l]) => off.has(l)).flatMap(([, k]) => k)), [off]);
  const nodes = LNODES.filter((n) => visible.has(n.id) && (n.id === focus || !hiddenKinds.has(n.kind)));
  const ids = new Set(nodes.map((n) => n.id));
  const cn: CNode[] = nodes.map((n) => ({ id: n.id, x: n.layer * (W + 40), y: n.row * (H + 28), w: W, h: H }));
  const path = useMemo(() => { if (!trace) return null; const s = new Set(['kpi.rev']); let ch = true; while (ch) { ch = false; LEDGES.forEach(([a, b]) => { if (s.has(b) && !s.has(a) && !(b === 'kpi.rev' && false)) { s.add(a); ch = true; } }); } return s; }, [trace]);
  const edges: CEdge[] = LEDGES.filter(([a, b]) => ids.has(a) && ids.has(b)).map(([a, b]) => ({ id: `${a}>${b}`, from: a, to: b, active: path ? path.has(a) && path.has(b) : false, dim: path ? !(path.has(a) && path.has(b)) : false }));
  const sel = st.sel?.kind === 'lnode' ? st.sel.id : null;
  const byId = new Map(LNODES.map((n) => [n.id, n]));
  const toggle = (l: string) => setOff((s) => { const n = new Set(s); if (n.has(l)) n.delete(l); else n.add(l); return n; });

  const select = (nid: string) => st.select({ kind: 'lnode', id: nid });
  return (
    <div className="dw-view dw-view--canvas">
      <ViewHead title="Linhagem" sub="Da fonte ao relatório, campo a campo" actions={<>
        {sel === 'kpi.rev' && <Button size="sm" variant="primary" icon="timeline" onPress={() => { setTrace(true); setFocus('kpi.rev'); setDir('up'); setDepth(0); }}>Rastrear até a fonte</Button>}
        <Button size="sm" variant="ghost" onPress={() => { setFocus(null); setTrace(false); setDir('both'); setDepth(0); setOff(new Set()); }}>Mostrar tudo</Button></>} />
      <div className="dw-toolbar dw-toolbar--tight">
        <SegmentedControl label="Direção" value={dir} onChange={setDir} options={[{ id: 'up', label: 'A montante' }, { id: 'down', label: 'A jusante' }, { id: 'both', label: 'Ambos' }]} />
        <SegmentedControl label="Profundidade" value={String(depth) as '0' | '1' | '2' | '3'} onChange={(v) => setDepth(Number(v) as 0 | 1 | 2 | 3)} options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '0', label: 'Tudo' }]} />
        <span className="dw-chips" role="group" aria-label="Tipos de objeto">{FILTERS.map(([l]) => <Chip key={l} on={!off.has(l)} onClick={() => toggle(l)}>{l}</Chip>)}</span>
        <span className="flex-1" />
        {focus && <span className="dw-muted">Foco: <b>{byId.get(focus)?.label}</b></span>}
      </div>
      <div className="dw-canvas-wrap">
        {nodes.length === 0 ? <Empty icon="share" title="A linhagem aparecerá após o processamento" text="Execute uma sincronização para ver a origem de cada campo." /> : (
          <Canvas label="Diagrama de linhagem" nodes={cn} edges={edges} fitKey={`${focus}${dir}${depth}${[...off].join()}${trace}`} onBackground={() => st.select(null, false)} focusId={focus}
            nodeClass={(nid) => `${sel === nid ? 'is-sel' : ''}`}
            renderNode={(nid) => {
              const n = byId.get(nid)!, k = KIND[n.kind];
              return (
                <button type="button" className={`dw-ln-node is-${n.kind}${sel === nid ? ' is-sel' : ''}${path && !path.has(nid) ? ' is-dim' : ''}${focus === nid ? ' is-focus' : ''}`} onClick={() => select(nid)} onDoubleClick={() => { setFocus(nid); }}>
                  <span className="dw-ln-i"><Icon name={k.icon} size={16} /></span><span className="dw-ln-t"><small>{k.label}</small><b title={n.label}>{n.label}</b><em>{n.sub}</em></span>
                </button>
              );
            }} />
        )}
        {trace && (
          <div className="dw-trace-card" role="region" aria-label="Rastro em nível de coluna">
            <header><b>Rastro de Revenue KPI</b><button type="button" aria-label="Fechar rastro" onClick={() => setTrace(false)}><Icon name="close" size={12} /></button></header>
            <ol>{KPI_TRACE.map((t) => <li key={t.t}><b>{t.t}</b><small>{t.d}</small></li>)}</ol>
            <Button size="sm" icon="timeline" onPress={() => st.showOrigin('db', 'ERP.PEDIDOS.VL_TOTAL')}>Ver origem</Button>
          </div>
        )}
      </div>
      <p className="dw-foot"><Icon name="info" size={12} />Clique em um nó para inspecionar; clique duas vezes para focar nele. {st.technical ? 'Zonas: RAW → STAGING → QUARANTINE → CURATED → SERVING.' : ''}</p>
    </div>
  );
}
