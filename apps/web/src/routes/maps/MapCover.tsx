import { useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { frac, stations } from './base';
import type { Feature, LonLat } from './base';
import { stormAt } from './data-extra';
import { QUALITY_COLORS, PHASE_COLORS } from './renderers';
import { makePath, pathAt, roadPath, roundedPath } from './roads';
import { COLORS, createDocument } from './model';
import type { ReportId } from './model';

export type CoverKind = ReportId | 'dependency' | 'replay';
const W = 320, H = 180;
type Bbox = [number, number, number, number];
const docs = new Map<ReportId, ReturnType<typeof createDocument>>();
const docOf = (id: ReportId) => { let d = docs.get(id); if (!d) { d = createDocument(id); docs.set(id, d); } return d; };
const bbox = (coords: number[][]): Bbox => coords.reduce<Bbox>((b, c) => [Math.min(b[0], c[0]!), Math.min(b[1], c[1]!), Math.max(b[2], c[0]!), Math.max(b[3], c[1]!)], [180, 90, -180, -90]);
function fit(b: Bbox, pad = .1) {
  const k = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180), dx = (b[2] - b[0]) * k || 1e-3, dy = b[3] - b[1] || 1e-3, s = Math.min(W * (1 - 2 * pad) / dx, H * (1 - 2 * pad) / dy), ox = (W - dx * s) / 2, oy = (H - dy * s) / 2;
  return (c: number[]) => ({ x: ox + (c[0]! - b[0]) * k * s, y: oy + (b[3] - c[1]!) * s });
}
type P = (c: number[]) => { x: number; y: number };
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const line = (p: P, coords: number[][], r = 5) => roundedPath(coords.map(p), r);

/** Procedural street network behind every cover, so each preview reads as a map and not an abstract chart. */
function Streets({ b, p, stroke, avenue }: { b: Bbox; p: P; stroke: string; avenue: string }) {
  const lines = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const a: LonLat = [b[0] + frac(i * 3.1) * (b[2] - b[0]), b[1] + frac(i * 5.3 + 2) * (b[3] - b[1])], d: LonLat = [a[0] + (frac(i * 7.7 + 4) - .5) * (b[2] - b[0]) * .7, a[1] + (frac(i * 9.1 + 6) - .5) * (b[3] - b[1]) * .7];
    return { d: line(p, roadPath(a, d, i * 13 + 1), 5), wide: i % 6 === 0 };
  }), [b, p]);
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round">{lines.map((l, i) => <path key={i} d={l.d} stroke={l.wide ? avenue : stroke} strokeWidth={l.wide ? 2.4 : .9} />)}</g>;
}

function Network({ p, uid, dependency, replay }: { p: P; uid: string; dependency?: boolean; replay?: boolean }) {
  const d = docOf('network'), links = d.layers[1]!.features, nodes = d.layers[0]!.features, still = reduced();
  return <g>{links.map((f, i) => { const sev = Number(f.properties.atenuacao_a) >= 24 ? 3 : Number(f.properties.atenuacao_a) >= 18 ? 2 : Number(f.properties.atenuacao_a) >= 12 ? 1 : 0, c = COLORS[sev]!, path = line(p, f.geometry.coordinates);
    return <g key={f.id}><path d={path} stroke="#04080d" strokeOpacity=".6" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d={path} stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={dependency && i % 3 ? .25 : 1} />{!still && <path d={path} stroke="#fff" strokeWidth="1.4" fill="none" strokeDasharray="1.5 14" strokeLinecap="round" opacity=".85"><animate attributeName="stroke-dashoffset" from="0" to="-31" dur={`${2.4 + i % 3 * .5}s`} repeatCount="indefinite" /></path>}</g>; })}
    {nodes.map((f, i) => { const q = p(f.geometry.coordinates[0]!); return <g key={f.id} transform={`translate(${q.x} ${q.y})`}>{dependency && i === 2 && [14, 24].map((r) => <circle key={r} r={r} fill="none" stroke="#ff6b7a" strokeOpacity={.5 - r / 80} strokeWidth="1.2" />)}<circle r="5.5" fill="#0b1018" stroke="#e9f3ff" strokeWidth="1.6" /></g>; })}
    {replay && <g transform={`translate(18 ${H - 26})`}><rect width={W - 36} height="14" rx="7" fill="rgba(0,0,0,.55)" />{Array.from({ length: 24 }, (_, i) => <rect key={i} x={8 + i * 11.4} y={7 - (3 + frac(i * 2) * 4)} width="5" height={6 + frac(i * 2) * 8} rx="1.5" fill={i < 15 ? '#4aa3d8' : '#4aa3d8'} opacity={i < 15 ? .95 : .35} />)}<circle cx={8 + 15 * 11.4} cy="7" r="5" fill="#fff" /></g>}
    <defs><linearGradient id={`${uid}-n`}><stop offset="0" stopColor="#4aa3d8" /></linearGradient></defs></g>;
}

