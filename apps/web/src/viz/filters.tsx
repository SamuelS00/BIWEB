import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { labelOf, OP_LABEL } from '../data/query';
import { getField } from '../data/registry';
import type { Filter } from '../data/types';
import type { Comp, FilterProps } from '../editor/doc';
import { useEditor } from '../editor/store';
import { PERIOD_LABEL } from './engine/model';

export type Level = 'Relatório' | 'Página' | 'Visual' | 'Seleção' | 'Drill';
export interface Chip { id: string; level: Level; field: string; text: string; clear?: () => void; mode?: 'filter' | 'highlight' }
const fv = (ds: string, table: string, f: Filter) => {
  const fld = getField(ds, table, f.field), fm = fld?.format;
  const one = (v: unknown) => (typeof v === 'number' && (fld?.kind === 'date') ? new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : labelOf(v, fld));
  return Array.isArray(f.value) ? (f.value.length > 3 ? `${f.value.slice(0, 3).map(one).join(', ')} +${f.value.length - 3}` : f.value.map(one).join(', ')) : fm === 'pct' && typeof f.value === 'number' ? `${f.value}%` : one(f.value);
};
export const describeFilter = (ds: string, table: string, f: Filter) => `${getField(ds, table, f.field)?.label ?? f.field} ${f.op === 'in' ? '=' : { '=': '=', '!=': '≠', '>': '>', '>=': '≥', '<': '<', '<=': '≤', contains: 'contém' }[f.op]} ${fv(ds, table, f)}`;
export const filterWord = (op: Filter['op']) => OP_LABEL[op];

/** Everything currently narrowing the page, by level: report, page, widget, the selection made on a chart, and drill state. */
export function usePageChips(): Chip[] {
  const slice = useEditor(useShallow((s) => [s.doc, s.pageId, s.filterValues, s.cross, s.drill, s.view] as const));
  return useMemo(() => {
    const st = useEditor.getState(), doc = st.doc, page = st.page();
    if (!doc || !page) return [];
    const ds = doc.datasets[0] ?? 'ds_rede_sp', chips: Chip[] = [];
    const table = (c: Comp) => c.data?.table ?? 'enlaces';
    (doc.filters ?? []).forEach((f, i) => chips.push({ id: `r${i}`, level: 'Relatório', field: f.field, text: describeFilter(ds, page.comps.find((c) => c.data)?.data?.table ?? 'enlaces', f) }));
    (page.filters ?? []).forEach((f, i) => chips.push({ id: `p${i}`, level: 'Página', field: f.field, text: describeFilter(ds, page.comps.find((c) => c.data)?.data?.table ?? 'enlaces', f) }));
    for (const c of doc.pages.flatMap((pg) => pg.comps.filter((x) => (x.type === 'filter' || x.type === 'slicer') && (pg.id === page.id || x.props.scope === 'report')))) {
      const vals = st.filterValues[c.id] ?? (c.props.defaultValues as unknown[] | undefined) ?? [];
      if (!vals.length) continue;
      const p = c.props as unknown as FilterProps, fld = getField(c.data!.dataset, table(c), String(p.field));
      const text = p.style === 'relative' ? PERIOD_LABEL[vals[0] as keyof typeof PERIOD_LABEL] ?? String(vals[0]) : p.style === 'daterange' ? `${new Date(Number(vals[0])).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} – ${new Date(Number(vals[1] ?? vals[0])).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : p.style === 'range' ? `${vals[0] ?? '…'} – ${vals[1] ?? '…'}` : vals.length > 3 ? `${vals.slice(0, 3).map((v) => labelOf(v, fld)).join(', ')} +${vals.length - 3}` : vals.map((v) => labelOf(v, fld)).join(', ');
      chips.push({ id: c.id, level: p.scope === 'report' ? 'Relatório' : 'Página', field: String(p.field), text: `${fld?.label ?? p.field}: ${text}`, clear: () => st.setFilter(c.id, []) });
    }
    if (st.cross) chips.push({ id: 'cross', level: 'Seleção', field: st.cross.field, mode: st.cross.mode ?? 'filter', text: st.cross.label, clear: () => st.setCross(null) });
    for (const [id, path] of Object.entries(st.drill)) { const c = page.comps.find((x) => x.id === id); if (c && path.length) chips.push({ id: `d${id}`, level: 'Drill', field: c.name, text: `${c.name}: ${path.map((v) => labelOf(v)).join(' › ')}`, clear: () => st.set({ drill: { ...st.drill, [id]: [] } }) }); }
    return chips;
  }, [slice]);
}
/** Filters acting on one widget, by level, including what the other widgets send to it and its own. */
export function useCompChips(comp: Comp): Chip[] {
  const all = usePageChips();
  const view = useEditor((s) => s.view[comp.id]);
  return useMemo(() => {
    const ds = comp.data?.dataset ?? 'ds_rede_sp', tb = comp.data?.table ?? 'enlaces', st = useEditor.getState();
    const own: Chip[] = [
      ...comp.localFilters.map((f, i) => ({ id: `l${comp.id}${i}`, level: 'Visual' as const, field: f.field, text: describeFilter(ds, tb, f) })),
      ...(view?.filters ?? []).map((f, i) => ({ id: `w${comp.id}${i}`, level: 'Visual' as const, field: f.field, text: describeFilter(ds, tb, f), clear: () => st.setView(comp.id, { filters: (view?.filters ?? []).filter((_, j) => j !== i) }) })),
    ];
    return [...all.filter((c) => c.level !== 'Drill' || c.id === `d${comp.id}`), ...own];
  }, [all, comp, view?.filters]);
}
