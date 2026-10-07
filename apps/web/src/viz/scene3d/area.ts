/**
 * Recorte local do gêmeo digital: ~3,6 km em torno do nó em foco, em metros locais (x = leste, z = sul, y = cima).
 * Sem three.js aqui — só dados e geometria pura, para manter o módulo testável.
 */
import { network } from '../../data/registry';
import type { NetLink, NetNode } from '../../net/generate';
import { terrain } from '../../net/los';

export const AREA_RADIUS = 3600;
export const GRID_N = 128;

export interface AreaNode {
  node: NetNode;
  x: number; z: number;
  /** cota do chão na cena (exagerada) */
  ground: number;
  /** altura física do ponto mais alto (m acima do chão, sem exagero) */
  height: number;
  /** cota real (m acima do mar) do topo — usada na visada */
  topReal: number;
  lon: number; lat: number;
}
export interface Area {
  focusId: string;
  lon0: number; lat0: number; mx: number; my: number;
  R: number; N: number; step: number;
  /** cota base (m) subtraída antes do exagero */
  base: number; minH: number; maxH: number;
  exag: number;
  /** alturas reais (m) da grade (N+1)², índice j*(N+1)+i, x = -R + i*step, z = -R + j*step */
  heights: Float32Array;
  /** cotas na cena (exageradas) da mesma grade */
  sceneY: Float32Array;
  nodes: AreaNode[];
  byId: Map<string, AreaNode>;
  /** enlaces desenhados (ambas as pontas na área, sem os cabos curtos de equipamento) */
  links: NetLink[];
}

const TOP: Record<NetNode['tipo'], number> = { Torre: 0, POP: 14, Equipamento: 4 };

export function toLocal(a: Pick<Area, 'lon0' | 'lat0' | 'mx' | 'my'>, lon: number, lat: number): [number, number] {
  return [(lon - a.lon0) * a.mx, -(lat - a.lat0) * a.my];
}
export function toLonLat(a: Pick<Area, 'lon0' | 'lat0' | 'mx' | 'my'>, x: number, z: number): [number, number] {
  return [a.lon0 + x / a.mx, a.lat0 - z / a.my];
}
/** Cota do chão na cena (bilinear sobre a grade). */
export function groundAt(a: Area, x: number, z: number): number {
  const N = a.N, fi = Math.min(N - 1e-6, Math.max(0, (x + a.R) / a.step)), fj = Math.min(N - 1e-6, Math.max(0, (z + a.R) / a.step));
  const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, W = N + 1, y = a.sceneY;
  const h00 = y[j * W + i] ?? 0, h10 = y[j * W + i + 1] ?? 0, h01 = y[(j + 1) * W + i] ?? 0, h11 = y[(j + 1) * W + i + 1] ?? 0;
  return (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
}
export const toSceneY = (a: Area, real: number) => (real - a.base) * a.exag;

export function resolveFocus(focus: string | undefined): NetNode | undefined {
  const nodes = network().nodes;
  const f = focus ? nodes.find((n) => n.id === focus) : undefined;
  if (f && f.tipo === 'Equipamento' && f.pai) return nodes.find((n) => n.id === f.pai) ?? f;
  return f ?? nodes.find((n) => n.id === 'Torre SP-023') ?? nodes.find((n) => n.tipo === 'Torre');
}

export function buildArea(focus: string | undefined, exaggeration: number): Area | null {
  const f = resolveFocus(focus);
  if (!f) return null;
  const exag = Math.max(1, Math.min(10, Number.isFinite(exaggeration) ? exaggeration : 3));
  const R = AREA_RADIUS, N = GRID_N, step = (2 * R) / N, W = N + 1;
  const lon0 = f.lon, lat0 = f.lat, mx = 111_320 * Math.cos((lat0 * Math.PI) / 180), my = 110_574;
  const proj = { lon0, lat0, mx, my };
  const heights = new Float32Array(W * W);
  let minH = Infinity, maxH = -Infinity;
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const [lon, lat] = toLonLat(proj, -R + i * step, -R + j * step);
    const h = terrain(lon, lat);
    heights[j * W + i] = h;
    if (h < minH) minH = h; if (h > maxH) maxH = h;
  }
  const base = Math.floor(minH / 10) * 10;
  const sceneY = new Float32Array(W * W);
  for (let k = 0; k < heights.length; k++) sceneY[k] = ((heights[k] ?? base) - base) * exag;
  const area: Area = { focusId: f.id, lon0, lat0, mx, my, R, N, step, base, minH, maxH, exag, heights, sceneY, nodes: [], byId: new Map(), links: [] };

  const net = network();
  const inside = (x: number, z: number) => Math.abs(x) < R - 60 && Math.abs(z) < R - 60;
  const add = (node: NetNode, x: number, z: number) => {
    const height = node.tipo === 'Torre' ? node.altura_m : TOP[node.tipo];
    const [lon, lat] = toLonLat(proj, x, z);
    const an: AreaNode = { node, x, z, ground: groundAt(area, x, z), height, topReal: terrain(lon, lat) + height, lon, lat };
    area.nodes.push(an); area.byId.set(node.id, an);
  };
  for (const n of net.nodes) {
    if (n.tipo === 'Equipamento') continue;
    const [x, z] = toLocal(proj, n.lon, n.lat);
    if (inside(x, z)) add(n, x, z);
  }
  // equipamentos: caixas pequenas ao pé do pai
  const kids = new Map<string, NetNode[]>();
  for (const n of net.nodes) if (n.tipo === 'Equipamento' && n.pai && area.byId.has(n.pai)) { const l = kids.get(n.pai) ?? []; l.push(n); kids.set(n.pai, l); }
  for (const [pid, list] of kids) {
    const p = area.byId.get(pid)!;
    const r = p.node.tipo === 'POP' ? 30 : 16;
    list.forEach((e, k) => { const ang = 0.6 + (k / list.length) * Math.PI * 2; add(e, p.x + Math.cos(ang) * r, p.z + Math.sin(ang) * r); });
  }
  area.links = net.links.filter((l) => {
    const a = area.byId.get(l.origem), b = area.byId.get(l.destino);
    return !!a && !!b && a.node.tipo !== 'Equipamento' && b.node.tipo !== 'Equipamento';
  });
  return area;
}
