import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@biweb/ui';
import type { Feature, Layer, MapDocument } from './model';
import { REPORTS, featureColor, severity } from './model';
import type { ReportId } from './model';
import { LightsLayer } from './LightsLayer';
import type { LightsHit, LightsMode } from './LightsLayer';
import { RENDERERS } from './renderers';
import { roundedPath } from './roads';
import { MAX_ZOOM, MIN_ZOOM, ViewContext, metersPerPixel, project, unproject } from './view';
import type { Camera, Pick, ViewCtx } from './view';
export type { Camera, Pick } from './view';
export const defaultCamera = (id: ReportId = 'network'): Camera => { const [lon, lat, zoom] = REPORTS.find((r) => r.id === id)!.camera; return { lon, lat, zoom }; };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const tileUrl = (basemap: MapDocument['basemap'], z: number, x: number, y: number) =>
  basemap === 'Terrain' ? `https://tile.opentopomap.org/${Math.min(z, 17)}/${x}/${y}.png`
    : basemap === 'Satellite' ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
      : `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
const node = (tag: string, text: string) => { const el = document.createElement(tag); el.textContent = text; return el; };
const NICE = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];

interface Props {
  doc: MapDocument; layers: Layer[]; camera: Camera; onCamera: (c: Camera) => void; selected: Pick | null; onPick: (p: Pick) => void;
  marker: boolean; onMarker: (lon: number, lat: number) => void; radius: number; preview: boolean;
  time: number; lightsMode?: LightsMode; fullscreen: boolean; onFullscreen: () => void; onReset: () => void;
  /** Rendered inside the map's coordinate space (live fleets, annotations). */
  overlay?: ReactNode;
  /** Rendered over the map, not affected by the 2.5D tilt (HUD chips, cards). */
  children?: ReactNode;
}

export function GeoCanvas({ doc, layers, camera, onCamera, selected, onPick, marker, onMarker, radius, preview, time, lightsMode = 'night', fullscreen, onFullscreen, onReset, overlay, children }: Props) {
  const ref = useRef<HTMLDivElement>(null), coordRef = useRef<HTMLSpanElement>(null), tipRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 650 });
  const [failed, setFailed] = useState(false);
  const cam = useRef(camera); cam.current = camera;
  const sizeRef = useRef(size); sizeRef.current = size;
  const lightsHit = useRef<LightsHit | null>(null);
  const tween = useRef(0), settle = useRef<number | undefined>(undefined);
  const drag = useRef<{ x: number; y: number; camera: Camera; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => { if (e) setSize({ w: e.contentRect.width, h: e.contentRect.height }); }); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => setFailed(false), [doc.basemap]);
  useEffect(() => () => cancelAnimationFrame(tween.current), []);
  // While the user moves the camera, live markers must follow without easing; the class is dropped when it settles.
  useEffect(() => { const el = ref.current; if (!el) return; el.classList.add('is-moving'); clearTimeout(settle.current); settle.current = window.setTimeout(() => el.classList.remove('is-moving'), 220); }, [camera]);

  const commit = useCallback((c: Camera) => { cam.current = c; onCamera(c); }, [onCamera]);
  /** Zoom keeping the geographic point under (ax, ay) fixed on screen. */
  const zoomAt = useCallback((zoom: number, ax: number, ay: number) => {
    const c = cam.current, s = sizeRef.current, z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const w0 = project(c.lon, c.lat, c.zoom), anchor = unproject(w0.x + ax - s.w / 2, w0.y + ay - s.h / 2, c.zoom), w1 = project(anchor.lon, anchor.lat, z);
    commit({ ...unproject(w1.x - (ax - s.w / 2), w1.y - (ay - s.h / 2), z), zoom: z });
  }, [commit]);
  const animateZoom = useCallback((target: number, ax?: number, ay?: number) => {
    cancelAnimationFrame(tween.current);
    const s = sizeRef.current, x = ax ?? s.w / 2, y = ay ?? s.h / 2, from = cam.current.zoom, to = clamp(target, MIN_ZOOM, MAX_ZOOM);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || from === to) { zoomAt(to, x, y); return; }
    const start = performance.now();
    const frame = (now: number) => { const k = Math.min(1, (now - start) / 260), e = 1 - (1 - k) ** 3; zoomAt(from + (to - from) * e, x, y); if (k < 1) tween.current = requestAnimationFrame(frame); };
    tween.current = requestAnimationFrame(frame);
  }, [zoomAt]);

  // Wheel / trackpad pinch (needs a non-passive listener to prevent page scroll).
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); cancelAnimationFrame(tween.current);
      const r = el.getBoundingClientRect(), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(cam.current.zoom - dy * (e.ctrlKey ? .01 : .0028), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const local = (e: { clientX: number; clientY: number }) => { const r = ref.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const center = project(camera.lon, camera.lat, camera.zoom);
  const p = useCallback((q: number[]) => { const w = project(q[0]!, q[1]!, camera.zoom); return { x: w.x - center.x + size.w / 2, y: w.y - center.y + size.h / 2 }; }, [camera.zoom, center.x, center.y, size.w, size.h]);
  const mpp = metersPerPixel(camera.lat, camera.zoom);

  const tiles = useMemo(() => {
    const tz = clamp(Math.round(camera.zoom), 3, 18), s = 2 ** (camera.zoom - tz), c = project(camera.lon, camera.lat, tz), out: { x: number; y: number; w: number; href: string }[] = [];
    const halfW = size.w / 2 / s, halfH = size.h / 2 / s, max = 2 ** tz;
    for (let x = Math.floor((c.x - halfW) / 256); x <= Math.floor((c.x + halfW) / 256); x++) for (let y = Math.floor((c.y - halfH) / 256); y <= Math.floor((c.y + halfH) / 256); y++) {
      if (y < 0 || y >= max) continue;
      out.push({ x: (x * 256 - c.x) * s + size.w / 2, y: (y * 256 - c.y) * s + size.h / 2, w: 256 * s + .6, href: tileUrl(doc.basemap, tz, ((x % max) + max) % max, y) });
    }
    return out;
  }, [camera.lon, camera.lat, camera.zoom, size.w, size.h, doc.basemap]);

  const view: ViewCtx = useMemo(() => ({ camera, size, mpp, doc, time, p, onCamera: commit, onPick }), [camera, size, mpp, doc, time, p, commit, onPick]);
  const selectedFeature = layers.find((l) => l.id === selected?.layerId)?.features.find((f) => f.id === selected?.featureId);
  const lightsLayer = layers.find((l) => l.visible && l.render === 'lights');
  const moved = () => !!drag.current?.moved;
  const pickHandlers = (l: Layer, f: Feature) => ({ role: 'button', tabIndex: 0, 'aria-label': `${f.id} ${String(f.properties[l.label] ?? '')}`, onClick: (e: React.MouseEvent) => { e.stopPropagation(); if (!moved()) onPick({ layerId: l.id, featureId: f.id }); }, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick({ layerId: l.id, featureId: f.id }); } } });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(tween.current);
    const q = local(e); pointers.current.set(e.pointerId, q);
    if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: cam.current.zoom }; drag.current = null; return; }
    drag.current = { x: q.x, y: q.y, camera: cam.current, moved: false };
    const move = (ev: PointerEvent) => {
      const pos = local(ev); pointers.current.set(ev.pointerId, pos);
      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()], d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        zoomAt(pinch.current.zoom + Math.log2(d / pinch.current.dist), (a!.x + b!.x) / 2, (a!.y + b!.y) / 2); return;
      }
      const dr = drag.current; if (!dr || marker) return;
      const dx = pos.x - dr.x, dy = pos.y - dr.y; if (!dr.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      dr.moved = true; const c = project(dr.camera.lon, dr.camera.lat, dr.camera.zoom);
      commit({ ...unproject(c.x - dx, c.y - dy, dr.camera.zoom), zoom: dr.camera.zoom });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      const pos = local(ev), dr = drag.current; pointers.current.delete(ev.pointerId); if (!pointers.current.size) pinch.current = null;
      if (dr && !dr.moved && ev.type === 'pointerup') {
        if (marker) { const s = sizeRef.current, c = project(cam.current.lon, cam.current.lat, cam.current.zoom), w = unproject(pos.x + c.x - s.w / 2, pos.y + c.y - s.h / 2, cam.current.zoom); onMarker(w.lon, w.lat); }
        else if (lightsHit.current && lightsLayer && !(ev.target as Element).closest?.('.mb-feature,.mb-cluster,.mb-ctrl')) { const hit = lightsHit.current.find(pos.x, pos.y, 14); if (hit) onPick({ layerId: lightsLayer.id, featureId: hit.id }); }
      }
      setTimeout(() => { drag.current = null; }, 0);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  const onHover = (e: React.PointerEvent) => {
    const pos = local(e), s = sizeRef.current, c = project(cam.current.lon, cam.current.lat, cam.current.zoom), w = unproject(pos.x + c.x - s.w / 2, pos.y + c.y - s.h / 2, cam.current.zoom);
    if (coordRef.current) coordRef.current.textContent = `${w.lat.toFixed(5)}, ${w.lon.toFixed(5)}`;
    const tip = tipRef.current; if (!tip) return;
    const hit = !drag.current && lightsHit.current && lightsLayer ? lightsHit.current.find(pos.x, pos.y, 10) : undefined;
    if (hit) { tip.hidden = false; tip.style.transform = `translate(${Math.min(pos.x + 14, s.w - 230)}px,${Math.max(8, pos.y - 44)}px)`; tip.replaceChildren(node('b', hit.id), node('span', `${hit.properties.via} · ${hit.properties.tecnologia}`), node('em', `${hit.properties.status}${hit.properties.falha ? ` · ${hit.properties.falha}` : ''}`)); } else tip.hidden = true;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('.mb-feature,.mb-cluster,button,input,select')) return;
    const c = cam.current, step = 90, w = project(c.lon, c.lat, c.zoom);
    const pan = (dx: number, dy: number) => commit({ ...unproject(w.x + dx, w.y + dy, c.zoom), zoom: c.zoom });
    if (e.key === 'ArrowLeft') pan(-step, 0); else if (e.key === 'ArrowRight') pan(step, 0); else if (e.key === 'ArrowUp') pan(0, -step); else if (e.key === 'ArrowDown') pan(0, step);
    else if (e.key === '+' || e.key === '=') animateZoom(c.zoom + 1); else if (e.key === '-') animateZoom(c.zoom - 1); else if (e.key === '0') onReset(); else return;
    e.preventDefault();
  };

  const scaleM = NICE.filter((n) => n / mpp <= 130).at(-1) ?? NICE[0]!, scalePx = scaleM / mpp;
  const night = doc.id === 'lights' && lightsMode === 'night';
  const heatSeverity = (f: Feature) => severity(f);
  const mapClass = ['mb-geo', doc.basemap === 'Dark' ? 'mb-geo-dark' : doc.basemap === 'Light' || doc.basemap === '3D Urban' ? 'mb-geo-light' : '', doc.dimension === '3d' ? 'mb-perspective' : '', preview ? 'mb-preview-map' : '', night ? 'mb-night' : '', marker ? 'is-marker' : ''].filter(Boolean).join(' ');

  return <div ref={ref} className={mapClass} tabIndex={0} role="application" aria-label={`Mapa operacional de São Paulo. Setas movem, + e − aproximam, 0 enquadra.`} onKeyDown={onKeyDown} onPointerMove={onHover} onPointerLeave={() => { if (tipRef.current) tipRef.current.hidden = true; }}>
    <div className="mb-plane">
      <svg className="mb-tile-layer" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">{tiles.map((t) => <image key={t.href + t.x} href={t.href} x={t.x} y={t.y} width={t.w} height={t.w} onError={() => setFailed(true)} />)}</svg>
      {lightsLayer && <LightsLayer features={lightsLayer.features} camera={camera} size={size} hour={time} mode={lightsMode} selectedId={selected?.layerId === lightsLayer.id ? selected.featureId : undefined} hit={lightsHit} />}
      <svg className="mb-feature-svg" viewBox={`0 0 ${size.w} ${size.h}`} aria-label="Camadas do mapa" style={{ cursor: marker ? 'crosshair' : undefined }} onPointerDown={onPointerDown} onDoubleClick={(e) => { const q = local(e); animateZoom(cam.current.zoom + 1, q.x, q.y); }}>
        <defs><radialGradient id="mb-heat"><stop offset="0" stopColor="#ff4d2e" stopOpacity=".34" /><stop offset=".45" stopColor="#ff8a2b" stopOpacity=".14" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient></defs>
        <ViewContext.Provider value={view}>
          {layers.filter((l) => l.visible && l.render !== 'lights' && (l.minZoom ?? 0) <= camera.zoom).map((l) => {
            const custom = l.render ? RENDERERS[l.render] : undefined;
            if (custom) return <g key={l.id} opacity={l.opacity / 100} className="mb-feature-layer">{custom({ layer: l, features: l.features, v: view, selected, handlers: pickHandlers })}</g>;
            const points = l.features.filter((f) => f.geometry.type === 'Point');
            const clusters = new Map<string, Feature[]>();
            if (doc.aggregation === 'Clusters' && camera.zoom < 14) points.forEach((f) => { const q = p(f.geometry.coordinates[0]!); const key = `${Math.floor(q.x / 62)}:${Math.floor(q.y / 62)}`; clusters.set(key, [...(clusters.get(key) ?? []), f]); });
            const heatR = clamp(900 / mpp, 24, 96);
            return <g key={l.id} opacity={l.opacity / 100} className="mb-feature-layer">
              {l.features.filter((f) => f.geometry.type !== 'Point').map((f) => {
                const pts = f.geometry.coordinates.map(p), d = f.geometry.type === 'Polygon' ? `M${pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L')}Z` : roundedPath(pts, 11);
                const color = featureColor(l, f, doc.bands), chosen = selected?.layerId === l.id && selected.featureId === f.id, line = f.geometry.type === 'LineString', sev = severity(f, doc.bands), w = l.size / 2 + sev;
                return <g key={f.id} {...pickHandlers(l, f)} className="mb-feature">
                  {chosen && <path d={d} fill="none" stroke="var(--accent)" strokeWidth={l.size + 9} opacity=".26" />}
                  {line && <path d={d} fill="none" stroke="#070b11" strokeOpacity=".5" strokeWidth={w + 3} strokeLinejoin="round" strokeLinecap="round" />}
                  <path className={line ? 'mb-route-draw' : undefined} pathLength={line ? 1 : undefined} d={d} fill={f.geometry.type === 'Polygon' ? l.color : 'none'} fillOpacity={f.geometry.type === 'Polygon' ? .16 : undefined} stroke={color} strokeWidth={f.geometry.type === 'Polygon' ? 1.6 : w} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={f.properties.tipo === 'Patrulha' ? '9 7' : undefined} />
                  {line && <><path d={d} fill="none" stroke="transparent" strokeWidth="16" />{(doc.id === 'network' || f.properties.tipo === 'Patrulha') && <path className="mb-signal" d={d} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.6" strokeDasharray="2 26" strokeLinecap="round" />}</>}
                  {l.tooltip && <title>{`${f.id} · ${String(f.properties[l.label] ?? '')} · ${String(f.properties.status ?? '')}`}</title>}
                </g>;
              })}
              {doc.aggregation === 'Heatmap' ? points.map((f) => { const q = p(f.geometry.coordinates[0]!); return <circle key={f.id} cx={q.x} cy={q.y} r={heatR + heatSeverity(f) * 5} fill="url(#mb-heat)" className="mb-heat-point" {...pickHandlers(l, f)} />; })
                : clusters.size ? [...clusters.entries()].map(([k, fs]) => {
                  const coords = fs.map((f) => p(f.geometry.coordinates[0]!)), x = coords.reduce((s, q) => s + q.x, 0) / fs.length, y = coords.reduce((s, q) => s + q.y, 0) / fs.length;
                  if (x < -30 || y < -30 || x > size.w + 30 || y > size.h + 30) return null;
                  const expand = () => animateZoom(camera.zoom + 2, x, y);
                  return <g key={k} className="mb-cluster" role="button" tabIndex={0} aria-label={`Expandir cluster de ${fs.length} elementos`} onClick={(e) => { e.stopPropagation(); expand(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expand(); } }}><circle cx={x} cy={y} r={13 + Math.min(9, fs.length / 12)} fill="var(--surface-panel)" stroke={l.color} strokeWidth="2" /><text x={x} y={y + 4} textAnchor="middle">{fs.length}</text></g>;
                })
                  : points.map((f) => {
                    const q = p(f.geometry.coordinates[0]!); if (q.x < -50 || q.y < -50 || q.x > size.w + 50 || q.y > size.h + 50) return null;
                    const chosen = selected?.layerId === l.id && selected.featureId === f.id, col = featureColor(l, f, doc.bands), sev = severity(f, doc.bands);
                    return <g key={f.id} className={`mb-feature ${chosen ? 'mb-selected' : ''}`} transform={`translate(${q.x},${q.y})`} {...pickHandlers(l, f)}>
                      {sev >= 2 && points.length < 140 && <circle r={l.size + 5} fill={col} opacity=".22" className="mb-pulse" />}
                      {chosen && <circle r={l.size + 8} fill="none" stroke="var(--accent)" strokeWidth="2" />}
                      {doc.dimension === '3d' && <path d="M-5 0V-19L0-23L6-19V0Z" fill={col} stroke="var(--surface-panel)" strokeWidth="1" />}
                      {l.icon === 'circle' ? <circle r={l.size} fill={col} stroke="var(--surface-panel)" strokeWidth="2" /> : <rect x={-l.size} y={-l.size} width={l.size * 2} height={l.size * 2} transform={l.icon === 'diamond' ? 'rotate(45)' : undefined} fill={col} stroke="var(--surface-panel)" strokeWidth="2" />}
                      {((points.length < 20 && camera.zoom >= 11.6) || chosen) && <text x={l.size + 7} y="-9">{String(f.properties[l.label] ?? f.id)}</text>}{l.tooltip && <title>{`${f.id} · ${String(f.properties[l.label] ?? '')} · ${String(f.properties.status ?? '')}`}</title>}
                    </g>;
                  })}
            </g>;
          })}
          {radius > 0 && selectedFeature && (() => { const coords = selectedFeature.geometry.coordinates[0]!, q = p(coords); return <circle cx={q.x} cy={q.y} r={radius * 1000 / metersPerPixel(coords[1]!, camera.zoom)} fill="var(--accent)" fillOpacity=".06" stroke="var(--accent)" strokeDasharray="6 5" pointerEvents="none" />; })()}
          {overlay}
        </ViewContext.Provider>
      </svg>
    </div>
    <div ref={tipRef} className="mb-hover-tip" hidden />
    <div className="mb-ctrl mb-ctrl-zoom" role="group" aria-label="Controles do mapa">
      <button aria-label="Aproximar" title="Aproximar (+)" onClick={() => animateZoom(Math.round(cam.current.zoom) + 1)}><Icon name="plus" size={16} /></button>
      <button aria-label="Afastar" title="Afastar (−)" onClick={() => animateZoom(Math.round(cam.current.zoom) - 1)}><Icon name="minus" size={16} /></button>
      <button aria-label="Enquadrar a região" title="Enquadrar (0)" onClick={onReset}><Icon name="fit" size={16} /></button>
      <button aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} aria-pressed={fullscreen} title={fullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'} onClick={onFullscreen}><Icon name={fullscreen ? 'close' : 'expand'} size={16} /></button>
    </div>
    <div className="mb-scale" aria-hidden="true"><i style={{ width: scalePx }} /><span>{scaleM >= 1000 ? `${scaleM / 1000} km` : `${scaleM} m`}</span></div>
    <div className="mb-readout" aria-hidden="true"><span ref={coordRef}>{camera.lat.toFixed(5)}, {camera.lon.toFixed(5)}</span><b>z{camera.zoom.toFixed(1)}</b></div>
    {failed && <div className="mb-tile-warning">Cartografia indisponível. As camadas continuam acessíveis.</div>}
    <div className="mb-attribution">© OpenStreetMap{doc.basemap === 'Terrain' ? ' · OpenTopoMap (CC-BY-SA)' : doc.basemap === 'Satellite' ? ' · Esri · Maxar · Earthstar Geographics' : ''} · Dados operacionais simulados{doc.dimension === '3d' ? ' · perspectiva 2.5D' : ''}</div>
    {children}
  </div>;
}
