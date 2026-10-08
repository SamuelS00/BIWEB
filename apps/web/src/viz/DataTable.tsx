import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger, Popover } from 'react-aria-components';
import { Icon } from '@biweb/ui';
import { aggFormat, aggregate, calcValue, fmt, labelOf, STATUS_LABEL, STATUS_ORDER } from '../data/query';
import { getTable } from '../data/registry';
import type { Field, Row } from '../data/types';
import type { Comp, MatrixProps, TableProps } from '../editor/doc';
import { useEditor } from '../editor/store';
import { useEmit } from './Chart';
import { cfFor, evalCf, TONE_VAR, type CfResult } from './cf';
import { Empty, fieldOf, StatusDot, useRows, useSize } from './common';
import { inWindow, maxDate, periodWindow, dateFieldOf } from './engine/model';
import { StateOverlay, useLiveTick } from './states';
import { exportRowsCsv } from './export';

/** Aggregate for a measure column in the footer / group header: ratios of sums for calculated fields, mean for percentages, sum otherwise. */
const colTotal = (rows: Row[], f: Field): number | null => {
  if (f.kind !== 'measure' || !rows.length) return null;
  if (f.calc) { const n = rows.reduce((a, r) => a + Number(r[f.calc!.num] ?? 0), 0), d = rows.reduce((a, r) => a + Number(r[f.calc!.den] ?? 0), 0); return calcValue(f.calc, n, d); }
  const vals = rows.map((r) => Number(r[f.name])).filter(Number.isFinite);
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return f.format === 'pct' || f.format === 'db' || f.format === 'ms' || f.name.startsWith('prob') || f.name === 'nps' ? sum / vals.length : sum;
};
const cmpRows = (a: Row, b: Row, k: string, dir: 1 | -1) => (k === 'status' ? (STATUS_ORDER.indexOf(String(a[k])) - STATUS_ORDER.indexOf(String(b[k]))) * dir : typeof a[k] === 'number' ? ((a[k] as number) - (b[k] as number)) * dir : String(a[k] ?? '').localeCompare(String(b[k] ?? ''), 'pt-BR') * dir);

