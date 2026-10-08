import { useEffect, useRef } from 'react';
import type { Feature } from './model';
import { COLORS } from './model';
import { lampLevel } from './data-lights';
import { metersPerPixel, project } from './view';
import type { Camera } from './view';

export type LightsMode = 'night' | 'state' | 'heat';
const TONES: Record<string, string> = { led: '196,222,255', warm: '255,226,160', sodium: '255,142,44', metal: '208,255,226' };
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(rgb: string) {
  let c = sprites.get(rgb);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d')!, grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    grad.addColorStop(0, `rgba(${rgb},1)`); grad.addColorStop(.18, `rgba(${rgb},.62)`); grad.addColorStop(.5, `rgba(${rgb},.16)`); grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 96, 96); sprites.set(rgb, c);
  }
  return c;
}
const STATUS_IDX: Record<string, number> = { 'Operacional': 0, 'Inspeção necessária': 1, 'Manutenção': 2, 'Falha': 3 };
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0) % 997 / 997; };

export interface LightsHit { find: (x: number, y: number, radius: number) => Feature | undefined }

/**
 * Canvas renderer for thousands of street lights. Lamps glow additively, so an avenue reads as a
 * continuous strand of light from far away and as individual pools of light up close.
 */
export function LightsLayer({ features, camera, size, hour, mode, selectedId, hit }: {
  features: Feature[]; camera: Camera; size: { w: number; h: number }; hour: number; mode: LightsMode; selectedId?: string; hit: { current: LightsHit | null };
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ features, camera, size, hour, mode, selectedId });
  state.current = { features, camera, size, hour, mode, selectedId };
  const screen = useRef<{ x: number; y: number; f: Feature }[]>([]);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let raf = 0, last = 0, alive = true;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (now: number) => {
      const s = state.current, g = canvas.getContext('2d'); if (!g) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(1, Math.round(s.size.w)), H = Math.max(1, Math.round(s.size.h));
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const c = project(s.camera.lon, s.camera.lat, s.camera.zoom), mpp = metersPerPixel(s.camera.lat, s.camera.zoom), t = now / 1000;
      const out: { x: number; y: number; f: Feature }[] = [];
      g.globalCompositeOperation = s.mode === 'state' ? 'source-over' : 'lighter';
      let selected: { x: number; y: number } | undefined;
      for (const f of s.features) {
        const q = f.geometry.coordinates[0]!, w = project(q[0]!, q[1]!, s.camera.zoom), x = w.x - c.x + W / 2, y = w.y - c.y + H / 2;
        if (x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
        out.push({ x, y, f });
        const p = f.properties, st = STATUS_IDX[String(p.status)] ?? 0, reach = Number(p.alcance_m ?? 28);
        if (f.id === s.selectedId) selected = { x, y };
        if (s.mode === 'state') {
          g.globalAlpha = 1; g.fillStyle = COLORS[st]!; g.beginPath(); g.arc(x, y, Math.max(2.2, Math.min(7, 2.4 + 1.5 / Math.max(.15, mpp / 4))), 0, 6.283); g.fill();
          if (p.vencida === true) { g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); }
          continue;
        }
        if (s.mode === 'heat') {
          const wgt = st === 3 ? 1 : st === 2 ? .6 : st === 1 ? .32 : 0; if (!wgt) continue;
          const r = Math.max(14, Math.min(90, 520 / mpp)); g.globalAlpha = .34 * wgt; g.drawImage(sprite('255,92,64'), x - r, y - r, r * 2, r * 2); continue;
        }
        const level = lampLevel(s.hour, Number(p.fotocelula_min ?? 0), String(p.tom));
        const radius = Math.max(4.5, Math.min(72, reach * 1.35 / mpp)), core = Math.max(1.1, Math.min(5, radius * .2)), k = Math.max(.1, Math.min(1, 9 / mpp));
        if (st === 3 || st === 2) {
          // Dead lamp: a dark socket. Far away it is a single red/amber dot; up close it gets a pulsing status ring.
          const near = mpp < 10, pulse = reduced ? .8 : .55 + .45 * Math.sin(t * 2.4 + hash(f.id) * 6.28), col = st === 3 ? '#ff5a4d' : '#ffb347';
          g.globalCompositeOperation = 'source-over';
          if (near) {
            g.globalAlpha = .92; g.fillStyle = '#0a0d12'; g.beginPath(); g.arc(x, y, core + 1, 0, 6.283); g.fill();
            g.globalAlpha = (st === 3 ? .95 : .7) * pulse; g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, core + 3 + pulse * 1.5, 0, 6.283); g.stroke();
          } else { g.globalAlpha = st === 3 ? .9 : .55; g.fillStyle = col; g.beginPath(); g.arc(x, y, st === 3 ? 1.7 : 1.2, 0, 6.283); g.fill(); }
          g.globalCompositeOperation = 'lighter'; continue;
        }
        if (level <= 0.01) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = .75; g.fillStyle = st === 1 ? '#c9a24a' : '#5d6678'; g.beginPath(); g.arc(x, y, Math.max(1.1, core * .55), 0, 6.283); g.fill(); g.globalCompositeOperation = 'lighter'; continue; }
        const flicker = st === 1 && !reduced ? .42 + .58 * (Math.sin(t * 9 + hash(f.id) * 40) > -.25 ? 1 : .15) : 1, a = level * flicker;
        const rgb = TONES[String(p.tom)] ?? TONES.led!;
        g.globalAlpha = Math.min(1, .16 * a * k); g.drawImage(sprite(rgb), x - radius * 2.3, y - radius * 2.3, radius * 4.6, radius * 4.6);
        g.globalAlpha = Math.min(1, .7 * a * k); g.drawImage(sprite(rgb), x - radius, y - radius, radius * 2, radius * 2);
        g.globalAlpha = Math.min(1, .95 * a * Math.max(.45, k)); g.drawImage(sprite('255,255,255'), x - core * 2, y - core * 2, core * 4, core * 4);
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      if (selected) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(selected.x, selected.y, 11, 0, 6.283); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(selected.x, selected.y, 17 + (reduced ? 0 : (t * 14) % 8), 0, 6.283); g.stroke(); }
      screen.current = out;
    };
    const loop = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 48) return; // ~20 fps is plenty for a glow
      last = now; draw(now);
    };
    hit.current = { find: (x, y, radius) => { let best: Feature | undefined, bd = radius * radius; for (const p of screen.current) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d <= bd) { bd = d; best = p.f; } } return best; } };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); hit.current = null; };
  }, [hit]);
  return <canvas ref={ref} className="mb-lights-canvas" aria-hidden="true" style={{ width: size.w, height: size.h }} />;
}
