import { aggregate, groupKey, labelOf, STATUS_ORDER, type Grain, type Series } from '../../data/query';
import { getField, getTable } from '../../data/registry';
import type { Agg, Field, Row } from '../../data/types';
import type { ChartProps, PeriodKey, RefLine } from '../../editor/doc';

const DAY = 86_400_000;
/** Window [from, to] of a period, anchored to the newest date in the data (the demo "today"). */
export function periodWindow(period: PeriodKey | undefined, end: number): [number, number] | null {
  if (!period || period === 'all') return null;
  const e = new Date(end);
  switch (period) {
    case 'ytd': return [Date.UTC(e.getUTCFullYear(), 0, 1), end];
    case 'last12m': return [Date.UTC(e.getUTCFullYear(), e.getUTCMonth() - 11, 1), end];
    case 'last90d': return [end - 89 * DAY, end];
    case 'last30d': return [end - 29 * DAY, end];
    case 'last7d': return [end - 6 * DAY, end];
  }
}
export const PERIOD_LABEL: Record<PeriodKey, string> = { all: 'Todo o período', ytd: 'Ano até hoje', last12m: 'Últimos 12 meses', last90d: 'Últimos 90 dias', last30d: 'Últimos 30 dias', last7d: 'Últimos 7 dias' };
/** Same instant one year earlier (leap days clamp to Feb 28). */
export const shiftYear = (ts: number, years = -1) => { const d = new Date(ts); const y = d.getUTCFullYear() + years, m = d.getUTCMonth(), day = d.getUTCDate(); return Date.UTC(y, m, m === 1 && day === 29 ? 28 : day); };
export const dateFieldOf = (ds: string, table: string, preferred?: string) => preferred ? getField(ds, table, preferred) : getTable(ds, table).fields.find((f) => f.kind === 'date');
export function maxDate(ds: string, table: string, field: string): number {
  const t = getTable(ds, table); let m = 0;
  for (const r of t.rows) { const v = Number(r[field]); if (v > m) m = v; }
  return m;
}
export const inWindow = (rows: Row[], field: string, w: [number, number] | null) => (w ? rows.filter((r) => { const v = Number(r[field]); return v >= w[0] && v <= w[1] + DAY - 1; }) : rows);

