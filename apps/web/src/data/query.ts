import { getField, getTable } from './registry';
import type { Agg, Field, FieldFormat, Filter, Row, RuleAction, Rule } from './types';

/* ---------- formatação pt-BR ---------- */
const nf = (v: number, d: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export function fmt(v: unknown, format?: FieldFormat, compact = false): string {
  if (v == null || v === '') return '—';
  if (typeof v !== 'number') return String(v);
  switch (format) {
    case 'pct': return `${nf(v, v >= 99 && v < 100 ? 2 : v % 1 ? 1 : 0)}%`;
    case 'db': return `${nf(v, 1)} dB`;
    case 'km': return `${nf(v, v >= 100 ? 0 : 1)} km`;
    case 'gbps': return v >= 1000 ? `${nf(v / 1000, 1)} Tbps` : `${nf(v, 0)} Gbps`;
    case 'ms': return `${nf(v, 2)} ms`;
    case 'brl': { const a = Math.abs(v), sg = v < 0 ? '−' : ''; return a >= 1e9 ? `${sg}R$ ${nf(a / 1e9, 2)} bi` : a >= 1e6 ? `${sg}R$ ${nf(a / 1e6, a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2)} mi` : a >= 1e4 && compact ? `${sg}R$ ${nf(a / 1e3, 0)} mil` : `${sg}R$ ${nf(a, a < 100 ? 2 : 0)}`; }
    case 'month': return new Date(v).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('.', '');
    case 'date': return new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    case 'datetime': return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    case 'int': return compact && Math.abs(v) >= 10000 ? `${nf(v / 1000, 1)} mil` : nf(Math.round(v), 0);
    default: return compact && Math.abs(v) >= 10000 ? `${nf(v / 1000, 1)} mil` : nf(v, Number.isInteger(v) ? 0 : v < 10 ? 2 : 1);
  }
}
export const AGG_LABEL: Record<Agg, string> = { sum: 'Soma', avg: 'Média', min: 'Mínimo', max: 'Máximo', count: 'Contagem', distinct: 'Contagem distinta' };
/** Formato do resultado de uma agregação: contagem é inteiro; soma de % vira média por padrão no modelo, mas respeitamos a escolha. */
export const aggFormat = (agg: Agg, f?: Field): FieldFormat | undefined => (agg === 'count' || agg === 'distinct' ? 'int' : f?.format);
export const STATUS_LABEL: Record<string, string> = { normal: 'Normal', warning: 'Atenção', critical: 'Crítico', offline: 'Offline' };
export const STATUS_ORDER = ['offline', 'critical', 'warning', 'normal'];

/* ---------- filtros ---------- */
const cmp = (a: unknown, op: Filter['op'], b: unknown): boolean => {
  switch (op) {
    case '=': return a == b; // eslint-disable-line eqeqeq
    case '!=': return a != b; // eslint-disable-line eqeqeq
    case 'in': return Array.isArray(b) ? b.length === 0 || b.includes(a) : a == b; // eslint-disable-line eqeqeq
    case '>': return Number(a) > Number(b);
    case '>=': return Number(a) >= Number(b);
    case '<': return Number(a) < Number(b);
    case '<=': return Number(a) <= Number(b);
    case 'contains': return String(a ?? '').toLowerCase().includes(String(b ?? '').toLowerCase());
  }
};
export const OP_LABEL: Record<Filter['op'], string> = { '=': 'é igual a', '!=': 'é diferente de', in: 'está em', '>': 'maior que', '>=': 'maior ou igual a', '<': 'menor que', '<=': 'menor ou igual a', contains: 'contém' };
export const matches = (row: Row, f: Filter) => cmp(row[f.field], f.op, f.value);

/* ---------- regras ---------- */
export function ruleMatches(rule: Rule, row: Row) {
  if (!rule.conditions.length) return false;
  let acc = cmp(row[rule.conditions[0]!.field], rule.conditions[0]!.op, coerce(rule.conditions[0]!.value));
  for (const c of rule.conditions.slice(1)) {
    const v = cmp(row[c.field], c.op, coerce(c.value));
    acc = c.join === 'OR' ? acc || v : acc && v;
  }
  return acc;
}
const coerce = (v: string | number) => (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v.replace(',', '.'))) ? Number(v.replace(',', '.')) : v);
const SEV: Record<string, number> = { normal: 0, warning: 1, critical: 2, offline: 3 };

