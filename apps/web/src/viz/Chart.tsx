import { memo, useEffect, useMemo, useState } from 'react';
import { labelOf, STATUS_LABEL } from '../data/query';
import type { ChartProps, Comp } from '../editor/doc';
import { useEditor } from '../editor/store';
import { Cartesian } from './engine/Cartesian';
import { KIND_BY_ID } from './engine/kinds';
import { buildModel, dateFieldOf, inWindow, maxDate, periodWindow, shiftYear } from './engine/model';
import { BoxPlot, CalendarHeat, Donut, Funnel, Gauge, HeatTable, Histogram, Sankey, Scatter, Treemap } from './engine/Other';
import { cat, COLOR, Legend, statusColor } from './engine/ui';
import { Empty, fieldOf, useRows, useSize } from './common';
import { StateOverlay, useLiveTick } from './states';

/** Cross-filter / cross-highlight / drill / navigation (drill-through) from a click on a mark. */
export function useEmit(comp: Comp, field?: string) {
  const cross = useEditor((s) => s.cross);
  const drillPath = useEditor((s) => s.drill[comp.id]);
  const highlighted = cross?.mode === 'highlight' && cross.source !== comp.id && cross.table === comp.data?.table && cross.field === field;
  return {
    active: cross?.source === comp.id || highlighted ? cross?.value : undefined,
    level: drillPath?.length ?? 0,
    emit: (f: string, value: unknown, label: string) => {
      const st = useEditor.getState();
      const d = comp.interactions.drill;
      if (d?.length && (st.drill[comp.id]?.length ?? 0) < d.length - 1 && f === d[st.drill[comp.id]?.length ?? 0]) {
        st.set({ drill: { ...st.drill, [comp.id]: [...(st.drill[comp.id] ?? []), value] } });
        return;
      }
      const same = cross?.source === comp.id && cross.value === value;
      if (comp.interactions.navigateTo && st.mode === 'preview') {
        st.goPage(comp.interactions.navigateTo, comp.interactions.carryContext === false ? null : { source: comp.id, table: comp.data?.table ?? '', field: f, value, label });
        return;
      }
      if (!comp.interactions.emitCross) return;
      st.setCross(same ? null : { source: comp.id, table: comp.data?.table ?? '', field: f, value, label, mode: comp.interactions.crossMode ?? 'filter' });
    },
  };
}

const MODEL_KINDS = new Set(['bar', 'hbar', 'line', 'area', 'step', 'combo', 'stacked', 'stacked100', 'grouped', 'waterfall', 'bullet', 'sparkbars', 'pie', 'funnel', 'treemap', 'gauge']);

/** Drill breadcrumb: Brasil / SP / São Paulo, each level clickable, plus Back. */
function DrillBar({ comp, drill, level }: { comp: Comp; drill: string[]; level: number }) {
  const path = useEditor((s) => s.drill[comp.id]) ?? [];
  const set = (n: number) => { const st = useEditor.getState(); st.set({ drill: { ...st.drill, [comp.id]: (st.drill[comp.id] ?? []).slice(0, n) } }); };
  return (
    <nav className="vz-drill" aria-label="Caminho do drill-down">
      <button type="button" onClick={() => set(level - 1)} disabled={level === 0}>← Voltar</button>
      <button type="button" className="vz-crumb" onClick={() => set(0)} aria-current={level === 0 ? 'true' : undefined}>{fieldOf(comp, drill[0])?.label ?? 'Todos'}</button>
      {path.map((v, i) => <span key={i} className="vz-crumb-wrap"><i>/</i><button type="button" className="vz-crumb" onClick={() => set(i + 1)} aria-current={i + 1 === level ? 'true' : undefined}>{labelOf(v)}</button></span>)}
      {level < drill.length - 1 && <span className="vz-drill-next">próximo nível: {fieldOf(comp, drill[level + 1])?.label}</span>}
    </nav>
  );
}

