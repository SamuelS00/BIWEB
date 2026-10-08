import type { CfRule, CondFormat, Tone3 } from '../editor/doc';

export const TONE_VAR: Record<Tone3, string> = { critical: 'var(--viz-status-critical)', warning: 'var(--viz-status-warning)', healthy: 'var(--viz-status-normal)' };
export const TONE_LABEL: Record<Tone3, string> = { critical: 'Crítico', warning: 'Atenção', healthy: 'Saudável' };
const ruleHit = (r: CfRule, v: number) => (r.op === '<' ? v < r.v : r.op === '<=' ? v <= r.v : r.op === '>' ? v > r.v : r.op === '>=' ? v >= r.v : v >= r.v && v <= (r.v2 ?? r.v));
export interface CfResult { tone?: Tone3; heat?: number; pct?: number; icon?: string }
export const cfFor = (cfs: CondFormat[] | undefined, field: string) => cfs?.find((c) => c.field === field);
/** Evaluates a column's conditional format for a value, given the column's min/max for scales and bars. */
export function evalCf(cf: CondFormat | undefined, value: unknown, range: { min: number; max: number }): CfResult {
  const v = Number(value);
  if (!cf || value == null || value === '' || !Number.isFinite(v)) return {};
  const t = range.max === range.min ? 0 : (v - range.min) / (range.max - range.min), k = cf.reverse ? 1 - t : t;
  if (cf.kind === 'scale') return { heat: k };
  if (cf.kind === 'bars') return { pct: Math.max(0, Math.min(1, range.max ? v / range.max : 0)) };
  const hit = cf.rules?.find((r) => ruleHit(r, v));
  if (!hit) return {};
  return cf.kind === 'icons' ? { tone: hit.tone, icon: hit.tone === 'critical' ? '▼' : hit.tone === 'warning' ? '◆' : '▲' } : { tone: hit.tone };
}
export const describeRule = (r: CfRule) => (r.op === 'between' ? `${r.v} – ${r.v2}` : `${r.op} ${r.v}`);
export const MARGIN_RULES: CfRule[] = [{ op: '<', v: 10, tone: 'critical' }, { op: 'between', v: 10, v2: 20, tone: 'warning' }, { op: '>', v: 20, tone: 'healthy' }];
