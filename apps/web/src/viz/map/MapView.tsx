import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@biweb/ui';
import { applyRules, STATUS_LABEL } from '../../data/query';
import { getTable, network } from '../../data/registry';
import type { Row } from '../../data/types';
import type { Comp, MapLayers, MapProps } from '../../editor/doc';
import { useEditor } from '../../editor/store';
import { hash, type LonLat, type NetRegion } from '../../net/generate';
import { schematic } from '../../net/layout';
import { useEmit } from '../Chart';
import { isReduced, StatusDot, useRows, useRules, useSize, useTokens } from '../common';
import { DetailPanel, RouteStrip } from './panels';

const KX = Math.cos((23.56 * Math.PI) / 180);
const LON0 = -46.64, LAT0 = -23.56;
type Pt = [number, number];
const geo = ([lon, lat]: LonLat): Pt => [(lon - LON0) * KX * 100, -(lat - LAT0) * 100];
const TOKENS = ['viz-map-land', 'viz-map-boundary', 'viz-map-label', 'viz-map-water', 'viz-status-normal', 'viz-status-warning', 'viz-status-critical', 'viz-status-offline',
  'viz-cat-1', 'viz-cat-2', 'viz-cat-3', 'viz-cat-4', 'viz-cat-5', 'viz-cat-8', 'viz-seq-1', 'viz-seq-2', 'viz-seq-3', 'viz-seq-4', 'viz-seq-5', 'dash-title', 'dash-widget-surface', 'font-sans'];
export const LAYER_LABEL: [keyof MapLayers, string][] = [['nos', 'Ativos'], ['enlaces', 'Infraestrutura (enlaces)'], ['eventos', 'Ocorrências'], ['rotas', 'Rotas'], ['cobertura', 'Cobertura 5G'], ['clientes', 'Clientes'], ['regioes', 'Regiões'], ['heat', 'Mapa de calor'], ['clusters', 'Agrupar ativos']];

interface View { cx: number; cy: number; s: number }
interface Hover { kind: 'node' | 'link' | 'event' | 'region' | 'cluster'; id: string; x: number; y: number; text: string; extra?: Pt }

/** Clientes sintéticos por região (pontos determinísticos dentro do polígono). */
const clientCache = new Map<string, Pt[]>();
function clientsOf(r: NetRegion): Pt[] {
  let pts = clientCache.get(r.id);
  if (pts) return pts;
  pts = [];
  const poly = r.poligono.map(geo);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let seed = hash(r.id);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const n = Math.round(r.clientes / 1500);
  for (let i = 0; i < n * 3 && pts.length < n; i++) { const p: Pt = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)]; if (inPoly(p, poly)) pts.push(p); }
  clientCache.set(r.id, pts);
  return pts;
}
function inPoly(p: Pt, poly: Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i]!, b = poly[j]!; if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}
function distSeg(p: Pt, a: Pt, b: Pt) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }

