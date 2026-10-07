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

const NOW_DAY = Math.floor(Date.UTC(2026, 9, 6) / 86_400_000) * 86_400_000;

/* ---------------- KPI ---------------- */
export const KpiView = memo(function KpiView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as KpiProps;
  const rows = useRows(comp);
  const hist = useRows(comp, 'historico');
  const mf = fieldOf(comp, p.measure);
  const value = useMemo(() => aggregate(rows, { ds: comp.data!.dataset, table: comp.data!.table, measure: p.measure, agg: p.agg })[0]!.value, [rows, p.measure, p.agg, comp.data]);
  const spark = useMemo(() => (p.spark && p.sparkMeasure ? aggregate(hist, { ds: comp.data!.dataset, table: 'historico', groupBy: 'dia', measure: p.sparkMeasure, agg: 'avg' }).map((s) => s.value) : []), [hist, p.spark, p.sparkMeasure, comp.data]);
  const fmtV = (v: number) => fmt(v, aggFormat(p.agg, mf), true);
  const hasT = p.compare === 'target' && p.target != null;
  const ok = hasT && (p.targetDir === 'above' ? value >= p.target! : value <= p.target!);
  const [ref, size] = useSize<HTMLDivElement>();
  return (
    <div className="vz-kpi" ref={ref}>
      <div className="vz-kpi-value bw-num">{fmtV(value)}</div>
      {hasT ? (
        <div className={`vz-kpi-delta ${ok ? 'is-ok' : 'is-bad'}`}>{ok ? '✓' : p.targetDir === 'above' ? '▼' : '▲'} {ok ? 'dentro da meta' : 'fora da meta'} <span>meta {p.targetDir === 'above' ? '≥' : '≤'} {fmtV(p.target!)}</span></div>
      ) : <div className="vz-kpi-delta"><span>{AGG_LABEL[p.agg].toLowerCase()} de {rows.length.toLocaleString('pt-BR')} {rows.length === 1 ? 'linha' : 'linhas'}</span></div>}
      {spark.length > 1 && size.w > 60 && size.h - 54 >= 10 && <Spark values={spark} w={size.w} h={Math.min(40, size.h - 54)} ok={!hasT || ok} />}
    </div>
  );
});
function Spark({ values, w, h, ok }: { values: number[]; w: number; h: number; ok: boolean }) {
  const mn = Math.min(...values), mx = Math.max(...values), sp = mx - mn || 1;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)} ${(h - 2 - ((v - mn) / sp) * (h - 4)).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} className="vz-spark" aria-hidden="true"><path d={d} style={{ fill: 'none', stroke: ok ? 'var(--viz-cat-1)' : 'var(--dash-negative)', strokeWidth: 1.5 }} /></svg>;
}

