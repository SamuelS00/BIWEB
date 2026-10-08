import type { Row } from '../../data/types';

export type LonLat = [number, number];
export type Geometry = { type: 'Point' | 'LineString' | 'Polygon'; coordinates: number[][] };
export interface Feature { id: string; geometry: Geometry; properties: Row }

/** Deterministic pseudo-random in [0, 1): the demo data must be identical on every load. */
export const frac = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** Seeded generator for simulations (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const point = (id: string, lon: number, lat: number, properties: Row): Feature =>
  ({ id, geometry: { type: 'Point', coordinates: [[lon, lat]] }, properties: { id, longitude: lon, latitude: lat, ...properties } });

export const stations = [
  ['Lapa', -46.705, -23.524], ['Barra Funda', -46.669, -23.526], ['Osasco', -46.779, -23.535],
  ['Barueri', -46.865, -23.51], ['Paulista', -46.654, -23.563], ['Santo Amaro', -46.709, -23.637],
  ['Itaquera', -46.474, -23.538], ['Santana', -46.627, -23.505], ['Mooca', -46.599, -23.567], ['Pinheiros', -46.693, -23.568],
] as const;

export function distanceKm(a: number[], b: number[]) {
  const rad = Math.PI / 180, dlat = (b[1]! - a[1]!) * rad, dlon = (b[0]! - a[0]!) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a[1]! * rad) * Math.cos(b[1]! * rad) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export const regionOf = (lon: number) => lon < -46.67 ? 'Oeste' : lon < -46.59 ? 'Centro' : 'Leste';
const MPD = 111320;
/** Move a coordinate by metres east/north. */
export const offsetM = (lon: number, lat: number, east: number, north: number): LonLat => [lon + east / (MPD * Math.cos(lat * Math.PI / 180)), lat + north / MPD];
/** Arc-shaped sector polygon (a wedge) centred on a site, azimuth in degrees clockwise from north. */
export function sectorPolygon(lon: number, lat: number, azimuth: number, widthDeg: number, rangeKm: number, steps = 9): number[][] {
  const pts: number[][] = [[lon, lat]];
  for (let i = 0; i <= steps; i++) {
    const a = (azimuth - widthDeg / 2 + widthDeg * i / steps) * Math.PI / 180;
    pts.push(offsetM(lon, lat, Math.sin(a) * rangeKm * 1000, Math.cos(a) * rangeKm * 1000));
  }
  pts.push([lon, lat]);
  return pts;
}