export const ChartView = memo(function ChartView({ comp }: { comp: Comp }) {
  const p0 = comp.props as unknown as ChartProps;
  const [ref, size] = useSize<HTMLDivElement>();
  const drill = comp.interactions.drill;
  const level = useEditor((s) => s.drill[comp.id]?.length ?? 0);
  const x = drill?.length ? drill[Math.min(level, drill.length - 1)]! : p0.x;
  const { emit, active } = useEmit(comp, x);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<[number, number] | null>(null);
  const tick = useLiveTick(p0.live);
  const ds = comp.data?.dataset ?? 'ds_rede_sp', table = comp.data?.table ?? 'enlaces';
  const def = KIND_BY_ID[p0.kind];
  const p = useMemo<ChartProps>(() => ({ ...p0, zoom: p0.zoom ?? def?.supportsZoom ?? false }), [p0, def]);
  const dateName = p.dateField ?? dateFieldOf(ds, table)?.name;
  const baseRows = useRows(comp, undefined, p.compare === 'prev' || p.compare === 'both' ? dateName : undefined);
  const end = useMemo(() => (dateName ? maxDate(ds, table, dateName) : 0), [ds, table, dateName]);
  const window = useMemo(() => (dateName ? periodWindow(p.period, end) : null), [p.period, end, dateName]);
  const rows = useMemo(() => (dateName ? inWindow(baseRows, dateName, window) : baseRows), [baseRows, dateName, window, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const wantPrev = (p.compare === 'prev' || p.compare === 'both') && !!dateName;
  const prevRows = useMemo(() => {
    if (!wantPrev || !dateName) return undefined;
    const w = window ?? (rows.length ? [Math.min(...rows.map((r) => Number(r[dateName]))), Math.max(...rows.map((r) => Number(r[dateName])))] as [number, number] : null);
    return w ? inWindow(baseRows, dateName, [shiftYear(w[0]), shiftYear(w[1])]) : undefined;
  }, [wantPrev, dateName, window, rows, baseRows]);
  const model = useMemo(() => (MODEL_KINDS.has(p.kind) && comp.data ? buildModel({ ds, table, rows, prevRows, x, props: p }) : null), [p, rows, prevRows, x, ds, table, comp.data]);
  useEffect(() => { setRange(null); }, [model?.pts.length, p.kind, x]);
  if (!comp.data) return <Empty text="Sem dados" hint="Escolha um dataset na aba Dados" />;
  const W = Math.max(size.w, 10);
  const legendOn = p.legend && p.kind !== 'pie' && p.kind !== 'treemap' && p.kind !== 'gauge' && p.kind !== 'sankey';
  const items: { k: string; c: string; dash?: boolean }[] = [];
  if (model) {
    if (model.seriesKeys.length) model.seriesKeys.forEach((s, i) => items.push({ k: STATUS_LABEL[s] ?? s, c: statusColor(s) ?? cat(i, comp.style.accent) }));
    else if (p.kind === 'combo' || p.compare !== 'none') items.push({ k: fieldOf(comp, p.y)?.label ?? 'Valor', c: cat(0, comp.style.accent) });
    if (p.kind === 'combo' && p.y2) items.push({ k: fieldOf(comp, p.y2)?.label ?? 'Linha', c: cat(2, comp.style.accent), dash: false });
    if (model.hasTarget && p.compare !== 'prev') items.push({ k: 'Meta', c: COLOR.target, dash: true });
    if (model.hasPrev) items.push({ k: 'Ano anterior', c: COLOR.prev, dash: true });
    if (p.movingAvg) items.push({ k: `Média móvel ${p.movingAvg}`, c: 'var(--text-secondary)', dash: true });
  }
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const rawSeries = model?.seriesKeys.map((s) => STATUS_LABEL[s] ?? s) ?? [];
  const keyOfItem = (label: string) => model?.seriesKeys.find((s) => (STATUS_LABEL[s] ?? s) === label) ?? label;
  const toggleItem = (label: string) => { if (rawSeries.includes(label)) toggle(keyOfItem(label)); };
  const hiddenLabels = new Set([...hidden].map((s) => STATUS_LABEL[s] ?? s));
  const common = { comp, p, W, hidden, active, x, emit };
  let body: React.ReactNode = null;
  if (size.w > 0) {
    const H = Math.max(size.h, 10);
    if (model && !model.pts.length) body = <Empty text="Nada para mostrar" hint="Os filtros atuais não deixaram nenhuma linha" />;
    else if (model && ['pie', 'gauge', 'funnel', 'treemap'].includes(p.kind)) {
      const o = { ...common, H, model, rows };
      body = p.kind === 'pie' ? <Donut {...o} /> : p.kind === 'gauge' ? <Gauge {...o} /> : p.kind === 'funnel' ? <Funnel {...o} /> : <Treemap {...o} />;
    } else if (model) {
      body = <Cartesian comp={comp} model={model} p={p} W={W} H={H} hidden={hidden} active={active} x={x} range={range} onRange={setRange} onSelect={(pt) => { if (String(pt.key).startsWith('__')) return; emit(x, pt.key, `${model.xf?.label ?? x}: ${pt.label}`); }} />;
    } else if (!rows.length) body = <Empty text="Nada para mostrar" hint="Os filtros atuais não deixaram nenhuma linha" />;
    else {
      const m = { pts: [], seriesKeys: [], total: 0, isTime: false, hasTarget: false, hasPrev: false, agg: p.agg, xf: fieldOf(comp, x), yf: fieldOf(comp, p.y) };
      const o = { ...common, H, model: m, rows };
      body = p.kind === 'scatter' || p.kind === 'bubble' ? <Scatter {...o} /> : p.kind === 'histogram' ? <Histogram {...o} /> : p.kind === 'box' ? <BoxPlot {...o} /> : p.kind === 'sankey' ? <Sankey {...o} /> : p.kind === 'heat' ? <HeatTable {...o} /> : p.kind === 'calendar' ? <CalendarHeat {...o} /> : null;
    }
  }
  return (
    <div className="vz-chart" data-kind={p.kind}>
      {drill?.length && drill.length > 1 ? <DrillBar comp={comp} drill={drill} level={level} /> : null}
      {legendOn && items.length > 0 && <Legend items={items.slice(0, 9)} hidden={hiddenLabels} onToggle={rawSeries.length ? toggleItem : undefined} />}
      <div className="vz-plot" ref={ref}>{body}</div>
      <StateOverlay state={p.state} comp={comp} />
      {p.live && <span className="vz-live-badge" title="Atualizando em tempo real"><i />LIVE</span>}
    </div>
  );
});
