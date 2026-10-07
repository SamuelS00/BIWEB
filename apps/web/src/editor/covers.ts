/**
 * Capas da galeria geradas a partir do conteúdo do próprio relatório: geometria real da rede
 * (regiões, enlaces, nós, rotas, eventos, relevo) e números reais agregados (gráficos e KPIs).
 * Canvas 2D offscreen → data URL (WebP quando suportado), com cache por id + updatedAt + tamanho.
 */
import { elevation, type NetLink, type NetStatus, type Network } from '../net/generate';
import { schematic } from '../net/layout';
import { getField, network } from '../data/registry';
import { aggFormat, aggregate, aggregateValues, fmt, rowsOf, type QueryCtx } from '../data/query';
import type { Agg, Filter, Row } from '../data/types';
import { DS, type ChartKind, type Comp, type ReportDoc } from './doc';

export interface CoverOpts { width?: number; height?: number; theme?: 'brand'; format?: 'jpeg' | 'webp' }

/* ---------- paleta da marca ---------- */
const INK = '#0c1b36', NAVY = '#153263', TEAL = '#16bcd8', BLUE = '#40a3c9', SLATE = '#546f93', AMBER = '#e0a43a', CORAL = '#ff6f61', PALE = '#d8f6fb';
const STATUS_COLOR: Record<NetStatus, string> = { normal: TEAL, warning: AMBER, critical: CORAL, offline: SLATE };
const CAT = [TEAL, BLUE, '#8fd3e6', SLATE, '#2b6fa8', '#9fb3cc'];
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

/* ---------- cache e canvas ---------- */
const cache = new Map<string, string>();
const CACHE_MAX = 80;
let canvas: HTMLCanvasElement | null = null;
let webp: boolean | null = null;
let family: string | null = null;

function fontFamily(): string {
  if (family) return family;
  let f = '';
  try { f = getComputedStyle(document.body).fontFamily; } catch { /* sem DOM */ }
  return (family = f || '"IBM Plex Sans", system-ui, sans-serif');
}
function scaleFor(w: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return dpr > 1 && w <= 640 ? 2 : 1;
}

/**
 * Data URL da capa. Cache por doc.id + doc.updatedAt + tamanho.
 * Formato: JPEG (q 0,9) por padrão — as capas são opacas e, medido no Chromium, o encoder WebP leva ~90 ms
 * por capa a 1280×720 (PNG ~30 ms e ~1,4 MB), contra ~13 ms do JPEG. `format: 'webp'` usa WebP quando suportado (senão PNG).
 */
export function coverFor(doc: ReportDoc, opts: CoverOpts = {}): string {
  const w = Math.round(opts.width ?? 640), h = Math.round(opts.height ?? 360), s = scaleFor(w), format = opts.format ?? 'jpeg';
  const key = `${doc.id}|${doc.updatedAt}|${w}x${h}@${s}|${doc.cover}|${format}`;
  const hit = cache.get(key);
  if (hit) return hit;
  canvas ??= document.createElement('canvas');
  canvas.width = w * s; canvas.height = h * s;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.drawImage(background(w, h, s), 0, 0, w, h);
  try { DRAW[doc.cover](ctx, doc, w, h); } catch (e) { console.warn('[covers]', doc.id, e); }
  drawMark(ctx, w, h);
  let url = '';
  if (format === 'jpeg') url = canvas.toDataURL('image/jpeg', 0.9);
  else if (format === 'webp' && webp !== false) { url = canvas.toDataURL('image/webp', 0.86); webp = url.startsWith('data:image/webp'); }
  if (!url || (format === 'webp' && !webp)) url = canvas.toDataURL('image/png');
  if (cache.size >= CACHE_MAX) { const first = cache.keys().next().value; if (first !== undefined) cache.delete(first); }
  cache.set(key, url);
  return url;
}

/** Gera as capas em tempo ocioso (requestIdleCallback; fallback setTimeout), uma ou poucas por fatia. */
const queue: { doc: ReportDoc; opts: CoverOpts }[] = [];
let scheduled = false;
export function coverPreload(docs: ReportDoc[], opts: CoverOpts = {}): void {
  for (const doc of docs) queue.push({ doc, opts });
  schedule();
}
function schedule() {
  if (scheduled || !queue.length) return;
  scheduled = true;
  const ric = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
  if (ric) ric(run, { timeout: 600 }); else setTimeout(() => run(), 16);
}
function run(deadline?: IdleDeadline) {
  scheduled = false;
  const t0 = performance.now();
  while (queue.length) {
    const job = queue.shift()!;
    coverFor(job.doc, job.opts);
    const left = deadline && !deadline.didTimeout ? deadline.timeRemaining() : 12 - (performance.now() - t0);
    if (left < 4) break;
  }
  schedule();
}

/* ---------- fundo e marca ---------- */
/** Fundo (gradiente navy → ink, grade de pontos, vinheta) renderizado uma vez por tamanho e reaproveitado. */
const bgCache = new Map<string, HTMLCanvasElement>();
function background(w: number, h: number, s: number): HTMLCanvasElement {
  const key = `${w}x${h}@${s}`;
  const hit = bgCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w * s; c.height = h * s;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, NAVY); g.addColorStop(1, INK);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(160,190,230,0.17)';
  ctx.beginPath();
  for (let y = 7; y < h; y += 14) for (let x = 7; x < w; x += 14) { ctx.moveTo(x + 0.6, y); ctx.arc(x, y, 0.6, 0, Math.PI * 2); }
  ctx.fill();
  const v = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, w * 0.75);
  v.addColorStop(0, 'rgba(12,27,54,0)'); v.addColorStop(1, 'rgba(12,27,54,0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  bgCache.set(key, c);
  return c;
}
function drawMark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const x = w - 30, y = h - 12;
  const bars: [number, string][] = [[5, rgba(SLATE, 0.7)], [8, rgba(SLATE, 0.85)], [12, rgba(BLUE, 0.9)]];
  bars.forEach(([bh, c], i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x + i * 6, y - bh, 4.5, bh, 1); ctx.fill(); });
}

