import { useMemo, useState } from 'react';
import { aggregate, fmt, STATUS_LABEL, labelOf } from '../../data/query';
import { getField } from '../../data/registry';
import type { Row } from '../../data/types';
import type { ChartProps, Comp } from '../../editor/doc';
import { boxStats, histogram, refValue, REF_LABEL, summary, type Model } from './model';
import { cat, COLOR, fmtDelta, niceTicks, pctDelta, RichTip, statusColor, type TipData } from './ui';

export interface OtherProps { comp: Comp; model: Model; rows: Row[]; p: ChartProps; W: number; H: number; hidden: Set<string>; active: unknown; x: string; emit: (field: string, value: unknown, label: string) => void }
const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const useTip = () => { const [tip, setTip] = useState<TipData | null>(null); return { tip, show: (e: React.PointerEvent, t: Omit<TipData, 'x' | 'y'>) => { const r = (e.currentTarget as Element).closest('svg')!.getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top - 10, ...t }); }, hide: () => setTip(null) }; };

/* ---------------- Rosca ---------------- */
export function Donut({ comp, model, p, W, H, active, emit, x }: OtherProps) {
  const { tip, show, hide } = useTip(), [hv, setHv] = useState<number | null>(null), pts = model.pts.filter((q) => q.value > 0), total = pts.reduce((a, b) => a + b.value, 0) || 1;
  const r = Math.max(10, Math.min(W * 0.46, H) / 2 - 8), cx = Math.min(W / 2, r + 14), cy = H / 2, f = (v: number) => fmt(v, model.yf?.format, true);
  let a0 = -Math.PI / 2;
  const color = (k: unknown, i: number) => statusColor(k) ?? cat(i, comp.style.accent);
  const cur = hv !== null ? pts[hv] : undefined;
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Rosca: ${pts.map((d) => `${d.label} ${f(d.value)}`).join(', ')}`}>
      {pts.map((d, i) => {
        const a1 = a0 + (d.value / total) * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0, ri = r * 0.6, hot = hv === i, rr = hot ? r + 3 : r;
        const pt = (a: number, q: number) => `${cx + Math.cos(a) * q} ${cy + Math.sin(a) * q}`;
        const el = <path key={String(d.key)} d={`M${pt(a0, rr)} A${rr} ${rr} 0 ${large} 1 ${pt(a1, rr)} L${pt(a1, ri)} A${ri} ${ri} 0 ${large} 0 ${pt(a0, ri)} Z`} className="vz-mark" style={{ fill: color(d.key, i), opacity: active !== undefined && active !== d.key ? 0.3 : hv !== null && !hot ? 0.55 : 1, stroke: 'var(--dash-widget-surface)', strokeWidth: 1.5 }}
          onClick={() => emit(x, d.key, `${model.xf?.label ?? x}: ${d.label}`)} onPointerMove={(e) => { setHv(i); show(e, { title: d.label, rows: [{ label: model.yf?.label ?? 'Valor', value: f(d.value), color: color(d.key, i), strong: true }, { label: 'Participação', value: fmt(d.share * 100, 'pct') }] }); }} onPointerLeave={() => { setHv(null); hide(); }} />;
        a0 = a1;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="vz-big">{cur ? f(cur.value) : f(total)}</text>
      <text x={cx} y={cy + 15} textAnchor="middle" className="vz-axis">{cur ? `${trunc(cur.label, 16)} · ${fmt(cur.share * 100, 'pct')}` : 'total'}</text>
      {p.legend && W > r * 2 + 150 && pts.slice(0, 9).map((d, i) => (
        <g key={`k${String(d.key)}`} transform={`translate(${cx + r + 22}, ${cy - (Math.min(pts.length, 9) * 20) / 2 + i * 20 + 10})`} onClick={() => emit(x, d.key, `${model.xf?.label ?? x}: ${d.label}`)} className="vz-mark" style={{ opacity: active !== undefined && active !== d.key ? 0.35 : 1 }}>
          <rect width={10} height={10} y={-8} rx={2} style={{ fill: color(d.key, i) }} /><text x={16} className="vz-lbl">{trunc(d.label, 18)}</text><text x={W - cx - r - 34} textAnchor="end" className="vz-val">{fmt(d.share * 100, 'pct')}</text>
        </g>
      ))}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Medidor ---------------- */
export function Gauge({ comp, model, p, W, H }: OtherProps) {
  const value = model.total, targetPts = model.pts.filter((q) => q.target != null), target = targetPts.length ? targetPts.reduce((a, b) => a + (b.target ?? 0), 0) : (p.refs?.find((r) => r.kind === 'target')?.value ?? 0);
  const [lo, hi] = p.thresholds ?? [0.6, 0.9], ratio = target ? value / target : 0, max = Math.max(1, target * 1.25 || value * 1.25), f = (v: number) => fmt(v, model.yf?.format, true);
  const r = Math.min(W / 2 - 10, H - 40), cx = W / 2, cy = Math.min(H - 24, r + 18), ang = (v: number) => Math.PI + Math.min(1, v / max) * Math.PI, pt = (a: number, q: number) => [cx + Math.cos(a) * q, cy + Math.sin(a) * q] as const;
  const arc = (v0: number, v1: number, q0: number, q1: number) => { const [a, b, c, d] = [pt(ang(v0), q1), pt(ang(v1), q1), pt(ang(v1), q0), pt(ang(v0), q0)]; return `M${a} A${q1} ${q1} 0 0 1 ${b} L${c} A${q0} ${q0} 0 0 0 ${d} Z`; };
  const tone = ratio >= hi ? COLOR.up : ratio >= lo ? COLOR.threshold : COLOR.down;
  const [nx, ny] = pt(ang(value), r * 0.82);
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Medidor: ${f(value)}${target ? ` de ${f(target)}` : ''}`}>
      {target > 0 ? <><path d={arc(0, target * lo, r * 0.72, r)} style={{ fill: COLOR.down, opacity: 0.28 }} /><path d={arc(target * lo, target * hi, r * 0.72, r)} style={{ fill: COLOR.threshold, opacity: 0.28 }} /><path d={arc(target * hi, max, r * 0.72, r)} style={{ fill: COLOR.up, opacity: 0.28 }} /></> : <path d={arc(0, max, r * 0.72, r)} style={{ fill: 'var(--surface-sunken, var(--border-subtle))' }} />}
      <path d={arc(0, value, r * 0.72, r)} className="vz-grow-x" style={{ fill: tone }} />
      {target > 0 && <line x1={pt(ang(target), r * 0.66)[0]} y1={pt(ang(target), r * 0.66)[1]} x2={pt(ang(target), r * 1.05)[0]} y2={pt(ang(target), r * 1.05)[1]} className="vz-target" />}
      <line x1={cx} y1={cy} x2={nx} y2={ny} style={{ stroke: 'var(--text-primary)', strokeWidth: 2.5, strokeLinecap: 'round' }} /><circle cx={cx} cy={cy} r={5} style={{ fill: 'var(--text-primary)' }} />
      <text x={cx} y={cy - r * 0.32} textAnchor="middle" className="vz-big">{f(value)}</text>
      {target > 0 && <text x={cx} y={cy - r * 0.32 + 18} textAnchor="middle" className="vz-axis" style={{ fill: tone }}>{fmt(ratio * 100, 'pct')} da meta · {f(target)}</text>}
      <text x={cx - r} y={cy + 14} textAnchor="middle" className="vz-axis">0</text><text x={cx + r} y={cy + 14} textAnchor="middle" className="vz-axis">{f(max)}</text>
    </svg>
  );
}

