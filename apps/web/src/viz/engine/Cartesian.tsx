import { useMemo, useRef, useState } from 'react';
import { fmt, STATUS_LABEL } from '../../data/query';
import type { ChartProps, Comp } from '../../editor/doc';
import { getField } from '../../data/registry';
import { refValue, REF_LABEL, type Model, type Pt } from './model';
import { cat, COLOR, fmtDelta, niceTicks, pctDelta, RichTip, statusColor, type TipData, type TipRow } from './ui';
import { aggFormat } from '../../data/query';
import { evalCf, TONE_VAR } from '../cf';

export interface CartesianProps {
  comp: Comp; model: Model; p: ChartProps; W: number; H: number; hidden: Set<string>; active: unknown; x: string;
  onSelect: (pt: Pt) => void; onRange: (r: [number, number] | null) => void; range: [number, number] | null;
}
const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Columns, lines, areas, steps, combos, stacks, groups, waterfalls and bullets share one frame: scales, hover, selection, references and zoom. */
export function Cartesian({ comp, model, p, W, H, hidden, active, x, onSelect, onRange, range }: CartesianProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null), [tipPos, setTipPos] = useState({ x: 0, y: 0 }), [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const kind = p.kind, ds = comp.data!.dataset, table = comp.data!.table;
  const horizontal = kind === 'hbar' || kind === 'bullet';
  const all = model.pts, [i0, i1] = range ?? [0, all.length - 1];
  const pts = useMemo(() => all.slice(i0, i1 + 1), [all, i0, i1]);
  const n = pts.length, yf = model.yf, y2f = p.y2 ? getField(ds, table, p.y2) : undefined;
  const fmtY = (v: number) => fmt(v, aggFormat(model.agg, yf), true), fmtY2 = (v: number) => fmt(v, y2f?.format, true);
  const keys = model.seriesKeys.filter((s) => !hidden.has(s));
  const stack = kind === 'stacked' || kind === 'stacked100', grouped = kind === 'grouped', line = kind === 'line' || kind === 'area' || kind === 'step';
  const band = kind !== 'line' && kind !== 'area' && kind !== 'step';
  const cfRange = useMemo(() => ({ min: Math.min(0, ...model.pts.map((q) => q.value)), max: Math.max(1, ...model.pts.map((q) => q.value)) }), [model.pts]);
  const cfRule = p.cf?.find((x) => x.kind === 'rules' || x.kind === 'icons');
  const colorOf = (s: string | undefined, i: number) => (cfRule && !s && pts[i] && evalCf(cfRule, pts[i]!.value, cfRange).tone ? TONE_VAR[evalCf(cfRule, pts[i]!.value, cfRange).tone!] : p.colorBy === 'sign' && !s ? ((pts[i]?.value ?? 0) >= 0 ? COLOR.up : COLOR.down) : s ? statusColor(s) ?? cat(model.seriesKeys.indexOf(s), comp.style.accent) : x === 'status' || x === 'severidade' ? statusColor(pts[i]?.key) ?? cat(0, comp.style.accent) : cat(0, comp.style.accent));
  const useTarget = model.hasTarget && p.compare !== 'prev', usePrev = model.hasPrev;
  const sumOf = (pt: Pt) => (p.series ? (stack ? keys.reduce((a, k) => a + (pt.series[k] ?? 0), 0) : Math.max(0, ...keys.map((k) => pt.series[k] ?? 0))) : pt.value);

  /* ---- escalas ---- */
  const refs = (p.refs ?? []).map((r) => ({ r, v: refValue(r, pts, r.kind === 'target' ? pts.find((q) => q.target != null)?.target : undefined) })).filter((q): q is { r: typeof q.r; v: number } => q.v != null && Number.isFinite(q.v));
  const vals = [...pts.map(sumOf), ...(useTarget ? pts.map((q) => q.target ?? 0) : []), ...(usePrev ? pts.map((q) => q.prev ?? 0) : []), ...refs.map((q) => q.v), ...pts.map((q) => q.ma ?? 0)];
  if (kind === 'waterfall') vals.push(...pts.flatMap((q) => [q.start ?? 0, q.end ?? 0]));
  let lo = kind === 'stacked100' ? 0 : Math.min(0, ...vals), hi = kind === 'stacked100' ? 100 : Math.max(...vals, 0);
  if (line && lo >= 0 && vals.length) { const mn = Math.min(...vals.filter((v) => v > 0)), mx = Math.max(...vals), span = mx - mn; if (span < mx * 0.35) { lo = Math.max(0, mn - span * 0.6); hi = mx + span * 0.25; } }
  const { ticks, lo: yLo, hi: yHi } = niceTicks(lo, hi, Math.max(3, Math.min(6, Math.floor(H / 54))));
  const y2vals = pts.map((q) => q.y2).filter((v): v is number => v != null), y2lo = Math.min(...y2vals), y2hi = Math.max(...y2vals), y2span = y2hi - y2lo;
  const t2 = kind === 'combo' && p.y2 && y2vals.length ? (y2lo > 0 && y2span < y2hi * 0.5 ? niceTicks(Math.max(0, y2lo - Math.max(y2span, y2hi * 0.04) * 0.8), y2hi + Math.max(y2span, y2hi * 0.04) * 0.8, 5) : niceTicks(Math.min(0, y2lo), y2hi, 5)) : null;
  const withBrush = !!p.zoom && model.isTime && all.length > 18 && !horizontal;
  const L = horizontal ? Math.min(150, W * 0.3) : 52, R = t2 ? 50 : 12, T = p.labels && band ? 18 : 10, B = 24 + (withBrush ? 34 : 0);
  const iw = Math.max(10, W - L - R), ih = Math.max(10, H - T - B);
  const X = (i: number) => (band ? L + (iw / Math.max(1, n)) * (i + 0.5) : L + (n === 1 ? iw / 2 : (iw * i) / (n - 1)));
  const Y = (v: number) => T + ih - ((v - yLo) / (yHi - yLo || 1)) * ih;
  const Y2 = (v: number) => (t2 ? T + ih - ((v - t2.lo) / (t2.hi - t2.lo || 1)) * ih : 0);
  const HX = (v: number) => L + ((v - yLo) / (yHi - yLo || 1)) * iw; // horizontal value scale
  const rh = horizontal ? Math.max(14, Math.min(34, ih / Math.max(1, n))) : 0;
  const every = Math.max(1, Math.ceil((n * (model.isTime ? 48 : 70)) / Math.max(iw, 1)));

  /* ---- tooltip ---- */
  const tipRows = (pt: Pt): TipRow[] => {
    const rows: TipRow[] = [];
    if (kind === 'waterfall') { rows.push({ label: pt.total ? 'Total' : 'Variação', value: pt.total ? fmtY(pt.end ?? pt.value) : `${(pt.value >= 0 ? '+' : '−')}${fmtY(Math.abs(pt.value))}`, strong: true, tone: pt.total ? undefined : pt.value >= 0 ? 'up' : 'down', color: pt.total ? cat(0, comp.style.accent) : pt.value >= 0 ? COLOR.up : COLOR.down }); if (!pt.total) rows.push({ label: 'Acumulado', value: fmtY(pt.end ?? 0), tone: 'muted' }); if (pt.prev != null) { rows.push({ label: 'Ano anterior', value: fmtY(pt.prev), tone: 'muted' }); } return rows; }
    if (p.series) {
      for (const s of model.seriesKeys) { if (hidden.has(s)) continue; const v = pt.series[s]; if (v == null) continue; rows.push({ label: STATUS_LABEL[s] ?? s, value: kind === 'stacked100' ? `${fmt((v / (sumOf(pt) || 1)) * 100, 'pct')} · ${fmtY(v)}` : fmtY(v), color: colorOf(s, 0) }); }
      if (stack && rows.length > 1) rows.push({ label: 'Total', value: fmtY(sumOf(pt)), strong: true });
    } else rows.push({ label: yf?.label ?? 'Valor', value: fmtY(pt.value), color: colorOf(undefined, pts.indexOf(pt)), strong: true });
    if (useTarget && pt.target != null) { rows.push({ label: 'Meta', value: fmtY(pt.target), color: COLOR.target, swatch: 'dash' }); const d = pctDelta(pt.value, pt.target); rows.push({ label: 'Δ Meta', value: fmtDelta(d), tone: d >= 0 ? 'up' : 'down' }); }
    if (usePrev && pt.prev != null) { rows.push({ label: 'Ano anterior', value: fmtY(pt.prev), color: COLOR.prev, swatch: 'dash' }); const d = pctDelta(pt.value, pt.prev); rows.push({ label: 'YoY', value: fmtDelta(d), tone: d >= 0 ? 'up' : 'down' }); }
    if (pt.y2 != null && p.y2) rows.push({ label: y2f?.label ?? 'Linha', value: fmtY2(pt.y2), color: cat(2, comp.style.accent), swatch: 'dot' });
    if (pt.ma != null) rows.push({ label: `Média móvel ${p.movingAvg}`, value: fmtY(pt.ma), tone: 'muted' });
    for (const [name, v] of Object.entries(pt.extra)) { const f = getField(ds, table, name); rows.push({ label: f?.label ?? name, value: fmt(v, f?.format, true), tone: 'muted' }); }
    if (!model.isTime && !p.series && n > 1) rows.push({ label: 'Participação', value: fmt(pt.share * 100, 'pct'), tone: 'muted' });
    return rows;
  };
  const tip: TipData | null = p.tooltip && hover !== null && pts[hover] ? { x: tipPos.x, y: tipPos.y, title: pts[hover]!.long ?? pts[hover]!.label, sub: pts[hover]!.partial ? `período parcial · ${pts[hover]!.partial} dias` : model.isTime ? undefined : model.xf?.label, rows: tipRows(pts[hover]!) } : null;
  const nearest = (at: number) => pts.reduce((b, q, i) => (Math.abs(Number(q.key) - at) < Math.abs(Number(pts[b]!.key) - at) ? i : b), 0);

  /* ---- ponteiro ---- */
  const idxAt = (px: number, py: number) => {
    if (horizontal) return Math.max(0, Math.min(n - 1, Math.floor((py - T) / rh)));
    return band ? Math.max(0, Math.min(n - 1, Math.floor(((px - L) / iw) * n))) : Math.max(0, Math.min(n - 1, Math.round(((px - L) / iw) * (n - 1))));
  };
  const local = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
  const down = useRef<{ a: number; moved: boolean } | null>(null);
  const onMove = (e: React.PointerEvent) => {
    const q = local(e); setHover(idxAt(q.x, q.y)); setTipPos({ x: q.x, y: q.y - 12 });
    if (down.current && !horizontal) { const i = idxAt(q.x, q.y); if (i !== down.current.a) down.current.moved = true; setDrag({ a: down.current.a, b: i }); }
  };
  const onDown = (e: React.PointerEvent) => { const q = local(e); down.current = { a: idxAt(q.x, q.y), moved: false }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); };
  const onUp = (e: React.PointerEvent) => {
    const q = local(e), d = down.current; down.current = null; setDrag(null);
    if (!d) return;
    const b = idxAt(q.x, q.y);
    if (d.moved && Math.abs(b - d.a) >= 2 && p.zoom !== false && !horizontal) { const lo2 = Math.min(d.a, b), hi2 = Math.max(d.a, b); onRange([i0 + lo2, i0 + hi2]); return; }
    const pt = pts[b]; if (pt) onSelect(pt);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { setHover((h) => Math.min(n - 1, (h ?? -1) + 1)); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { setHover((h) => Math.max(0, (h ?? n) - 1)); e.preventDefault(); }
    else if ((e.key === 'Enter' || e.key === ' ') && hover !== null) { const pt = pts[hover]; if (pt) onSelect(pt); e.preventDefault(); }
    else if (e.key === 'Escape') { setHover(null); onRange(null); }
    if (hover !== null && (e.key.startsWith('Arrow'))) setTipPos({ x: horizontal ? W / 2 : X(Math.min(n - 1, Math.max(0, hover))), y: T + 8 });
  };
  const dim = (pt: Pt, i: number) => (active !== undefined && active !== pt.key ? 0.3 : hover !== null && hover !== i ? 0.5 : 1);
  const refColor = (k: string) => (k === 'target' ? COLOR.target : k === 'sla' ? COLOR.sla : k === 'threshold' ? COLOR.threshold : k === 'forecast' ? cat(2, comp.style.accent) : COLOR.avg);

  /* ---- marcas ---- */
  const linePath = (get: (q: Pt) => number | undefined, stepped = false) => {
    const seq = pts.map((q, i) => ({ i, v: get(q) })).filter((q): q is { i: number; v: number } => q.v != null);
    return seq.map((q, j) => (j === 0 ? `M${X(q.i).toFixed(1)} ${Y(q.v).toFixed(1)}` : stepped ? `H${X(q.i).toFixed(1)}V${Y(q.v).toFixed(1)}` : `L${X(q.i).toFixed(1)} ${Y(q.v).toFixed(1)}`)).join(' ');
  };
  const seriesList = p.series ? keys : [undefined];
  const marks: React.ReactNode[] = [];
  if (kind === 'bar' || kind === 'combo' || kind === 'stacked' || kind === 'stacked100' || kind === 'grouped') {
    const slot = iw / Math.max(1, n), bw = Math.max(2, slot * (kind === 'grouped' ? 0.78 : 0.62));
    pts.forEach((pt, i) => {
      const cx = X(i), op = dim(pt, i), tot = sumOf(pt) || 1;
      if (usePrev && pt.prev != null && !stack && !grouped) marks.push(<rect key={`pv${i}`} x={cx - bw / 2 - 2} y={Y(Math.max(0, pt.prev))} width={bw + 4} height={Math.max(0, Y(0) - Y(Math.max(0, pt.prev)))} rx={2} className="vz-ghost" style={{ opacity: op }} />);
      if (!p.series) marks.push(<rect key={`b${i}`} x={cx - bw / 2} y={Y(Math.max(0, pt.value))} width={bw} height={Math.max(0, Math.abs(Y(0) - Y(pt.value)))} rx={Math.min(3, bw / 3)} className={`vz-grow-y${pt.partial ? ' vz-partial' : ''}`} style={{ fill: colorOf(undefined, i), opacity: op * (pt.partial ? 0.62 : 1), ['--i' as string]: Math.min(i, 30) }} />);
      else if (grouped) keys.forEach((s, j) => { const w = bw / keys.length, v = pt.series[s] ?? 0; marks.push(<rect key={`g${i}${s}`} x={cx - bw / 2 + j * w + 0.5} y={Y(Math.max(0, v))} width={Math.max(1, w - 1)} height={Math.max(0, Math.abs(Y(0) - Y(v)))} rx={2} className="vz-grow-y" style={{ fill: colorOf(s, i), opacity: op, ['--i' as string]: Math.min(i, 30) }} />); });
      else { let acc = 0; keys.forEach((s) => { const raw = pt.series[s] ?? 0, v = kind === 'stacked100' ? (raw / tot) * 100 : raw, y1 = Y(acc + v), y0 = Y(acc); acc += v; marks.push(<rect key={`s${i}${s}`} x={cx - bw / 2} y={y1} width={bw} height={Math.max(0, y0 - y1)} className="vz-grow-y" style={{ fill: colorOf(s, i), opacity: op, ['--i' as string]: Math.min(i, 30) }} />); }); }
      if (useTarget && pt.target != null) marks.push(<line key={`t${i}`} x1={cx - bw / 2 - 3} x2={cx + bw / 2 + 3} y1={Y(pt.target)} y2={Y(pt.target)} className="vz-target" style={{ opacity: op }} />);
      if (p.labels && bw > 20 && !p.series) marks.push(<text key={`l${i}`} x={cx} y={Y(Math.max(0, pt.value)) - 5} textAnchor="middle" className="vz-val">{fmtY(pt.value)}</text>);
    });
  }
  if (kind === 'waterfall') {
    const slot = iw / Math.max(1, n), bw = Math.max(4, slot * 0.64);
    pts.forEach((pt, i) => {
      const a = Y(pt.start ?? 0), b = Y(pt.end ?? 0), up = (pt.end ?? 0) >= (pt.start ?? 0), cx = X(i), prevEnd = i > 0 ? pts[i - 1]!.end : undefined;
      if (prevEnd != null) marks.push(<line key={`c${i}`} x1={X(i - 1) + bw / 2} x2={cx - bw / 2} y1={Y(prevEnd)} y2={Y(prevEnd)} className="vz-conn" />);
      marks.push(<rect key={`w${i}`} x={cx - bw / 2} y={Math.min(a, b)} width={bw} height={Math.max(1.5, Math.abs(a - b))} rx={2} className="vz-grow-y" style={{ fill: pt.total ? cat(0, comp.style.accent) : up ? COLOR.up : COLOR.down, opacity: dim(pt, i), ['--i' as string]: i }} />);
      if (p.labels !== false && bw > 22) marks.push(<text key={`wl${i}`} x={cx} y={Math.min(a, b) - 5} textAnchor="middle" className="vz-val">{pt.total ? fmtY(pt.end ?? 0) : `${pt.value >= 0 ? '+' : '−'}${fmtY(Math.abs(pt.value))}`}</text>);
    });
  }
  if (line) {
    seriesList.forEach((s, si) => {
      const get = (q: Pt) => (s ? q.series[s] : q.value), color = colorOf(s, 0), path = linePath(get, kind === 'step'), pa = pts.map((q, i) => ({ i, v: get(q) })).filter((q): q is { i: number; v: number } => q.v != null);
      if (kind === 'area' && pa.length > 1) marks.push(<path key={`a${si}`} d={`${path} L${X(pa.at(-1)!.i)} ${Y(Math.max(yLo, 0))} L${X(pa[0]!.i)} ${Y(Math.max(yLo, 0))} Z`} style={{ fill: color, fillOpacity: s ? 0.1 : 0.16 }} />);
      marks.push(<path key={`ln${si}`} d={path} pathLength={1} className="vz-draw" style={{ fill: 'none', stroke: color, strokeWidth: 2, strokeLinejoin: 'round' }} />);
    });
  }
  if (kind === 'combo' && t2) {
    const d = pts.map((q, i) => (q.y2 != null ? `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y2(q.y2).toFixed(1)}` : '')).join(' ');
    marks.push(<path key="y2" d={d} fill="none" className="vz-draw" style={{ stroke: cat(2, comp.style.accent), strokeWidth: 2.2 }} />);
  }
  if (usePrev && (line || kind === 'combo' && false)) marks.push(<path key="prev" d={linePath((q) => q.prev)} fill="none" className="vz-prev" />);
  if (useTarget && line) marks.push(<path key="tgt" d={linePath((q) => q.target, true)} fill="none" className="vz-target-line" />);
  if (pts.some((q) => q.ma != null)) marks.push(<path key="ma" d={linePath((q) => q.ma)} fill="none" className="vz-ma" />);
  if (kind === 'sparkbars') pts.forEach((pt, i) => marks.push(<rect key={`sp${i}`} x={X(i) - Math.max(1, (iw / n) * .35)} y={Y(pt.value)} width={Math.max(1.5, (iw / n) * .7)} height={Math.max(1, Y(0) - Y(pt.value))} rx={1} style={{ fill: cat(0, comp.style.accent), opacity: i === n - 1 ? 1 : .55 }} />));

  /* ---- horizontais ---- */
  const hMarks: React.ReactNode[] = [];
  if (horizontal) pts.forEach((pt, i) => {
    const y0 = T + i * rh, op = dim(pt, i);
    if (kind === 'bullet') {
      const t = pt.target ?? pt.value, bh = rh * 0.62, by = y0 + (rh - bh) / 2, edge = (r: number) => HX(t * r);
      hMarks.push(<g key={`bl${i}`} style={{ opacity: op }}><rect x={L} y={by} width={Math.max(0, edge(0.6) - L)} height={bh} className="vz-band-1" /><rect x={edge(0.6)} y={by} width={Math.max(0, edge(0.9) - edge(0.6))} height={bh} className="vz-band-2" /><rect x={edge(0.9)} y={by} width={Math.max(0, edge(1.15) - edge(0.9))} height={bh} className="vz-band-3" />
        <rect x={L} y={by + bh * 0.32} width={Math.max(0, HX(pt.value) - HX(0))} height={bh * 0.36} rx={2} className="vz-grow-x" style={{ fill: pt.value >= t ? COLOR.up : cat(0, comp.style.accent) }} /><line x1={HX(t)} x2={HX(t)} y1={by - 2} y2={by + bh + 2} className="vz-target" /></g>);
      if (p.labels) hMarks.push(<text key={`bv${i}`} x={W - R} y={y0 + rh / 2 + 4} textAnchor="end" className="vz-val">{fmtY(pt.value)} · {fmt((pt.value / (t || 1)) * 100, 'pct')}</text>);
    } else {
      const bh = rh * 0.64, by = y0 + (rh - bh) / 2;
      if (p.series) { let acc = 0; keys.forEach((s) => { const v = pt.series[s] ?? 0; hMarks.push(<rect key={`h${i}${s}`} x={HX(acc)} y={by} width={Math.max(0, HX(acc + v) - HX(acc))} height={bh} rx={2} className="vz-grow-x" style={{ fill: colorOf(s, i), opacity: op, ['--i' as string]: i }} />); acc += v; }); }
      else hMarks.push(<rect key={`h${i}`} x={Math.min(HX(0), HX(pt.value))} y={by} width={Math.abs(HX(pt.value) - HX(0))} height={bh} rx={2} className="vz-grow-x" style={{ fill: colorOf(undefined, i), opacity: op, ['--i' as string]: i }} />);
      if (usePrev && pt.prev != null) hMarks.push(<line key={`hp${i}`} x1={HX(pt.prev)} x2={HX(pt.prev)} y1={by - 2} y2={by + bh + 2} className="vz-prev-tick" />);
      if (useTarget && pt.target != null) hMarks.push(<line key={`ht${i}`} x1={HX(pt.target)} x2={HX(pt.target)} y1={by - 3} y2={by + bh + 3} className="vz-target" />);
      if (p.labels) hMarks.push(<text key={`hv${i}`} x={Math.max(HX(0), HX(sumOf(pt))) + 6} y={y0 + rh / 2 + 4} className="vz-val">{fmtY(sumOf(pt))}</text>);
    }
  });

  /* ---- composição ---- */
  const yTicks = ticks.filter((t) => t >= yLo - 1e-9 && t <= yHi + 1e-9);
  const sel = pts.findIndex((q) => active !== undefined && q.key === active);
  const brushPts = withBrush ? all : [];
  const bmax = Math.max(1, ...brushPts.map((q) => q.value));
  const bx = (i: number) => L + (iw * i) / Math.max(1, all.length - 1);
  return (
    <div className="vz-cartesian">
      <svg ref={ref} width={W} height={H} className="vz-svg" role="img" tabIndex={0} aria-label={`${kind}: ${pts.slice(0, 12).map((q) => `${q.label} ${fmtY(q.value)}`).join(', ')}`} onKeyDown={onKey} onFocus={() => hover === null && setHover(0)} onBlur={() => setHover(null)}
        onPointerMove={onMove} onPointerLeave={() => { if (!down.current) setHover(null); }} onPointerDown={onDown} onPointerUp={onUp}>
        {horizontal ? (
          <>{yTicks.map((t) => <g key={t}><line x1={HX(t)} x2={HX(t)} y1={T} y2={H - B} className="vz-grid" /><text x={HX(t)} y={H - B + 14} textAnchor="middle" className="vz-axis">{fmtY(t)}</text></g>)}
            {pts.map((pt, i) => <text key={`hl${i}`} x={L - 8} y={T + i * rh + rh / 2 + 4} textAnchor="end" className="vz-lbl" style={{ opacity: dim(pt, i) }}>{trunc(pt.label, 24)}</text>)}{hMarks}</>
        ) : (
          <>{yTicks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className={t === 0 ? 'vz-zero' : 'vz-grid'} /><text x={L - 6} y={Y(t) + 3} textAnchor="end" className="vz-axis">{kind === 'stacked100' ? `${t}%` : fmtY(t)}</text></g>)}
            {t2 && t2.ticks.map((t) => <text key={`r${t}`} x={W - R + 6} y={Y2(t) + 3} className="vz-axis vz-axis-r">{fmtY2(t)}</text>)}
            {pts.map((pt, i) => (i % every === 0 ? <text key={`x${String(pt.key)}`} x={X(i)} y={H - B + 15} textAnchor="middle" className="vz-axis">{trunc(pt.label, 12)}</text> : null))}
            {marks}</>
        )}
        {!horizontal && refs.map(({ r, v }) => <g key={r.id} className="vz-ref"><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={refColor(r.kind)} strokeDasharray={r.kind === 'forecast' || r.kind === 'avg' ? '5 4' : '2 3'} /><text x={W - R - 4} y={Y(v) - 4} textAnchor="end" style={{ fill: refColor(r.kind) }}>{r.label || REF_LABEL[r.kind]} · {fmtY(v)}</text></g>)}
        {horizontal && refs.map(({ r, v }) => <g key={r.id} className="vz-ref"><line x1={HX(v)} x2={HX(v)} y1={T} y2={H - B} stroke={refColor(r.kind)} strokeDasharray="5 4" /><text x={HX(v) + 4} y={T + 9} style={{ fill: refColor(r.kind) }}>{r.label || REF_LABEL[r.kind]} · {fmtY(v)}</text></g>)}
        {!horizontal && model.isTime && (p.notes ?? []).map((a) => { const i = nearest(a.at); if (a.at < Number(pts[0]?.key) - 15 * 86_400_000 || a.at > Number(pts.at(-1)?.key) + 15 * 86_400_000) return null; const cx = X(i), tone = a.tone === 'danger' ? COLOR.down : a.tone === 'warning' ? COLOR.threshold : 'var(--accent)'; return <g key={a.id} className="vz-note"><line x1={cx} x2={cx} y1={T + 14} y2={T + ih} stroke={tone} strokeDasharray="2 3" /><g transform={`translate(${cx} ${T + 6})`}><circle r="6" fill={tone} /><text y="3.4" textAnchor="middle" className="vz-note-i">!</text></g>{iw / Math.max(1, (p.notes ?? []).length) > 120 && <text x={cx + (cx > W - R - 150 ? -10 : 10)} y={T + 9} textAnchor={cx > W - R - 150 ? 'end' : 'start'} className="vz-note-t">{trunc(a.label, 34)}</text>}<title>{`${a.label} · ${pts[i]?.label}`}</title></g>; })}
        {!horizontal && hover !== null && pts[hover] && (line || kind === 'combo') && (
          <g pointerEvents="none"><line x1={X(hover)} x2={X(hover)} y1={T} y2={T + ih} className="vz-cross" />{seriesList.map((s, si) => { const v = s ? pts[hover]!.series[s] : pts[hover]!.value; return v != null ? <circle key={si} cx={X(hover)} cy={Y(v)} r={4.2} style={{ fill: 'var(--dash-widget-surface)', stroke: colorOf(s, 0), strokeWidth: 2 }} /> : null; })}</g>
        )}
        {!horizontal && hover !== null && band && pts[hover] && !line && <rect x={X(hover) - iw / n / 2} y={T} width={iw / n} height={ih} className="vz-hover-band" pointerEvents="none" />}
        {horizontal && hover !== null && <rect x={0} y={T + hover * rh} width={W} height={rh} className="vz-hover-band" pointerEvents="none" />}
        {sel >= 0 && !horizontal && <rect x={band ? X(sel) - iw / n / 2 : X(sel) - 1} y={T} width={band ? iw / n : 2} height={ih} className="vz-sel-band" pointerEvents="none" />}
        {drag && !horizontal && <rect x={Math.min(X(drag.a), X(drag.b))} y={T} width={Math.abs(X(drag.b) - X(drag.a))} height={ih} className="vz-drag" pointerEvents="none" />}
        {withBrush && (
          <g transform={`translate(0 ${H - 34})`} className="vz-brush">
            <path d={brushPts.map((q, i) => `${i ? 'L' : 'M'}${bx(i).toFixed(1)} ${(26 - (q.value / bmax) * 22).toFixed(1)}`).join(' ')} fill="none" className="vz-brush-line" />
            <rect x={bx(i0)} y={0} width={Math.max(4, bx(i1) - bx(i0))} height={28} className="vz-brush-win" /><rect x={L} y={28} width={iw} height={0} />
            <text x={L} y={38} className="vz-axis">{all[0]?.label}</text><text x={W - R} y={38} textAnchor="end" className="vz-axis">{all.at(-1)?.label}</text>
          </g>
        )}
      </svg>
      {tip && <RichTip tip={tip} width={W} />}
      {range && <button type="button" className="vz-reset" onClick={() => onRange(null)}>Redefinir zoom</button>}
      {!range && withBrush && <span className="vz-hint">Arraste no gráfico para ampliar o período</span>}
    </div>
  );
}