/* ---------- projeção geográfica (pré-calculada por rede e tamanho) ---------- */
interface GeoFrame {
  links: Float32Array[]; regions: Float32Array[]; nodes: Float32Array /* x,y,... na ordem de net.nodes */;
  metro: Path2D; px: (lon: number, lat: number) => [number, number];
}
const geoCache = new WeakMap<Network, Map<string, GeoFrame>>();
function geoFrame(net: Network, w: number, h: number, pad = 26): GeoFrame {
  let m = geoCache.get(net);
  if (!m) { m = new Map(); geoCache.set(net, m); }
  const key = `${w}x${h}:${pad}`;
  const hit = m.get(key);
  if (hit) return hit;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  // enquadra a rede (nós e traçados); os polígonos das regiões podem sangrar para fora do quadro
  for (const l of net.links) for (const [lon, lat] of l.geometria) { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); }
  const kx = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
  const bw = (x1 - x0) * kx, bh = y1 - y0;
  const sc = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
  const ox = (w - bw * sc) / 2, oy = (h - bh * sc) / 2;
  const px = (lon: number, lat: number): [number, number] => [ox + (lon - x0) * kx * sc, oy + (y1 - lat) * sc];
  const proj = (pts: [number, number][]) => { const a = new Float32Array(pts.length * 2); pts.forEach(([lon, lat], i) => { const [x, y] = px(lon, lat); a[i * 2] = x; a[i * 2 + 1] = y; }); return a; };
  const regions = net.regions.map((r) => proj(r.poligono));
  const metro = new Path2D();
  for (const a of regions) { for (let i = 0; i < a.length; i += 2) (i ? metro.lineTo(a[i]!, a[i + 1]!) : metro.moveTo(a[i]!, a[i + 1]!)); metro.closePath(); }
  const f: GeoFrame = { px, regions, metro, links: net.links.map((l) => proj(l.geometria)), nodes: proj(net.nodes.map((n) => [n.lon, n.lat])) };
  m.set(key, f);
  return f;
}
function polyline(ctx: CanvasRenderingContext2D, a: Float32Array, close = false) {
  for (let i = 0; i < a.length; i += 2) (i ? ctx.lineTo(a[i]!, a[i + 1]!) : ctx.moveTo(a[i]!, a[i + 1]!));
  if (close) ctx.closePath();
}
function drawRegions(ctx: CanvasRenderingContext2D, f: GeoFrame, fill: string, stroke: string, lw = 0.6) {
  ctx.fillStyle = fill; ctx.fill(f.metro);
  ctx.beginPath();
  for (const a of f.regions) polyline(ctx, a, true);
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
}
/** Status efetivo dos enlaces (regras do relatório aplicadas). */
function linkStatus(doc: ReportDoc): Map<string, NetStatus> {
  const rows = rowsOf(DS, 'enlaces', { rules: doc.rules, filters: [] });
  return new Map(rows.map((r) => [String(r.id), String(r.status) as NetStatus]));
}
const LW: Record<NetLink['camada'], number> = { Backbone: 1.6, Metro: 0.95, Acesso: 0.6 };
const SEV_ORDER: NetStatus[] = ['normal', 'warning', 'critical', 'offline'];