/* ---------------- Funil ---------------- */
export function Funnel({ comp, model, W, H, active, emit, x }: OtherProps) {
  const { tip, show, hide } = useTip(), pts = model.pts, max = Math.max(1, ...pts.map((q) => q.value)), rh = Math.min(46, (H - 8) / Math.max(1, pts.length)), f = (v: number) => fmt(v, model.yf?.format, true), lw = Math.min(140, W * 0.28), iw = W - lw - 90;
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Funil: ${pts.map((q) => `${q.label} ${f(q.value)}`).join(', ')}`}>
      {pts.map((q, i) => {
        const w = (q.value / max) * iw, nxt = pts[i + 1], w2 = nxt ? (nxt.value / max) * iw : w * 0.78, y0 = 4 + i * rh, cx = lw + iw / 2, conv = i ? q.value / pts[i - 1]!.value : 1;
        return (
          <g key={String(q.key)} className="vz-mark" style={{ opacity: active !== undefined && active !== q.key ? 0.3 : 1 }} onClick={() => emit(x, q.key, `${model.xf?.label ?? x}: ${q.label}`)} onPointerMove={(e) => show(e, { title: q.label, rows: [{ label: model.yf?.label ?? 'Valor', value: f(q.value), strong: true, color: cat(i, comp.style.accent) }, { label: 'Do topo', value: fmt((q.value / pts[0]!.value) * 100, 'pct') }, ...(i ? [{ label: 'Da etapa anterior', value: fmt(conv * 100, 'pct') }, { label: 'Perda', value: f(pts[i - 1]!.value - q.value), tone: 'down' as const }] : [])] })} onPointerLeave={hide}>
            <path d={`M${cx - w / 2} ${y0} L${cx + w / 2} ${y0} L${cx + w2 / 2} ${y0 + rh - 3} L${cx - w2 / 2} ${y0 + rh - 3} Z`} style={{ fill: cat(i, comp.style.accent), opacity: 0.88 }} />
            <text x={lw - 10} y={y0 + rh / 2 + 3} textAnchor="end" className="vz-lbl">{trunc(q.label, 20)}</text><text x={cx} y={y0 + rh / 2 + 3} textAnchor="middle" className="vz-onmark">{f(q.value)}</text>
            <text x={W - 8} y={y0 + rh / 2 + 3} textAnchor="end" className="vz-val" style={{ fill: conv < 0.6 ? COLOR.down : undefined }}>{i ? fmt(conv * 100, 'pct') : '100%'}</text>
          </g>
        );
      })}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Treemap ---------------- */
interface Box { key: string; label: string; value: number; x: number; y: number; w: number; h: number; parent?: string }
function squarify(items: { key: string; label: string; value: number; parent?: string }[], x: number, y: number, w: number, h: number): Box[] {
  const out: Box[] = [], list = [...items].sort((a, b) => b.value - a.value), total = list.reduce((a, b) => a + b.value, 0) || 1;
  let rest = list.map((i) => ({ ...i, area: (i.value / total) * w * h })), cx = x, cy = y, cw = w, ch = h;
  const worst = (row: typeof rest, side: number) => { const s = row.reduce((a, b) => a + b.area, 0), mx = Math.max(...row.map((r) => r.area)), mn = Math.min(...row.map((r) => r.area)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  while (rest.length) {
    const side = Math.min(cw, ch), row = [rest[0]!]; let i = 1;
    while (i < rest.length && worst([...row, rest[i]!], side) <= worst(row, side)) row.push(rest[i++]!);
    const s = row.reduce((a, b) => a + b.area, 0);
    if (cw >= ch) { const rw = s / ch; let yy = cy; for (const r of row) { const hh = r.area / rw; out.push({ ...r, x: cx, y: yy, w: rw, h: hh }); yy += hh; } cx += rw; cw -= rw; }
    else { const rhh = s / cw; let xx = cx; for (const r of row) { const ww = r.area / rhh; out.push({ ...r, x: xx, y: cy, w: ww, h: rhh }); xx += ww; } cy += rhh; ch -= rhh; }
    rest = rest.slice(row.length);
  }
  return out;
}
export function Treemap({ comp, model, rows, p, W, H, active, emit, x }: OtherProps) {
  const { tip, show, hide } = useTip(), f = (v: number) => fmt(v, model.yf?.format, true);
  const boxes = useMemo(() => {
    const top = squarify(model.pts.filter((q) => q.value > 0).map((q) => ({ key: String(q.key), label: q.label, value: q.value })), 0, 0, W, H);
    if (!p.series) return { top, kids: [] as Box[] };
    const kids = top.flatMap((t) => {
      const sub = aggregate(rows.filter((r) => String(r[x]) === t.key), { ds: comp.data!.dataset, table: comp.data!.table, groupBy: p.series, measure: p.y, agg: p.agg, sort: 'value' }).filter((s) => s.value > 0);
      return squarify(sub.map((s) => ({ key: `${t.key}¦${String(s.key)}`, label: s.label, value: s.value, parent: t.key })), t.x + 2, t.y + 18, Math.max(1, t.w - 4), Math.max(1, t.h - 20));
    });
    return { top, kids };
  }, [model.pts, rows, p, W, H, x, comp.data]);
  const idx = (k: string) => model.pts.findIndex((q) => String(q.key) === k);
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Treemap: ${model.pts.map((q) => `${q.label} ${f(q.value)}`).join(', ')}`}>
      {boxes.top.map((b) => { const i = idx(b.key), pt = model.pts[i]!; return (
        <g key={b.key} className="vz-mark" style={{ opacity: active !== undefined && active !== pt.key ? 0.3 : 1 }} onClick={() => emit(x, pt.key, `${model.xf?.label ?? x}: ${pt.label}`)} onPointerMove={(e) => show(e, { title: pt.label, rows: [{ label: model.yf?.label ?? 'Valor', value: f(pt.value), strong: true, color: cat(i, comp.style.accent) }, { label: 'Participação', value: fmt(pt.share * 100, 'pct') }] })} onPointerLeave={hide}>
          <rect x={b.x + 1} y={b.y + 1} width={Math.max(0, b.w - 2)} height={Math.max(0, b.h - 2)} rx={3} style={{ fill: cat(i, comp.style.accent), opacity: p.series ? 0.25 : 0.9 }} />
          {b.w > 54 && b.h > 18 && <text x={b.x + 7} y={b.y + 14} className={p.series ? 'vz-lbl' : 'vz-onmark vz-left'}>{trunc(pt.label, Math.floor(b.w / 7))}{!p.series && b.h > 34 ? ` · ${fmt(pt.share * 100, 'pct')}` : ''}</text>}
        </g>); })}
      {boxes.kids.map((b) => { const i = idx(b.parent!); return (
        <g key={b.key} className="vz-mark" onPointerMove={(e) => show(e, { title: `${model.pts[i]?.label} › ${b.label}`, rows: [{ label: model.yf?.label ?? 'Valor', value: f(b.value), strong: true, color: cat(i, comp.style.accent) }, { label: `Do ${model.pts[i]?.label}`, value: fmt((b.value / (model.pts[i]?.value || 1)) * 100, 'pct') }] })} onPointerLeave={hide}>
          <rect x={b.x} y={b.y} width={Math.max(0, b.w - 1.5)} height={Math.max(0, b.h - 1.5)} rx={2} style={{ fill: cat(i, comp.style.accent), opacity: 0.55 + 0.35 * ((b.value / (model.pts[i]?.value || 1))) }} />
          {b.w > 46 && b.h > 14 && <text x={b.x + 5} y={b.y + 12} className="vz-onmark vz-left">{trunc(b.label, Math.floor(b.w / 6.5))}</text>}
        </g>); })}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Sankey ---------------- */
