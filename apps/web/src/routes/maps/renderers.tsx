import type { ReactNode } from 'react';
import type { Feature, Layer, LayerRender } from './model';
import { COLORS, STATUS } from './model';
import { stormAt } from './data-extra';
import type { Storm } from './data-extra';
import { makePath, pathAt, roundedPath } from './roads';
import type { LonLat } from './base';
import type { Pick, ViewCtx } from './view';

export interface RenderArgs { layer: Layer; features: Feature[]; v: ViewCtx; selected: Pick | null; handlers: (l: Layer, f: Feature) => Record<string, unknown> }

export const QUALITY_COLORS: Record<string, string> = { Excelente: '#37d08a', Boa: '#a3d94f', Regular: '#f2b84b', Fraca: '#ef5b5b' };
export const PHASE_COLORS: Record<string, string> = { Projeto: '#8d9bb5', Licenciamento: '#e6a23c', 'Em obra': '#4aa3f0', Concluído: '#46c28b' };
const num = (v: unknown) => Number(v ?? 0);
const pill = (x: number, y: number, text: string, tone = 'rgba(11,16,24,.86)', fg = '#fff') => {
  const w = text.length * 5.6 + 14;
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} className="mb-pill" pointerEvents="none"><rect x={-w / 2} y="-9" width={w} height="18" rx="9" fill={tone} stroke="rgba(255,255,255,.18)" /><text textAnchor="middle" y="3.5" fill={fg}>{text}</text></g>;
};

/** Cell-tower sectors: fill = signal quality (RSRP), outline = traffic load (PRB occupancy). */
function sectors({ layer, features, v, selected, handlers }: RenderArgs) {
  return <>{features.map((f) => {
    const pts = f.geometry.coordinates.map(v.p), d = `M${pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L')}Z`;
    const c = v.p(f.properties.centro as number[]), R = num(f.properties.alcance_km) * 1000 / v.mpp;
    const color = QUALITY_COLORS[String(f.properties.qualidade)] ?? '#8d9bb5', sev = Math.max(0, STATUS.indexOf(String(f.properties.status)));
    const loadSev = num(f.properties.ocupacao_prb) > 92 ? 3 : num(f.properties.ocupacao_prb) > 80 ? 2 : num(f.properties.ocupacao_prb) > 66 ? 1 : 0;
    const gid = `sg-${f.id}`, chosen = selected?.layerId === layer.id && selected.featureId === f.id;
    return <g key={f.id} className="mb-feature" {...handlers(layer, f)}>
      <defs><radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={c.x} cy={c.y} r={Math.max(8, R)}><stop offset="0" stopColor={color} stopOpacity=".86" /><stop offset=".5" stopColor={color} stopOpacity=".42" /><stop offset="1" stopColor={color} stopOpacity=".06" /></radialGradient></defs>
      <path d={d} fill={`url(#${gid})`} stroke={loadSev ? COLORS[loadSev] : 'rgba(255,255,255,.28)'} strokeWidth={loadSev > 1 ? 2.2 : 1} strokeDasharray={loadSev === 3 ? '6 3' : undefined} strokeLinejoin="round" className={loadSev >= 2 ? 'mb-sector-hot' : undefined} />
      {chosen && <path d={d} fill="none" stroke="#fff" strokeWidth="2.4" />}
      {sev > 1 && R > 24 && v.camera.zoom > 11.5 && pill((c.x + (pts[4]?.x ?? c.x)) / 2, (c.y + (pts[4]?.y ?? c.y)) / 2, `${f.properties.ocupacao_prb}% PRB`, 'rgba(11,16,24,.8)', COLORS[loadSev] ?? '#fff')}
      <title>{`${f.properties.nome} · RSRP ${f.properties.rsrp_dbm} dBm (${f.properties.qualidade}) · ocupação ${f.properties.ocupacao_prb}%`}</title>
    </g>;
  })}</>;
}