function strokeLinks(ctx: CanvasRenderingContext2D, net: Network, f: GeoFrame, st: Map<string, NetStatus>) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const sev of SEV_ORDER) {
    for (const camada of ['Acesso', 'Metro', 'Backbone'] as const) {
      ctx.beginPath();
      let any = false;
      net.links.forEach((l, i) => { if (l.camada === camada && (st.get(l.id) ?? l.status) === sev) { polyline(ctx, f.links[i]!); any = true; } });
      if (!any) continue;
      if (sev === 'normal') ctx.strokeStyle = camada === 'Backbone' ? rgba(TEAL, 0.85) : camada === 'Metro' ? rgba(BLUE, 0.6) : rgba(BLUE, 0.32);
      else if (sev === 'offline') ctx.strokeStyle = rgba('#9fb3cc', 0.85);
      else ctx.strokeStyle = rgba(STATUS_COLOR[sev], 0.95);
      ctx.lineWidth = sev === 'normal' ? LW[camada] : Math.max(1.3, LW[camada] + 0.4);
      ctx.setLineDash(sev === 'offline' ? [3, 2.5] : []);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}

/* ---------- capas ---------- */
type Draw = (ctx: CanvasRenderingContext2D, doc: ReportDoc, w: number, h: number) => void;

const drawMap: Draw = (ctx, doc, w, h) => {
  const net = network(), f = geoFrame(net, w, h);
  drawRegions(ctx, f, rgba('#1a3d72', 0.35), rgba(SLATE, 0.45));
  strokeLinks(ctx, net, f, linkStatus(doc));
  // nós: equipamentos e torres minúsculos, POPs maiores com halo
  const order = ['Equipamento', 'Torre', 'POP'] as const;
  for (const tipo of order) {
    net.nodes.forEach((n, i) => {
      if (n.tipo !== tipo) return;
      const x = f.nodes[i * 2]!, y = f.nodes[i * 2 + 1]!;
      const c = n.status === 'normal' ? (tipo === 'POP' ? PALE : BLUE) : STATUS_COLOR[n.status];
      if (tipo === 'POP') { ctx.fillStyle = rgba(TEAL, 0.22); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, tipo === 'POP' ? 2.4 : tipo === 'Torre' ? 1.3 : 0.9, 0, Math.PI * 2); ctx.fill();
    });
  }
};

const drawTopology: Draw = (ctx, doc, w, h) => {
  const net = network(), pos = schematic(net), st = linkStatus(doc);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pos.values()) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const pad = 18, sy = (h - pad * 2) / (y1 - y0), sx = Math.min((w - pad * 2) / (x1 - x0), sy * 1.5);
  const P = (id: string): [number, number] | null => { const p = pos.get(id); return p ? [w / 2 + (p[0] - (x0 + x1) / 2) * sx, h / 2 + (p[1] - (y0 + y1) / 2) * sy] : null; };
  // anel guia do backbone
  ctx.strokeStyle = rgba(SLATE, 0.25); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(w / 2 + (0.5 - (x0 + x1) / 2) * sx, h / 2 + (0.5 - (y0 + y1) / 2) * sy, 0.3 * sx, 0.3 * sy, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.lineCap = 'round';
  for (const sev of SEV_ORDER) for (const camada of ['Acesso', 'Metro', 'Backbone'] as const) {
    ctx.beginPath(); let any = false;
    for (const l of net.links) {
      if (l.camada !== camada || (st.get(l.id) ?? l.status) !== sev) continue;
      const a = P(l.origem), b = P(l.destino); if (!a || !b) continue;
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); any = true;
    }
    if (!any) continue;
    ctx.strokeStyle = sev === 'normal' ? (camada === 'Backbone' ? rgba(TEAL, 0.95) : camada === 'Metro' ? rgba(BLUE, 0.5) : rgba(BLUE, 0.26)) : sev === 'offline' ? rgba('#9fb3cc', 0.85) : rgba(STATUS_COLOR[sev], 0.9);
    ctx.lineWidth = camada === 'Backbone' ? 2.2 : sev === 'normal' ? (camada === 'Metro' ? 0.9 : 0.6) : 1.2;
    ctx.setLineDash(sev === 'offline' ? [3, 2.5] : []);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const tipo of ['Equipamento', 'Torre', 'POP'] as const) for (const n of net.nodes) {
    if (n.tipo !== tipo) continue;
    const p = P(n.id); if (!p) continue;
    const c = n.status === 'normal' ? (tipo === 'Equipamento' ? rgba(BLUE, 0.9) : tipo === 'Torre' ? '#8fd3e6' : PALE) : STATUS_COLOR[n.status];
    if (tipo === 'POP') {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(p[0], p[1], 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (tipo === 'Torre') { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], 1.9, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = c; ctx.fillRect(p[0] - 1.3, p[1] - 1.3, 2.6, 2.6); }
  }
};

const drawRoutes: Draw = (ctx, doc, w, h) => {
  const net = network(), f = geoFrame(net, w, h);
  drawRegions(ctx, f, rgba('#1a3d72', 0.28), rgba(SLATE, 0.3), 0.5);
  ctx.beginPath(); for (const a of f.links) polyline(ctx, a);
  ctx.strokeStyle = rgba(SLATE, 0.32); ctx.lineWidth = 0.6; ctx.stroke();
  const idx = new Map(net.links.map((l, i) => [l.id, i]));
  const mapComp = allComps(doc).find((c) => c.type === 'map' && c.props.variant === 'routes');
  const first = typeof mapComp?.props.routeId === 'string' ? mapComp.props.routeId : undefined;
  const ranked = [...net.routes].sort((a, b) => Number(b.id === first) - Number(a.id === first) || Number(!!b.desvio) - Number(!!a.desvio) || b.distancia_km - a.distancia_km);
  // a rota do mapa, até 2 com desvio ativo e as mais longas sem desvio (total 5)
  const picked: typeof ranked = [];
  for (const r of ranked) {
    const nDesvio = picked.filter((x) => x.desvio).length;
    if (r.id === first || (r.desvio ? nDesvio < 2 : picked.length - nDesvio < 3)) picked.push(r);
    if (picked.length >= 5) break;
  }
  const path = (ids: string[]) => { ctx.beginPath(); for (const id of ids) { const i = idx.get(id); if (i !== undefined) polyline(ctx, f.links[i]!); } };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const r of picked) {
    if (r.desvio) continue;
    path(r.enlaces); ctx.strokeStyle = rgba(TEAL, 0.18); ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const r of picked) {
    if (!r.desvio) continue;
    path(r.desvio.enlaces); ctx.strokeStyle = rgba(BLUE, 0.2); ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.stroke();
    path(r.enlaces); ctx.strokeStyle = CORAL; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  }
  // origem/destino com rótulos
  const ends = new Map<string, number>();
  for (const r of picked) for (const id of [r.origem, r.destino]) { const i = net.nodes.findIndex((n) => n.id === id); if (i >= 0) ends.set(id, i); }
  ctx.font = `500 9px ${fontFamily()}`; ctx.textBaseline = 'middle';
  const placed: [number, number, number, number][] = [];
  for (const [id, i] of ends) {
    const x = f.nodes[i * 2]!, y = f.nodes[i * 2 + 1]!;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 3.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALE; ctx.lineWidth = 1.4; ctx.stroke();
    const label = id.replace(/^POP-/, '').replace(/-/g, ' ');
    const tw = ctx.measureText(label).width;
    const cands: [number, number][] = [[x + 7, y], [x - 7 - tw, y], [x - tw / 2, y - 11], [x - tw / 2, y + 11], [x + 7, y + 11], [x - 7 - tw, y - 11]];
    const free = (lx: number, ly: number) => lx > 6 && lx + tw < w - 6 && !placed.some(([a, b, c, d]) => lx - 2 < c && lx + tw + 2 > a && ly - 6 < d && ly + 6 > b);
    const [lx, ly] = cands.find(([a, b]) => free(a, b)) ?? cands[0]!;
    placed.push([lx, ly - 5, lx + tw, ly + 5]);
    ctx.fillStyle = rgba(INK, 0.6); ctx.fillRect(lx - 2, ly - 5.5, tw + 4, 11);
    ctx.fillStyle = rgba(PALE, 0.9); ctx.fillText(label, lx, ly + 0.5);
  }
};

