import { memo, useMemo, useState } from 'react';
import { aggFormat, aggregate, fmt, labelOf, STATUS_LABEL, type Series } from '../data/query';
import type { ChartProps, Comp } from '../editor/doc';
import { useEditor } from '../editor/store';
import { Empty, fieldOf, Tip, useRows, useSize } from './common';

/** Cor da série i (viz-cat-n), começando pelo acento escolhido no Visual. Status usa a escala de status. */
const cat = (i: number, base = 1) => `var(--viz-cat-${((base - 1 + i) % 8) + 1})`;
const statusColor = (k: unknown) => (typeof k === 'string' && STATUS_LABEL[k] ? `var(--viz-status-${k})` : undefined);
const niceMax = (m: number) => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)); for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= m) return s * p; return m; };

/** Cross-filter / drill / navegação a partir de um clique numa marca. */
export function useEmit(comp: Comp) {
  const cross = useEditor((s) => s.cross);
  const drillPath = useEditor((s) => s.drill[comp.id]);
  return {
    active: cross?.source === comp.id ? cross.value : undefined,
    level: drillPath?.length ?? 0,
    emit: (field: string, value: unknown, label: string) => {
      const st = useEditor.getState();
      const d = comp.interactions.drill;
      if (d?.length && (st.drill[comp.id]?.length ?? 0) < d.length - 1 && field === d[st.drill[comp.id]?.length ?? 0]) {
        st.set({ drill: { ...st.drill, [comp.id]: [...(st.drill[comp.id] ?? []), value] } });
        return;
      }
      if (comp.interactions.navigateTo && st.mode === 'preview') { st.goPage(comp.interactions.navigateTo); return; }
      if (!comp.interactions.emitCross) return;
      st.setCross(cross?.source === comp.id && cross.value === value ? null : { source: comp.id, table: comp.data?.table ?? '', field, value, label });
    },
  };
}

