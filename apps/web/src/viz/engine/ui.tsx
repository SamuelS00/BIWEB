import type { ReactNode } from 'react';
import { STATUS_LABEL } from '../../data/query';

/** Color of series i (viz-cat-n), starting from the accent chosen in the Visual tab. */
export const cat = (i: number, base = 1) => `var(--viz-cat-${((base - 1 + i) % 8) + 1})`;
export const statusColor = (k: unknown) => (typeof k === 'string' && STATUS_LABEL[k] ? `var(--viz-status-${k})` : undefined);
export const COLOR = { target: 'var(--viz-cat-4)', prev: 'var(--text-muted)', sla: 'var(--viz-status-critical)', threshold: 'var(--viz-status-warning)', avg: 'var(--text-secondary)', up: 'var(--viz-status-normal)', down: 'var(--viz-status-critical)' };

export function niceTicks(lo: number, hi: number, count = 5): { ticks: number[]; lo: number; hi: number } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { ticks: [0, 1], lo: 0, hi: 1 };
  if (hi === lo) { hi = lo + 1; }
  const raw = (hi - lo) / Math.max(1, count - 1), mag = 10 ** Math.floor(Math.log10(raw)), step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, ticks: number[] = [];
  for (let v = a; v <= b + step / 2; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { ticks, lo: a, hi: b };
}
export const pctDelta = (a: number, b: number) => (b ? a / b - 1 : 0);
export const fmtDelta = (d: number, digits = 1) => `${d >= 0 ? '+' : '−'}${Math.abs(d * 100).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export interface TipRow { label: string; value: string; color?: string; tone?: 'up' | 'down' | 'muted'; strong?: boolean; swatch?: 'dash' | 'bar' | 'dot' }
export interface TipData { x: number; y: number; title: string; sub?: string; rows: TipRow[] }
/** Rich tooltip: title, series rows with swatch, deltas and secondary measures. Flips to stay inside the chart. */
export function RichTip({ tip, width }: { tip: TipData; width: number }) {
  const flip = tip.x > width - 230;
  return (
    <div className="vz-rtip" role="status" style={{ transform: `translate(${Math.round(flip ? tip.x - 14 : tip.x + 14)}px, ${Math.max(4, Math.round(tip.y))}px) ${flip ? 'translateX(-100%)' : ''}` }}>
      <div className="vz-rtip-h"><b>{tip.title}</b>{tip.sub && <span>{tip.sub}</span>}</div>
      {tip.rows.map((r, i) => (
        <div key={i} className={`vz-rtip-r${r.strong ? ' is-strong' : ''}${r.tone ? ` is-${r.tone}` : ''}`}>
          <span>{r.color && <i className={`sw-${r.swatch ?? 'bar'}`} style={{ background: r.swatch === 'dash' ? 'none' : r.color, borderColor: r.color }} />}{r.label}</span><b className="bw-num">{r.value}</b>
        </div>
      ))}
    </div>
  );
}
export function Legend({ items, hidden, onToggle }: { items: { k: string; c: string; dash?: boolean }[]; hidden: Set<string>; onToggle?: (k: string) => void }): ReactNode {
  return (
    <div className="vz-legend">
      {items.map((l) => (
        <button key={l.k} type="button" className={hidden.has(l.k) ? 'is-off' : undefined} aria-pressed={!hidden.has(l.k)} onClick={() => onToggle?.(l.k)} disabled={!onToggle}>
          <i className={l.dash ? 'is-dash' : undefined} style={{ background: l.dash ? 'none' : l.c, borderColor: l.c }} />{l.k}
        </button>
      ))}
    </div>
  );
}