/** Aplica as regras ativas sobre as linhas de uma tabela. Retorna linhas novas só onde algo mudou (identidade preservada no resto). */
const ruleCache = new WeakMap<Row[], Map<string, Row[]>>();
export function applyRules(rows: Row[], rules: Rule[]): Row[] {
  const active = rules.filter((r) => r.enabled && r.conditions.length && r.actions.length);
  if (!active.length) return rows;
  const key = JSON.stringify(active);
  let m = ruleCache.get(rows);
  if (!m) { m = new Map(); ruleCache.set(rows, m); }
  const hit = m.get(key);
  if (hit) return hit;
  const out = rows.map((row) => {
    let next: Row | null = null;
    for (const rule of active) {
      if (!ruleMatches(rule, next ?? row)) continue;
      next ??= { ...row, _rules: [] as string[] };
      (next._rules as string[]).push(rule.name);
      for (const a of rule.actions as RuleAction[]) {
        if (a.kind === 'status' && (SEV[a.value] ?? 0) >= (SEV[String(next.status)] ?? 0)) { next._statusOriginal ??= row.status; next.status = a.value; }
        if (a.kind === 'label') next._label = a.value;
        if (a.kind === 'alert') next._alert = true;
        if (a.kind === 'highlight') next._highlight = true;
      }
    }
    return next ?? row;
  });
  if (m.size > 20) m.clear();
  m.set(key, out);
  return out;
}

/* ---------- consulta ---------- */
export interface QueryCtx { rules: Rule[]; filters: Filter[] }
/** Linhas efetivas de uma tabela: regras aplicadas e filtros (página, slicers, cross-filter, filtros locais). */
export function rowsOf(ds: string, table: string, ctx: QueryCtx): Row[] {
  const t = getTable(ds, table);
  const rows = applyRules(t.rows, ctx.rules.filter((r) => r.dataset === ds && r.table === t.id));
  const fs = ctx.filters.filter((f) => t.fields.some((x) => x.name === f.field) || f.field.startsWith('_'));
  return fs.length ? rows.filter((r) => fs.every((f) => matches(r, f))) : rows;
}

/** Value of a calculated field from the sums of its parts. */
export const calcValue = (c: NonNullable<Field['calc']>, n: number, d: number) => (c.op === 'diff' ? n - d : (d ? n / d : 0) * (c.scale ?? 1) + (c.offset ?? 0));