function Theft({ p, uid }: { p: P; uid: string }) {
  const d = docOf('theft'), ev = d.layers[0]!.features, patrol = d.layers[4]!.features[0]!, dps = d.layers[2]!.features;
  return <g><defs><radialGradient id={`${uid}-h`}><stop offset="0" stopColor="#ff5a4d" stopOpacity=".7" /><stop offset=".5" stopColor="#ff9a4d" stopOpacity=".28" /><stop offset="1" stopColor="#ff9a4d" stopOpacity="0" /></radialGradient></defs>
    {ev.map((f, i) => { const q = p(f.geometry.coordinates[0]!); return <circle key={f.id} cx={q.x} cy={q.y} r={14 + (i % 4) * 4} fill={`url(#${uid}-h)`} />; })}
    <path d={line(p, patrol.geometry.coordinates)} fill="none" stroke="#59b6d6" strokeWidth="2.2" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round"><animate attributeName="stroke-dashoffset" from="0" to="-22" dur="2s" repeatCount="indefinite" /></path>
    {ev.filter((_, i) => i % 3 === 0).map((f) => { const q = p(f.geometry.coordinates[0]!); return <circle key={f.id} cx={q.x} cy={q.y} r="2.2" fill="#ffd2c9" />; })}
    {dps.map((f) => { const q = p(f.geometry.coordinates[0]!); return <rect key={f.id} x={q.x - 3.5} y={q.y - 3.5} width="7" height="7" fill="#667bb0" stroke="#fff" strokeWidth="1" />; })}</g>;
}