export function Sankey({ comp, rows, p, W, H, x, emit }: OtherProps) {
  const { tip, show, hide } = useTip(), [hv, setHv] = useState<string | null>(null);
  const ds = comp.data!.dataset, table = comp.data!.table, f = (v: number) => fmt(v, getField(ds, table, p.y)?.format, true);
  const links = useMemo(() => aggregate(rows, { ds, table, groupBy: x, series: p.series, measure: p.y, agg: p.agg, sort: 'none' }).filter((s) => s.value > 0 && s.series), [rows, ds, table, x, p]);
  const left = [...new Map(links.map((l) => [String(l.key), l.label])).entries()].map(([k, label]) => ({ k, label, v: links.filter((l) => String(l.key) === k).reduce((a, b) => a + b.value, 0) })).sort((a, b) => b.v - a.v);
  const right = [...new Set(links.map((l) => l.series!))].map((k) => ({ k, label: STATUS_LABEL[k] ?? k, v: links.filter((l) => l.series === k).reduce((a, b) => a + b.value, 0) })).sort((a, b) => b.v - a.v);
  const total = left.reduce((a, b) => a + b.v, 0) || 1, pad = 8, nw = 14, lw = Math.min(110, W * 0.22), usable = H - 8 - pad * Math.max(left.length, right.length), k = usable / total;
  let ly = 4; const lpos = new Map(left.map((n) => { const y = ly; ly += n.v * k + pad; return [n.k, { y, h: n.v * k, off: 0 }]; }));
  let ry = 4; const rpos = new Map(right.map((n) => { const y = ry; ry += n.v * k + pad; return [n.k, { y, h: n.v * k, off: 0 }]; }));
  const x0 = lw, x1 = W - lw;
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Sankey: ${links.length} fluxos`}>
      {links.map((l, i) => {
        const a = lpos.get(String(l.key))!, b = rpos.get(l.series!)!, h = l.value * k, ay = a.y + a.off, by = b.y + b.off; a.off += h; b.off += h;
        const id = `${String(l.key)}→${l.series}`, on = hv === null || hv === id || hv === String(l.key) || hv === l.series;
        return <path key={id} d={`M${x0 + nw} ${ay} C${(x0 + x1) / 2} ${ay} ${(x0 + x1) / 2} ${by} ${x1} ${by} L${x1} ${by + h} C${(x0 + x1) / 2} ${by + h} ${(x0 + x1) / 2} ${ay + h} ${x0 + nw} ${ay + h} Z`} className="vz-mark" style={{ fill: cat(left.findIndex((n) => n.k === String(l.key)), comp.style.accent), opacity: on ? 0.5 : 0.1 }} onPointerMove={(e) => { setHv(id); show(e, { title: `${l.label} → ${STATUS_LABEL[l.series!] ?? l.series}`, rows: [{ label: 'Fluxo', value: f(l.value), strong: true }, { label: 'Da origem', value: fmt((l.value / (left.find((n) => n.k === String(l.key))?.v ?? 1)) * 100, 'pct') }, { label: 'Do destino', value: fmt((l.value / (right.find((n) => n.k === l.series)?.v ?? 1)) * 100, 'pct') }] }); }} onPointerLeave={() => { setHv(null); hide(); }} onClick={() => emit(x, l.key, `${getField(ds, table, x)?.label}: ${l.label}`)} />;
      })}
      {left.map((n, i) => { const q = lpos.get(n.k)!; return <g key={n.k} onPointerEnter={() => setHv(n.k)} onPointerLeave={() => setHv(null)}><rect x={x0} y={q.y} width={nw} height={Math.max(2, q.h)} rx={2} style={{ fill: cat(i, comp.style.accent) }} /><text x={x0 - 6} y={q.y + q.h / 2 + 4} textAnchor="end" className="vz-lbl">{trunc(n.label, 16)}</text></g>; })}
      {right.map((n) => { const q = rpos.get(n.k)!; return <g key={n.k} onPointerEnter={() => setHv(n.k)} onPointerLeave={() => setHv(null)}><rect x={x1} y={q.y} width={nw} height={Math.max(2, q.h)} rx={2} style={{ fill: 'var(--text-muted)' }} /><text x={x1 + nw + 6} y={q.y + q.h / 2 + 4} className="vz-lbl">{trunc(n.label, 16)}</text></g>; })}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Histograma e box plot ---------------- */
export function Histogram({ comp, rows, p, W, H }: OtherProps) {
  const { tip, show, hide } = useTip(), [hv, setHv] = useState<number | null>(null), field = getField(comp.data!.dataset, comp.data!.table, p.x), values = useMemo(() => rows.map((r) => Number(r[p.x])).filter(Number.isFinite), [rows, p.x]);
  const bins = p.bins ?? 14, h = useMemo(() => histogram(values, bins), [values, bins]), sm = useMemo(() => summary(values), [values]);
  const L = 44, B = 26, T = 10, R = 12, iw = W - L - R, ih = H - T - B, { ticks, hi } = niceTicks(0, Math.max(...h.counts, 1), 5), lo = h.edges[0] ?? 0, up = h.edges.at(-1) ?? 1, X = (v: number) => L + ((v - lo) / (up - lo || 1)) * iw, Y = (v: number) => T + ih - (v / hi) * ih;
  const f = (v: number) => fmt(v, field?.format, true);
  const lines = (p.refs ?? []).map((r) => ({ r, v: r.kind === 'avg' ? sm.avg : r.kind === 'median' ? sm.median : r.value })).filter((q): q is { r: typeof q.r; v: number } => q.v != null);
  if (!values.length) return null;
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Histograma de ${field?.label}: ${values.length} valores, média ${f(sm.avg)}`}>
      {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="vz-grid" /><text x={L - 6} y={Y(t) + 3} textAnchor="end" className="vz-axis">{t}</text></g>)}
      {h.counts.map((c, i) => <rect key={i} x={X(h.edges[i]!) + 1} y={Y(c)} width={Math.max(1, X(h.edges[i + 1]!) - X(h.edges[i]!) - 2)} height={Math.max(0, Y(0) - Y(c))} rx={2} className="vz-grow-y" style={{ fill: cat(0, comp.style.accent), opacity: hv === null || hv === i ? 1 : 0.45, ['--i' as string]: i }} onPointerMove={(e) => { setHv(i); show(e, { title: `${f(h.edges[i]!)} – ${f(h.edges[i + 1]!)}`, rows: [{ label: 'Quantidade', value: c.toLocaleString('pt-BR'), strong: true, color: cat(0, comp.style.accent) }, { label: 'Participação', value: fmt((c / values.length) * 100, 'pct') }] }); }} onPointerLeave={() => { setHv(null); hide(); }} />)}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <text key={t} x={L + iw * t} y={H - 8} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'} className="vz-axis">{f(lo + (up - lo) * t)}</text>)}
      {lines.map(({ r, v }) => <g key={r.id} className="vz-ref"><line x1={X(v)} x2={X(v)} y1={T} y2={T + ih} stroke={r.kind === 'avg' ? COLOR.avg : COLOR.target} strokeDasharray="5 4" /><text x={X(v) + 4} y={T + 10} style={{ fill: r.kind === 'avg' ? COLOR.avg : COLOR.target }}>{r.label || REF_LABEL[r.kind]} · {f(v)}</text></g>)}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}