/** Rampa sequencial navy → azul → teal → claro (RGBA, 256 entradas). */
let rampLut: Uint8ClampedArray | null = null;
function ramp(): Uint8ClampedArray {
  if (rampLut) return rampLut;
  const stops: [number, string, number][] = [[0, NAVY, 0], [0.18, '#1f4f8a', 0.55], [0.45, BLUE, 0.85], [0.72, TEAL, 0.95], [1, PALE, 1]];
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0; while (k < stops.length - 2 && t > stops[k + 1]![0]) k++;
    const [t0, c0, a0] = stops[k]!, [t1, c1, a1] = stops[k + 1]!;
    const u = (t - t0) / (t1 - t0);
    const n0 = parseInt(c0.slice(1), 16), n1 = parseInt(c1.slice(1), 16);
    for (let ch = 0; ch < 3; ch++) { const s = 16 - ch * 8; lut[i * 4 + ch] = ((n0 >> s) & 255) * (1 - u) + ((n1 >> s) & 255) * u; }
    lut[i * 4 + 3] = 255 * (a0 * (1 - u) + a1 * u);
  }
  return (rampLut = lut);
}
const heatCache = new WeakMap<Network, Map<string, HTMLCanvasElement>>();
const drawHeat: Draw = (ctx, _doc, w, h) => {
  const net = network(), f = geoFrame(net, w, h);
  ctx.fillStyle = rgba('#10264b', 0.85); ctx.fill(f.metro);
  let m = heatCache.get(net);
  if (!m) { m = new Map(); heatCache.set(net, m); }
  const key = `${w}x${h}`;
  let hc = m.get(key);
  if (!hc) {
    const cell = 3, gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), sigma = 15 / cell, R = Math.ceil(sigma * 3);
    const grid = new Float32Array(gw * gh);
    const ker = new Float32Array((2 * R + 1) ** 2);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) ker[(dy + R) * (2 * R + 1) + dx + R] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    for (const e of net.events) {
      const [x, y] = f.px(e.lon, e.lat), cx = Math.round(x / cell), cy = Math.round(y / cell);
      const wgt = e.severidade === 'offline' || e.severidade === 'critical' ? 1.4 : 1;
      for (let dy = -R; dy <= R; dy++) {
        const yy = cy + dy; if (yy < 0 || yy >= gh) continue;
        for (let dx = -R; dx <= R; dx++) { const xx = cx + dx; if (xx < 0 || xx >= gw) continue; grid[yy * gw + xx]! += wgt * ker[(dy + R) * (2 * R + 1) + dx + R]!; }
      }
    }
    let max = 0; for (const v of grid) max = Math.max(max, v);
    const lut = ramp(), img = new ImageData(gw, gh);
    for (let i = 0; i < grid.length; i++) {
      const t = Math.min(255, Math.round(Math.pow(grid[i]! / (max || 1), 0.75) * 255)) * 4;
      img.data[i * 4] = lut[t]!; img.data[i * 4 + 1] = lut[t + 1]!; img.data[i * 4 + 2] = lut[t + 2]!; img.data[i * 4 + 3] = lut[t + 3]!;
    }
    hc = document.createElement('canvas'); hc.width = gw; hc.height = gh;
    hc.getContext('2d')!.putImageData(img, 0, 0);
    m.set(key, hc);
  }
  ctx.save(); ctx.clip(f.metro);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(hc, 0, 0, hc.width * 3, hc.height * 3);
  ctx.restore();
  ctx.beginPath(); for (const a of f.regions) polyline(ctx, a, true);
  ctx.strokeStyle = 'rgba(200,225,250,0.22)'; ctx.lineWidth = 0.6; ctx.lineJoin = 'round'; ctx.stroke();
  // ocorrências ainda ativas
  for (const e of net.events) {
    if (e.resolvido) continue;
    const [x, y] = f.px(e.lon, e.lat);
    ctx.strokeStyle = CORAL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  }
};

/* ---------- gráficos reais ---------- */
function allComps(doc: ReportDoc): Comp[] { return doc.pages.flatMap((p) => [...p.comps].sort((a, b) => a.y - b.y || a.x - b.x)); }
const ctxOf = (doc: ReportDoc, c: Comp): QueryCtx => ({ rules: doc.rules, filters: c.localFilters });