export function aggregateValues(vals: unknown[], agg: Agg): number {
  if (agg === 'count') return vals.length;
  if (agg === 'distinct') return new Set(vals).size;
  const nums = vals.map(Number).filter((v) => !Number.isNaN(v));
  if (!nums.length) return 0;
  if (agg === 'sum') return nums.reduce((a, b) => a + b, 0);
  if (agg === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (agg === 'min') return Math.min(...nums);
  return Math.max(...nums);
}

export type Grain = 'day' | 'week' | 'month' | 'quarter' | 'year';
const DAY = 86_400_000;
export function groupKey(v: unknown, f?: Field, grain: Grain = 'day') {
  if (f?.kind === 'date' && typeof v === 'number') {
    const d = Math.floor(v / DAY) * DAY;
    if (grain === 'week') return d - (new Date(d).getUTCDay() * DAY);
    if (grain === 'month' || grain === 'quarter' || grain === 'year') { const x = new Date(d), m = grain === 'year' ? 0 : grain === 'quarter' ? Math.floor(x.getUTCMonth() / 3) * 3 : x.getUTCMonth(); return Date.UTC(x.getUTCFullYear(), m, 1); }
    return d;
  }
  return v;
}

export interface Series { key: unknown; label: string; value: number; series?: string }
/** Agrupa e agrega. Datas são agrupadas por dia/semana e ordenadas no tempo; categorias por valor (desc) ou por ordem de status. */
export function aggregate(rows: Row[], o: { ds: string; table: string; groupBy?: string; measure?: string; agg: Agg; series?: string; sort?: 'value' | 'asc' | 'label' | 'none'; limit?: number; grain?: Grain }): Series[] {
  const gf = o.groupBy ? getField(o.ds, o.table, o.groupBy) : undefined;
  const val = (r: Row) => (o.measure ? r[o.measure] : r[o.groupBy ?? 'id']);
  if (!o.groupBy) {
    const f0 = o.measure ? getField(o.ds, o.table, o.measure) : undefined;
    if (f0?.calc && (o.agg === 'sum' || o.agg === 'avg')) { const n = rows.reduce((a, r) => a + Number(r[f0.calc!.num] ?? 0), 0), d = rows.reduce((a, r) => a + Number(r[f0.calc!.den] ?? 0), 0); return [{ key: 'total', label: 'Total', value: calcValue(f0.calc, n, d) }]; }
    return [{ key: 'total', label: 'Total', value: aggregateValues(rows.map(val), o.agg) }];
  }
  const groups = new Map<string, { key: unknown; series?: string; vals: unknown[] }>();
  for (const r of rows) {
    const k = groupKey(r[o.groupBy], gf, o.grain), s = o.series ? String(r[o.series] ?? '—') : undefined;
    const id = `${String(k)}¦${s ?? ''}`;
    let g = groups.get(id);
    if (!g) { g = { key: k, series: s, vals: [] }; groups.set(id, g); }
    g.vals.push(val(r));
  }
  const mf = o.measure ? getField(o.ds, o.table, o.measure) : undefined, calc = mf?.calc && (o.agg === 'sum' || o.agg === 'avg') ? mf.calc : undefined;
  if (calc) {
    const num = new Map<string, number>(), den = new Map<string, number>();
    for (const r of rows) { const k = groupKey(r[o.groupBy], gf, o.grain), s = o.series ? String(r[o.series] ?? '—') : '', id = `${String(k)}¦${s}`; num.set(id, (num.get(id) ?? 0) + Number(r[calc.num] ?? 0)); den.set(id, (den.get(id) ?? 0) + Number(r[calc.den] ?? 0)); }
    for (const [id, g] of groups) (g as { ratio?: number }).ratio = calcValue(calc, num.get(id) ?? 0, den.get(id) ?? 0);
  }
  let out: Series[] = [...groups.values()].map((g) => ({ key: g.key, series: g.series, value: calc ? (g as { ratio?: number }).ratio ?? 0 : aggregateValues(g.vals, o.agg), label: labelOf(g.key, gf, o.grain) }));
  if (gf?.kind === 'date') out.sort((a, b) => Number(a.key) - Number(b.key));
  else if (o.groupBy === 'status' || o.groupBy === 'severidade') out.sort((a, b) => STATUS_ORDER.indexOf(String(a.key)) - STATUS_ORDER.indexOf(String(b.key)));
  else if (o.sort === 'label') out.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  else if (o.sort === 'asc') out.sort((a, b) => a.value - b.value);
  else if (o.sort !== 'none') out.sort((a, b) => b.value - a.value);
  if (o.limit && gf?.kind !== 'date' && !o.series) out = out.slice(0, o.limit);
  return out;
}
export const labelOf = (k: unknown, f?: Field, grain: Grain = 'day') => (f?.kind === 'date' ? (grain === 'month' ? fmt(k, 'month') : grain === 'quarter' ? `T${Math.floor(new Date(Number(k)).getUTCMonth() / 3) + 1}/${String(new Date(Number(k)).getUTCFullYear()).slice(2)}` : grain === 'year' ? String(new Date(Number(k)).getUTCFullYear()) : fmt(k, 'date')) : f?.name === 'status' || f?.name === 'severidade' ? STATUS_LABEL[String(k)] ?? String(k) : String(k ?? '—'));

/** Valores distintos de um campo (para slicers, filtros e o construtor de regras). */
export function distinct(ds: string, table: string, field: string): unknown[] {
  const t = getTable(ds, table);
  const s = [...new Set(t.rows.map((r) => r[field]))];
  return field === 'status' || field === 'severidade' ? s.sort((a, b) => STATUS_ORDER.indexOf(String(a)) - STATUS_ORDER.indexOf(String(b))) : s.sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}
