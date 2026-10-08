import { createContext, useContext } from 'react';
import type { MapDocument } from './model';

export interface Camera { lon: number; lat: number; zoom: number }
export interface Pick { layerId: string; featureId: string }
export const MIN_ZOOM = 8, MAX_ZOOM = 18;

/** Web Mercator in "world pixels" at a (possibly fractional) zoom. */
export const project = (lon: number, lat: number, z: number) => ({
  x: (lon + 180) / 360 * 256 * 2 ** z,
  y: (1 - Math.asinh(Math.tan(Math.max(-85, Math.min(85, lat)) * Math.PI / 180)) / Math.PI) / 2 * 256 * 2 ** z,
});
export const unproject = (x: number, y: number, z: number) => ({
  lon: x / (256 * 2 ** z) * 360 - 180,
  lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / (256 * 2 ** z)))) * 180 / Math.PI,
});
export const metersPerPixel = (lat: number, zoom: number) => 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** zoom;

/** Everything an overlay needs to place itself on the map. */
export interface ViewCtx {
  camera: Camera; size: { w: number; h: number }; mpp: number; doc: MapDocument; time: number;
  p: (q: number[]) => { x: number; y: number };
  onCamera: (c: Camera) => void;
  onPick: (p: Pick) => void;
}
export const ViewContext = createContext<ViewCtx | null>(null);
export function useView(): ViewCtx {
  const v = useContext(ViewContext);
  if (!v) throw new Error('useView must be used inside GeoCanvas');
  return v;
}