interface Pt { label: string; value: number; series?: string; key: unknown }
function plotArea(w: number, h: number) { return { l: 36, r: w - 36, t: 40, b: h - 40 }; }
/** Linha de base "honesta" para valores em faixa estreita (ex.: disponibilidade 99,x%) — só para a miniatura. */
function domain(vals: number[]): [number, number] {
  const mx = Math.max(...vals, 0), mn = Math.min(...vals);
  if (mn > 0 && mn / (mx || 1) > 0.85) return [mn - (mx - mn) * 1.2 - mx * 0.002, mx];
  return [Math.min(0, mn), mx || 1];
}
function seriesColor(series: string | undefined, all: string[], byStatus: boolean): string {
  if (series === undefined) return TEAL;
  if (byStatus && series in STATUS_COLOR) return series === 'normal' ? BLUE : STATUS_COLOR[series as NetStatus];
  return CAT[Math.max(0, all.indexOf(series)) % CAT.length]!;
}
function drawBars(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, h: number, horizontal: boolean, byStatus: boolean) {
  const A = plotArea(w, h);
  const keys: string[] = [], seriesNames: string[] = [];
  const stack = new Map<string, { s?: string; v: number }[]>();
  for (const p of pts) {
    if (!stack.has(p.label)) { stack.set(p.label, []); keys.push(p.label); }
    stack.get(p.label)!.push({ s: p.series, v: p.value });
    if (p.series !== undefined && !seriesNames.includes(p.series)) seriesNames.push(p.series);
  }
  if (byStatus) seriesNames.sort((a, b) => SEV_ORDER.indexOf(a as NetStatus) - SEV_ORDER.indexOf(b as NetStatus));
  const totals = keys.map((k) => stack.get(k)!.reduce((a, b) => a + b.v, 0));
  const [d0, d1] = domain(totals);
  const n = keys.length, len = horizontal ? A.b - A.t : A.r - A.l, slot = len / Math.max(1, n), bw = Math.min(slot * 0.68, horizontal ? 26 : 44);
  const span = horizontal ? A.r - A.l : A.b - A.t;
  const maxI = totals.indexOf(Math.max(...totals));
  keys.forEach((k, i) => {
    const segs = stack.get(k)!.sort((a, b) => seriesNames.indexOf(a.s ?? '') - seriesNames.indexOf(b.s ?? ''));
    let acc = 0;
    const c = (horizontal ? A.t : A.l) + slot * (i + 0.5) - bw / 2;
    segs.forEach((sg, j) => {
      const v0 = (acc - d0) / (d1 - d0), v1 = (acc + sg.v - d0) / (d1 - d0);
      acc += sg.v;
      const a = Math.max(0, v0) * span, b = Math.max(0, v1) * span, last = j === segs.length - 1;
      const col = sg.s !== undefined ? seriesColor(sg.s, seriesNames, byStatus) : i === maxI ? TEAL : BLUE;
      if (horizontal) {
        const g = ctx.createLinearGradient(A.l, 0, A.r, 0); g.addColorStop(0, rgba(col, 0.75)); g.addColorStop(1, col);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(A.l + a, c, Math.max(1, b - a), bw, last ? [0, 3, 3, 0] : 0); ctx.fill();
      } else {
        const g = ctx.createLinearGradient(0, A.b, 0, A.t); g.addColorStop(0, rgba(col, 0.7)); g.addColorStop(1, col);
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(c, A.b - b, bw, Math.max(1, b - a), last ? [3, 3, 0, 0] : 0); ctx.fill();
      }
    });
  });
  ctx.strokeStyle = rgba(SLATE, 0.8); ctx.lineWidth = 1; ctx.beginPath();
  if (horizontal) { ctx.moveTo(A.l + 0.5, A.t - 6); ctx.lineTo(A.l + 0.5, A.b + 6); } else { ctx.moveTo(A.l - 6, A.b + 0.5); ctx.lineTo(A.r + 6, A.b + 0.5); }
  ctx.stroke();
}
function drawLine(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, h: number, area: boolean) {
  const A = plotArea(w, h), vals = pts.map((p) => p.value);
  if (vals.length < 2) return;
  let [d0, d1] = [Math.min(...vals), Math.max(...vals)];
  const pad = (d1 - d0) * 0.25 || 1; d0 -= pad; d1 += pad * 0.4;
  const X = (i: number) => A.l + (i / (vals.length - 1)) * (A.r - A.l), Y = (v: number) => A.b - ((v - d0) / (d1 - d0)) * (A.b - A.t);
  // grade horizontal discreta
  ctx.strokeStyle = rgba(SLATE, 0.22); ctx.lineWidth = 0.7;
  for (let k = 1; k <= 3; k++) { const y = A.t + ((A.b - A.t) * k) / 4; ctx.beginPath(); ctx.moveTo(A.l, y); ctx.lineTo(A.r, y); ctx.stroke(); }
  const trace = () => { ctx.beginPath(); vals.forEach((v, i) => { const x = X(i), y = Y(v); if (!i) ctx.moveTo(x, y); else { const px = X(i - 1), py = Y(vals[i - 1]!); ctx.bezierCurveTo((px + x) / 2, py, (px + x) / 2, y, x, y); } }); };
  if (area) {
    trace(); ctx.lineTo(A.r, A.b); ctx.lineTo(A.l, A.b); ctx.closePath();
    const g = ctx.createLinearGradient(0, A.t, 0, A.b); g.addColorStop(0, rgba(TEAL, 0.45)); g.addColorStop(1, rgba(TEAL, 0));
    ctx.fillStyle = g; ctx.fill();
  }
  trace(); ctx.strokeStyle = TEAL; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  const lx = X(vals.length - 1), ly = Y(vals[vals.length - 1]!);
  ctx.fillStyle = rgba(TEAL, 0.25); ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALE; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = rgba(SLATE, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.l - 6, A.b + 0.5); ctx.lineTo(A.r + 6, A.b + 0.5); ctx.stroke();
}
function drawPie(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, h: number, byStatus: boolean) {
  const total = pts.reduce((a, p) => a + p.value, 0) || 1, R = h * 0.34, cx = w / 2, cy = h / 2;
  let a = -Math.PI / 2;
  const names = pts.map((p) => String(p.key));
  pts.forEach((p, i) => {
    const da = (p.value / total) * Math.PI * 2, k = String(p.key);
    ctx.fillStyle = byStatus && k in STATUS_COLOR ? (k === 'normal' ? TEAL : STATUS_COLOR[k as NetStatus]) : CAT[i % CAT.length]!;
    ctx.beginPath(); ctx.arc(cx, cy, R, a + 0.012, a + da - 0.012); ctx.arc(cx, cy, R * 0.62, a + da - 0.02, a + 0.02, true); ctx.closePath(); ctx.fill();
    a += da;
  });
  void names;
}
function drawScatter(ctx: CanvasRenderingContext2D, rows: Row[], xf: string, yf: string, series: string | undefined, w: number, h: number) {
  const A = plotArea(w, h);
  const xs = rows.map((r) => Number(r[xf])), ys = rows.map((r) => Number(r[yf]));
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const names = [...new Set(rows.map((r) => String(r[series ?? ''] ?? '')))];
  rows.forEach((r, i) => {
    const x = A.l + ((xs[i]! - x0) / (x1 - x0 || 1)) * (A.r - A.l), y = A.b - ((ys[i]! - y0) / (y1 - y0 || 1)) * (A.b - A.t);
    ctx.fillStyle = rgba(series ? CAT[names.indexOf(String(r[series] ?? '')) % CAT.length]! : TEAL, 0.7);
    ctx.beginPath(); ctx.arc(x + (Math.sin(i * 12.9898) * 2), y, 2.2, 0, Math.PI * 2); ctx.fill();
  });
  ctx.strokeStyle = rgba(SLATE, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.l - 6, A.b + 6.5); ctx.lineTo(A.r + 6, A.b + 6.5); ctx.stroke();
}

