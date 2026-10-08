import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger, Popover } from 'react-aria-components';
import { Icon } from '@biweb/ui';
import { aggFormat, aggregate, AGG_LABEL, applyRules, distinct, fmt, labelOf, STATUS_LABEL, STATUS_ORDER } from '../data/query';
import { getTable } from '../data/registry';
import type { Row } from '../data/types';
import type { CardProps, Comp, FilterProps, ImageProps, KpiProps, MatrixProps, SlicerProps, StatusProps, TableProps, TextProps, TimelineProps } from '../editor/doc';
import { useEditor } from '../editor/store';
import { asset } from '../state/ui-store';
import { useEmit } from './Chart';
import { Empty, fieldOf, StatusDot, Tip, useRows, useRules, useSize } from './common';
import { inWindow, maxDate, periodWindow, shiftYear, dateFieldOf } from './engine/model';
import { liveAgo, StateOverlay, useLiveTick } from './states';

const NOW_DAY = Math.floor(Date.UTC(2026, 9, 6) / 86_400_000) * 86_400_000;

/* ---------------- KPI ---------------- */
export const KpiView = memo(function KpiView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as KpiProps;
  const ds = comp.data!.dataset, tb = comp.data!.table;
  const dateName = p.dateField ?? dateFieldOf(ds, tb)?.name;
  const periodic = !!p.period && p.period !== 'all' && !!dateName;
  const wantPrev = (p.compare === 'prev' || p.compare === 'both') && periodic;
  const all = useRows(comp, undefined, wantPrev ? dateName : undefined);
  const hist = useRows(comp, 'historico');
  const mf = fieldOf(comp, p.measure);
  const end = useMemo(() => (dateName ? maxDate(ds, tb, dateName) : 0), [ds, tb, dateName]);
  const w = useMemo(() => (periodic ? periodWindow(p.period, end) : null), [periodic, p.period, end]);
  const rows = useMemo(() => (dateName && w ? inWindow(all, dateName, w) : all), [all, dateName, w]);
  const prevRows = useMemo(() => (wantPrev && w && dateName ? inWindow(all, dateName, [shiftYear(w[0]), shiftYear(w[1])]) : null), [wantPrev, w, all, dateName]);
  const one = (rs: Row[], measure = p.measure, agg = p.agg) => aggregate(rs, { ds, table: tb, measure, agg })[0]!.value;
  const value = useMemo(() => one(rows), [rows, p.measure, p.agg, ds, tb]); // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useMemo(() => (prevRows && prevRows.length ? one(prevRows) : null), [prevRows, p.measure, p.agg, ds, tb]); // eslint-disable-line react-hooks/exhaustive-deps
  const targetValue = p.targetField ? aggregate(rows, { ds, table: tb, measure: p.targetField, agg: 'sum' })[0]!.value : p.target;
  const spark = useMemo(() => {
    if (!p.spark) return [];
    if (dateName && periodic) return aggregate(rows, { ds, table: tb, groupBy: dateName, measure: p.measure, agg: p.agg, grain: p.sparkGrain ?? (p.period === 'last12m' || p.period === 'ytd' ? 'month' : 'day'), sort: 'none' }).map((s) => s.value);
    return p.sparkMeasure ? aggregate(hist, { ds, table: 'historico', groupBy: 'dia', measure: p.sparkMeasure, agg: 'avg' }).map((s) => s.value) : [];
  }, [rows, hist, p, dateName, periodic, ds, tb]);
  const fmtV = (v: number) => fmt(v, aggFormat(p.agg, mf), true);
  const hasT = (p.compare === 'target' || p.compare === 'both') && targetValue != null && targetValue !== 0;
  const better = (a: number, b: number) => (p.lowerIsBetter ? a <= b : a >= b);
  const ok = hasT && (p.targetDir === 'below' || p.lowerIsBetter ? value <= targetValue! : value >= targetValue!);
  const dPrev = prev ? value / prev - 1 : null, dPrevPp = prev != null && mf?.format === 'pct' ? value - prev : null;
  const live = useLiveTick(p.live), [bump, setBump] = useState(false);
  const last = useRef(value);
  useEffect(() => { if (!p.live || last.current === value) { last.current = value; return; } last.current = value; setBump(true); const t = setTimeout(() => setBump(false), 700); return () => clearTimeout(t); }, [value, p.live]);
  const [ref, size] = useSize<HTMLDivElement>();
  const sec = (p.secondary ?? []).map((q) => ({ ...q, v: one(rows, q.measure, q.agg), f: fieldOf(comp, q.measure) }));
  const tonePrev = dPrev == null ? '' : better(value, prev!) ? 'is-ok' : 'is-bad';
  return (
    <div className="vz-kpi" ref={ref} data-live={p.live ? '' : undefined}>
      <div className="vz-kpi-top"><div className={`vz-kpi-value bw-num${bump ? ' is-bump' : ''}`}>{fmtV(value)}</div>{p.live && <span className="vz-live-badge vz-live-inline"><i />{liveAgo(live)}</span>}</div>
      {dPrev != null && <div className={`vz-kpi-delta ${tonePrev}`}>{dPrev >= 0 ? '▲' : '▼'} {Math.abs(dPrev * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%{dPrevPp != null ? ` (${dPrevPp >= 0 ? '+' : '−'}${Math.abs(dPrevPp).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} pp)` : ''} <span>vs ano anterior · {fmtV(prev!)}</span></div>}
      {hasT ? (
        <div className={`vz-kpi-delta ${ok ? 'is-ok' : 'is-bad'}`}>{ok ? '✓' : p.targetDir === 'above' && !p.lowerIsBetter ? '▼' : '▲'} {ok ? 'dentro da meta' : 'fora da meta'} <span>meta {p.targetDir === 'above' && !p.lowerIsBetter ? '≥' : '≤'} {fmtV(targetValue!)}{p.targetField ? ` · ${fmt((value / targetValue!) * 100, 'pct')}` : ''}</span></div>
      ) : dPrev == null && <div className="vz-kpi-delta"><span>{AGG_LABEL[p.agg].toLowerCase()} de {rows.length.toLocaleString('pt-BR')} {rows.length === 1 ? 'linha' : 'linhas'}</span></div>}
      {sec.length > 0 && <div className="vz-kpi-sec">{sec.map((q) => <span key={q.label}>{q.label}<b className="bw-num">{fmt(q.v, aggFormat(q.agg, q.f), true)}</b></span>)}</div>}
      {spark.length > 1 && size.w > 60 && size.h - 54 - (sec.length ? 22 : 0) >= 10 && <Spark values={spark} w={size.w} h={Math.min(40, size.h - 54 - (sec.length ? 22 : 0))} ok={!hasT || ok} />}
      <StateOverlay state={p.state} comp={comp} />
    </div>
  );
});
function Spark({ values, w, h, ok }: { values: number[]; w: number; h: number; ok: boolean }) {
  const mn = Math.min(...values), mx = Math.max(...values), sp = mx - mn || 1, pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 2 - ((v - mn) / sp) * (h - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '), color = ok ? 'var(--viz-cat-1)' : 'var(--dash-negative)';
  return <svg width={w} height={h} className="vz-spark" aria-hidden="true"><path d={`${d} L${w - 2} ${h} L2 ${h} Z`} style={{ fill: color, fillOpacity: 0.1 }} /><path d={d} style={{ fill: 'none', stroke: color, strokeWidth: 1.5 }} /><circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r={2.4} style={{ fill: color }} /></svg>;
}

export { TableView, MatrixView } from './DataTable';

/* ---------------- Indicador de status ---------------- */
export const StatusView = memo(function StatusView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as StatusProps;
  const rows = useRows(comp, undefined, p.mode === 'counts' ? p.field : undefined);
  const rules = useRules();
  const { emit, active } = useEmit(comp);
  if (p.mode === 'element') {
    const t = getTable(comp.data!.dataset, comp.data!.table);
    const r = applyRules(t.rows, rules.filter((x) => x.table === t.id)).find((x) => x.id === p.element || x.nome === p.element);
    if (!r) return <Empty text="Elemento não encontrado" hint={p.element} />;
    const s = String(r.status);
    return (
      <div className={`vz-elstatus vz-elstatus--${s}`}>
        <div className="vz-elstatus-main"><StatusDot s={s} size={12} /><b>{STATUS_LABEL[s]}</b><span className="bw-mono">{String(r.id)}</span></div>
        <div className="vz-elstatus-kv">
          <span>Utilização <b className="bw-num">{fmt(r.utilizacao, 'pct')}</b></span><span>Disponib. <b className="bw-num">{fmt(r.disponibilidade, 'pct')}</b></span>
          {r.alarmes != null && <span>Alarmes <b className="bw-num">{String(r.alarmes)}</b></span>}{r.tecnologia != null && <span>{String(r.tecnologia)}</span>}
        </div>
      </div>
    );
  }
  const counts = STATUS_ORDER.map((s) => ({ s, n: rows.filter((r) => r[p.field] === s).length })).filter((c) => c.n > 0 || c.s === 'normal');
  const total = rows.length || 1;
  return (
    <div className="vz-status-counts">
      <div className="vz-status-bar" aria-hidden="true">{counts.map((c) => <i key={c.s} className={`vz-bg--${c.s}`} style={{ flex: c.n / total }} />)}</div>
      <div className="vz-status-items">
        {counts.map((c) => (
          <button key={c.s} type="button" aria-pressed={active === c.s} className={active !== undefined && active !== c.s ? 'is-dim' : undefined} onClick={() => emit(p.field, c.s, `Status: ${STATUS_LABEL[c.s]}`)}>
            <StatusDot s={c.s} /><span>{STATUS_LABEL[c.s]}</span><b className="bw-num">{c.n.toLocaleString('pt-BR')}</b>
          </button>
        ))}
      </div>
    </div>
  );
});

/* ---------------- Linha do tempo ---------------- */
export const TimelineView = memo(function TimelineView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as TimelineProps;
  const rows = useRows(comp);
  const [ref, size] = useSize<HTMLDivElement>();
  const { emit, active } = useEmit(comp);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const gf = fieldOf(comp, p.groupBy);
  const { days, groups, max } = useMemo(() => {
    const cnt = new Map<string, number>();
    for (const r of rows) cnt.set(String(r[p.groupBy]), (cnt.get(String(r[p.groupBy])) ?? 0) + 1);
    const top = [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    const groups = [...top, ...(cnt.size > 5 ? ['Outros'] : [])];
    const days = Array.from({ length: p.days }, (_, i) => ({ d: NOW_DAY - (p.days - 1 - i) * 86_400_000, by: new Map<string, number>(), items: [] as Row[] }));
    for (const r of rows) {
      const d = Math.floor(Number(r[p.dateField]) / 86_400_000) * 86_400_000;
      const slot = days.find((x) => x.d === d);
      if (!slot) continue;
      const g = top.includes(String(r[p.groupBy])) ? String(r[p.groupBy]) : 'Outros';
      slot.by.set(g, (slot.by.get(g) ?? 0) + 1);
      slot.items.push(r);
    }
    return { days, groups, max: Math.max(1, ...days.map((x) => [...x.by.values()].reduce((a, b) => a + b, 0))) };
  }, [rows, p]);
  const W = size.w, H = Math.max(10, size.h), L = 24, B = 18, T = 4, bw = (W - L) / days.length;
  const color = (g: string) => (g === 'Outros' ? 'var(--viz-cat-8)' : STATUS_LABEL[g] ? `var(--viz-status-${g})` : `var(--viz-cat-${(groups.indexOf(g) % 7) + 1})`);
  return (
    <div className="vz-chart">
      <div className="vz-legend">{groups.map((g) => <button key={g} type="button" className={active !== undefined && active !== g ? 'is-dim' : undefined} onClick={() => g !== 'Outros' && emit(p.groupBy, g, `${gf?.label}: ${g}`)}><i style={{ background: color(g) }} />{labelOf(g, gf)}</button>)}</div>
      <div className="vz-plot" ref={ref}>
        {W > 0 && (
          <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Linha do tempo de ${rows.length} eventos em ${p.days} dias`}>
            <line x1={L} x2={W} y1={H - B} y2={H - B} className="vz-grid" />
            <text x={L - 4} y={T + 8} textAnchor="end" className="vz-axis">{max}</text>
            {days.map((d, i) => {
              let y = H - B;
              const tot = [...d.by.values()].reduce((a, b) => a + b, 0);
              return (
                <g key={d.d} onMouseMove={(e) => { const r = (e.currentTarget as Element).closest('.vz-chart')!.getBoundingClientRect(); setTip({ x: e.clientX - r.left + 10, y: e.clientY - r.top - 10, text: `${fmt(d.d, 'date')} · ${tot} ${tot === 1 ? 'evento' : 'eventos'}${d.items.length ? ` · ${[...d.by.entries()].map(([g, n]) => `${labelOf(g, gf)} ${n}`).join(', ')}` : ''}` }); }} onMouseLeave={() => setTip(null)}>
                  <rect x={L + i * bw} y={T} width={bw} height={H - B - T} fill="transparent" />
                  {groups.map((g) => { const n = d.by.get(g) ?? 0; if (!n) return null; const h = (n / max) * (H - B - T); y -= h; return <rect key={g} x={L + i * bw + bw * 0.15} y={y} width={bw * 0.7} height={h} className="vz-grow-y" style={{ fill: color(g), opacity: active !== undefined && active !== g ? 0.25 : 1, ['--i' as string]: i }} />; })}
                  {(i % Math.max(1, Math.ceil(44 / bw)) === 0 || i === days.length - 1) && <text x={L + i * bw + bw / 2} y={H - 4} textAnchor="middle" className="vz-axis">{fmt(d.d, 'date')}</text>}
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {tip && <Tip x={tip.x} y={tip.y}>{tip.text}</Tip>}
    </div>
  );
});

/* ---------------- Filtro e segmentação ---------------- */
export { FilterView } from './FilterWidgets';
import { useOptions } from './FilterWidgets';
export const SlicerView = memo(function SlicerView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as SlicerProps;
  const sel = useEditor((s) => s.filterValues[comp.id]) ?? [];
  const { values, counts } = useOptions(comp, p.field);
  const f = fieldOf(comp, p.field);
  const setSel = (v: unknown[]) => useEditor.getState().setFilter(comp.id, v);
  return (
    <div className={`vz-slicer vz-slicer--${p.orientation}`} role="group" aria-label={f?.label}>
      {values.slice(0, 24).map((v) => {
        const on = sel.includes(v);
        return (
          <button key={String(v)} type="button" aria-pressed={on} onClick={() => setSel(p.multi ? (on ? sel.filter((x) => x !== v) : [...sel, v]) : on ? [] : [v])}>
            {(p.field === 'status' || p.field === 'severidade') && <StatusDot s={String(v)} />}
            {labelOf(v, f)}{p.showCounts && <span className="bw-num">{(counts.get(v) ?? 0).toLocaleString('pt-BR')}</span>}
          </button>
        );
      })}
    </div>
  );
});

/* ---------------- Texto, imagem, card, container ---------------- */
export const TextView = memo(function TextView({ comp, editing }: { comp: Comp; editing: boolean }) {
  const p = comp.props as unknown as TextProps;
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
  const cls = `vz-text vz-text--${p.size} vz-text--${p.weight} vz-text--${p.tone ?? 'title'}`;
  if (editing) return <textarea ref={ref} className={`${cls} vz-text-edit`} style={{ textAlign: p.align }} defaultValue={p.text} aria-label="Texto"
    onBlur={(e) => { const v = e.currentTarget.value; if (v !== p.text) useEditor.getState().update(comp.id, (c) => { c.props.text = v; c.name = v.slice(0, 40) || 'Texto'; }, 'Editar texto'); useEditor.getState().set({ interactive: null }); }}
    onKeyDown={(e) => { if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) e.currentTarget.blur(); e.stopPropagation(); }} />;
  return <div className={cls} style={{ textAlign: p.align }}>{p.text}</div>;
});
export const ImageView = memo(function ImageView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as ImageProps;
  return <img className="vz-image" src={p.src.startsWith('data:') ? p.src : asset(p.src)} alt={p.alt} style={{ objectFit: p.fit }} draggable={false} />;
});
export const CardView = memo(function CardView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as CardProps;
  const nav = comp.interactions.navigateTo;
  const pageName = useEditor((s) => s.doc?.pages.find((x) => x.id === nav)?.name);
  return (
    <div className={`vz-card vz-card--${p.icon}`}>
      <Icon name={p.icon} size={16} className="vz-card-ico" />
      <p>{p.body}</p>
      {nav && pageName && <button type="button" className="vz-card-link" onClick={() => useEditor.getState().goPage(nav)}>Abrir {pageName} <Icon name="arrowRight" size={12} /></button>}
    </div>
  );
});