export interface Pt {
  key: unknown; label: string; value: number; series: Record<string, number>;
  long?: string; partial?: number; target?: number; prev?: number; share: number; extra: Record<string, number>; y2?: number; ma?: number; total?: boolean; start?: number; end?: number;
}
export interface Model { pts: Pt[]; seriesKeys: string[]; total: number; isTime: boolean; hasTarget: boolean; hasPrev: boolean; xf?: Field; yf?: Field; agg: Agg }

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** Full label for tooltips: "Fevereiro de 2026", "12 de fevereiro de 2026"… */
export function longLabel(key: number, grain: Grain): string {
  const d = new Date(key), y = d.getUTCFullYear(), m = MONTHS[d.getUTCMonth()]!;
  if (grain === 'minute' || grain === 'hour') return `${d.getUTCDate()} de ${m} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;
  return grain === 'month' ? `${m[0]!.toUpperCase()}${m.slice(1)} de ${y}` : grain === 'quarter' ? `${Math.floor(d.getUTCMonth() / 3) + 1}º trimestre de ${y}` : grain === 'year' ? String(y) : grain === 'week' ? `Semana de ${d.getUTCDate()} de ${m}` : `${d.getUTCDate()} de ${m} de ${y}`;
}
const bucketEnd = (key: number, grain: Grain) => { if (grain === 'minute' || grain === 'hour') return key; const d = new Date(key); return grain === 'month' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0) : grain === 'quarter' ? Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3 + 3, 0) : grain === 'year' ? Date.UTC(d.getUTCFullYear(), 11, 31) : key; };

export interface BuildInput { ds: string; table: string; rows: Row[]; prevRows?: Row[]; x: string; props: ChartProps }
const aggOf = (p: ChartProps): Agg => p.agg;
const orderKeys = (pts: Pt[], p: ChartProps, isTime: boolean, x: string) => {
  if (isTime) return pts.sort((a, b) => Number(a.key) - Number(b.key));
  if (x === 'status' || x === 'severidade') return pts.sort((a, b) => STATUS_ORDER.indexOf(String(a.key)) - STATUS_ORDER.indexOf(String(b.key)));
  if (p.sort === 'label') return pts.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  if (p.sort === 'asc') return pts.sort((a, b) => a.value - b.value);
  if (p.sort === 'none') return pts;
  return pts.sort((a, b) => b.value - a.value);
};

/** One model for every cartesian chart: values, series, target, previous period, share and extra tooltip measures per category. */
export function buildModel({ ds, table, rows, prevRows, x, props: p }: BuildInput): Model {
  const xf = getField(ds, table, x), yf = getField(ds, table, p.y), agg = aggOf(p), isTime = xf?.kind === 'date';
  const grain: Grain = p.grain;
  const main = aggregate(rows, { ds, table, groupBy: x, measure: p.y, agg, series: p.series, sort: 'none', grain });
  const byKey = new Map<string, Pt>();
  for (const s of main) {
    const k = String(s.key);
    let pt = byKey.get(k);
    if (!pt) { pt = { key: s.key, label: s.label, value: 0, series: {}, share: 0, extra: {} }; byKey.set(k, pt); }
    if (s.series !== undefined) pt.series[s.series] = s.value;
    pt.value += s.value;
  }
  // with no series, `value` is the aggregate itself; with calculated ratios across series the sum is not meaningful, so recompute
  if (p.series) {
    const flat = aggregate(rows, { ds, table, groupBy: x, measure: p.y, agg, sort: 'none', grain });
    for (const s of flat) { const pt = byKey.get(String(s.key)); if (pt) pt.value = yf?.calc ? s.value : pt.value; }
  }
  const attach = (list: Series[], set: (pt: Pt, v: number) => void, keyOf: (s: Series) => string = (s) => String(s.key)) => { for (const s of list) { const pt = byKey.get(keyOf(s)); if (pt) set(pt, s.value); } };
  if (p.target) attach(aggregate(rows, { ds, table, groupBy: x, measure: p.target, agg, sort: 'none', grain }), (pt, v) => { pt.target = v; });
  const hasPrev = (p.compare === 'prev' || p.compare === 'both') && !!prevRows?.length;
  if (hasPrev) {
    const shifted = isTime ? prevRows!.map((r) => ({ ...r, [x]: shiftYear(Number(r[x]), 1) })) : prevRows!;
    attach(aggregate(shifted, { ds, table, groupBy: x, measure: p.y, agg, sort: 'none', grain }), (pt, v) => { pt.prev = v; });
  }
  if (p.y2 && p.kind === 'combo') attach(aggregate(rows, { ds, table, groupBy: x, measure: p.y2, agg: getField(ds, table, p.y2)?.calc ? 'sum' : agg, sort: 'none', grain }), (pt, v) => { pt.y2 = v; });
  for (const name of p.tooltipFields ?? []) attach(aggregate(rows, { ds, table, groupBy: x, measure: name, agg: getField(ds, table, name)?.format === 'pct' && !getField(ds, table, name)?.calc ? 'avg' : 'sum', sort: 'none', grain }), (pt, v) => { pt.extra[name] = v; });
  let pts = orderKeys([...byKey.values()], p, isTime, x);
  if (isTime) {
    let last = 0; for (const r of rows) { const v = Number(r[x]); if (v > last) last = v; }
    for (const pt of pts) { pt.long = longLabel(Number(pt.key), grain); const e = bucketEnd(Number(pt.key), grain); if (grain !== 'day' && grain !== 'minute' && grain !== 'hour' && last && last < e && Number(pt.key) <= last) pt.partial = Math.max(1, Math.round((last - Number(pt.key)) / 86_400_000) + 1); }
  }
  if (!isTime && p.limit && !p.series && p.kind !== 'waterfall' && p.kind !== 'funnel') pts = pts.slice(0, p.limit);
  const seriesKeys = [...new Set(main.map((s) => s.series).filter((s): s is string => !!s))];
  const total = pts.reduce((a, b) => a + b.value, 0) || 1;
  for (const pt of pts) pt.share = pt.value / total;
  if (p.movingAvg && p.movingAvg > 1 && isTime) { const n = p.movingAvg; pts.forEach((pt, i) => { const win = pts.slice(Math.max(0, i - n + 1), i + 1); pt.ma = win.reduce((a, b) => a + b.value, 0) / win.length; }); }
  if (p.kind === 'waterfall') pts = waterfall(pts, p, hasPrev);
  return { pts, seriesKeys, total, isTime, hasTarget: pts.some((q) => q.target != null), hasPrev, xf, yf, agg };
}

/** Running totals for a waterfall. `totals` labels close the running sum; with `compare: 'prev'` it explains previous → current by category. */
export function waterfall(pts: Pt[], p: ChartProps, delta: boolean): Pt[] {
  const out: Pt[] = [];
  if (delta) {
    const prev = pts.reduce((a, b) => a + (b.prev ?? 0), 0), cur = pts.reduce((a, b) => a + b.value, 0);
    out.push({ key: '__start', label: 'Ano anterior', value: prev, series: {}, share: 0, extra: {}, total: true, start: 0, end: prev });
    let run = prev;
    for (const pt of pts) { const d = pt.value - (pt.prev ?? 0); out.push({ ...pt, value: d, start: run, end: run + d }); run += d; }
    out.push({ key: '__end', label: 'Atual', value: cur, series: {}, share: 0, extra: {}, total: true, start: 0, end: cur });
    return out;
  }
  const totals = new Set(p.totals ?? []);
  let run = 0;
  pts.forEach((pt, i) => {
    if (totals.has(pt.label) || (i === 0 && !totals.size)) { run = totals.has(pt.label) && i > 0 ? run : pt.value; out.push({ ...pt, total: true, start: 0, end: run }); }
    else { out.push({ ...pt, start: run, end: run + pt.value }); run += pt.value; }
  });
  return out;
}

/* ---------- estatística ---------- */
export const quantile = (sorted: number[], q: number) => { if (!sorted.length) return 0; const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (i - lo); };
export function summary(values: number[]) {
  const s = [...values].filter(Number.isFinite).sort((a, b) => a - b), n = s.length, avg = n ? s.reduce((a, b) => a + b, 0) / n : 0;
  return { n, avg, median: quantile(s, .5), min: s[0] ?? 0, max: s[n - 1] ?? 0, q1: quantile(s, .25), q3: quantile(s, .75), sd: n ? Math.sqrt(s.reduce((a, b) => a + (b - avg) ** 2, 0) / n) : 0 };
}
export function histogram(values: number[], bins = 12) {
  const s = values.filter(Number.isFinite); if (!s.length) return { edges: [] as number[], counts: [] as number[] };
  const lo = Math.min(...s), hi = Math.max(...s), step = (hi - lo || 1) / bins, counts = Array<number>(bins).fill(0);
  for (const v of s) counts[Math.min(bins - 1, Math.floor((v - lo) / step))]!++;
  return { edges: Array.from({ length: bins + 1 }, (_, i) => lo + i * step), counts };
}
export function boxStats(values: number[]) {
  const sm = summary(values), iqr = sm.q3 - sm.q1, lo = sm.q1 - 1.5 * iqr, hi = sm.q3 + 1.5 * iqr, inside = values.filter((v) => v >= lo && v <= hi);
  return { ...sm, whiskerLo: Math.min(...inside, sm.q1), whiskerHi: Math.max(...inside, sm.q3), outliers: values.filter((v) => v < lo || v > hi) };
}
/** Value of a reference line given the plotted points. */
export function refValue(ref: RefLine, pts: Pt[], fallback?: number): number | undefined {
  const vals = pts.map((q) => q.value);
  switch (ref.kind) {
    case 'avg': return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
    case 'median': return summary(vals).median;
    case 'max': return Math.max(...vals);
    case 'min': return Math.min(...vals);
    case 'forecast': { const n = vals.length; if (n < 3) return undefined; const mx = (n - 1) / 2, my = vals.reduce((a, b) => a + b, 0) / n; let num = 0, den = 0; vals.forEach((v, i) => { num += (i - mx) * (v - my); den += (i - mx) ** 2; }); return my + (num / (den || 1)) * (n - mx); }
    default: return ref.value ?? fallback;
  }
}
export const REF_LABEL: Record<RefLine['kind'], string> = { avg: 'Média', median: 'Mediana', target: 'Meta', sla: 'SLA', threshold: 'Limite', forecast: 'Projeção', max: 'Máximo', min: 'Mínimo' };
export { groupKey, labelOf };