/** Weather radar: blurred precipitation cells, their motion trail and a 3 h forecast. */
function storms({ features, v }: RenderArgs) {
  return <g className="mb-storms"><defs><filter id="mb-storm-blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter></defs>
    {features.map((f) => {
      const s = f.properties as unknown as Storm, now = stormAt({ ...s, id: f.id }, v.time); if (!now) return null;
      const c = v.p([now.lon, now.lat]), R = Math.max(10, now.radiusKm * 1000 / v.mpp), core = now.strength;
      const future = [1, 2, 3].map((h) => { const x = stormAt({ ...s, id: f.id }, v.time + h); return x ? { h, c: v.p([x.lon, x.lat]), r: x.radiusKm * 1000 / v.mpp } : null; }).filter(Boolean) as { h: number; c: { x: number; y: number }; r: number }[];
      const blobs = Array.from({ length: 6 }, (_, k) => { const a = k * 1.05 + s.born, d = R * (.2 + (k % 3) * .17); return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * .8, r: R * (.5 + (k % 4) * .1) }; });
      return <g key={f.id} pointerEvents="none">
        {future.length > 0 && <path d={`M${c.x},${c.y}${future.map((q) => `L${q.c.x},${q.c.y}`).join('')}`} fill="none" stroke="#9db3ff" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" opacity=".8" />}
        {future.map((q) => <g key={q.h}><circle cx={q.c.x} cy={q.c.y} r={Math.max(6, q.r)} fill="none" stroke="#9db3ff" strokeOpacity=".4" strokeDasharray="3 5" /><text x={q.c.x} y={q.c.y + 3} textAnchor="middle" className="mb-forecast">{`+${q.h}h`}</text></g>)}
        <g filter="url(#mb-storm-blur)">
          {blobs.map((b, k) => <circle key={`o${k}`} cx={b.x} cy={b.y} r={b.r} fill="#3b8cff" opacity={.3 * (.4 + core * .6)} />)}
          {blobs.map((b, k) => <circle key={`m${k}`} cx={b.x} cy={b.y} r={b.r * .66} fill={core > .7 ? '#f5d33f' : '#42d17c'} opacity={.45 * core} />)}
          {blobs.slice(0, 4).map((b, k) => <circle key={`c${k}`} cx={(b.x + c.x) / 2} cy={(b.y + c.y) / 2} r={b.r * .38} fill={now.mmh > 70 ? '#ff3c4a' : '#ff9a3c'} opacity={.65 * core} />)}
        </g>
        {pill(c.x, c.y - R * .62 - 6, `${f.properties.nome} · ${now.mmh} mm/h`, 'rgba(11,16,24,.86)', now.mmh > 70 ? '#ff8b93' : '#ffd27a')}
      </g>;
    })}</g>;
}

/** Fiber build progress: planned path (dashed), built portion (solid, by phase) and the crew at its head. */
function progress({ layer, features, v, selected, handlers }: RenderArgs) {
  return <>{features.filter((f) => f.geometry.type === 'LineString').map((f) => {
    const pts = f.geometry.coordinates.map(v.p), d = roundedPath(pts, 10), pct = num(f.properties.pct) / 100, fase = String(f.properties.fase), color = PHASE_COLORS[fase] ?? '#8d9bb5';
    const path = makePath(f.geometry.coordinates as LonLat[]), head = pathAt(path, path.total * pct), mid = pathAt(path, path.total * .5), hp = v.p([head.lon, head.lat]), mp = v.p([mid.lon, mid.lat]);
    const blocked = f.properties.bloqueada === true, chosen = selected?.layerId === layer.id && selected.featureId === f.id, w = layer.size;
    return <g key={f.id} className="mb-feature" {...handlers(layer, f)}>
      {chosen && <path d={d} fill="none" stroke="var(--accent)" strokeWidth={w + 9} opacity=".28" />}
      <path d={d} fill="none" stroke="#0a0f16" strokeWidth={w + 4} strokeOpacity=".55" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={blocked ? '#ef5b5b' : '#9aa7bf'} strokeOpacity={blocked ? .75 : .55} strokeWidth={w - 1} strokeDasharray="3 6" strokeLinejoin="round" />
      {pct > 0 && <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${pct} 1.001`} />}
      <path d={d} fill="none" stroke="transparent" strokeWidth="16" />
      {pct > 0 && pct < 1 && <g transform={`translate(${hp.x} ${hp.y})`}><circle r="9" fill={color} opacity=".25" className="mb-pulse" /><circle r="4.5" fill="#fff" stroke={color} strokeWidth="2" /></g>}
      {v.camera.zoom > 10.6 && pill(mp.x, mp.y - 13, `${String(f.properties.nome).split(' · ')[0]} · ${Math.round(pct * 100)}%`, 'rgba(11,16,24,.86)', blocked ? '#ff9aa0' : '#fff')}
      <title>{`${f.properties.nome} · ${fase} · ${Math.round(pct * 100)}% · licença ${f.properties.licenca}`}</title>
    </g>;
  })}</>;
}

export const RENDERERS: Partial<Record<LayerRender, (a: RenderArgs) => ReactNode>> = { sector: sectors, storm: storms, progress };
export { pill };
