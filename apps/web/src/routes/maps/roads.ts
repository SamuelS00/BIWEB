import { distanceKm, frac } from './base';
import type { LonLat } from './base';

/**
 * Street-like routing for the demo data. There is no routing engine behind the maps, so connections
 * between two points are generated as a believable street path: a staircase of blocks with the
 * occasional diagonal avenue, deterministic for a given seed. Rendering rounds the corners.
 */
export function roadPath(a: LonLat, b: LonLat, seed = 0): LonLat[] {
  const km = distanceKm(a, b);
  if (km < 0.05) return [a, b];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const blocks = Math.max(2, Math.min(9, Math.round(km / 0.9)));
  const wx = Array.from({ length: blocks }, (_, i) => .35 + frac(seed * 13.3 + i * 2.1 + 1)), wy = Array.from({ length: blocks }, (_, i) => .35 + frac(seed * 7.9 + i * 3.7 + 5));
  const sx = wx.reduce((s, n) => s + n, 0), sy = wy.reduce((s, n) => s + n, 0);
  const pts: LonLat[] = [a];
  let x = a[0], y = a[1], horizontalFirst = frac(seed * 3.3 + 9) > .5;
  for (let i = 0; i < blocks; i++) {
    const mx = dx * wx[i]! / sx, my = dy * wy[i]! / sy;
    if (frac(seed * 5.1 + i * 1.9 + 3) > .72) { x += mx; y += my; pts.push([x, y]); continue; } // diagonal avenue
    if (horizontalFirst) { x += mx; pts.push([x, y]); y += my; pts.push([x, y]); } else { y += my; pts.push([x, y]); x += mx; pts.push([x, y]); }
    if (frac(seed * 2.7 + i + 11) > .6) horizontalFirst = !horizontalFirst;
  }
  pts[pts.length - 1] = b;
  return dedupe(pts);
}

/** Route that visits every stop in order, each leg following streets. */
export function routeThrough(stops: LonLat[], seed = 0): LonLat[] {
  const out: LonLat[] = [];
  stops.slice(1).forEach((to, i) => { const leg = roadPath(stops[i]!, to, seed + i * 17); out.push(...(out.length ? leg.slice(1) : leg)); });
  return out;
}

function dedupe(pts: LonLat[]): LonLat[] {
  const out: LonLat[] = [];
  for (const q of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[0] - q[0]) < 1e-7 && Math.abs(last[1] - q[1]) < 1e-7) continue;
    const prev = out[out.length - 2];
    if (last && prev && Math.abs((last[0] - prev[0]) * (q[1] - last[1]) - (last[1] - prev[1]) * (q[0] - last[0])) < 1e-12) { out[out.length - 1] = q; continue; }
    out.push(q);
  }
  return out;
}

export interface Path { pts: LonLat[]; cum: number[]; total: number }
/** Cumulative-length index so a vehicle can be placed at any distance along the route. */
export function makePath(pts: LonLat[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + distanceKm(pts[i - 1]!, pts[i]!));
  return { pts, cum, total: cum[cum.length - 1]! };
}
export function pathAt(path: Path, km: number): { lon: number; lat: number; heading: number } {
  const d = Math.max(0, Math.min(path.total, km));
  let i = 1;
  while (i < path.pts.length - 1 && path.cum[i]! < d) i++;
  const a = path.pts[i - 1]!, b = path.pts[i] ?? a, span = path.cum[i]! - path.cum[i - 1]! || 1, k = Math.max(0, Math.min(1, (d - path.cum[i - 1]!) / span));
  const heading = Math.atan2((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]) * 180 / Math.PI;
  return { lon: a[0] + (b[0] - a[0]) * k, lat: a[1] + (b[1] - a[1]) * k, heading };
}
/** Remaining part of a route after `km`, starting at the vehicle position. */
export function pathAfter(path: Path, km: number): LonLat[] {
  const here = pathAt(path, km), rest = path.pts.filter((_, i) => path.cum[i]! > km);
  return [[here.lon, here.lat], ...rest];
}

/** SVG path with rounded corners through already-projected points. */
export function roundedPath(pts: { x: number; y: number }[], radius = 9): string {
  if (pts.length < 3) return pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  let d = `M${pts[0]!.x.toFixed(1)},${pts[0]!.y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]!, p1 = pts[i]!, p2 = pts[i + 1]!;
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y), l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y), r = Math.min(radius, l1 / 2, l2 / 2);
    if (r < .5) { d += ` L${p1.x.toFixed(1)},${p1.y.toFixed(1)}`; continue; }
    const ax = p1.x + (p0.x - p1.x) * r / l1, ay = p1.y + (p0.y - p1.y) * r / l1, bx = p1.x + (p2.x - p1.x) * r / l2, by = p1.y + (p2.y - p1.y) * r / l2;
    d += ` L${ax.toFixed(1)},${ay.toFixed(1)} Q${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
  }
  const last = pts[pts.length - 1]!;
  return `${d} L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
}
