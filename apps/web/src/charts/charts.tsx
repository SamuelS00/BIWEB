/**
 * Visualizações de exemplo do shell (SVG, só tokens runtime: dash-x e viz-x).
 * No produto, estes viram plugins do viz-core (ECharts) atrás do contrato viz-sdk (épico E2.4).
 */
import { useId, useState } from 'react';

const nf = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtMi = (v: number) => nf(v, Math.abs(v) < 1 ? 2 : (Math.round(v * 10) === v * 10 ? 1 : 2));
function niceMax(m: number) { const p = 10 ** Math.floor(Math.log10(m)); for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= m) return s * p; return m; }

/** Tooltip de dados que segue a marca sob o cursor. */
function useTip() {
  const [tip, setTip] = useState<{ x: number | string; y: number | string; text: string } | null>(null);
  const el = tip && <div className="ch-tip" style={{ left: tip.x, top: tip.y }} role="status">{tip.text}</div>;
  return { set: setTip, el };
}

export function BarChart({ labels, values, format, highlightLast, height = 220 }: { labels: string[]; values: number[]; format: (v: number) => string; highlightLast?: boolean; height?: number }) {
  const W = 600, H = height, L = 40, B = 22, T = 10, iw = W - L - 6, ih = H - B - T, n = values.length;
  const max = niceMax(Math.max(...values)), bw = iw / n, gap = Math.min(14, bw * 0.32);
  const tip = useTip();
  return (
    <div className="ch-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ch-svg" role="img" aria-label={`Barras: ${labels.map((l, i) => `${l} ${format(values[i]!)}`).join(', ')}`}>
        {[0, 0.5, 1].map((f) => { const y = T + ih - ih * f; return <g key={f}><line x1={L} x2={W} y1={y} y2={y} className="ch-grid" /><text x={L - 6} y={y + 3} textAnchor="end" className="ch-axis">{format(max * f)}</text></g>; })}
        {values.map((v, i) => {
          const h = (ih * v) / max, x = L + i * bw + gap / 2, y = T + ih - h, last = highlightLast && i === n - 1;
          return (
            <g key={labels[i]} onMouseMove={(e) => tip.set({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, text: `${labels[i]} · ${format(v)}` })} onMouseLeave={() => tip.set(null)}>
              <rect x={x} y={y} width={bw - gap} height={h} rx={2} className="bw-grow-y ch-bar" style={{ ['--i' as string]: i, fill: `var(--${last ? 'viz-cat-2' : 'viz-cat-1'})` }} />
              <text x={x + (bw - gap) / 2} y={H - 6} textAnchor="middle" className="ch-axis">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
      {tip.el}
    </div>
  );
}

export function LineChart({ labels, values, format, height = 220 }: { labels: string[]; values: number[]; format: (v: number) => string; height?: number }) {
  const W = 900, H = height, L = 40, B = 22, T = 14, iw = W - L - 14, ih = H - B - T, n = values.length;
  const max = niceMax(Math.max(...values));
  const X = (i: number) => L + (iw * i) / (n - 1), Y = (v: number) => T + ih - (ih * v) / max;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const gid = useId();
  const tip = useTip();
  return (
    <div className="ch-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ch-svg" role="img" aria-label={`Linha: ${labels.map((l, i) => `${l} ${format(values[i]!)}`).join(', ')}`}>
        {[0, 0.5, 1].map((f) => { const y = T + ih - ih * f; return <g key={f}><line x1={L} x2={W} y1={y} y2={y} className="ch-grid" /><text x={L - 6} y={y + 3} textAnchor="end" className="ch-axis">{format(max * f)}</text></g>; })}
        <path d={`${d} L${X(n - 1)} ${T + ih} L${L} ${T + ih} Z`} style={{ fill: 'var(--viz-cat-1)', fillOpacity: 0.12 }} className="bw-fade-in" key={`a${gid}`} />
        <path d={d} pathLength={1} className="bw-draw" style={{ fill: 'none', stroke: 'var(--viz-cat-1)', strokeWidth: 2.5 }} />
        {values.map((v, i) => (
          <g key={labels[i]} onMouseEnter={() => tip.set({ x: `${(X(i) / W) * 100}%`, y: `${(Y(v) / H) * 100}%`, text: `${labels[i]} · ${format(v)}` })} onMouseLeave={() => tip.set(null)}>
            <circle cx={X(i)} cy={Y(v)} r={10} style={{ fill: 'transparent' }} />
            <circle cx={X(i)} cy={Y(v)} r={3.5} style={{ fill: 'var(--dash-widget-surface)', stroke: 'var(--viz-cat-1)', strokeWidth: 2 }} />
            <text x={X(i)} y={H - 6} textAnchor="middle" className="ch-axis">{labels[i]}</text>
          </g>
        ))}
      </svg>
      {tip.el}
    </div>
  );
}

export function HBarChart({ rows, unit, selected, onSelect }: { rows: [string, number][]; unit: 'R$ mi' | '%'; selected?: string | null; onSelect?: (k: string) => void }) {
  const max = Math.max(...rows.map((r) => Math.abs(r[1])));
  const f = (v: number) => (unit === '%' ? `${nf(v, 0)}%` : fmtMi(v));
  return (
    <div className="ch-hbar" role={onSelect ? 'group' : 'list'} aria-label={onSelect ? 'Clique para destacar' : undefined}>
      {rows.map(([k, v], i) => {
        const dim = selected && selected !== k;
        const Row = onSelect ? 'button' : 'div';
        return (
          <Row key={k} role={onSelect ? undefined : 'listitem'} className={`ch-hrow${onSelect ? ' ch-hrow--btn' : ''}`} {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(k), 'aria-pressed': selected === k } : {})} style={{ opacity: dim ? 0.35 : 1 }}>
            <span className="ch-hk" title={k}>{k}</span>
            <span className="ch-htrack"><i className="bw-grow-x" style={{ width: `${(Math.abs(v) / max) * 100}%`, ['--i' as string]: i }} /></span>
            <span className="ch-hv">{f(v)}</span>
          </Row>
        );
      })}
    </div>
  );
}

export function DivergingChart({ rows }: { rows: [string, number][] }) {
  const max = Math.max(...rows.map((r) => Math.abs(r[1])));
  return (
    <div className="ch-hbar" role="list" aria-label={rows.map(([k, v]) => `${k} −${fmtMi(-v)}`).join(', ')}>
      {rows.map(([k, v], i) => (
        <div key={k} role="listitem" className="ch-hrow">
          <span className="ch-hk">{k}</span>
          <span className="ch-htrack ch-htrack--neg"><i className="bw-grow-x" style={{ width: `${(Math.abs(v) / max) * 100}%`, background: 'var(--viz-div-neg)', ['--i' as string]: i }} /></span>
          <span className="ch-hv" style={{ color: 'var(--dash-negative)' }}>−{fmtMi(-v)}</span>
        </div>
      ))}
    </div>
  );
}

/** Participação em uma barra 100% com legenda; cada parte tem rótulo, não só cor. */
export function ShareBar({ rows }: { rows: [string, number][] }) {
  return (
    <div className="ch-share">
      <div className="ch-share-bar" role="img" aria-label={rows.map(([k, v]) => `${k} ${v}%`).join(', ')}>
        {rows.map(([k, v], i) => <i key={k} className="bw-grow-x" style={{ width: `${v}%`, background: `var(--viz-cat-${i + 1})`, ['--i' as string]: i }} />)}
      </div>
      <ul className="ch-legend">
        {rows.map(([k, v], i) => <li key={k}><span className="ch-sw" style={{ background: `var(--viz-cat-${i + 1})` }} /><span>{k}</span><b>{v}%</b></li>)}
      </ul>
    </div>
  );
}

const UF: Record<string, [number, number]> = { RR: [1, 0], AP: [3, 0], AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1], AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PB: [5, 2], PE: [6, 2], MS: [2, 3], GO: [3, 3], DF: [4, 3], BA: [5, 3], AL: [6, 3], PR: [2, 4], SP: [3, 4], MG: [4, 4], ES: [5, 4], SE: [6, 4], SC: [2, 5], RJ: [4, 5], RS: [2, 6] };
/** Mapa esquemático (um quadrado por UF). Estados fora do top 10 entram em "demais". */
export function StateTileMap({ values }: { values: [string, number][] }) {
  const val = Object.fromEntries(values);
  const bin = (v?: number) => (v == null ? 1 : v >= 4 ? 5 : v >= 1.3 ? 4 : v >= 1.1 ? 3 : 2);
  const tip = useTip();
  return (
    <div className="ch-wrap ch-map">
      <svg viewBox="0 0 280 290" className="ch-svg" role="img" aria-label={`Mapa por estado: ${values.map(([k, v]) => `${k} ${fmtMi(v)}`).join(', ')}; demais estados somados`}>
        {Object.entries(UF).map(([uf, [c, r]], i) => {
          const v = val[uf] as number | undefined;
          return (
            <g key={uf} onMouseEnter={() => tip.set({ x: `${((c * 40 + 18) / 280) * 100}%`, y: `${((r * 40) / 290) * 100}%`, text: `${uf} · ${v != null ? `R$ ${fmtMi(v)} mi` : 'em "demais"'}` })} onMouseLeave={() => tip.set(null)}>
              <rect x={c * 40} y={r * 40} width={36} height={36} rx={3} className="bw-fade-in" style={{ fill: `var(--viz-seq-${bin(v)})`, animationDelay: `${i * 12}ms` }} />
              <text x={c * 40 + 18} y={r * 40 + 22} textAnchor="middle" style={{ font: '600 10px var(--font-sans)', fill: bin(v) >= 4 ? 'var(--dash-widget-surface)' : 'var(--dash-title)', pointerEvents: 'none' }}>{uf}</text>
            </g>
          );
        })}
      </svg>
      <ul className="ch-legend ch-legend--row">
        {['demais', '0,7–0,9', '1,1–1,2', '1,3–1,9', '4,3'].map((t, i) => <li key={t}><span className="ch-sw" style={{ background: `var(--viz-seq-${i + 1})` }} />{t}</li>)}
      </ul>
      {tip.el}
    </div>
  );
}

export function Matrix({ rows }: { rows: [string, number][] }) {
  const t = rows.reduce((a, r) => a + r[1], 0), max = Math.max(...rows.map((r) => r[1]));
  return (
    <table className="bw-matrix">
      <thead><tr><th>Item</th><th>Receita (R$ mi)</th><th>Participação</th></tr></thead>
      <tbody>
        {rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className="bw-bar"><i style={{ width: `${(v / max) * 60}px` }} /><span>{fmtMi(v)}</span></td><td>{nf((v / t) * 100, 1)}%</td></tr>)}
        <tr className="bw-total"><td>Total</td><td>{fmtMi(+t.toFixed(2))}</td><td>100%</td></tr>
      </tbody>
    </table>
  );
}

/** Linha mínima para KPIs (sem eixos). */
export function Sparkline({ values, tone = 'viz-cat-1' }: { values: number[]; tone?: string }) {
  const W = 120, H = 32, mx = Math.max(...values), mn = Math.min(...values);
  const pts = values.map((v, i) => `${((W * i) / (values.length - 1)).toFixed(1)},${(H - 3 - ((H - 6) * (v - mn)) / (mx - mn || 1)).toFixed(1)}`);
  const last = pts[pts.length - 1]!.split(',');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" className="ch-spark">
      <polyline points={`0,${H} ${pts.join(' ')} ${W},${H}`} style={{ fill: `var(--${tone})`, fillOpacity: 0.12, stroke: 'none' }} />
      <polyline points={pts.join(' ')} pathLength={1} className="bw-draw" style={{ fill: 'none', stroke: `var(--${tone})`, strokeWidth: 1.75 }} />
      <circle cx={last[0]} cy={last[1]} r={2.5} style={{ fill: `var(--${tone})` }} />
    </svg>
  );
}
