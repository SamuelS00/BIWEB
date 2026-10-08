import { frac } from '../routes/maps/base';
import type { Row } from './types';

/** Shared tick of the live widgets: one tick = one simulated minute of telemetry. */
let tick = 0;
export const liveTick = () => tick;
export const setLiveTick = (t: number) => { tick = t; };
const BASE_MIN = Math.floor(Date.UTC(2026, 9, 6, 11, 0) / 60_000), POPS = ['POP Paulista', 'POP Lapa', 'POP Osasco'];
/** The window moves one minute per tick, so a chart over it scrolls like a real monitor. */
export const INCIDENT_MIN = BASE_MIN + 14;
export function telemetry(t: number, span = 40): Row[] {
  const rows: Row[] = [], end = BASE_MIN + 24 + t;
  for (let m = end - span + 1; m <= end; m++) for (const [pi, pop] of POPS.entries()) {
    const storm = m >= INCIDENT_MIN && m < INCIDENT_MIN + 9 && pi === 1 ? 1 - Math.abs(m - INCIDENT_MIN - 4) / 5 : 0;
    const wave = Math.sin(m / 9 + pi * 2) * 7 + Math.sin(m / 3.1 + pi) * 2.2 + (frac(m * 1.7 + pi * 9) - 0.5) * 3.5;
    rows.push({ id: `${pop}-${m}`, ts: m * 60_000, pop, trafego_gbps: Math.round((46 + pi * 9 + wave + storm * 38) * 10) / 10, latencia_ms: Math.round((11 + pi * 2 + (frac(m * 2.3 + pi) - 0.5) * 2 + storm * 24) * 10) / 10, perda_pct: Math.max(0, Math.round(((frac(m * 3.3 + pi) * 0.08) + storm * 2.4) * 100) / 100) });
  }
  return rows;
}
