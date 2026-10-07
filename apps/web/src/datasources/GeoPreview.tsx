import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoData, GeoPt } from './analyze';
import type { LonLat } from '../net/generate';

const KIND_TOKEN: Record<GeoPt['kind'], string> = { POP: '--viz-cat-1', Torre: '--viz-cat-2', Equipamento: '--viz-cat-3', Ponto: '--viz-cat-1' };
const STATUS_TOKEN = { normal: '--viz-status-normal', warning: '--viz-status-warning', critical: '--viz-status-critical', offline: '--viz-status-offline', none: '--viz-status-normal' } as const;
const STATUS_LABEL = { normal: 'Normal', warning: 'Atenção', critical: 'Crítico', offline: 'Offline' } as const;
const PAD = 12;

/** Pré-visualização geográfica em canvas: regiões, linhas por status e pontos por tipo. Nítida em qualquer devicePixelRatio. */
export function GeoPreview({ geo, height = 320 }: { geo: GeoData; height?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);
  const [theme, setTheme] = useState(0);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => { if (e) setW(Math.floor(e.contentRect.width)); });
    ro.observe(el);
    const mo = new MutationObserver(() => setTheme((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'data-dash-theme'] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, []);

  /** Projeção equiretangular com correção de latitude, ajustada aos limites. */
  const proj = useMemo(() => {
    const all: LonLat[] = [...geo.points.map((p) => [p.lon, p.lat] as LonLat), ...geo.lines.flatMap((l) => l.coords), ...geo.polygons.flatMap((p) => p.coords)];
    if (!all.length || !w) return null;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of all) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180) || 1;
    const dx = Math.max((x1 - x0) * k, 1e-6), dy = Math.max(y1 - y0, 1e-6);
    const s = Math.min((w - PAD * 2) / dx, (height - PAD * 2) / dy);
    const ox = (w - dx * s) / 2, oy = (height - dy * s) / 2;
    return (c: LonLat): [number, number] => [ox + (c[0] - x0) * k * s, oy + (y1 - c[1]) * s];
  }, [geo, w, height]);

  const screenPts = useMemo(() => proj ? geo.points.map((p) => ({ p, xy: proj([p.lon, p.lat]) })) : [], [geo, proj]);

  useEffect(() => {
    const c = canvas.current; if (!c || !proj || !w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(height * dpr);
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);
    const cs = getComputedStyle(c);
    const tok = (n: string) => cs.getPropertyValue(n).trim() || '#888';
    const path = (coords: LonLat[], close: boolean) => {
      ctx.beginPath();
      coords.forEach((ll, i) => { const [x, y] = proj(ll); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      if (close) ctx.closePath();
    };
    ctx.fillStyle = tok('--viz-map-land'); ctx.strokeStyle = tok('--viz-map-boundary'); ctx.lineWidth = 1;
    for (const p of geo.polygons) { if (p.coords.length < 3) continue; path(p.coords, true); ctx.fill(); ctx.stroke(); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const order = ['none', 'normal', 'offline', 'warning', 'critical'] as const;
    for (const st of order) {
      ctx.strokeStyle = tok(STATUS_TOKEN[st]);
      ctx.lineWidth = st === 'critical' || st === 'warning' ? 1.6 : 1;
      ctx.setLineDash(st === 'offline' ? [3, 3] : []);
      ctx.globalAlpha = st === 'normal' || st === 'none' ? 0.7 : 1;
      for (const l of geo.lines) if (l.status === st && l.coords.length > 1) { path(l.coords, false); ctx.stroke(); }
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    const surface = tok('--surface-panel');
    for (const kind of ['Equipamento', 'Torre', 'Ponto', 'POP'] as const) {
      const r = kind === 'POP' ? 3.5 : kind === 'Equipamento' ? 1.8 : 2.5;
      ctx.fillStyle = tok(KIND_TOKEN[kind]); ctx.strokeStyle = surface; ctx.lineWidth = 1;
      for (const { p, xy } of screenPts) if (p.kind === kind) { ctx.beginPath(); ctx.arc(xy[0], xy[1], r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
  }, [geo, proj, w, height, screenPts, theme]);

  const onMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let best: { d: number; label: string; xy: [number, number] } | null = null;
    for (const { p, xy } of screenPts) { const d = Math.hypot(xy[0] - x, xy[1] - y); if (d <= 6 && (!best || d < best.d)) best = { d, label: p.name ? `${p.name}${p.kind !== 'Ponto' && !p.name.startsWith(p.kind) ? ` · ${p.kind}` : ''}` : 'Ponto sem nome', xy }; }
    setHover(best ? { x: best.xy[0], y: best.xy[1], label: best.label } : null);
  };

  const kinds = [...new Set(geo.points.map((p) => p.kind))];
  const statuses = (['normal', 'warning', 'critical', 'offline'] as const).filter((s) => geo.lines.some((l) => l.status === s));
  const total = geo.points.length + geo.lines.length + geo.polygons.length;

  return (
    <figure className="ds-preview" aria-label={`Pré-visualização geográfica: ${geo.points.length} pontos, ${geo.lines.length} linhas, ${geo.polygons.length} polígonos`}>
      <div ref={wrap} className="ds-preview-canvas" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {total === 0 ? <div className="ds-preview-empty">Sem geometrias para pré-visualizar</div> : <canvas ref={canvas} style={{ width: w, height }} />}
        {hover && <div className="ds-preview-tip" style={{ transform: `translate(${Math.round(hover.x)}px, ${Math.round(hover.y)}px)` }}>{hover.label}</div>}
      </div>
      {total > 0 && (
        <figcaption className="ds-legend">
          {geo.polygons.length > 0 && <span><i className="ds-sw ds-sw--area" />Regiões</span>}
          {kinds.map((k) => <span key={k}><i className="ds-sw ds-sw--dot" style={{ background: `var(${KIND_TOKEN[k]})` }} />{k === 'Ponto' ? 'Pontos' : k === 'Torre' ? 'Torres' : k === 'Equipamento' ? 'Equipamentos' : 'POPs'}</span>)}
          {statuses.length > 0 ? statuses.map((s) => <span key={s}><i className={`ds-sw ds-sw--line${s === 'offline' ? ' ds-sw--dash' : ''}`} style={{ color: `var(${STATUS_TOKEN[s]})` }} />{STATUS_LABEL[s]}</span>)
            : geo.lines.length > 0 && <span><i className="ds-sw ds-sw--line" style={{ color: 'var(--viz-status-normal)' }} />Linhas</span>}
        </figcaption>
      )}
    </figure>
  );
}