const drawChart: Draw = (ctx, doc, w, h) => {
  const comps = allComps(doc);
  const chart = comps.find((c) => c.type === 'chart' && !c.hidden);
  if (chart) {
    const p = chart.props as { kind?: ChartKind; x?: string; y?: string; y2?: string; agg?: Agg; series?: string; sort?: 'value' | 'label' | 'none'; limit?: number; grain?: 'day' | 'week' };
    const ds = chart.data?.dataset ?? DS, table = chart.data?.table ?? 'enlaces', kind = p.kind ?? 'bar';
    const rows = rowsOf(ds, table, ctxOf(doc, chart));
    if (kind === 'scatter') { drawScatter(ctx, rows.slice(0, p.limit || 400), p.x ?? 'extensao_km', p.y2 ?? p.y ?? 'atenuacao_dB', p.series, w, h); return; }
    const pts = aggregate(rows, { ds, table, groupBy: p.x, measure: p.y, agg: p.agg ?? 'count', series: p.series, sort: p.sort, limit: kind === 'pie' ? p.limit || 6 : p.limit, grain: p.grain });
    const byStatus = p.x === 'status' || p.x === 'severidade' || p.series === 'status' || p.series === 'severidade';
    if (kind === 'line' || kind === 'area') drawLine(ctx, pts, w, h, kind === 'area');
    else if (kind === 'pie') drawPie(ctx, pts, w, h, byStatus);
    else drawBars(ctx, pts, w, h, kind === 'hbar', byStatus);
    return;
  }
  const tl = comps.find((c) => c.type === 'timeline');
  if (tl) { drawTimeline(ctx, doc, tl, w, h); return; }
  const rows = rowsOf(DS, 'enlaces', { rules: doc.rules, filters: [] });
  drawBars(ctx, aggregate(rows, { ds: DS, table: 'enlaces', groupBy: 'regiao', measure: 'id', agg: 'count', sort: 'value', limit: 12 }), w, h, false, false);
};
/** Linha do tempo: eventos por dia (30 dias), empilhados pelos 4 grupos mais frequentes. */
function drawTimeline(ctx: CanvasRenderingContext2D, doc: ReportDoc, c: Comp, w: number, h: number) {
  const p = c.props as { dateField?: string; groupBy?: string; days?: number };
  const table = c.data?.table ?? 'eventos', ds = c.data?.dataset ?? DS;
  const rows = rowsOf(ds, table, ctxOf(doc, c));
  const days = p.days ?? 30, DAY = 86_400_000, df = p.dateField ?? 'data';
  const end = Math.max(...rows.map((r) => Number(r[df])), 0), d0 = Math.floor(end / DAY) - days + 1;
  const counts = Array.from({ length: days }, () => 0);
  for (const r of rows) { const d = Math.floor(Number(r[df]) / DAY) - d0; if (d >= 0 && d < days) counts[d]!++; }
  drawBars(ctx, counts.map((v, i) => ({ label: String(i), value: v, key: i })), w, h, false, false);
}