function Lights({ p, uid }: { p: P; uid: string }) {
  const poles = docOf('lights').layers[0]!.features, still = reduced();
  return <g><defs><filter id={`${uid}-b`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.6" /></filter></defs>
    <g filter={`url(#${uid}-b)`} opacity=".9">{poles.filter((_, i) => i % 2 === 0).map((f) => { const q = p(f.geometry.coordinates[0]!), t = String(f.properties.tom); return String(f.properties.status) === 'Falha' ? null : <circle key={f.id} cx={q.x} cy={q.y} r="2.5" fill={t === 'sodium' ? '#ff8e2c' : t === 'metal' ? '#d0ffe2' : t === 'warm' ? '#ffe2a0' : '#c4deff'} />; })}</g>
    <g>{poles.filter((_, i) => i % 2 === 0).map((f, i) => { const q = p(f.geometry.coordinates[0]!), bad = String(f.properties.status) === 'Falha'; return <circle key={f.id} cx={q.x} cy={q.y} r={bad ? 1.8 : .7} fill={bad ? 'none' : '#fff'} stroke={bad ? '#ff5a4d' : undefined} strokeWidth=".9" opacity={bad ? 1 : .9}>{bad && !still && <animate attributeName="opacity" values="1;.25;1" dur={`${1.4 + i % 4 * .2}s`} repeatCount="indefinite" />}</circle>; })}</g></g>;
}

function Incidents({ p, uid }: { p: P; uid: string }) {
  const ev = docOf('incidents').layers[0]!.features;
  return <g style={{ mixBlendMode: 'screen' }}><defs><radialGradient id={`${uid}-h`}><stop offset="0" stopColor="#ff7a3d" stopOpacity=".85" /><stop offset=".45" stopColor="#ffb347" stopOpacity=".3" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient></defs>
    {ev.filter((_, i) => i % 2 === 0).map((f, i) => { const q = p(f.geometry.coordinates[0]!); return <circle key={f.id} cx={q.x} cy={q.y} r={16 + i % 3 * 5} fill={`url(#${uid}-h)`} />; })}
    <g transform={`translate(18 ${H - 24})`}>{Array.from({ length: 24 }, (_, i) => <rect key={i} x={i * 12.2} y={16 - (3 + frac(i * 3 + 1) * 13)} width="8" height={3 + frac(i * 3 + 1) * 13} rx="1.5" fill="#ffb347" opacity=".75" />)}</g></g>;
}

function Field({ p, uid }: { p: P; uid: string }) {
  const still = reduced(), routes = useMemo(() => stations.slice(0, 7).map(([, lon, lat], i) => { const to: LonLat = [lon + (frac(i + 2) - .3) * .06, lat + (frac(i + 9) - .5) * .045], pts = roadPath([lon, lat], to, i * 5 + 2); return { id: i, d: line(p, pts), a: p(pts[0]!), b: p(pts.at(-1)!), len: makePath(pts).total, color: ['#4aa3f0', '#a78bfa', '#46c28b', '#4aa3f0', '#ef5b5b', '#a78bfa', '#4aa3f0'][i]! }; }), [p]);
  return <g>{routes.map((r) => <g key={r.id}><path d={r.d} stroke="#05090e" strokeOpacity=".55" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path id={`${uid}-r${r.id}`} d={r.d} stroke={r.color} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <g transform={`translate(${r.b.x} ${r.b.y})`}><circle r="7" fill={r.color === '#ef5b5b' ? '#ef5b5b' : '#e8cf4a'} opacity=".25"><animate attributeName="r" values="4;11" dur="1.8s" repeatCount="indefinite" /><animate attributeName="opacity" values=".5;0" dur="1.8s" repeatCount="indefinite" /></circle><path d="M0 4 L-4.5 -2 A5 5 0 1 1 4.5 -2Z" fill={r.color === '#ef5b5b' ? '#ef5b5b' : '#e8cf4a'} stroke="#0b1018" strokeWidth="1" transform="translate(0 -2)" /></g>
    <g><circle r="5.5" fill="#0b1018" stroke={r.color} strokeWidth="2">{!still && <animateMotion dur={`${5 + r.id * .9}s`} repeatCount="indefinite" path={r.d} />}{still && <animateMotion dur="1s" path={r.d} keyPoints="0.5;0.5" keyTimes="0;1" calcMode="linear" fill="freeze" />}</circle></g></g>)}</g>;
}

function Coverage({ p, uid }: { p: P; uid: string }) {
  const d = docOf('coverage'), sectors = d.layers[0]!.features, towers = d.layers[1]!.features;
  return <g><defs>{sectors.map((f, i) => { const c = p(f.properties.centro as number[]); return <radialGradient key={f.id} id={`${uid}-s${i}`} gradientUnits="userSpaceOnUse" cx={c.x} cy={c.y} r="34"><stop offset="0" stopColor={QUALITY_COLORS[String(f.properties.qualidade)]} stopOpacity=".9" /><stop offset="1" stopColor={QUALITY_COLORS[String(f.properties.qualidade)]} stopOpacity=".05" /></radialGradient>; })}</defs>
    {sectors.map((f, i) => <path key={f.id} d={`M${f.geometry.coordinates.map(p).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L')}Z`} fill={`url(#${uid}-s${i})`} stroke="rgba(255,255,255,.25)" strokeWidth=".6" />)}
    {towers.map((f) => { const q = p(f.geometry.coordinates[0]!); return <g key={f.id} transform={`translate(${q.x} ${q.y})`}><rect x="-2.6" y="-2.6" width="5.2" height="5.2" transform="rotate(45)" fill="#eef1fa" stroke="#0b1018" strokeWidth="1" /></g>; })}</g>;
}

function Expansion({ p }: { p: P }) {
  const d = docOf('expansion'), routes = d.layers[0]!.features, areas = d.layers[1]!.features, week = 14, still = reduced();
  return <g>{areas.map((f) => <path key={f.id} d={`M${f.geometry.coordinates.map(p).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L')}Z`} fill="#3fb6a8" fillOpacity=".18" stroke="#3fb6a8" strokeOpacity=".55" strokeWidth=".8" strokeDasharray="3 3" />)}
    {routes.map((f) => { const start = Number(f.properties.inicio_semana) + Number(f.properties.atraso_sem ?? 0), dur = Number(f.properties.duracao_sem), pct = Math.max(0, Math.min(1, (week - start) / dur)), path = line(p, f.geometry.coordinates, 7), color = pct >= 1 ? PHASE_COLORS['Concluído']! : pct > 0 ? PHASE_COLORS['Em obra']! : PHASE_COLORS.Licenciamento!;
      const mp = makePath(f.geometry.coordinates as LonLat[]), head = p([pathAt(mp, mp.total * pct).lon, pathAt(mp, mp.total * pct).lat]);
      return <g key={f.id}><path d={path} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d={path} fill="none" stroke="#7a889f" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />{pct > 0 && <path d={path} pathLength={1} fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${pct} 1.001`} />}{pct > 0 && pct < 1 && <g transform={`translate(${head.x} ${head.y})`}><circle r="6" fill={color} opacity=".3">{!still && <animate attributeName="r" values="3;9" dur="1.6s" repeatCount="indefinite" />}</circle><circle r="3" fill="#fff" stroke={color} strokeWidth="1.6" /></g>}</g>; })}</g>;
}

function Weather({ p, uid }: { p: P; uid: string }) {
  const sites = docOf('weather').layers[1]!.features, cells = [[16.5, 0], [17, 1], [18, 3]].map(([h, i]) => ({ i: i!, now: stormAt(({ ...(docOf('weather').layers[0]!.features[i!]!.properties as object), id: 'x' }) as never, h!) })).filter((x) => x.now), still = reduced();
  return <g><defs><filter id={`${uid}-b`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter></defs>
    <g filter={`url(#${uid}-b)`}>{cells.map(({ i, now }) => { const q = p([now!.lon, now!.lat]), r = now!.radiusKm * 3.4; return <g key={i}><circle cx={q.x} cy={q.y} r={r * 1.5} fill="#3b8cff" opacity=".4" /><circle cx={q.x} cy={q.y} r={r} fill="#42d17c" opacity=".55" /><circle cx={q.x + 3} cy={q.y - 2} r={r * .55} fill="#f5d33f" opacity=".8" /><circle cx={q.x + 2} cy={q.y} r={r * .28} fill="#ff3c4a" opacity=".9" />{!still && <animateTransform attributeName="transform" type="translate" values="0 0;10 -3;0 0" dur={`${7 + i}s`} repeatCount="indefinite" />}</g>; })}</g>
    {cells[0] && (() => { const a = p([cells[0]!.now!.lon, cells[0]!.now!.lat]); return <path d={`M${a.x} ${a.y} L${a.x + 58} ${a.y - 14}`} stroke="#9db3ff" strokeWidth="1.6" strokeDasharray="2 6" strokeLinecap="round" />; })()}
    {sites.slice(0, 10).map((f) => { const q = p(f.geometry.coordinates[0]!); return <circle key={f.id} cx={q.x} cy={q.y} r="2.8" fill="#0b1018" stroke="#e9f3ff" strokeWidth="1.3" />; })}</g>;
}

const THEME: Record<CoverKind, { bg: string; street: string; avenue: string; accent: string }> = {
  network: { bg: 'radial-gradient(120% 120% at 20% 10%,#14263a,#070d15)', street: 'rgba(160,190,230,.1)', avenue: 'rgba(160,190,230,.2)', accent: '#4aa3d8' },
  theft: { bg: 'radial-gradient(120% 120% at 80% 0%,#2a1620,#0a0a12)', street: 'rgba(230,170,170,.09)', avenue: 'rgba(230,170,170,.18)', accent: '#cb7063' },
  lights: { bg: 'radial-gradient(120% 120% at 50% 100%,#10131c,#020307)', street: 'rgba(255,255,255,.035)', avenue: 'rgba(255,255,255,.07)', accent: '#f1c25b' },
  incidents: { bg: 'radial-gradient(120% 120% at 30% 0%,#2a1c12,#0b0907)', street: 'rgba(255,200,150,.08)', avenue: 'rgba(255,200,150,.16)', accent: '#d98a4a' },
  field: { bg: 'radial-gradient(120% 120% at 70% 0%,#10281f,#050a09)', street: 'rgba(170,230,200,.1)', avenue: 'rgba(170,230,200,.2)', accent: '#5dbb8a' },
  coverage: { bg: 'radial-gradient(120% 120% at 20% 0%,#201a36,#07060d)', street: 'rgba(200,185,255,.08)', avenue: 'rgba(200,185,255,.16)', accent: '#9d81d6' },
  expansion: { bg: 'linear-gradient(160deg,#eef2ee,#d7dfd8)', street: 'rgba(60,80,70,.14)', avenue: 'rgba(60,80,70,.26)', accent: '#3fb6a8' },
  weather: { bg: 'radial-gradient(120% 120% at 50% 0%,#14203d,#050811)', street: 'rgba(170,190,255,.08)', avenue: 'rgba(170,190,255,.16)', accent: '#6f8bff' },
  dependency: { bg: 'radial-gradient(120% 120% at 20% 10%,#241626,#0a0710)', street: 'rgba(230,180,240,.09)', avenue: 'rgba(230,180,240,.18)', accent: '#c07bd6' },
  replay: { bg: 'radial-gradient(120% 120% at 80% 10%,#1a2230,#080b11)', street: 'rgba(190,200,230,.09)', avenue: 'rgba(190,200,230,.18)', accent: '#7f9bd8' },
};
const BOUNDS: Record<CoverKind, () => Bbox> = {
  network: () => bbox(stations.map((s) => [s[1], s[2]])), dependency: () => bbox(stations.map((s) => [s[1], s[2]])), replay: () => bbox(stations.map((s) => [s[1], s[2]])),
  theft: () => { const b = bbox(stations.slice(0, 7).map((s) => [s[1], s[2]])); return [b[0] - .02, b[1] - .02, b[2] + .02, b[3] + .02]; },
  lights: () => bbox(docOf('lights').layers[0]!.features.map((f) => f.geometry.coordinates[0]!)),
  incidents: () => bbox(stations.map((s) => [s[1], s[2]])), field: () => bbox(stations.slice(0, 7).map((s) => [s[1], s[2]])),
  coverage: () => bbox(docOf('coverage').layers[1]!.features.map((f) => f.geometry.coordinates[0]!)),
  expansion: () => bbox(docOf('expansion').layers[0]!.features.flatMap((f) => f.geometry.coordinates)),
  weather: () => bbox([...stations.map((s) => [s[1], s[2]]), [-46.93, -23.62], [-46.4, -23.45]]),
};

/** Live miniature of a map: real data from the same documents, framed for a card cover. */
export function MapCover({ kind, className }: { kind: CoverKind; className?: string }) {
  const uid = useId().replace(/:/g, ''), theme = THEME[kind];
  const b = useMemo(() => BOUNDS[kind](), [kind]), p = useMemo(() => fit(b, kind === 'lights' ? .02 : .12), [b, kind]);
  const body: ReactNode = kind === 'network' ? <Network p={p} uid={uid} /> : kind === 'dependency' ? <Network p={p} uid={uid} dependency /> : kind === 'replay' ? <Network p={p} uid={uid} replay />
    : kind === 'theft' ? <Theft p={p} uid={uid} /> : kind === 'lights' ? <Lights p={p} uid={uid} /> : kind === 'incidents' ? <Incidents p={p} uid={uid} /> : kind === 'field' ? <Field p={p} uid={uid} />
      : kind === 'coverage' ? <Coverage p={p} uid={uid} /> : kind === 'expansion' ? <Expansion p={p} /> : <Weather p={p} uid={uid} />;
  return <div className={`mc-cover ${className ?? ''}`} style={{ background: theme.bg }}><svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><Streets b={b} p={p} stroke={theme.street} avenue={theme.avenue} />{body}</svg></div>;
}
export type { Feature };
