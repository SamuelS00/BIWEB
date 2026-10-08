import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const nf = (n: number, d = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
export function exportCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function Spark({ values, color = 'var(--accent)', w = 84, h = 26 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1, id = useId().replace(/:/g, '');
  const pts = values.map((v, i) => [i / Math.max(1, values.length - 1) * (w - 2) + 1, h - 3 - (v - min) / span * (h - 6)] as const), d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  return <svg className="dm-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d={`${d}L${w - 1},${h}L1,${h}Z`} fill={`url(#${id})`} /><path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" /><circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="2.2" fill={color} /></svg>;
}

export interface Series { pts: { x: number; y: number }[]; color: string; width?: number; dash?: string; label?: string }
export interface Marker { x: number; y: number; color: string; id: string; selected?: boolean; label?: string }
/** Line chart with an optional confidence band, markers, reference lines and a crosshair tooltip. */
export function LineChart({ series, band, markers = [], xTicks, xLabel, yFormat, yDomain, vlines = [], onMarker, tooltip, height = 250, ariaLabel }: {
  series: Series[]; band?: { x: number; lo: number; hi: number }[]; markers?: Marker[]; xTicks: number[]; xLabel: (x: number) => string; yFormat: (y: number) => string; yDomain?: [number, number];
  vlines?: { x: number; label: string; color: string }[]; onMarker?: (id: string) => void; tooltip?: (x: number) => ReactNode; height?: number; ariaLabel: string;
}) {
  const W = 760, H = height, L = 50, R = 14, T = 14, B = 26, ref = useRef<SVGSVGElement>(null), [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.pts), xs = all.map((p) => p.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ys = [...all.map((p) => p.y), ...(band ? band.flatMap((b) => [b.lo, b.hi]) : [])], lo = yDomain?.[0] ?? Math.min(...ys), hi = yDomain?.[1] ?? Math.max(...ys), pad = (hi - lo) * .08 || 1;
  const y0 = yDomain ? lo : lo - pad, y1 = yDomain ? hi : hi + pad, sx = (x: number) => L + (x - x0) / (x1 - x0 || 1) * (W - L - R), sy = (y: number) => T + (1 - (y - y0) / (y1 - y0 || 1)) * (H - T - B);
  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
  const grid = Array.from({ length: 5 }, (_, i) => y0 + (y1 - y0) * i / 4);
  const main = series[0]!.pts, near = (cx: number) => { const r = ref.current!.getBoundingClientRect(), x = x0 + ((cx - r.left) / r.width * W - L) / (W - L - R) * (x1 - x0); return main.reduce((a, b) => Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a).x; };
  const hp = hover === null ? null : main.find((p) => p.x === hover);
  return <div className="dm-chart"><svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} onPointerMove={(e) => setHover(near(e.clientX))} onPointerLeave={() => setHover(null)}>
    {grid.map((g, i) => <g key={i}><line x1={L} x2={W - R} y1={sy(g)} y2={sy(g)} className="dm-grid" /><text x={L - 7} y={sy(g) + 3} textAnchor="end">{yFormat(g)}</text></g>)}
    {xTicks.map((t) => <text key={t} x={sx(t)} y={H - 8} textAnchor="middle">{xLabel(t)}</text>)}
    {band && <path d={`${band.map((b, i) => `${i ? 'L' : 'M'}${sx(b.x).toFixed(1)},${sy(b.hi).toFixed(1)}`).join('')}${[...band].reverse().map((b) => `L${sx(b.x).toFixed(1)},${sy(b.lo).toFixed(1)}`).join('')}Z`} className="dm-band" />}
    {vlines.map((v) => <g key={v.label}><line x1={sx(v.x)} x2={sx(v.x)} y1={T} y2={H - B} stroke={v.color} strokeDasharray="3 4" /><text x={sx(v.x) + 5} y={T + 9} fill={v.color} className="dm-vlabel">{v.label}</text></g>)}
    {series.map((s, i) => <path key={i} d={path(s.pts)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />)}
    {markers.map((m) => <g key={m.id} className="dm-marker" role={onMarker ? 'button' : undefined} tabIndex={onMarker ? 0 : undefined} aria-label={m.label} onClick={() => onMarker?.(m.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMarker?.(m.id); } }}><circle cx={sx(m.x)} cy={sy(m.y)} r={m.selected ? 9 : 6} fill={m.color} opacity={m.selected ? .28 : .2} /><circle cx={sx(m.x)} cy={sy(m.y)} r="3.6" fill={m.color} stroke="var(--surface-panel)" strokeWidth="1.5" /></g>)}
    {hp && <g pointerEvents="none"><line x1={sx(hp.x)} x2={sx(hp.x)} y1={T} y2={H - B} className="dm-cross" />{series.map((s, i) => { const q = s.pts.find((p) => p.x === hp.x); return q ? <circle key={i} cx={sx(q.x)} cy={sy(q.y)} r="3.4" fill={s.color} stroke="var(--surface-panel)" strokeWidth="1.4" /> : null; })}</g>}
  </svg>{hp && tooltip && <div className="dm-tip" style={{ left: `${Math.min(78, sx(hp.x) / W * 100)}%` }}>{tooltip(hp.x)}</div>}</div>;
}
