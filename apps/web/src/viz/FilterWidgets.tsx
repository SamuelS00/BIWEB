import { memo, useMemo, useState } from 'react';
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger, Popover } from 'react-aria-components';
import { Icon } from '@biweb/ui';
import { distinct, labelOf } from '../data/query';
import { getTable } from '../data/registry';
import type { Comp, FilterProps } from '../editor/doc';
import { useEditor } from '../editor/store';
import { fieldOf } from './common';
import { RELATIVE } from './filterOps';
import { useRows } from './common';

export function useOptions(comp: Comp, field: string) {
  const values = useMemo(() => distinct(comp.data!.dataset, comp.data!.table, field), [comp.data, field]);
  const rows = useRows(comp, undefined, field);
  const counts = useMemo(() => { const m = new Map<unknown, number>(); for (const r of rows) m.set(r[field], (m.get(r[field]) ?? 0) + 1); return m; }, [rows, field]);
  return { values, counts };
}

const dayStr = (ts?: unknown) => (typeof ts === 'number' ? new Date(ts).toISOString().slice(0, 10) : '');
const parseDay = (s: string) => { const t = Date.parse(`${s}T00:00:00Z`); return Number.isFinite(t) ? t : undefined; };

/** One filter widget, many shapes: list, search, numeric range, date range, relative window or a hierarchy (region › state › city). */
export const FilterView = memo(function FilterView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as FilterProps;
  const sel = useEditor((s) => s.filterValues[comp.id]) ?? p.defaultValues ?? [];
  const setSel = (v: unknown[]) => useEditor.getState().setFilter(comp.id, v);
  const f = fieldOf(comp, p.field);
  switch (p.style) {
    case 'search': return <div className="vz-filter"><label className="vz-fsearch"><Icon name="search" size={12} /><input value={String(sel[0] ?? '')} placeholder={`Buscar ${f?.label?.toLowerCase() ?? ''}`} aria-label={`Buscar ${f?.label}`} onChange={(e) => setSel(e.target.value ? [e.target.value] : [])} />{sel.length > 0 && <button type="button" aria-label="Limpar" onClick={() => setSel([])}><Icon name="close" size={12} /></button>}</label></div>;
    case 'range': return <RangeFilter comp={comp} p={p} sel={sel as number[]} setSel={setSel} />;
    case 'daterange': return <div className="vz-filter vz-frange"><input type="date" aria-label="De" value={dayStr(sel[0])} onChange={(e) => { const lo = parseDay(e.target.value); setSel(lo == null && sel[1] == null ? [] : [lo, sel[1]]); }} /><span>até</span><input type="date" aria-label="Até" value={dayStr(sel[1])} onChange={(e) => { const hi = parseDay(e.target.value); setSel(hi == null && sel[0] == null ? [] : [sel[0], hi]); }} />{sel.length > 0 && <button type="button" aria-label="Limpar datas" onClick={() => setSel([])}><Icon name="close" size={12} /></button>}</div>;
    case 'relative': return <div className="vz-filter"><div className="vz-chips" role="radiogroup" aria-label="Janela de tempo">{RELATIVE.map((r) => <button key={r.id} type="button" role="radio" aria-checked={sel[0] === r.id || (!sel.length && r.id === 'all')} onClick={() => setSel(r.id === 'all' ? [] : [r.id])}>{r.label.replace('Últimos ', '')}</button>)}</div></div>;
    case 'hierarchy': return <HierarchyFilter comp={comp} p={p} sel={sel} setSel={setSel} />;
    default: return <ListFilter comp={comp} p={p} sel={sel} setSel={setSel} />;
  }
});

function ListFilter({ comp, p, sel, setSel }: { comp: Comp; p: FilterProps; sel: unknown[]; setSel: (v: unknown[]) => void }) {
  const { values, counts } = useOptions(comp, p.field), [q, setQ] = useState(''), f = fieldOf(comp, p.field);
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
}

function RangeFilter({ comp, p, sel, setSel }: { comp: Comp; p: FilterProps; sel: number[]; setSel: (v: unknown[]) => void }) {
  const t = getTable(comp.data!.dataset, comp.data!.table), bounds = useMemo(() => { let lo = Infinity, hi = -Infinity; for (const r of t.rows) { const v = Number(r[p.field]); if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } } return [p.rangeMin ?? Math.floor(lo), p.rangeMax ?? Math.ceil(hi)] as const; }, [t, p.field, p.rangeMin, p.rangeMax]);
  const lo = sel[0] ?? bounds[0], hi = sel[1] ?? bounds[1], step = (bounds[1] - bounds[0]) / 100 || 1;
  const set = (a: number, b: number) => setSel(a <= bounds[0] && b >= bounds[1] ? [] : [Math.min(a, b), Math.max(a, b)]);
  return (
    <div className="vz-filter vz-frange vz-frange--sliders">
      <div className="vz-dual"><input type="range" aria-label="Mínimo" min={bounds[0]} max={bounds[1]} step={step} value={lo} onChange={(e) => set(Number(e.target.value), hi)} /><input type="range" aria-label="Máximo" min={bounds[0]} max={bounds[1]} step={step} value={hi} onChange={(e) => set(lo, Number(e.target.value))} /></div>
      <span className="bw-num">{Math.round(lo).toLocaleString('pt-BR')} – {Math.round(hi).toLocaleString('pt-BR')}</span>
    </div>
  );
}

function HierarchyFilter({ comp, p, sel, setSel }: { comp: Comp; p: FilterProps; sel: unknown[]; setSel: (v: unknown[]) => void }) {
  const levels = p.hierarchy?.length ? p.hierarchy : [p.field], t = getTable(comp.data!.dataset, comp.data!.table);
  const options = (i: number) => { const parent = levels.slice(0, i).map((f, j) => [f, sel[j]] as const).filter(([, v]) => v != null && v !== ''); const rows = t.rows.filter((r) => parent.every(([f, v]) => r[f] === v)); return [...new Set(rows.map((r) => r[levels[i]!]))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')); };
  return (
    <div className="vz-filter vz-fhier">{levels.map((f, i) => (
      <select key={f} aria-label={fieldOf(comp, f)?.label ?? f} disabled={i > 0 && (sel[i - 1] == null || sel[i - 1] === '')} value={String(sel[i] ?? '')} onChange={(e) => { const next = [...sel.slice(0, i), e.target.value || undefined]; setSel(next.filter((_, j) => j <= i && next[j] !== undefined).length ? next.map((v) => v ?? '') : []); }}>
        <option value="">{fieldOf(comp, f)?.label ?? f}: todos</option>{options(i).slice(0, 200).map((v) => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
      </select>
    ))}</div>
  );
}
export { distinct };