/* ---------------- Tabela virtualizada ---------------- */
export const TableView = memo(function TableView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as TableProps;
  const rows = useRows(comp);
  const t = getTable(comp.data!.dataset, comp.data!.table);
  const [sort, setSort] = useState<[string | undefined, 'asc' | 'desc']>([p.sortBy, p.sortDir]);
  useEffect(() => setSort([p.sortBy, p.sortDir]), [p.sortBy, p.sortDir]);
  const sorted = useMemo(() => {
    const [k, dir] = sort;
    if (!k) return rows;
    const m = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (k === 'status' ? (STATUS_ORDER.indexOf(String(a[k])) - STATUS_ORDER.indexOf(String(b[k]))) * m : typeof a[k] === 'number' ? ((a[k] as number) - (b[k] as number)) * m : String(a[k]).localeCompare(String(b[k]), 'pt-BR') * m));
  }, [rows, sort]);
  const list = p.rowLimit ? sorted.slice(0, p.rowLimit) : sorted;
  const [ref, size] = useSize<HTMLDivElement>();
  const [top, setTop] = useState(0);
  const rh = p.density === 'compact' ? 26 : 32;
  const first = Math.max(0, Math.floor(top / rh) - 6), last = Math.min(list.length, Math.ceil((top + size.h) / rh) + 6);
  const { emit, active: crossActive } = useEmit(comp);
  const pickedId = useEditor((s) => s.picked?.id);
  const active = crossActive ?? pickedId;
  const cols = p.columns.map((c) => t.fields.find((f) => f.name === c)).filter((f): f is NonNullable<typeof f> => !!f);
  if (!cols.length) return <Empty text="Sem colunas" hint="Adicione campos na aba Dados" />;
  const tpl = cols.map((c) => (c.name === 'nome' || c.name === 'elementoNome' ? 'minmax(120px, 2fr)' : c.kind === 'measure' ? 'minmax(52px, .8fr)' : 'minmax(60px, 1fr)')).join(' ');
  return (
    <div className="vz-table" role="table" aria-label={comp.style.title || 'Tabela'} aria-rowcount={list.length}>
      <div className="vz-tr vz-th" role="row" style={{ gridTemplateColumns: tpl }}>
        {cols.map((c) => (
          <button key={c.name} type="button" role="columnheader" aria-sort={sort[0] === c.name ? (sort[1] === 'asc' ? 'ascending' : 'descending') : 'none'} className={c.kind === 'measure' ? 'is-num' : undefined}
            onClick={() => setSort(([k, d]) => [c.name, k === c.name && d === 'desc' ? 'asc' : 'desc'])}>
            {c.label}{sort[0] === c.name && <span aria-hidden="true">{sort[1] === 'asc' ? ' ↑' : ' ↓'}</span>}
          </button>
        ))}
      </div>
      <div className="vz-tbody" ref={ref} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
        {list.length === 0 ? <Empty text="Nenhuma linha" hint="Os filtros atuais não deixaram nenhuma linha" /> : (
          <div style={{ height: list.length * rh, position: 'relative' }}>
            {list.slice(first, last).map((r, i) => {
              const key = r[t.key];
              return (
                <div key={String(key)} role="row" className={`vz-tr${r._highlight ? ' is-hl' : ''}${active === key ? ' is-active' : ''}`} style={{ gridTemplateColumns: tpl, height: rh, transform: `translateY(${(first + i) * rh}px)` }}
                  onClick={() => { const el = t.id === 'eventos' ? String(r.elemento) : String(key); const st = useEditor.getState(); if (t.id === 'enlaces' || t.id === 'nos' || t.id === 'eventos') st.set({ picked: st.picked?.id === el ? null : { comp: comp.id, kind: t.id === 'nos' ? 'node' : 'link', id: el } }); else emit(t.key, key, `${t.name}: ${String(r.nome ?? key)}`); }}>
                  {cols.map((c) => <Cell key={c.name} r={r} f={c} statusColors={p.statusColors} />)}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="vz-tfoot">{list.length.toLocaleString('pt-BR')} {list.length === 1 ? 'linha' : 'linhas'}{rows.length !== t.rows.length && ` de ${t.rows.length.toLocaleString('pt-BR')}`}</div>
    </div>
  );
});
function Cell({ r, f, statusColors }: { r: Row; f: { name: string; kind: string; format?: Parameters<typeof fmt>[1] }; statusColors: boolean }) {
  const v = r[f.name];
  if ((f.name === 'status' || f.name === 'severidade') && typeof v === 'string') {
    return <span role="cell" className="vz-td vz-status">{statusColors && <StatusDot s={v} />}{STATUS_LABEL[v] ?? v}{r._label ? <em className="vz-rule-tag" title={(r._rules as string[] | undefined)?.join(', ')}>{String(r._label)}</em> : r._statusOriginal ? <em className="vz-rule-tag" title={`Regra: ${(r._rules as string[]).join(', ')}`}>regra</em> : null}{r._alert ? <Icon name="warning" size={12} className="vz-alert" /> : null}</span>;
  }
  return <span role="cell" className={`vz-td${f.kind === 'measure' ? ' is-num' : ''}`} title={typeof v === 'string' ? v : undefined}>{fmt(v, f.format)}</span>;
}

/* ---------------- Matriz ---------------- */
export const MatrixView = memo(function MatrixView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as MatrixProps;
  const rows = useRows(comp);
  const ds = comp.data!.dataset, tb = comp.data!.table;
  const { emit, active } = useEmit(comp);
  const cells = useMemo(() => aggregate(rows, { ds, table: tb, groupBy: p.rows, series: p.cols, measure: p.measure, agg: p.agg, sort: 'label' }), [rows, p, ds, tb]);
  const rf = fieldOf(comp, p.rows), cf = fieldOf(comp, p.cols), mf = fieldOf(comp, p.measure);
  const rk = [...new Set(cells.map((c) => String(c.key)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ck = [...new Set(cells.map((c) => c.series!))].sort((a, b) => (p.cols === 'status' ? STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b) : a.localeCompare(b, 'pt-BR')));
  const get = (r: string, c: string) => cells.find((x) => String(x.key) === r && x.series === c)?.value;
  const max = Math.max(...cells.map((c) => c.value), 1);
  const f = (v?: number) => (v == null ? '' : fmt(v, aggFormat(p.agg, mf), true));
  const tot = (vs: (number | undefined)[]) => { const xs = vs.filter((v): v is number => v != null); return p.agg === 'avg' ? xs.reduce((a, b) => a + b, 0) / (xs.length || 1) : p.agg === 'max' ? Math.max(...xs) : p.agg === 'min' ? Math.min(...xs) : xs.reduce((a, b) => a + b, 0); };
  if (!rk.length) return <Empty text="Nada para mostrar" />;
  return (
    <div className="vz-matrix-wrap">
      <table className="vz-matrix">
        <thead><tr><th>{rf?.label}</th>{ck.map((c) => <th key={c} className="is-num">{labelOf(c, cf)}</th>)}{p.totals && <th className="is-num">Total</th>}</tr></thead>
        <tbody>
          {rk.map((r) => (
            <tr key={r} className={active !== undefined && active !== r ? 'is-dim' : undefined} onClick={() => emit(p.rows, r, `${rf?.label}: ${r}`)}>
              <th>{labelOf(r, rf)}</th>
              {ck.map((c) => { const v = get(r, c); const t = v == null ? 0 : v / max; return <td key={c} className="is-num" style={p.heat && v != null ? { background: `color-mix(in srgb, var(--viz-seq-5) ${Math.round(8 + t * 62)}%, transparent)`, color: t > 0.55 ? 'var(--viz-tooltip-text)' : undefined } : undefined}>{f(v)}</td>; })}
              {p.totals && <td className="is-num is-total">{f(tot(ck.map((c) => get(r, c))))}</td>}
            </tr>
          ))}
        </tbody>
        {p.totals && <tfoot><tr><th>Total</th>{ck.map((c) => <td key={c} className="is-num">{f(tot(rk.map((r) => get(r, c))))}</td>)}<td className="is-num">{f(tot(cells.map((x) => x.value)))}</td></tr></tfoot>}
      </table>
    </div>
  );
});

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
function useOptions(comp: Comp, field: string) {
  const values = useMemo(() => distinct(comp.data!.dataset, comp.data!.table, field), [comp.data, field]);
  const rows = useRows(comp, undefined, field);
  const counts = useMemo(() => { const m = new Map<unknown, number>(); for (const r of rows) m.set(r[field], (m.get(r[field]) ?? 0) + 1); return m; }, [rows, field]);
  return { values, counts };
}
export const FilterView = memo(function FilterView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as FilterProps;
  const sel = useEditor((s) => s.filterValues[comp.id]) ?? p.defaultValues ?? [];
  const { values, counts } = useOptions(comp, p.field);
  const [q, setQ] = useState('');
  const f = fieldOf(comp, p.field);
  const setSel = (v: unknown[]) => useEditor.getState().setFilter(comp.id, v);
  const label = sel.length === 0 ? 'Todos' : sel.length === 1 ? labelOf(sel[0], f) : `${sel.length} selecionados`;
  return (
    <div className="vz-filter">
      <DialogTrigger>
        <AriaButton className="bw-select vz-filter-btn" aria-label={`${f?.label ?? p.field}: ${label}`}><span className={sel.length ? undefined : 'bw-muted'}>{label}</span><Icon name="chevronDown" size={12} /></AriaButton>
        <Popover className="bw-menu vz-filter-pop" placement="bottom start" offset={4}>
          <AriaDialog aria-label={`Filtrar ${f?.label}`} className="vz-filter-dialog">
            <input className="vz-filter-q" placeholder={`Buscar ${f?.label?.toLowerCase() ?? ''}`} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <div className="vz-filter-list">
              {values.filter((v) => !q || labelOf(v, f).toLowerCase().includes(q.toLowerCase())).map((v) => {
                const on = sel.includes(v);
                return (
                  <button key={String(v)} type="button" role="menuitemcheckbox" aria-checked={on} className="vz-filter-opt" onClick={() => setSel(p.multi ? (on ? sel.filter((x) => x !== v) : [...sel, v]) : on ? [] : [v])}>
                    <span className="bw-checkbox" aria-hidden="true">{on && <svg viewBox="0 0 10 10"><path d="M1.5 5.2l2.3 2.3L8.5 2.8" /></svg>}</span>
                    <span className="vz-filter-lbl">{labelOf(v, f)}</span><span className="bw-num bw-muted">{counts.get(v) ?? 0}</span>
                  </button>
                );
              })}
            </div>
            {sel.length > 0 && <button type="button" className="vz-filter-clear" onClick={() => setSel([])}>Limpar seleção</button>}
          </AriaDialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
});
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
