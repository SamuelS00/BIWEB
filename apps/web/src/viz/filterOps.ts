import { getTable } from '../data/registry';
import type { Filter } from '../data/types';
import type { Comp, FilterProps, PeriodKey } from '../editor/doc';
import { inWindow, periodWindow } from './engine/model';

const endCache = new Map<string, number>();
const endOf = (ds: string, table: string, field: string) => {
  const k = `${ds}¦${table}¦${field}`; let v = endCache.get(k);
  if (v === undefined) { v = 0; for (const r of getTable(ds, table).rows) { const n = Number(r[field]); if (n > v) v = n; } endCache.set(k, v); }
  return v;
};
export const RELATIVE: { id: PeriodKey; label: string }[] = [{ id: 'last7d', label: 'Últimos 7 dias' }, { id: 'last30d', label: 'Últimos 30 dias' }, { id: 'last90d', label: 'Últimos 90 dias' }, { id: 'last12m', label: 'Últimos 12 meses' }, { id: 'ytd', label: 'Ano até hoje' }, { id: 'all', label: 'Todo o período' }];

/** Turns the current selection of a filter widget into row filters, whatever its style (list, range, dates, relative window…). */
export function filtersFromComp(c: Comp, vals: unknown[]): Filter[] {
  const p = c.props as unknown as FilterProps, field = String(p.field);
  if (!vals.length) return [];
  switch (p.style) {
    case 'range': case 'daterange': {
      const [lo, hi] = vals as (number | undefined)[], out: Filter[] = [];
      if (lo != null && Number.isFinite(lo)) out.push({ field, op: '>=', value: lo });
      if (hi != null && Number.isFinite(hi)) out.push({ field, op: '<=', value: p.style === 'daterange' ? hi + 86_399_999 : hi });
      return out;
    }
    case 'relative': {
      const w = c.data ? periodWindow(vals[0] as PeriodKey, endOf(c.data.dataset, c.data.table, field)) : null;
      return w ? [{ field, op: '>=', value: w[0] }, { field, op: '<=', value: w[1] + 86_399_999 }] : [];
    }
    case 'hierarchy': return (p.hierarchy ?? []).flatMap((f, i) => (vals[i] != null && vals[i] !== '' ? [{ field: f, op: '=' as const, value: vals[i] }] : []));
    case 'search': return [{ field, op: 'contains', value: String(vals[0] ?? '') }];
    case 'toggle': return [{ field, op: '=', value: vals[0] === 'true' || vals[0] === true ? true : vals[0] }];
    default: return [{ field, op: 'in', value: vals }];
  }
}
export { inWindow };