export const MapView = memo(function MapView({ comp, interactive }: { comp: Comp; interactive: boolean }) {
  const p = comp.props as unknown as MapProps;
  const net = network();
  const rules = useRules();
  const [wrap, size] = useSize<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const tk = useTokens(wrap, TOKENS);
  const [layers, setLayers] = useState(p.layers);
  useEffect(() => setLayers(p.layers), [p.layers]);
  const [routeId, setRouteId] = useState(p.routeId);
  useEffect(() => setRouteId(p.routeId), [p.routeId]);
  const topo = p.variant === 'topology', routesMode = p.variant === 'routes';

  // dados efetivos (regras + filtros). No modo rotas, os filtros da página valem para a lista de rotas.
  const linksF = useRows(comp, 'enlaces');
  const allLinks = useMemo(() => applyRules(getTable(comp.data?.dataset ?? 'ds_rede_sp', 'enlaces').rows, rules.filter((r) => r.table === 'enlaces')), [rules, comp.data]);
  const links = routesMode ? allLinks : linksF;
  const nodes = useRows(comp, 'nos');
  const events = useRows(comp, 'eventos');
  const routes = useRows(comp, 'rotas');
  const allNodes = useMemo(() => applyRules(getTable(comp.data?.dataset ?? 'ds_rede_sp', 'nos').rows, rules.filter((r) => r.table === 'nos')), [rules, comp.data]);
  const byId = useMemo(() => { const m = new Map<string, Row>(); for (const r of allLinks) m.set(String(r.id), r); for (const r of allNodes) m.set(String(r.id), r); return m; }, [allLinks, allNodes]);
  const sch = useMemo(() => schematic(net), [net]);
  const pos = useCallback((id: string): Pt | undefined => {
    if (topo) { const q = sch.get(id); return q ? [q[0] * 60 - 30, q[1] * 60 - 30] : undefined; }
    const n = byId.get(id); return n ? geo([Number(n.lon), Number(n.lat)]) : undefined;
  }, [topo, sch, byId]);
  const linkPath = useCallback((l: Row): Pt[] => (topo ? [pos(String(l.origem)), pos(String(l.destino))].filter((x): x is Pt => !!x) : (l.geometria as LonLat[]).map(geo)), [topo, pos]);
  const route = routesMode ? (routes.find((r) => r.id === routeId) ?? routes[0]) : undefined;

  const picked = useEditor((s) => (s.picked?.comp === comp.id || (s.picked && s.picked.kind !== 'region' && byId.has(s.picked.id)) ? s.picked : null));
  const { emit } = useEmit(comp);
  const cross = useEditor((s) => s.cross);
  const zoom = useEditor((s) => s.zoom);

  // ---- vista (centro/escala); null = ajustar ao conteúdo
  const view = useRef<View | null>(null);
  const [, force] = useState(0);
  const fitView = useCallback((): View => {
    const pts: Pt[] = [];
    if (topo) for (const q of sch.values()) pts.push([q[0] * 60 - 30, q[1] * 60 - 30]);
    else if (routesMode && route) { for (const id of [...(route.enlaces as string[]), ...((route.desvio as { enlaces: string[] } | undefined)?.enlaces ?? [])]) { const l = byId.get(id); if (l) for (const q of l.geometria as LonLat[]) pts.push(geo(q)); } }
    if (!pts.length) for (const n of net.nodes) pts.push(geo([n.lon, n.lat]));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = topo ? 28 : 40, leftPad = routesMode ? 248 : 0, bottomPad = routesMode ? 120 : 0, rightPad = p.detailPanel && picked ? 300 : 0;
    const s = Math.min((size.w - pad * 2 - leftPad - rightPad) / (x1 - x0 || 1), (size.h - pad * 2 - bottomPad - (routesMode ? 60 : 0)) / (y1 - y0 || 1), routesMode ? 220 : 400);
    return { cx: (x0 + x1) / 2 - (leftPad - rightPad) / 2 / s, cy: (y0 + y1) / 2 + bottomPad / 2 / s, s };
  }, [topo, sch, net, size.w, size.h, routesMode, p.detailPanel, picked, route, byId]);
  useEffect(() => { view.current = null; force((x) => x + 1); }, [topo, size.w, size.h]);
  const V = () => (view.current ??= fitView());
  const toScreen = (q: Pt, v = V()): Pt => [(q[0] - v.cx) * v.s + size.w / 2, (q[1] - v.cy) * v.s + size.h / 2];
  const toWorld = (x: number, y: number, v = V()): Pt => [(x - size.w / 2) / v.s + v.cx, (y - size.h / 2) / v.s + v.cy];

  // ---- desenho
  const t0 = useRef(performance.now());
  const draw = useCallback(() => {
    const cv = canvas.current;
    if (!cv || !size.w || !tk['viz-map-land']) return;
    const dpr = Math.min(3, (devicePixelRatio || 1) * Math.max(1, useEditor.getState().zoom));
    if (cv.width !== size.w * dpr) { cv.width = size.w * dpr; cv.height = size.h * dpr; }
    const g = cv.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = V();
    const S = (q: Pt) => toScreen(q, v);
    const phase = (performance.now() - t0.current) / 1000;
    g.fillStyle = tk['viz-map-water']!; g.fillRect(0, 0, size.w, size.h);
    const font = tk['font-sans'] || 'sans-serif';
    const statusCol = (s: unknown) => tk[`viz-status-${String(s)}`] ?? tk['viz-status-normal']!;
    const crossRegion = cross?.field === 'regiao' ? String(cross.value) : null;

    // regiões
    if (!topo && layers.regioes) {
      for (const r of net.regions) {
        g.beginPath();
        r.poligono.forEach((q, i) => { const [x, y] = S(geo(q)); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
        g.closePath();
        g.fillStyle = tk['viz-map-land']!; g.fill();
        g.lineWidth = crossRegion === r.nome ? 2 : 1; g.strokeStyle = crossRegion === r.nome ? tk['dash-title']! : tk['viz-map-boundary']!; g.stroke();
      }
      if (p.labels && v.s > 9) {
        g.font = `500 10px ${font}`; g.fillStyle = tk['viz-map-label']!; g.textAlign = 'center'; g.globalAlpha = 0.85;
        for (const r of net.regions) { const [x, y] = S(geo([r.lon, r.lat])); g.fillText(r.nome, x, y + 14); }
        g.globalAlpha = 1;
      }
    } else if (!topo) { g.fillStyle = tk['viz-map-land']!; g.fillRect(0, 0, size.w, size.h); }

    // mapa de calor (densidade de eventos ou de atenuação)
    if (layers.heat) {
      const k = 4, w = Math.ceil(size.w / k), h = Math.ceil(size.h / k);
      const off = document.createElement('canvas'); off.width = w; off.height = h;
      const o = off.getContext('2d')!;
      const pts: [Pt, number][] = p.heatField === 'eventos' ? events.map((e) => [geo([Number(e.lon), Number(e.lat)]), e.severidade === 'offline' ? 1.6 : e.severidade === 'critical' ? 1.2 : 0.7])
        : links.map((l) => [geo([Number(l.lon), Number(l.lat)]), Math.max(0, (Number(l[p.heatField]) - (p.heatField === 'utilizacao' ? 50 : 8)) / (p.heatField === 'utilizacao' ? 50 : 12))]);
      const rad = Math.max(10, Math.min(40, v.s * 2.2)) / k;
      for (const [q, wgt] of pts) {
        if (wgt <= 0) continue;
        const [x, y] = S(q); const gr = o.createRadialGradient(x / k, y / k, 0, x / k, y / k, rad);
        gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.22 * wgt)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        o.fillStyle = gr; o.fillRect(x / k - rad, y / k - rad, rad * 2, rad * 2);
      }
      const img = o.getImageData(0, 0, w, h);
      const ramp = [1, 2, 3, 4, 5].map((i) => hexRgb(tk[`viz-seq-${i}`]!));
      for (let i = 0; i < img.data.length; i += 4) {
        const a = img.data[i + 3]! / 255;
        if (a < 0.02) continue;
        const t = Math.min(0.999, a * 1.6) * 4, j = Math.floor(t), f = t - j, c0 = ramp[j]!, c1 = ramp[Math.min(4, j + 1)]!;
        img.data[i] = c0[0] + (c1[0] - c0[0]) * f; img.data[i + 1] = c0[1] + (c1[1] - c0[1]) * f; img.data[i + 2] = c0[2] + (c1[2] - c0[2]) * f; img.data[i + 3] = Math.min(235, 60 + a * 400);
      }
      o.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, size.w, size.h);
    }
    // cobertura 5G (~800 m)
    if (!topo && layers.cobertura) {
      g.fillStyle = tk['viz-cat-5']!; g.strokeStyle = tk['viz-cat-5']!;
      for (const n of nodes) if (n.tipo === 'Torre' && String(n.tecnologia).startsWith('5G')) { const [x, y] = S(geo([Number(n.lon), Number(n.lat)])); const r = 0.0072 * 100 * v.s; g.globalAlpha = 0.1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 0.35; g.lineWidth = 1; g.stroke(); }
      g.globalAlpha = 1;
    }
    // clientes
    if (!topo && layers.clientes) { g.fillStyle = tk['viz-cat-8']!; g.globalAlpha = 0.45; for (const r of net.regions) for (const q of clientsOf(r)) { const [x, y] = S(q); g.fillRect(x - 1, y - 1, 2, 2); } g.globalAlpha = 1; }

    // enlaces
    const routeLinks = new Set<string>(route ? (route.enlaces as string[]) : []);
    const detour = new Set<string>(route && route.desvio ? (route.desvio as { enlaces: string[] }).enlaces : []);
    if (layers.enlaces || routesMode) {
      const ramp = (t: number) => tk[`viz-seq-${Math.max(2, Math.min(5, Math.round(2 + t * 3)))}`]!;
      for (const l of links) {
        const path = linkPath(l).map(S);
        if (path.length < 2) continue;
        const st = String(l.status), cam = String(l.camada);
        let color = statusCol(st);
        if (p.colorBy === 'utilizacao') color = ramp(Number(l.utilizacao) / 100);
        if (p.colorBy === 'atenuacao_dB') color = ramp(Math.min(1, Number(l.atenuacao_dB) / 22));
        if (p.colorBy === 'camada') color = tk[`viz-cat-${cam === 'Backbone' ? 1 : cam === 'Metro' ? 3 : 8}`]!;
        let width = cam === 'Backbone' ? 2.6 : cam === 'Metro' ? 1.7 : 1.1;
        if (v.s > 30) width *= 1.4;
        const faded = routesMode && !routeLinks.has(String(l.id)) && !detour.has(String(l.id));
        g.globalAlpha = faded ? 0.28 : st === 'normal' && p.colorBy === 'status' ? 0.8 : 1;
        const line = () => { g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
        if (l._highlight && !faded) { line(); g.strokeStyle = color; g.globalAlpha = 0.14; g.lineWidth = width + 4; g.setLineDash([]); g.stroke(); g.globalAlpha = 1; }
        if (st === 'critical' && !faded && animating.current) { line(); g.strokeStyle = color; g.globalAlpha = 0.05 + 0.07 * (1 + Math.sin(phase * 2.2)); g.lineWidth = width + 5; g.stroke(); g.globalAlpha = 1; }
        line();
        g.setLineDash(st === 'offline' ? [5, 4] : []);
        g.strokeStyle = color; g.lineWidth = st === 'critical' ? width + 0.8 : width; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
        g.setLineDash([]); g.globalAlpha = 1;
        if (picked?.id === l.id) { line(); g.strokeStyle = tk['dash-title']!; g.lineWidth = 1.2; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]); }
      }
    }
    // rotas
    if (layers.rotas && (routesMode || routes.length)) {
      const drawRoute = (ids: string[], color: string, w: number, dash: number[]) => {
        for (const id of ids) { const l = byId.get(id); if (!l) continue; const path = linkPath(l).map(S); g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = tk['dash-widget-surface']!; g.lineWidth = w + 3; g.setLineDash([]); g.stroke(); g.strokeStyle = color; g.lineWidth = w; g.setLineDash(dash); g.stroke(); }
        g.setLineDash([]);
      };
      if (routesMode && route) {
        if (route.desvio) drawRoute((route.desvio as { enlaces: string[] }).enlaces, tk['viz-cat-3']!, 3, [7, 5]);
        drawRoute(route.enlaces as string[], tk['viz-cat-1']!, 4, []);
        for (const id of route.enlaces as string[]) { const l = byId.get(id); if (l && (l.status === 'offline' || l.status === 'critical')) { const [x, y] = S(geo([Number(l.lon), Number(l.lat)])); g.fillStyle = statusCol(l.status); g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = tk['dash-widget-surface']!; g.lineWidth = 2; g.stroke(); } }
        (route.nos as string[]).forEach((id, i, arr) => {
          const q = pos(id); if (!q) return; const [x, y] = S(q); const end = i === 0 || i === arr.length - 1;
          g.fillStyle = end ? tk['viz-cat-1']! : tk['dash-widget-surface']!; g.strokeStyle = tk['viz-cat-1']!; g.lineWidth = 2;
          g.beginPath(); g.arc(x, y, end ? 6 : 4, 0, Math.PI * 2); g.fill(); g.stroke();
          g.font = `${end ? 600 : 500} 11px ${font}`; g.fillStyle = tk['dash-title']!; g.textAlign = 'left';
          g.strokeStyle = tk['viz-map-land']!; g.lineWidth = 3; g.strokeText(id, x + 9, y - 6); g.fillText(id, x + 9, y - 6);
        });
      } else for (const r of routes) drawRoute(r.enlaces as string[], tk['viz-cat-1']!, 2, [1, 3]);
    }
    // nós (com agrupamento)
    if (layers.nos && !routesMode) {
      const showEq = topo || v.s > 34;
      const list = nodes.filter((n) => showEq || n.tipo !== 'Equipamento');
      const placed: { x: number; y: number; n: Row }[] = [];
      for (const n of list) { const q = pos(String(n.id)); if (q) { const [x, y] = S(q); if (x > -20 && y > -20 && x < size.w + 20 && y < size.h + 20) placed.push({ x, y, n }); } }
      const clusters = new Map<string, typeof placed>();
      const cell = 38;
      if (layers.clusters && !topo && v.s < 22) for (const q of placed) { const k = `${Math.floor(q.x / cell)},${Math.floor(q.y / cell)}`; if (!clusters.has(k)) clusters.set(k, []); clusters.get(k)!.push(q); }
      const singles = clusters.size ? [...clusters.values()].filter((c) => c.length === 1).flat() : placed;
      for (const c of clusters.values()) {
        if (c.length < 2) continue;
        const x = c.reduce((a, q) => a + q.x, 0) / c.length, y = c.reduce((a, q) => a + q.y, 0) / c.length;
        const worst = ['offline', 'critical', 'warning', 'normal'].find((s) => c.some((q) => q.n.status === s))!;
        const r = 9 + Math.min(9, c.length);
        g.fillStyle = tk['dash-widget-surface']!; g.strokeStyle = statusCol(worst); g.lineWidth = worst === 'normal' ? 1.5 : 2.5;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = tk['dash-title']!; g.font = `600 10px ${font}`; g.textAlign = 'center'; g.fillText(String(c.length), x, y + 3.5);
      }
      for (const { x, y, n } of singles) {
        const st = String(n.status), col = statusCol(st), t = n.tipo;
        if (st === 'critical' && animating.current) { g.strokeStyle = col; g.globalAlpha = 0.5 - ((phase * 0.8) % 1) * 0.5; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 6 + ((phase * 0.8) % 1) * 10, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
        g.lineWidth = 1.5; g.strokeStyle = tk['dash-widget-surface']!; g.fillStyle = col;
        g.setLineDash([]);
        if (t === 'POP') { g.beginPath(); g.rect(x - 5.5, y - 5.5, 11, 11); }
        else if (t === 'Torre') { g.beginPath(); g.moveTo(x, y - 6.5); g.lineTo(x + 5.5, y + 4.5); g.lineTo(x - 5.5, y + 4.5); g.closePath(); }
        else { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); }
        if (st === 'offline') { g.fillStyle = tk['dash-widget-surface']!; g.fill(); g.strokeStyle = col; g.setLineDash([2, 2]); g.stroke(); g.setLineDash([]); }
        else { g.fill(); g.stroke(); }
        if (n._highlight) { g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke(); }
        if (picked?.id === n.id) { g.strokeStyle = tk['dash-title']!; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.stroke(); }
        if (p.labels && t === 'POP' && (topo || v.s > 12)) { g.font = `600 10.5px ${font}`; g.textAlign = 'left'; g.strokeStyle = tk[topo ? 'viz-map-water' : 'viz-map-land']!; g.lineWidth = 3; g.strokeText(String(n.id), x + 9, y + 3.5); g.fillStyle = tk['dash-title']!; g.fillText(String(n.id), x + 9, y + 3.5); }
      }
    }
    // ocorrências
    if (layers.eventos) {
      for (const e of events) {
        const [x, y] = S(geo([Number(e.lon), Number(e.lat)]));
        const active = e.situacao === 'Ativo', col = statusCol(e.severidade);
        if (!active) { g.globalAlpha = 0.45; g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; continue; }
        g.save(); g.translate(x, y); g.rotate(Math.PI / 4);
        g.fillStyle = col; g.strokeStyle = tk['dash-widget-surface']!; g.lineWidth = 2; g.fillRect(-5, -5, 10, 10); g.strokeRect(-5, -5, 10, 10);
        g.restore();
        if (animating.current) { g.strokeStyle = col; g.globalAlpha = 0.45 - ((phase * 0.7) % 1) * 0.45; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 8 + ((phase * 0.7) % 1) * 9, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
      }
    }
  }, [size.w, size.h, tk, layers, topo, routesMode, net, events, links, nodes, routes, route, p.colorBy, p.heatField, p.labels, linkPath, pos, byId, picked, cross, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // animação discreta só quando há algo crítico, o mapa está em uso e sem redução de movimento
  const animating = useRef(false);
  const hasCritical = useMemo(() => links.some((l) => l.status === 'critical') || (layers.eventos && events.some((e) => e.situacao === 'Ativo')), [links, events, layers.eventos]);
  useEffect(() => {
    draw();
    if (!interactive || !hasCritical || isReduced()) { animating.current = false; draw(); return; }
    animating.current = true;
    let raf = 0, last = 0;
    const loop = (t: number) => { if (t - last > 50) { last = t; draw(); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); animating.current = false; };
  }, [draw, interactive, hasCritical]);

  // ---- hit test
  const hit = useCallback((mx: number, my: number): Hover | null => {
    const v = V(), S = (q: Pt) => toScreen(q, v);
    if (layers.eventos) for (const e of events) { const [x, y] = S(geo([Number(e.lon), Number(e.lat)])); if (Math.hypot(x - mx, y - my) < 8) return { kind: 'event', id: String(e.id), x: mx, y: my, text: `${String(e.tipo)} · ${String(e.elementoNome)} · ${String(e.situacao)}` }; }
    if (layers.nos && !routesMode) {
      let best: Row | null = null, bd = 9;
      for (const n of nodes) { if (n.tipo === 'Equipamento' && !topo && v.s <= 34) continue; const q = pos(String(n.id)); if (!q) continue; const [x, y] = S(q); const d = Math.hypot(x - mx, y - my); if (d < bd) { bd = d; best = n; } }
      if (best) {
        if (layers.clusters && !topo && v.s < 22) {
          const near = nodes.filter((n) => { const q = pos(String(n.id)); if (!q || n.tipo === 'Equipamento') return false; const [x, y] = S(q); return Math.floor(x / 38) === Math.floor(mx / 38) && Math.floor(y / 38) === Math.floor(my / 38); });
          if (near.length > 1) return { kind: 'cluster', id: 'cluster', x: mx, y: my, text: `${near.length} ativos · clique para aproximar`, extra: toWorld(mx, my, v) };
        }
        return { kind: 'node', id: String(best.id), x: mx, y: my, text: `${String(best.id)} · ${String(best.tipo)} · ${STATUS_LABEL[String(best.status)]}${best._label ? ` · ${String(best._label)}` : ''}` };
      }
    }
    if (layers.enlaces || routesMode) {
      let best: Row | null = null, bd = 6;
      for (const l of links) { const path = linkPath(l).map(S); for (let i = 1; i < path.length; i++) { const d = distSeg([mx, my], path[i - 1]!, path[i]!); if (d < bd) { bd = d; best = l; } } }
      if (best) return { kind: 'link', id: String(best.id), x: mx, y: my, text: `${String(best.id)} · ${String(best.camada)} · ${STATUS_LABEL[String(best.status)]} · ${Number(best.atenuacao_dB).toLocaleString('pt-BR')} dB · ${Number(best.utilizacao)}%${best._label ? ` · ${String(best._label)}` : ''}` };
    }
    if (!topo && layers.regioes) { const w = toWorld(mx, my, v); const r = net.regions.find((x) => inPoly(w, x.poligono.map(geo))); if (r) return { kind: 'region', id: r.nome, x: mx, y: my, text: `${r.nome} · ${r.municipio} · ${r.clientes.toLocaleString('pt-BR')} clientes` }; }
    return null;
  }, [layers, events, nodes, links, pos, linkPath, routesMode, topo, net]); // eslint-disable-line react-hooks/exhaustive-deps

  const [hover, setHover] = useState<Hover | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
  const animateTo = (target: View) => {
    const from = { ...V() }, start = performance.now(), dur = isReduced() ? 1 : 240;
    const step = (t: number) => { const k = Math.min(1, (t - start) / dur), e = 1 - (1 - k) ** 3; view.current = { cx: from.cx + (target.cx - from.cx) * e, cy: from.cy + (target.cy - from.cy) * e, s: from.s + (target.s - from.s) * e }; draw(); if (k < 1) requestAnimationFrame(step); else force((x) => x + 1); };
    requestAnimationFrame(step);
  };
  const zoomBy = (f: number, at?: Pt) => { const v = V(); const [mx, my] = at ?? [size.w / 2, size.h / 2]; const w = toWorld(mx, my, v); const s = Math.max(2, Math.min(400, v.s * f)); animateTo({ s, cx: w[0] - (mx - size.w / 2) / s, cy: w[1] - (my - size.h / 2) / s }); };
  useEffect(() => { if (routesMode && view.current && size.w) animateTo(fitView()); }, [route?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // seleção vinda de outro componente (tabela, linha do tempo): aproxima o mapa do elemento
  useEffect(() => { if (picked && picked.comp !== comp.id && byId.has(picked.id) && size.w) focusOn(picked.id); }, [picked?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const focusOn = (id: string) => { const l = byId.get(id); const a = l?.origem ? pos(String(l.origem)) : undefined, b = l?.destino ? pos(String(l.destino)) : undefined; const q = l && l.geometria && !topo ? geo([Number(l.lon), Number(l.lat)]) : a && b ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Pt : pos(id); if (q) { const s = Math.max(V().s, topo ? 14 : 40); animateTo({ cx: q[0] + (p.detailPanel ? 150 / s : 0), cy: q[1], s }); } };
  useEffect(() => {
    const el = canvas.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const r = el.getBoundingClientRect(); const v = V(); const mx = e.clientX - r.left, my = e.clientY - r.top; const w = toWorld(mx, my, v); const s = Math.max(2, Math.min(400, v.s * Math.exp(-e.deltaY * 0.0016))); view.current = { s, cx: w[0] - (mx - size.w / 2) / s, cy: w[1] - (my - size.h / 2) / s }; draw(); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [interactive, draw, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e: React.PointerEvent) => { if (!interactive) return; e.stopPropagation(); (e.target as Element).setPointerCapture(e.pointerId); const v = V(); drag.current = { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy, moved: false }; };
  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const d = drag.current;
    if (d) { const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true; if (d.moved) { const v = V(); view.current = { ...v, cx: d.cx - dx / v.s, cy: d.cy - dy / v.s }; draw(); setHover(null); return; } }
    if (interactive) setHover(hit(mx, my));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!interactive || !d || d.moved) { if (d?.moved) force((x) => x + 1); return; }
    const r = e.currentTarget.getBoundingClientRect(), h = hit(e.clientX - r.left, e.clientY - r.top);
    const st = useEditor.getState();
    if (!h) { st.set({ picked: null }); return; }
    if (h.kind === 'cluster' && h.extra) { animateTo({ cx: h.extra[0], cy: h.extra[1], s: V().s * 2.6 }); return; }
    if (h.kind === 'region') { emit('regiao', h.id, `Região: ${h.id}`); return; }
    if (h.kind === 'event') { const ev = events.find((x) => x.id === h.id); if (ev) st.set({ picked: { comp: comp.id, kind: 'link', id: String(ev.elemento) } }); return; }
    st.set({ picked: { comp: comp.id, kind: h.kind, id: h.id } });
  };
  const setLayer = (k: keyof MapLayers, on: boolean) => {
    const next = { ...layers, [k]: on };
    setLayers(next);
    const st = useEditor.getState();
    if (st.mode === 'edit') st.update(comp.id, (c) => { (c.props as unknown as MapProps).layers = next; }, `Camada ${LAYER_LABEL.find((x) => x[0] === k)?.[1]} ${on ? 'ligada' : 'desligada'}`);
  };
  const pickedRow = picked ? byId.get(picked.id) : undefined;
  const legend = p.colorBy === 'status' ? (['normal', 'warning', 'critical', 'offline'] as const) : null;

  return (
    <div className={`vz-map${interactive ? ' is-live' : ''}${routesMode ? ' is-routes' : ''}`} ref={wrap}>
      <canvas ref={canvas} style={{ width: size.w, height: size.h, cursor: interactive ? (hover && hover.kind !== 'region' ? 'pointer' : drag.current?.moved ? 'grabbing' : 'grab') : undefined }}
        role="img" aria-label={`${topo ? 'Topologia' : 'Mapa'}: ${links.length} enlaces, ${nodes.length} nós${route ? `, rota ${String(route.nome)}` : ''}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setHover(null)}
        onDoubleClick={(e) => { if (interactive) { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); zoomBy(2, [e.clientX - r.left, e.clientY - r.top]); } }} />
      {hover && <div className="vz-tip" style={{ transform: `translate(${hover.x + 12}px, ${hover.y - 10}px)` }}>{hover.text}</div>}
      {p.layerPanel && !routesMode && (
        <div className="vz-map-layers" role="group" aria-label="Camadas">
          <span className="vz-map-cap">Camadas</span>
          {LAYER_LABEL.filter(([k]) => !topo || ['nos', 'enlaces', 'rotas'].includes(k)).map(([k, l]) => (
            <label key={k} className="vz-map-layer"><input type="checkbox" checked={layers[k]} onChange={(e) => setLayer(k, e.target.checked)} />{l}</label>
          ))}
        </div>
      )}
      {routesMode && (
        <div className="vz-route-list" role="listbox" aria-label="Rotas">
          <span className="vz-map-cap">{routes.length} {routes.length === 1 ? 'rota' : 'rotas'}</span>
          {routes.map((r) => (
            <button key={String(r.id)} type="button" role="option" aria-selected={route?.id === r.id} onClick={() => setRouteId(String(r.id))}>
              <StatusDot s={String(r.status)} /><span className="vz-route-name">{String(r.nome).replace('Rota ', '')}</span><span className="bw-num">{Number(r.distancia_km).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</span>
              {r.com_desvio === 'Sim' && <em>desvio</em>}
            </button>
          ))}
        </div>
      )}
      {routesMode && route && <RouteStrip route={route} byId={byId} onPick={(id) => { useEditor.getState().set({ picked: { comp: comp.id, kind: 'link', id } }); focusOn(id); }} />}
      {p.legend && (
        <div className="vz-map-legend" style={routesMode ? { bottom: 128 } : undefined}>
          {routesMode ? <><span><i className="vz-leg-line" style={{ background: 'var(--viz-cat-1)' }} />Caminho</span><span><i className="vz-leg-line is-dash" style={{ color: 'var(--viz-cat-3)' }} />Desvio</span></>
            : legend ? legend.map((s) => <span key={s}><StatusDot s={s} />{STATUS_LABEL[s]}</span>)
              : <span className="vz-ramp">{p.colorBy === 'camada' ? 'Backbone · Metro · Acesso' : <>{p.colorBy === 'utilizacao' ? 'Utilização' : 'Atenuação'} <i /> baixa → alta</>}</span>}
          {layers.heat && <span className="vz-ramp">Calor <i /></span>}
          {!topo && layers.nos && <span className="vz-glyphs">▪ POP ▴ Torre • Equip.</span>}
        </div>
      )}
      {interactive && (
        <div className="vz-map-zoom">
          <button type="button" aria-label="Aproximar" onClick={() => zoomBy(1.6)}><Icon name="plus" size={12} /></button>
          <button type="button" aria-label="Afastar" onClick={() => zoomBy(1 / 1.6)}><Icon name="minus" size={12} /></button>
          <button type="button" aria-label="Ajustar à área" onClick={() => animateTo(fitView())}><Icon name="fit" size={12} /></button>
        </div>
      )}
      {!interactive && <div className="vz-map-hint">Clique duas vezes para interagir</div>}
      {p.detailPanel && pickedRow && <DetailPanel row={pickedRow} byId={byId} events={events} onClose={() => useEditor.getState().set({ picked: null })} onPick={(id) => { useEditor.getState().set({ picked: { comp: comp.id, kind: id.startsWith('ENL') ? 'link' : 'node', id } }); focusOn(id); }} onFocus={() => focusOn(String(pickedRow.id))} />}
    </div>
  );
});

function hexRgb(h: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return [120, 150, 190];
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