export function BoxPlot({ comp, rows, p, W, H, x, active, emit }: OtherProps) {
  const { tip, show, hide } = useTip(), ds = comp.data!.dataset, table = comp.data!.table, yf = getField(ds, table, p.y), xf = getField(ds, table, x);
  const groups = useMemo(() => { const m = new Map<string, number[]>(); for (const r of rows) { const k = String(r[x]), v = Number(r[p.y]); if (Number.isFinite(v)) (m.get(k) ?? m.set(k, []).get(k)!).push(v); } return [...m.entries()].map(([k, v]) => ({ k, s: boxStats(v), n: v.length })).sort((a, b) => b.s.median - a.s.median).slice(0, p.limit || 12); }, [rows, x, p.y, p.limit]);
  const L = 52, B = 36, T = 10, R = 12, iw = W - L - R, ih = H - T - B, all = groups.flatMap((g) => [g.s.whiskerLo, g.s.whiskerHi, ...g.s.outliers]), { ticks, lo, hi } = niceTicks(Math.min(0, ...all), Math.max(...all, 1), 5), Y = (v: number) => T + ih - ((v - lo) / (hi - lo || 1)) * ih, slot = iw / Math.max(1, groups.length), bw = Math.min(46, slot * 0.5), f = (v: number) => fmt(v, yf?.format, true);
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Box plot de ${yf?.label} por ${xf?.label}`}>
      {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="vz-grid" /><text x={L - 6} y={Y(t) + 3} textAnchor="end" className="vz-axis">{f(t)}</text></g>)}
      {groups.map((g, i) => { const cx = L + slot * (i + 0.5), c = cat(i, comp.style.accent), dimmed = active !== undefined && active !== g.k; return (
        <g key={g.k} className="vz-mark" style={{ opacity: dimmed ? 0.3 : 1 }} onClick={() => emit(x, g.k, `${xf?.label}: ${g.k}`)} onPointerMove={(e) => show(e, { title: labelOf(g.k, xf), sub: `${g.n.toLocaleString('pt-BR')} observações`, rows: [{ label: 'Mediana', value: f(g.s.median), strong: true, color: c }, { label: 'Q1 – Q3', value: `${f(g.s.q1)} – ${f(g.s.q3)}` }, { label: 'Mín – Máx', value: `${f(g.s.min)} – ${f(g.s.max)}`, tone: 'muted' }, { label: 'Média', value: f(g.s.avg), tone: 'muted' }, { label: 'Outliers', value: String(g.s.outliers.length), tone: g.s.outliers.length ? 'down' : 'muted' }] })} onPointerLeave={hide}>
          <rect x={cx - slot / 2} y={T} width={slot} height={ih} fill="transparent" />
          <line x1={cx} x2={cx} y1={Y(g.s.whiskerHi)} y2={Y(g.s.whiskerLo)} style={{ stroke: c, strokeWidth: 1.5 }} /><line x1={cx - bw / 4} x2={cx + bw / 4} y1={Y(g.s.whiskerHi)} y2={Y(g.s.whiskerHi)} style={{ stroke: c }} /><line x1={cx - bw / 4} x2={cx + bw / 4} y1={Y(g.s.whiskerLo)} y2={Y(g.s.whiskerLo)} style={{ stroke: c }} />
          <rect x={cx - bw / 2} y={Y(g.s.q3)} width={bw} height={Math.max(2, Y(g.s.q1) - Y(g.s.q3))} rx={3} style={{ fill: c, fillOpacity: 0.32, stroke: c, strokeWidth: 1.5 }} /><line x1={cx - bw / 2} x2={cx + bw / 2} y1={Y(g.s.median)} y2={Y(g.s.median)} style={{ stroke: 'var(--text-primary)', strokeWidth: 2 }} />
          <circle cx={cx} cy={Y(g.s.avg)} r={3} style={{ fill: 'var(--dash-widget-surface)', stroke: c, strokeWidth: 1.5 }} />
          {g.s.outliers.slice(0, 20).map((o, j) => <circle key={j} cx={cx + ((j % 5) - 2) * 2.5} cy={Y(o)} r={2.2} style={{ fill: c, fillOpacity: 0.55 }} />)}
          <text x={cx} y={H - B + 14} textAnchor="middle" className="vz-axis">{trunc(labelOf(g.k, xf), Math.max(6, Math.floor(slot / 6.5)))}</text>
        </g>); })}
      {(p.refs ?? []).map((r) => r.value != null ? <g key={r.id} className="vz-ref"><line x1={L} x2={W - R} y1={Y(r.value)} y2={Y(r.value)} stroke={COLOR.target} strokeDasharray="5 4" /><text x={W - R - 4} y={Y(r.value) - 4} textAnchor="end" style={{ fill: COLOR.target }}>{r.label || REF_LABEL[r.kind]} · {f(r.value)}</text></g> : null)}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Dispersão e bolhas ---------------- */
export function Scatter({ comp, rows, p, W, H, active, emit }: OtherProps) {
  const { tip, show, hide } = useTip(), ds = comp.data!.dataset, table = comp.data!.table, xf = getField(ds, table, p.x), yf = getField(ds, table, p.y), sf = p.y2 ? getField(ds, table, p.y2) : undefined, bubble = p.kind === 'bubble' && !!sf;
  const pts = useMemo(() => rows.slice(0, 1800).map((r) => ({ id: r.id ?? r.nome, label: String(r.nome ?? r.id), x: Number(r[p.x]), y: Number(r[p.y]), s: bubble ? Number(r[p.y2!]) : 0, g: p.series ? String(r[p.series]) : undefined })).filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y)), [rows, p, bubble]);
  const L = 52, B = 28, T = 10, R = 14, iw = W - L - R, ih = H - T - B, tx = niceTicks(Math.min(0, ...pts.map((q) => q.x)), Math.max(...pts.map((q) => q.x), 1), 5), ty = niceTicks(Math.min(0, ...pts.map((q) => q.y)), Math.max(...pts.map((q) => q.y), 1), 5);
  const X = (v: number) => L + ((v - tx.lo) / (tx.hi - tx.lo || 1)) * iw, Y = (v: number) => T + ih - ((v - ty.lo) / (ty.hi - ty.lo || 1)) * ih, smax = Math.max(1, ...pts.map((q) => q.s)), groups = [...new Set(pts.map((q) => q.g).filter(Boolean))] as string[];
  const fx = (v: number) => fmt(v, xf?.format, true), fy = (v: number) => fmt(v, yf?.format, true), colorOf = (g?: string) => (g ? statusColor(g) ?? cat(groups.indexOf(g), comp.style.accent) : cat(0, comp.style.accent));
  const radius = (q: { s: number }) => (bubble ? 3 + Math.sqrt(q.s / smax) * 15 : pts.length > 600 ? 2.6 : 3.4);
  const reg = (p.refs ?? []).some((r) => r.kind === 'forecast') && pts.length > 2 ? (() => { const n = pts.length, mx = pts.reduce((a, b) => a + b.x, 0) / n, my = pts.reduce((a, b) => a + b.y, 0) / n; let num = 0, den = 0; for (const q of pts) { num += (q.x - mx) * (q.y - my); den += (q.x - mx) ** 2; } const m = num / (den || 1), b = my - m * mx, sxy = Math.sqrt(pts.reduce((a, q) => a + (q.y - my) ** 2, 0) * den) || 1; return { m, b, r: num / sxy }; })() : null;
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`${bubble ? 'Bolhas' : 'Dispersão'} de ${yf?.label} por ${xf?.label}: ${pts.length} pontos`}>
      {ty.ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="vz-grid" /><text x={L - 6} y={Y(t) + 3} textAnchor="end" className="vz-axis">{fy(t)}</text></g>)}
      {tx.ticks.map((t) => <text key={t} x={X(t)} y={H - 10} textAnchor="middle" className="vz-axis">{fx(t)}</text>)}
      <text x={L + iw / 2} y={H - 0} textAnchor="middle" className="vz-axis-title">{xf?.label}</text>
      {[...pts].sort((a, b) => b.s - a.s).map((q, i) => <circle key={i} cx={X(q.x)} cy={Y(q.y)} r={radius(q)} className="vz-mark" style={{ fill: colorOf(q.g), fillOpacity: active !== undefined && active !== q.id ? 0.1 : bubble ? 0.5 : pts.length > 600 ? 0.4 : 0.7, stroke: bubble ? colorOf(q.g) : 'none' }} onClick={() => emit('id', q.id, q.label)}
        onPointerMove={(e) => show(e, { title: q.label, sub: q.g, rows: [{ label: xf?.label ?? 'X', value: fx(q.x) }, { label: yf?.label ?? 'Y', value: fy(q.y), strong: true, color: colorOf(q.g) }, ...(bubble ? [{ label: sf!.label, value: fmt(q.s, sf!.format, true) }] : [])] })} onPointerLeave={hide} />)}
      {reg && <g className="vz-ref"><line x1={X(tx.lo)} y1={Y(reg.m * tx.lo + reg.b)} x2={X(tx.hi)} y2={Y(reg.m * tx.hi + reg.b)} stroke={COLOR.target} strokeDasharray="6 4" strokeWidth="1.6" /><text x={W - R - 4} y={T + 12} textAnchor="end" style={{ fill: COLOR.target }}>tendência · r = {reg.r.toFixed(2).replace('.', ',')}</text></g>}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}

/* ---------------- Tabela de calor e calendário ---------------- */
export function HeatTable({ comp, rows, p, W, H, x, active, emit }: OtherProps) {
  const { tip, show, hide } = useTip(), ds = comp.data!.dataset, table = comp.data!.table, yf = getField(ds, table, p.y), xf = getField(ds, table, x), cf = p.series ? getField(ds, table, p.series) : undefined;
  const cells = useMemo(() => aggregate(rows, { ds, table, groupBy: x, series: p.series, measure: p.y, agg: p.agg, sort: 'label', grain: p.grain }), [rows, ds, table, x, p]);
  const rk = [...new Map(cells.map((c) => [String(c.key), c.label])).entries()], ck = [...new Set(cells.map((c) => c.series ?? ''))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const vals = cells.map((c) => c.value), mx = Math.max(...vals, 1), mn = Math.min(...vals, 0), L = Math.min(130, W * 0.25), T = 22, cw = (W - L - 8) / Math.max(1, ck.length), ch = Math.min(30, (H - T - 4) / Math.max(1, rk.length)), f = (v: number) => fmt(v, yf?.format, true);
  const get = new Map(cells.map((c) => [`${String(c.key)}¦${c.series ?? ''}`, c.value]));
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Tabela de calor de ${yf?.label}`}>
      {ck.map((c, j) => <text key={c} x={L + cw * (j + 0.5)} y={14} textAnchor="middle" className="vz-axis">{trunc(labelOf(c, cf), Math.max(4, Math.floor(cw / 6.5)))}</text>)}
      {rk.map(([k, label], i) => (
        <g key={k} style={{ opacity: active !== undefined && active !== k ? 0.35 : 1 }} className="vz-mark" onClick={() => emit(x, k, `${xf?.label}: ${label}`)}>
          <text x={L - 8} y={T + ch * i + ch / 2 + 4} textAnchor="end" className="vz-lbl">{trunc(label, 18)}</text>
          {ck.map((c, j) => { const v = get.get(`${k}¦${c}`), t = v == null ? 0 : (v - mn) / (mx - mn || 1); return <g key={c}><rect x={L + cw * j + 1} y={T + ch * i + 1} width={Math.max(1, cw - 2)} height={Math.max(1, ch - 2)} rx={3} style={{ fill: v == null ? 'var(--surface-sunken, transparent)' : `color-mix(in srgb, var(--viz-seq-5) ${Math.round(10 + t * 80)}%, transparent)` }} onPointerMove={(e) => v != null && show(e, { title: `${label} · ${labelOf(c, cf)}`, rows: [{ label: yf?.label ?? 'Valor', value: f(v), strong: true }, { label: 'Do máximo', value: fmt((v / mx) * 100, 'pct'), tone: 'muted' }] })} onPointerLeave={hide} />{v != null && cw > 46 && ch > 16 && <text x={L + cw * (j + 0.5)} y={T + ch * i + ch / 2 + 4} textAnchor="middle" className="vz-cell" style={{ fill: t > 0.55 ? 'var(--on-seq, #fff)' : 'var(--text-primary)' }}>{f(v)}</text>}</g>; })}
        </g>
      ))}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}