export const ChartView = memo(function ChartView({ comp }: { comp: Comp }) {
  const p = comp.props as unknown as ChartProps;
  const [ref, size] = useSize<HTMLDivElement>();
  const rows = useRows(comp);
  const { emit, active, level } = useEmit(comp);
  const drill = comp.interactions.drill;
  const x = drill?.length ? drill[Math.min(level, drill.length - 1)]! : p.x;
  const xf = fieldOf(comp, x), yf = fieldOf(comp, p.y);
  const data = useMemo<Series[]>(() => {
    if (p.kind === 'scatter') return rows.slice(0, p.limit || 400).map((r) => ({ key: r.id ?? r.nome, label: String(r.nome ?? r.id), value: Number(r[p.y]), series: p.series ? String(r[p.series]) : undefined, x: Number(r[p.x]) } as Series & { x: number }));
    return aggregate(rows, { ds: comp.data!.dataset, table: comp.data!.table, groupBy: x, measure: p.y, agg: p.agg, series: p.series, sort: p.sort, limit: p.limit, grain: p.grain });
  }, [rows, p, x, comp.data]);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const f = (v: number) => fmt(v, aggFormat(p.agg, yf), true);
  if (!comp.data) return <Empty text="Sem dados" hint="Escolha um dataset na aba Dados" />;
  if (!data.length) return <Empty text="Nada para mostrar" hint="Os filtros atuais não deixaram nenhuma linha" />;
  const W = Math.max(size.w, 10), H = Math.max(size.h, 10);
  const seriesKeys = [...new Set(data.map((d) => d.series).filter(Boolean))] as string[];
  const colorOf = (d: Series, i: number) => (p.series ? (statusColor(d.series) ?? cat(seriesKeys.indexOf(d.series!), comp.style.accent)) : x === 'status' || x === 'severidade' ? statusColor(d.key) ?? cat(i) : p.kind === 'pie' ? cat(i, comp.style.accent) : cat(0, comp.style.accent));
  const hover = (e: React.MouseEvent, text: string) => { const r = (e.currentTarget as Element).closest('.vz-chart')!.getBoundingClientRect(); setTip({ x: e.clientX - r.left + 12, y: e.clientY - r.top - 8, text }); };
  const dim = (k: unknown) => (active !== undefined && active !== k ? 0.3 : 1);
  const click = (d: Series) => emit(x, d.key, `${xf?.label ?? x}: ${d.label}`);
  const legend = p.legend && seriesKeys.length > 0 && p.kind !== 'pie';
  const legendItems = seriesKeys.map((s, i) => ({ k: STATUS_LABEL[s] ?? s, c: statusColor(s) ?? cat(i, comp.style.accent) }));
  const ih = H;
  let body: React.ReactNode = null;

  if (p.kind === 'pie') {
    const total = data.reduce((a, d) => a + d.value, 0) || 1, r = Math.max(10, Math.min(W * 0.5, ih) / 2 - 8), cx = Math.min(W / 2, r + 12), cy = ih / 2;
    let a0 = -Math.PI / 2;
    body = (
      <svg width={W} height={ih} className="vz-svg" role="img" aria-label={`Pizza: ${data.map((d) => `${d.label} ${f(d.value)}`).join(', ')}`}>
        {data.map((d, i) => {
          const a1 = a0 + (d.value / total) * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0, ri = r * 0.58;
          const pt = (a: number, rr: number) => `${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
          const path = `M${pt(a0, r)} A${r} ${r} 0 ${large} 1 ${pt(a1, r)} L${pt(a1, ri)} A${ri} ${ri} 0 ${large} 0 ${pt(a0, ri)} Z`;
          const el = <path key={String(d.key)} d={path} style={{ fill: colorOf(d, i), opacity: dim(d.key) }} className="vz-mark" onClick={() => click(d)} onMouseMove={(e) => hover(e, `${d.label} · ${f(d.value)} (${fmt((d.value / total) * 100, 'pct')})`)} onMouseLeave={() => setTip(null)} />;
          a0 = a1;
          return el;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" className="vz-big">{f(total)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="vz-axis">total</text>
        {p.labels && (() => { let b = -Math.PI / 2; return data.map((d) => { const m = b + (d.value / total) * Math.PI; b += (d.value / total) * Math.PI * 2; const pc = d.value / total; return pc < 0.06 ? null : <text key={`l${String(d.key)}`} x={cx + Math.cos(m) * r * 0.79} y={cy + Math.sin(m) * r * 0.79 + 4} textAnchor="middle" className="vz-onmark">{Math.round(pc * 100)}%</text>; }); })()}
        {p.legend && W > r * 2 + 140 && data.slice(0, 8).map((d, i) => (
          <g key={`k${String(d.key)}`} transform={`translate(${cx + r + 20}, ${cy - (Math.min(data.length, 8) * 20) / 2 + i * 20 + 10})`} onClick={() => click(d)} className="vz-mark" style={{ opacity: dim(d.key) }}>
            <rect width={10} height={10} y={-8} rx={2} style={{ fill: colorOf(d, i) }} /><text x={16} className="vz-lbl">{d.label}</text><text x={W - cx - r - 32} textAnchor="end" className="vz-val">{f(d.value)}</text>
          </g>
        ))}
      </svg>
    );
  } else if (p.kind === 'scatter') {
    const pts = data as (Series & { x: number })[];
    const xf2 = fieldOf(comp, p.x);
    const mx = niceMax(Math.max(...pts.map((d) => d.x))), my = niceMax(Math.max(...pts.map((d) => d.value)));
    const L = 44, B = 22, T = 8, R = 8, iw = W - L - R, h = ih - B - T;
    body = (
      <svg width={W} height={ih} className="vz-svg" role="img" aria-label={`Dispersão de ${yf?.label} por ${xf2?.label}`}>
        {[0, 0.5, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={T + h - h * t} y2={T + h - h * t} className="vz-grid" /><text x={L - 6} y={T + h - h * t + 3} textAnchor="end" className="vz-axis">{fmt(my * t, yf?.format, true)}</text></g>)}
        {[0, 0.5, 1].map((t) => <text key={`x${t}`} x={L + iw * t} y={ih - 6} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'} className="vz-axis">{fmt(mx * t, xf2?.format, true)}</text>)}
        {pts.map((d, i) => <circle key={i} cx={L + (d.x / mx) * iw} cy={T + h - (d.value / my) * h} r={3.2} className="vz-mark" style={{ fill: d.series ? statusColor(d.series) ?? cat(seriesKeys.indexOf(d.series), comp.style.accent) : cat(0, comp.style.accent), fillOpacity: active !== undefined && active !== d.key ? 0.15 : 0.75 }}
          onClick={() => emit('id', d.key, d.label)} onMouseMove={(e) => hover(e, `${d.label} · ${xf2?.label} ${fmt(d.x, xf2?.format)} · ${yf?.label} ${fmt(d.value, yf?.format)}`)} onMouseLeave={() => setTip(null)} />)}
      </svg>
    );
  } else if (p.kind === 'hbar') {
    const groups = [...new Map(data.map((d) => [String(d.key), d])).values()];
    const tot = (k: unknown) => data.filter((d) => d.key === k).reduce((a, d) => a + d.value, 0);
    const max = niceMax(Math.max(...groups.map((g) => tot(g.key)))), lw = Math.min(150, W * 0.34), vw = p.labels ? 56 : 8;
    const rh = Math.max(14, Math.min(28, ih / groups.length));
    body = (
      <svg width={W} height={Math.max(ih, groups.length * rh)} className="vz-svg" role="img" aria-label={`Barras horizontais: ${groups.map((g) => `${g.label} ${f(tot(g.key))}`).join(', ')}`}>
        {groups.map((g, i) => {
          let x0 = lw;
          const parts = data.filter((d) => d.key === g.key);
          return (
            <g key={String(g.key)} transform={`translate(0, ${i * rh})`} className="vz-mark" style={{ opacity: dim(g.key) }} onClick={() => click(g)} onMouseMove={(e) => hover(e, `${g.label} · ${parts.map((q) => (q.series ? `${STATUS_LABEL[q.series] ?? q.series} ${f(q.value)}` : f(q.value))).join(' · ')}`)} onMouseLeave={() => setTip(null)}>
              <text x={lw - 8} y={rh / 2 + 4} textAnchor="end" className="vz-lbl">{g.label.length > 22 ? `${g.label.slice(0, 21)}…` : g.label}</text>
              {parts.map((q, j) => { const w = ((W - lw - vw) * q.value) / max; const el = <rect key={j} x={x0} y={rh * 0.18} width={Math.max(0, w)} height={rh * 0.64} rx={2} className="vz-grow-x" style={{ fill: colorOf(q, i), ['--i' as string]: i }} />; x0 += w; return el; })}
              {p.labels && <text x={x0 + 6} y={rh / 2 + 4} className="vz-val">{f(tot(g.key))}</text>}
            </g>
          );
        })}
      </svg>
    );
  } else {
    // bar · line · area (eixo X categórico ou temporal)
    const keys = [...new Map(data.map((d) => [String(d.key), d])).values()];
    const stacked = p.kind === 'bar' && !!p.series;
    const sums = keys.map((k) => data.filter((d) => d.key === k.key).reduce((a, d) => (stacked ? a + d.value : Math.max(a, d.value)), 0));
    const vals = data.map((d) => d.value);
    const isTime = xf?.kind === 'date';
    let lo = 0, hi = niceMax(Math.max(...sums));
    if (p.kind !== 'bar') { const mn = Math.min(...vals), mxv = Math.max(...vals), span = mxv - mn; if (mn > 0 && span < mxv * 0.25) { lo = Math.max(0, mn - span * 0.6); hi = mxv + span * 0.3 || mxv + 1; } }
    const L = 46, B = 24, T = p.labels && p.kind === 'bar' ? 16 : 8, R = 8, iw = W - L - R, h = ih - B - T, n = keys.length;
    const X = (i: number) => (p.kind === 'bar' ? L + (iw / n) * (i + 0.5) : L + (n === 1 ? iw / 2 : (iw * i) / (n - 1)));
    const Y = (v: number) => T + h - ((v - lo) / (hi - lo || 1)) * h;
    const every = Math.max(1, Math.ceil((n * (isTime ? 44 : 64)) / Math.max(iw, 1)));
    const lines = p.series ? seriesKeys : [undefined];
    body = (
      <svg width={W} height={ih} className="vz-svg" role="img" aria-label={`${p.kind === 'bar' ? 'Barras' : p.kind === 'area' ? 'Área' : 'Linha'}: ${keys.slice(0, 12).map((k, i) => `${k.label} ${f(sums[i]!)}`).join(', ')}`}>
        {[0, 0.5, 1].map((t) => { const v = lo + (hi - lo) * t; return <g key={t}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className="vz-grid" /><text x={L - 6} y={Y(v) + 3} textAnchor="end" className="vz-axis">{f(v)}</text></g>; })}
        {keys.map((k, i) => (i % every === 0 ? <text key={`x${String(k.key)}`} x={X(i)} y={ih - 7} textAnchor="middle" className="vz-axis">{k.label.length > 12 ? `${k.label.slice(0, 11)}…` : k.label}</text> : null))}
        {p.kind === 'bar' ? keys.map((k, i) => {
          const bw = Math.max(2, (iw / n) * 0.66);
          let y0 = Y(0);
          const parts = data.filter((d) => d.key === k.key);
          return (
            <g key={String(k.key)} className="vz-mark" style={{ opacity: dim(k.key) }} onClick={() => click(k)} onMouseMove={(e) => hover(e, `${k.label} · ${parts.map((q) => (q.series ? `${STATUS_LABEL[q.series] ?? q.series} ${f(q.value)}` : f(q.value))).join(' · ')}`)} onMouseLeave={() => setTip(null)}>
              <rect x={X(i) - (iw / n) / 2} y={T} width={iw / n} height={h} fill="transparent" />
              {parts.map((q, j) => { const hh = (q.value / (hi - lo || 1)) * h; y0 -= hh; return <rect key={j} x={X(i) - bw / 2} y={y0} width={bw} height={Math.max(0, hh)} rx={2} className="vz-grow-y" style={{ fill: colorOf(q, i), ['--i' as string]: i }} />; })}
              {p.labels && bw > 18 && <text x={X(i)} y={y0 - 4} textAnchor="middle" className="vz-val">{f(sums[i]!)}</text>}
            </g>
          );
        }) : lines.map((s, si) => {
          const pts = keys.map((k, i) => ({ i, d: data.find((d) => d.key === k.key && d.series === s) })).filter((q) => q.d);
          const color = s ? statusColor(s) ?? cat(si, comp.style.accent) : cat(0, comp.style.accent);
          const path = pts.map((q, j) => `${j ? 'L' : 'M'}${X(q.i).toFixed(1)} ${Y(q.d!.value).toFixed(1)}`).join(' ');
          return (
            <g key={s ?? 'one'}>
              {p.kind === 'area' && pts.length > 1 && <path d={`${path} L${X(pts[pts.length - 1]!.i)} ${T + h} L${X(pts[0]!.i)} ${T + h} Z`} style={{ fill: color, fillOpacity: 0.14 }} />}
              <path d={path} pathLength={1} className="vz-draw" style={{ fill: 'none', stroke: color, strokeWidth: 2 }} />
              {pts.map((q) => (
                <g key={q.i} className="vz-mark" onClick={() => click(q.d!)} onMouseMove={(e) => hover(e, `${keys[q.i]!.label}${s ? ` · ${STATUS_LABEL[s] ?? s}` : ''} · ${f(q.d!.value)}`)} onMouseLeave={() => setTip(null)}>
                  <circle cx={X(q.i)} cy={Y(q.d!.value)} r={10} fill="transparent" />
                  {(n <= 31 || active === q.d!.key) && <circle cx={X(q.i)} cy={Y(q.d!.value)} r={active === q.d!.key ? 4.5 : 2.6} style={{ fill: 'var(--dash-widget-surface)', stroke: color, strokeWidth: 1.6 }} />}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    );
  }
  return (
    <div className="vz-chart">
      {drill?.length && level > 0 ? (
        <div className="vz-drill"><button type="button" onClick={() => { const st = useEditor.getState(); st.set({ drill: { ...st.drill, [comp.id]: (st.drill[comp.id] ?? []).slice(0, -1) } }); }}>← {fieldOf(comp, drill[level - 1])?.label}</button><span>{(useEditor.getState().drill[comp.id] ?? []).map((v) => labelOf(v)).join(' › ')}</span></div>
      ) : null}
      {legend && <div className="vz-legend">{legendItems.slice(0, 8).map((l) => <span key={l.k}><i style={{ background: l.c }} />{l.k}</span>)}</div>}
      <div className="vz-plot" ref={ref}>{size.w > 0 && body}</div>
      {p.tooltip && tip && <Tip x={tip.x} y={tip.y}>{tip.text}</Tip>}
    </div>
  );
});