/* ---------- KPIs reais ---------- */
const drawKpi: Draw = (ctx, doc, w, h) => {
  const kpis = (doc.pages[0]?.comps ?? []).filter((c) => c.type === 'kpi' && !c.hidden).sort((a, b) => a.y - b.y || a.x - b.x).slice(0, 4);
  const ff = fontFamily();
  const n = Math.max(1, kpis.length), gap = 10, padX = 28, top = 34, th = h * 0.36;
  const tw = (w - padX * 2 - gap * (n - 1)) / n;
  let sparkComp: Comp | undefined;
  kpis.forEach((c, i) => {
    const p = c.props as { compare?: 'none' | 'target'; measure?: string; agg?: Agg; label?: string; target?: number; targetDir?: 'above' | 'below'; spark?: boolean; sparkMeasure?: string };
    const ds = c.data?.dataset ?? DS, table = c.data?.table ?? 'enlaces', agg = p.agg ?? 'count', measure = p.measure ?? 'id';
    const rows = rowsOf(ds, table, ctxOf(doc, c));
    const v = aggregateValues(rows.map((r) => r[measure]), agg);
    const format = aggFormat(agg, getField(ds, table, measure));
    const x = padX + i * (tw + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.strokeStyle = 'rgba(160,190,230,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 0.5, top + 0.5, tw - 1, th, 8); ctx.fill(); ctx.stroke();
    const ok = p.target === undefined || p.compare !== 'target' ? undefined : p.targetDir === 'below' ? v <= p.target : v >= p.target;
    ctx.fillStyle = ok === undefined ? BLUE : ok ? TEAL : AMBER; ctx.beginPath(); ctx.roundRect(x + 12, top + 12, 3, th - 24, 1.5); ctx.fill();
    ctx.textBaseline = 'alphabetic';
    ctx.font = `500 10.5px ${ff}`; ctx.fillStyle = 'rgba(200,218,240,0.75)';
    ctx.fillText(clip(ctx, p.label ?? c.style.title, tw - 34), x + 22, top + 26);
    const val = fmt(v, format, true);
    let fs = Math.min(32, tw * 0.26);
    ctx.font = `600 ${fs}px ${ff}`;
    while (fs > 14 && ctx.measureText(val).width > tw - 34) { fs -= 1; ctx.font = `600 ${fs}px ${ff}`; }
    ctx.fillStyle = '#f2f7fc'; ctx.fillText(val, x + 22, top + 26 + fs + 8);
    if (ok !== undefined) {
      const txt = `meta ${fmt(p.target, format, true)}`;
      ctx.font = `600 9px ${ff}`;
      const cw = ctx.measureText(txt).width + 14, cy = top + th - 22;
      ctx.fillStyle = rgba(ok ? TEAL : AMBER, 0.16); ctx.beginPath(); ctx.roundRect(x + 22, cy, cw, 14, 7); ctx.fill();
      ctx.fillStyle = ok ? TEAL : AMBER; ctx.beginPath(); ctx.arc(x + 28, cy + 7, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ok ? '#8fe3f2' : '#f3c77a'; ctx.fillText(txt, x + 33, cy + 10.5);
    }
    if (!sparkComp && p.spark) sparkComp = c;
  });
  // sparkline: série diária real do histórico
  const sm = sparkComp ? String((sparkComp.props as { sparkMeasure?: string; measure?: string }).sparkMeasure ?? (sparkComp.props as { measure?: string }).measure) : 'disponibilidade';
  const hist = rowsOf(DS, 'historico', { rules: [], filters: [] as Filter[] });
  const pts = aggregate(hist, { ds: DS, table: 'historico', groupBy: 'dia', measure: sm, agg: 'avg', grain: 'day' });
  const vals = pts.map((p) => p.value);
  if (vals.length < 2) return;
  const L = padX, R = w - padX, T = top + th + 30, B = h - 34;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const X = (i: number) => L + (i / (vals.length - 1)) * (R - L), Y = (v: number) => B - ((v - mn) / rg) * (B - T);
  ctx.beginPath(); vals.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  ctx.lineTo(R, B + 6); ctx.lineTo(L, B + 6); ctx.closePath();
  const g = ctx.createLinearGradient(0, T, 0, B + 6); g.addColorStop(0, rgba(TEAL, 0.3)); g.addColorStop(1, rgba(TEAL, 0));
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); vals.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
  ctx.strokeStyle = TEAL; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = PALE; ctx.beginPath(); ctx.arc(R, Y(vals[vals.length - 1]!), 2.6, 0, Math.PI * 2); ctx.fill();
};
function clip(ctx: CanvasRenderingContext2D, s: string, max: number) {
  if (ctx.measureText(s).width <= max) return s;
  let t = s; while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/* ---------- gêmeo digital: relevo em cristas (oblíquo) ---------- */
interface Terrain { lon0: number; lat1: number; dLon: number; dLat: number; N: number; z: Float32Array; zMin: number; zMax: number }
const terrainCache = new WeakMap<Network, Terrain>();
function terrainAround(net: Network, focusId: string): { t: Terrain; focus: Network['nodes'][number] | undefined } {
  const focus = net.nodes.find((n) => n.id === focusId) ?? net.nodes.find((n) => n.tipo === 'Torre');
  const hit = terrainCache.get(net);
  if (hit) return { t: hit, focus };
  const N = 60, half = 0.042, kx = Math.cos(((focus?.lat ?? -23.56) * Math.PI) / 180);
  const lon0 = (focus?.lon ?? -46.64) - (half * 1.5) / kx, lat1 = (focus?.lat ?? -23.56) + half;
  const dLon = (half * 3) / kx / (N - 1), dLat = (half * 2) / (N - 1);
  const z = new Float32Array(N * N); let zMin = Infinity, zMax = -Infinity;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const e = elevation(lon0 + i * dLon, lat1 - j * dLat); z[j * N + i] = e; zMin = Math.min(zMin, e); zMax = Math.max(zMax, e); }
  const t = { lon0, lat1, dLon, dLat, N, z, zMin, zMax };
  terrainCache.set(net, t);
  return { t, focus };
}
const draw3d: Draw = (ctx, doc, w, h) => {
  const net = network();
  const sc = allComps(doc).find((c) => c.type === 'scene3d');
  const focusId = typeof sc?.props.focus === 'string' ? sc.props.focus : 'Torre SP-023';
  const { t, focus } = terrainAround(net, focusId);
  const { N, z, zMin, zMax } = t;
  const top = h * 0.2, depth = h * 0.74, H = h * 0.3, vs = H / (zMax - zMin || 1);
  // (u: 0..1 oeste→leste, v: 0..1 fundo→frente, alt em m) → tela
  const P = (u: number, v: number, alt: number): [number, number] => {
    const p = 0.6 + 0.4 * v;
    return [w / 2 + (u - 0.5) * w * 1.08 * p, top + depth * (v * (0.6 + 0.4 * v)) - (alt - zMin) * vs * p];
  };
  const uvOf = (lon: number, lat: number): [number, number] => [(lon - t.lon0) / (t.dLon * (N - 1)), (t.lat1 - lat) / (t.dLat * (N - 1))];
  const towers = net.nodes.filter((n) => n.tipo === 'Torre').map((n) => ({ n, uv: uvOf(n.lon, n.lat) })).filter(({ uv }) => uv[0] >= 0.02 && uv[0] <= 0.98 && uv[1] >= 0.02 && uv[1] <= 0.98);
  const tops = new Map<string, [number, number]>();
  const ridge = (j: number, v: number) => { for (let i = 0; i < N; i++) { const [x, y] = P(i / (N - 1), v, z[j * N + i]!); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } };
  for (let j = 0; j < N; j++) {
    const v = j / (N - 1);
    // oclusão: basta preencher da crista até a base desta linha (as de trás nunca descem abaixo dela)
    const [xr, yb] = P(1, v, zMin), [xl] = P(0, v, zMin);
    ctx.beginPath(); ridge(j, v); ctx.lineTo(xr, j === N - 1 ? h + 2 : yb + 0.5); ctx.lineTo(xl, j === N - 1 ? h + 2 : yb + 0.5); ctx.closePath();
    ctx.fillStyle = j === N - 1 ? '#0d1d3b' : `rgb(${16 - 3 * v | 0},${37 - 8 * v | 0},${72 - 13 * v | 0})`; ctx.fill();
    ctx.beginPath(); ridge(j, v);
    const major = j % 6 === 0;
    ctx.strokeStyle = major ? rgba(TEAL, 0.4 + 0.5 * v) : rgba(BLUE, 0.2 + 0.45 * v);
    ctx.lineWidth = major ? 1.1 : 0.7; ctx.lineJoin = 'round'; ctx.stroke();
    // torres desta faixa de profundidade
    for (const { n, uv } of towers) {
      if (Math.floor(uv[1] * (N - 1)) !== j) continue;
      const base = elevation(n.lon, n.lat), [bx, by] = P(uv[0], uv[1], base), [tx, ty] = P(uv[0], uv[1], base + n.altura_m);
      const isFocus = n.id === focus?.id, col = n.status === 'normal' ? PALE : STATUS_COLOR[n.status];
      ctx.strokeStyle = rgba(PALE, isFocus ? 0.95 : 0.75); ctx.lineWidth = isFocus ? 2 : 1.3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = rgba(PALE, 0.5); ctx.beginPath(); ctx.ellipse(bx, by, 3, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      if (isFocus) { ctx.strokeStyle = rgba(col, 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx, ty, 6.5, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, isFocus ? 3 : 2.1, 0, Math.PI * 2); ctx.fill();
      tops.set(n.id, [tx, ty]);
    }
  }
  // linha de visada: torre-foco → a torre mais distante dentro da cena (ou SP-041, se estiver nela)
  if (!focus) return;
  const others = towers.filter(({ n }) => n.id !== focus.id);
  const target = others.find(({ n }) => n.id === 'Torre SP-041') ?? others.sort((a, b) => Math.hypot(b.uv[0] - 0.5, b.uv[1] - 0.5) - Math.hypot(a.uv[0] - 0.5, a.uv[1] - 0.5)).find(({ uv }) => uv[1] < 0.85);
  const a = tops.get(focus.id), b = target ? tops.get(target.n.id) : undefined;
  if (!target || !a || !b) return;
  const ha = elevation(focus.lon, focus.lat) + focus.altura_m, hb = elevation(target.n.lon, target.n.lat) + target.n.altura_m;
  let blocked = false;
  for (let k = 1; k < 40; k++) { const s = k / 40; if (elevation(focus.lon + (target.n.lon - focus.lon) * s, focus.lat + (target.n.lat - focus.lat) * s) > ha + (hb - ha) * s) { blocked = true; break; } }
  ctx.strokeStyle = blocked ? CORAL : TEAL; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
};

const DRAW: Record<ReportDoc['cover'], Draw> = { map: drawMap, topology: drawTopology, routes: drawRoutes, heat: drawHeat, chart: drawChart, kpi: drawKpi, '3d': draw3d };