function MiniTrend({ values }: { values: number[] }) {
  const mn = Math.min(...values), mx = Math.max(...values), sp = mx - mn || 1, d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * 54 + 1).toFixed(1)} ${(14 - ((v - mn) / sp) * 12).toFixed(1)}`).join('');
  return <svg width="56" height="16" aria-hidden="true"><path d={d} fill="none" style={{ stroke: values.at(-1)! >= values[0]! ? 'var(--viz-cat-1)' : 'var(--viz-status-critical)', strokeWidth: 1.4 }} /></svg>;
}

type SortKey = { field: string; dir: 1 | -1 };
export const TableView = memo(function TableView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as TableProps;
  const live = useLiveTick(p.live), raw = useRows(comp);
  const t = getTable(comp.data!.dataset, comp.data!.table);
  // calculated fields are evaluated per row so that sorting, formatting and totals see real values
  const rows = useMemo(() => { const calcs = p.columns.map((c) => t.fields.find((f) => f.name === c)).filter((f): f is Field => !!f?.calc); return calcs.length ? raw.map((r) => { const o: Row = { ...r }; for (const f of calcs) o[f.name] = calcValue(f.calc!, Number(r[f.calc!.num] ?? 0), Number(r[f.calc!.den] ?? 0)); return o; }) : raw; }, [raw, p.columns, t]);
  const [sort, setSort] = useState<SortKey[]>(p.sortBy ? [{ field: p.sortBy, dir: p.sortDir === 'asc' ? 1 : -1 }] : []);
  useEffect(() => setSort(p.sortBy ? [{ field: p.sortBy, dir: p.sortDir === 'asc' ? 1 : -1 }] : []), [p.sortBy, p.sortDir]);
  const [q, setQ] = useState(''), [off, setOff] = useState<string[]>([]), [widths, setWidths] = useState<Record<string, number>>({}), [closed, setClosed] = useState<Set<string>>(new Set());
  const allCols = p.columns.map((c) => t.fields.find((f) => f.name === c)).filter((f): f is Field => !!f);
  const cols = allCols.filter((c) => !off.includes(c.name));
  const filtered = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter((r) => cols.some((c) => typeof r[c.name] === 'string' && String(r[c.name]).toLowerCase().includes(s))) : rows; }, [rows, q, cols]);
  const sorted = useMemo(() => (sort.length ? [...filtered].sort((a, b) => { for (const s of sort) { const c = cmpRows(a, b, s.field, s.dir); if (c) return c; } return 0; }) : filtered), [filtered, sort]);
  const list = p.rowLimit ? sorted.slice(0, p.rowLimit) : sorted;
  const groupField = p.groupBy ? t.fields.find((f) => f.name === p.groupBy) : undefined;
  const flat = useMemo(() => {
    if (!groupField) return list.map((r) => ({ kind: 'row' as const, r }));
    const m = new Map<string, Row[]>();
    for (const r of list) { const k = String(r[groupField.name]); (m.get(k) ?? m.set(k, []).get(k)!).push(r); }
    return [...m.entries()].flatMap(([k, rs]) => [{ kind: 'group' as const, k, rs }, ...(closed.has(k) ? [] : rs.map((r) => ({ kind: 'row' as const, r })))]);
  }, [list, groupField, closed]);
  const ranges = useMemo(() => Object.fromEntries(cols.filter((c) => cfFor(p.cf, c.name)).map((c) => { const v = list.map((r) => Number(r[c.name])).filter(Number.isFinite); return [c.name, { min: Math.min(...v, 0), max: Math.max(...v, 1) }]; })), [cols, list, p.cf]);
  const trend = useMemo(() => { if (!p.trend || t.id !== 'enlaces') return null; const h = getTable(comp.data!.dataset, 'historico'), m = new Map<string, number[]>(); for (const r of h.rows) { const k = String(r.enlace); (m.get(k) ?? m.set(k, []).get(k)!).push(Number(r[p.trend.measure])); } return m; }, [p.trend, t.id, comp.data]);
  const [ref, size] = useSize<HTMLDivElement>();
  const [top, setTop] = useState(0);
  const rh = p.density === 'compact' ? 26 : 32;
  const first = Math.max(0, Math.floor(top / rh) - 6), last = Math.min(flat.length, Math.ceil((top + size.h) / rh) + 6);
  const { emit, active: crossActive } = useEmit(comp);
  const pickedId = useEditor((s) => s.picked?.id);
  const active = crossActive ?? pickedId;
  const prevLive = useRef(0);
  useEffect(() => { prevLive.current = live; });
  if (!cols.length) return <Empty text="Sem colunas" hint="Adicione campos na aba Dados" />;
  const tpl = [...cols.map((c) => (widths[c.name] ? `${widths[c.name]}px` : c.name === 'nome' || c.name === 'elementoNome' || c.name === 'loja' || c.name === 'linha' ? 'minmax(130px, 2fr)' : c.kind === 'measure' ? 'minmax(70px, .9fr)' : 'minmax(70px, 1fr)')), ...(trend ? ['64px'] : [])].join(' ');
  const toggleSort = (f: string, multi: boolean) => setSort((s) => { const cur = s.find((x) => x.field === f); const next: SortKey = { field: f, dir: cur ? (cur.dir === -1 ? 1 : -1) : -1 }; return multi ? [...s.filter((x) => x.field !== f), next] : [next]; });
  const startResize = (e: React.PointerEvent, name: string) => {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement!, x0 = e.clientX, w0 = th.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => setWidths((w) => ({ ...w, [name]: Math.max(56, Math.round(w0 + ev.clientX - x0)) }));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const rowClick = (r: Row) => { const key = r[t.key], el = t.id === 'eventos' ? String(r.elemento) : String(key), st = useEditor.getState(); if (t.id === 'enlaces' || t.id === 'nos' || t.id === 'eventos') st.set({ picked: st.picked?.id === el ? null : { comp: comp.id, kind: t.id === 'nos' ? 'node' : 'link', id: el } }); else emit(t.key, key, `${t.name}: ${String(r.nome ?? key)}`); };
  const totalsRow = p.totals ? cols.map((c) => colTotal(list, c)) : null;
  const toolbar = p.search || p.columnPicker || p.exportable;
  return (
    <div className="vz-table" role="table" aria-label={comp.style.title || 'Tabela'} aria-rowcount={flat.length}>
      {toolbar && (
        <div className="vz-ttools">
          {p.search && <label className="vz-tsearch"><Icon name="search" size={12} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar na tabela" aria-label="Buscar na tabela" />{q && <button type="button" aria-label="Limpar busca" onClick={() => setQ('')}><Icon name="close" size={12} /></button>}</label>}
          <span className="flex-1" />
          {p.columnPicker && (
            <DialogTrigger>
              <AriaButton className="vz-tbtn" aria-label="Escolher colunas"><Icon name="grid" size={12} />Colunas</AriaButton>
              <Popover className="bw-menu vz-filter-pop" placement="bottom end" offset={4}><AriaDialog aria-label="Colunas visíveis" className="vz-filter-dialog"><div className="vz-filter-list">{allCols.map((c) => { const on = !off.includes(c.name); return <button key={c.name} type="button" role="menuitemcheckbox" aria-checked={on} className="vz-filter-opt" onClick={() => setOff((o) => on ? [...o, c.name] : o.filter((x) => x !== c.name))}><span className="bw-checkbox" aria-hidden="true">{on && <svg viewBox="0 0 10 10"><path d="M1.5 5.2l2.3 2.3L8.5 2.8" /></svg>}</span><span className="vz-filter-lbl">{c.label}</span></button>; })}</div></AriaDialog></Popover>
            </DialogTrigger>
          )}
          {p.exportable && <button type="button" className="vz-tbtn" onClick={() => exportRowsCsv(`${comp.name}.csv`, cols, list)}><Icon name="download" size={12} />CSV</button>}
        </div>
      )}
      <div className="vz-tr vz-th" role="row" style={{ gridTemplateColumns: tpl }}>
        {cols.map((c) => {
          const si = sort.findIndex((s) => s.field === c.name);
          return (
            <div key={c.name} className="vz-thc">
              <button type="button" role="columnheader" aria-sort={si >= 0 ? (sort[si]!.dir === 1 ? 'ascending' : 'descending') : 'none'} className={c.kind === 'measure' ? 'is-num' : undefined} title="Clique para ordenar · Shift+clique para ordenar por várias colunas" onClick={(e) => toggleSort(c.name, e.shiftKey)}>
                {c.label}{si >= 0 && <span aria-hidden="true" className="vz-sortmark">{sort[si]!.dir === 1 ? ' ↑' : ' ↓'}{sort.length > 1 ? <sup>{si + 1}</sup> : null}</span>}
              </button>
              <i className="vz-resize" role="separator" aria-orientation="vertical" aria-label={`Redimensionar ${c.label}`} onPointerDown={(e) => startResize(e, c.name)} onDoubleClick={() => setWidths((w) => { const n = { ...w }; delete n[c.name]; return n; })} />
            </div>
          );
        })}
        {trend && <div className="vz-thc"><span className="vz-tcap">{p.trend!.label ?? 'Tendência'}</span></div>}
      </div>
      <div className="vz-tbody" ref={ref} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
        {flat.length === 0 ? <Empty text="Nenhuma linha" hint={q ? 'A busca não encontrou resultados' : 'Os filtros atuais não deixaram nenhuma linha'} /> : (
          <div style={{ height: flat.length * rh, position: 'relative' }}>
            {flat.slice(first, last).map((it, i) => {
              const y = (first + i) * rh;
              if (it.kind === 'group') {
                const open = !closed.has(it.k);
                return (
                  <div key={`g${it.k}`} role="row" className="vz-tr vz-grp" style={{ gridTemplateColumns: tpl, height: rh, transform: `translateY(${y}px)` }}>
                    {cols.map((c, ci) => ci === 0
                      ? <span key={c.name} role="cell" className="vz-td"><button type="button" className="vz-disc" aria-expanded={open} onClick={() => setClosed((s) => { const n = new Set(s); if (open) n.add(it.k); else n.delete(it.k); return n; })}><Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />{labelOf(it.k, groupField)} <em>{it.rs.length}</em></button></span>
                      : <span key={c.name} role="cell" className={`vz-td${c.kind === 'measure' ? ' is-num' : ''}`}>{c.name === groupField!.name ? '' : colTotal(it.rs, c) != null ? fmt(colTotal(it.rs, c), c.format, true) : ''}</span>)}
                  </div>
                );
              }
              const r = it.r, key = r[t.key], fresh = p.live && r._live === live;
              return (
                <div key={String(key)} role="row" className={`vz-tr${r._highlight ? ' is-hl' : ''}${active === key ? ' is-active' : ''}${fresh ? ' is-fresh' : ''}`} style={{ gridTemplateColumns: tpl, height: rh, transform: `translateY(${y}px)` }} onClick={() => rowClick(r)}>
                  {cols.map((c) => <Cell key={c.name} r={r} f={c} statusColors={p.statusColors} cf={evalCf(cfFor(p.cf, c.name), r[c.name], ranges[c.name] ?? { min: 0, max: 1 })} kindCf={cfFor(p.cf, c.name)?.kind} />)}
                  {trend && <span role="cell" className="vz-td">{trend.get(String(r.id)) && <MiniTrend values={trend.get(String(r.id))!} />}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {totalsRow && <div className="vz-tr vz-tot" role="row" style={{ gridTemplateColumns: tpl }}>{cols.map((c, i) => <span key={c.name} role="cell" className={`vz-td${c.kind === 'measure' ? ' is-num' : ''}`}>{i === 0 ? 'Total' : totalsRow[i] != null ? fmt(totalsRow[i], c.format, true) : ''}</span>)}{trend && <span />}</div>}
      <div className="vz-tfoot">{list.length.toLocaleString('pt-BR')} {list.length === 1 ? 'linha' : 'linhas'}{rows.length !== t.rows.length && ` de ${t.rows.length.toLocaleString('pt-BR')}`}{sort.length > 1 && ` · ordenado por ${sort.length} colunas`}<StateOverlay state={p.state} comp={comp} /></div>
    </div>
  );
});

function Cell({ r, f, statusColors, cf, kindCf }: { r: Row; f: Field; statusColors: boolean; cf: CfResult; kindCf?: string }) {
  const v = r[f.name];
  if ((f.name === 'status' || f.name === 'severidade') && typeof v === 'string') {
    return <span role="cell" className="vz-td vz-status">{statusColors && <StatusDot s={v} />}{STATUS_LABEL[v] ?? v}{r._label ? <em className="vz-rule-tag" title={(r._rules as string[] | undefined)?.join(', ')}>{String(r._label)}</em> : r._statusOriginal ? <em className="vz-rule-tag" title={`Regra: ${(r._rules as string[]).join(', ')}`}>regra</em> : null}{r._alert ? <Icon name="warning" size={12} className="vz-alert" /> : null}</span>;
  }
  const style: React.CSSProperties = cf.heat != null ? { background: `color-mix(in srgb, var(--viz-seq-5) ${Math.round(8 + cf.heat * 62)}%, transparent)` } : cf.tone && kindCf === 'rules' ? { background: `color-mix(in srgb, ${TONE_VAR[cf.tone]} 16%, transparent)`, color: TONE_VAR[cf.tone], fontWeight: 600 } : {};
  return (
    <span role="cell" className={`vz-td${f.kind === 'measure' ? ' is-num' : ''}${cf.pct != null ? ' has-bar' : ''}`} style={style} title={typeof v === 'string' ? v : undefined}>
      {cf.pct != null && <i className="vz-cfbar" style={{ width: `${cf.pct * 100}%` }} />}
      {cf.icon && cf.tone && <b className="vz-cficon" style={{ color: TONE_VAR[cf.tone] }} aria-label={cf.tone}>{cf.icon}</b>}
      <span className="vz-cftxt">{fmt(v, f.format, true)}</span>
    </span>
  );
}

/* ---------------- Matriz com hierarquia, totais e formatação condicional ---------------- */
export const MatrixView = memo(function MatrixView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as MatrixProps;
  const all = useRows(comp);
  const ds = comp.data!.dataset, tb = comp.data!.table;
  const dateName = dateFieldOf(ds, tb)?.name, periodic = !!p.period && p.period !== 'all' && !!dateName;
  const rows = useMemo(() => (periodic ? inWindow(all, dateName!, periodWindow(p.period, maxDate(ds, tb, dateName!))) : all), [all, periodic, p.period, dateName, ds, tb]);
  const { emit, active } = useEmit(comp, p.rows);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const hier = p.rowHier && p.rowHier.length > 1 ? p.rowHier : null, topField = hier ? hier[0]! : p.rows, childField = hier ? hier[1]! : null;
  const cells = useMemo(() => aggregate(rows, { ds, table: tb, groupBy: topField, series: p.cols, measure: p.measure, agg: p.agg, sort: 'label' }), [rows, p, ds, tb, topField]);
  const rf = fieldOf(comp, topField), cf = fieldOf(comp, p.cols), mf = fieldOf(comp, p.measure), cff = cfFor(p.cf, p.measure);
  const rk = [...new Set(cells.map((c) => String(c.key)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ck = [...new Set(cells.map((c) => c.series!))].sort((a, b) => (p.cols === 'status' ? STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b) : a.localeCompare(b, 'pt-BR')));
  const get = (r: string, c: string) => cells.find((x) => String(x.key) === r && x.series === c)?.value;
  const max = Math.max(...cells.map((c) => c.value), 1), min = Math.min(...cells.map((c) => c.value), 0);
  const f = (v?: number) => (v == null ? '' : fmt(v, aggFormat(p.agg, mf), true));
  const totals = (vs: (number | undefined)[]) => { const xs = vs.filter((v): v is number => v != null); if (!xs.length) return undefined; return p.agg === 'avg' || mf?.format === 'pct' ? xs.reduce((a, b) => a + b, 0) / xs.length : p.agg === 'max' ? Math.max(...xs) : p.agg === 'min' ? Math.min(...xs) : xs.reduce((a, b) => a + b, 0); };
  const cellStyle = (v?: number): React.CSSProperties => { if (v == null) return {}; const r = cff ? evalCf(cff, v, { min, max }) : { heat: p.heat ? (v - min) / (max - min || 1) : undefined } as CfResult; if (r.heat != null) return { background: `color-mix(in srgb, var(--viz-seq-5) ${Math.round(8 + r.heat * 62)}%, transparent)`, color: r.heat > 0.6 ? 'var(--on-seq, #fff)' : undefined }; if (r.tone) return { background: `color-mix(in srgb, ${TONE_VAR[r.tone]} 18%, transparent)`, color: TONE_VAR[r.tone], fontWeight: 600 }; return {}; };
  const childRows = (parent: string) => { const sub = aggregate(rows.filter((r) => String(r[topField]) === parent), { ds, table: tb, groupBy: childField!, series: p.cols, measure: p.measure, agg: p.agg, sort: 'label' }); const keys = [...new Set(sub.map((c) => String(c.key)))].sort((a, b) => a.localeCompare(b, 'pt-BR')); return { keys, val: (k: string, c: string) => sub.find((x) => String(x.key) === k && x.series === c)?.value }; };
  if (!rk.length) return <Empty text="Nada para mostrar" />;
  const expandAll = () => setOpen(open.size ? new Set() : new Set(rk));
  return (
    <div className="vz-matrix-wrap">
      <table className="vz-matrix">
        <thead><tr><th>{hier && <button type="button" className="vz-disc" onClick={expandAll} aria-label={open.size ? 'Recolher tudo' : 'Expandir tudo'}><Icon name={open.size ? 'chevronDown' : 'chevronRight'} size={12} /></button>}{rf?.label}</th>{ck.map((c) => <th key={c} className="is-num">{labelOf(c, cf)}</th>)}{p.totals && <th className="is-num">Total</th>}</tr></thead>
        <tbody>
          {rk.flatMap((r) => {
            const isOpen = open.has(r), head = (
              <tr key={r} className={active !== undefined && active !== r ? 'is-dim' : undefined} onClick={() => emit(topField, r, `${rf?.label}: ${r}`)}>
                <th>{hier && <button type="button" className="vz-disc" aria-expanded={isOpen} onClick={(e) => { e.stopPropagation(); setOpen((s) => { const n = new Set(s); if (isOpen) n.delete(r); else n.add(r); return n; }); }}><Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={12} /></button>}{labelOf(r, rf)}</th>
                {ck.map((c) => { const v = get(r, c); return <td key={c} className="is-num" style={cellStyle(v)}>{f(v)}</td>; })}
                {p.totals && <td className="is-num is-total">{f(totals(ck.map((c) => get(r, c))))}</td>}
              </tr>);
            if (!hier || !isOpen) return [head];
            const sub = childRows(r);
            return [head, ...sub.keys.map((k) => <tr key={`${r}/${k}`} className="vz-sub"><th>{k}</th>{ck.map((c) => { const v = sub.val(k, c); return <td key={c} className="is-num" style={cellStyle(v)}>{f(v)}</td>; })}{p.totals && <td className="is-num is-total">{f(totals(ck.map((c) => sub.val(k, c))))}</td>}</tr>)];
          })}
        </tbody>
        {p.totals && <tfoot><tr><th>Total</th>{ck.map((c) => <td key={c} className="is-num">{f(totals(rk.map((r) => get(r, c))))}</td>)}<td className="is-num">{f(totals(cells.map((x) => x.value)))}</td></tr></tfoot>}
      </table>
    </div>
  );
});
