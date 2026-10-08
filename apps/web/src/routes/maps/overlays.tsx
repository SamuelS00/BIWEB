import type { Feature } from './model';
import { pill } from './renderers';
import { roundedPath } from './roads';
import { useView } from './view';

/** Highlights an alternative route over the network and marks the cut link. */
export function RouteOverlay({ cut, alternative }: { cut: Feature; alternative: Feature[] }) {
  const v = useView();
  const line = (f: Feature) => roundedPath(f.geometry.coordinates.map(v.p), 11);
  const mid = (f: Feature) => v.p(f.geometry.coordinates[Math.floor(f.geometry.coordinates.length / 2)]!);
  const m = mid(cut);
  return <g className="mb-reroute" pointerEvents="none">
    {alternative.map((f) => <g key={f.id}>
      <path d={line(f)} fill="none" stroke="#06202b" strokeOpacity=".7" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(f)} fill="none" stroke="#35d0ff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="mb-signal mb-signal-fast" d={line(f)} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2 16" strokeLinecap="round" />
    </g>)}
    <path d={line(cut)} fill="none" stroke="#ff4d5e" strokeWidth="5" strokeDasharray="1 9" strokeLinecap="round" />
    <g transform={`translate(${m.x} ${m.y})`}><circle r="13" fill="#ff4d5e" opacity=".25" className="mb-pulse" /><circle r="10" fill="#0b1018" stroke="#ff4d5e" strokeWidth="2.4" /><path d="M-4.5 -4.5 L4.5 4.5 M4.5 -4.5 L-4.5 4.5" stroke="#ff4d5e" strokeWidth="2.4" strokeLinecap="round" /></g>
    {pill(m.x, m.y - 24, `${cut.id} · rompimento simulado`, 'rgba(60,10,18,.92)', '#ff9aa4')}
  </g>;
}