export function CalendarHeat({ comp, rows, p, W, H, x }: OtherProps) {
  const { tip, show, hide } = useTip(), ds = comp.data!.dataset, table = comp.data!.table, yf = getField(ds, table, p.y);
  const days = useMemo(() => aggregate(rows, { ds, table, groupBy: x, measure: p.y, agg: p.agg, sort: 'none', grain: 'day' }), [rows, ds, table, x, p]);
  const cell = Math.max(9, Math.min(18, Math.floor((H - 30) / 7))), weeks = Math.max(8, Math.floor((W - 40) / (cell + 2))), last = days.at(-1) ? Number(days.at(-1)!.key) : 0, DAY = 86_400_000;
  const endSat = last + (6 - new Date(last).getUTCDay()) * DAY, startTs = endSat - (weeks * 7 - 1) * DAY, map = new Map(days.map((d) => [Number(d.key), d.value])), vals = days.map((d) => d.value), mx = Math.max(...vals, 1), mn = Math.min(...vals, 0), f = (v: number) => fmt(v, yf?.format, true);
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => startTs + (w * 7 + d) * DAY));
  const months = cols.map((c, i) => ({ i, m: new Date(c[0]!).getUTCMonth(), ts: c[0]! })).filter((c, i, a) => i === 0 || c.m !== a[i - 1]!.m);
  return (
    <svg width={W} height={H} className="vz-svg" role="img" aria-label={`Calendário de calor de ${yf?.label}`}>
      {months.map((m) => <text key={m.ts} x={32 + m.i * (cell + 2)} y={10} className="vz-axis">{new Date(m.ts).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}</text>)}
      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (i % 2 ? <text key={i} x={20} y={26 + i * (cell + 2) + cell - 2} textAnchor="end" className="vz-axis">{d}</text> : null))}
      {cols.map((c, w) => c.map((ts, d) => { const v = map.get(ts), t = v == null ? 0 : (v - mn) / (mx - mn || 1); return ts > last ? null : <rect key={ts} x={28 + w * (cell + 2)} y={16 + d * (cell + 2)} width={cell} height={cell} rx={2.5} style={{ fill: v == null ? 'var(--border-subtle)' : `color-mix(in srgb, var(--viz-seq-5) ${Math.round(12 + t * 80)}%, transparent)` }} className="vz-mark" onPointerMove={(e) => show(e, { title: new Date(ts).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }), rows: [{ label: yf?.label ?? 'Valor', value: v == null ? '—' : f(v), strong: true }, ...(v != null ? [{ label: 'Do pico', value: fmt((v / mx) * 100, 'pct'), tone: 'muted' as const }] : [])] })} onPointerLeave={hide} />; }))}
      {tip && <foreignObject x={0} y={0} width={W} height={H} pointerEvents="none"><RichTip tip={tip} width={W} /></foreignObject>}
    </svg>
  );
}
export { fmtDelta, pctDelta, refValue };
