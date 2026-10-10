import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon, IconButton } from '@biweb/ui';

export interface CNode { id: string; x: number; y: number; w: number; h: number }
export interface CEdge { id: string; from: string; to: string; label?: ReactNode; fromEnd?: string; toEnd?: string; dashed?: boolean; active?: boolean; dim?: boolean; tone?: 'default' | 'warn' | 'ok' }
interface Props {
  nodes: CNode[]; edges: CEdge[]; renderNode: (id: string) => ReactNode; selectedEdge?: string | null; onEdge?: (id: string) => void; onBackground?: () => void;
  onMove?: (id: string, x: number, y: number) => void; extra?: ReactNode; label: string; fitKey?: string; nodeClass?: (id: string) => string; minimap?: boolean; focusId?: string | null;
}
interface V { x: number; y: number; k: number }
const anchor = (a: CNode, b: CNode) => {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const horizontal = a.x + a.w < b.x - 10 || b.x + b.w < a.x - 10;
  if (horizontal) { const r = ac.x < bc.x; return { p1: { x: r ? a.x + a.w : a.x, y: ac.y }, p2: { x: r ? b.x : b.x + b.w, y: bc.y }, h: true }; }
  const d = ac.y < bc.y; return { p1: { x: ac.x, y: d ? a.y + a.h : a.y }, p2: { x: bc.x, y: d ? b.y : b.y + b.h }, h: false };
};

/** Viewport com pan, zoom, ajustar à tela, minimapa e arrasto de nós. Reutilizado pelo Modelo e pela Linhagem. */
export function Canvas({ nodes, edges, renderNode, selectedEdge, onEdge, onBackground, onMove, extra, label, fitKey, nodeClass, minimap = true, focusId }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<V>({ x: 20, y: 20, k: 1 });
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [measured, setMeasured] = useState(false);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const bounds = useMemo(() => {
    if (!nodes.length) return { x0: 0, y0: 0, x1: 100, y1: 100 };
    return { x0: Math.min(...nodes.map((n) => n.x)), y0: Math.min(...nodes.map((n) => n.y)), x1: Math.max(...nodes.map((n) => n.x + n.w)), y1: Math.max(...nodes.map((n) => n.y + n.h)) };
  }, [nodes]);

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => { setSize({ w: el.clientWidth, h: el.clientHeight }); setMeasured(true); });
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight }); setMeasured(true);
    return () => ro.disconnect();
  }, []);
  const fit = useCallback(() => {
    const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0, pad = 40;
    const k = Math.min(1.2, Math.max(0.25, Math.min((size.w - pad * 2) / bw, (size.h - pad * 2) / bh)));
    setV({ k, x: (size.w - bw * k) / 2 - bounds.x0 * k, y: (size.h - bh * k) / 2 - bounds.y0 * k });
  }, [bounds, size]);
  useEffect(() => { if (measured) fit(); }, [fitKey, measured]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // focar um nó: centraliza sem alterar o zoom
    if (!focusId) return; const n = byId.get(focusId); if (!n) return;
    setV((s) => ({ ...s, x: size.w / 2 - (n.x + n.w / 2) * s.k, y: size.h / 2 - (n.y + n.h / 2) * s.k }));
  }, [focusId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // zoom com a roda, sem rolar a página
    const el = box.current; if (!el) return;
    const f = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      setV((s) => { const k = Math.min(2, Math.max(0.25, s.k * (e.deltaY < 0 ? 1.1 : 0.9))); return { k, x: mx - ((mx - s.x) / s.k) * k, y: my - ((my - s.y) / s.k) * k }; });
    };
    el.addEventListener('wheel', f, { passive: false }); return () => el.removeEventListener('wheel', f);
  }, []);
  const zoom = (d: number) => setV((s) => { const k = Math.min(2, Math.max(0.25, s.k * d)); return { k, x: size.w / 2 - ((size.w / 2 - s.x) / s.k) * k, y: size.h / 2 - ((size.h / 2 - s.y) / s.k) * k }; });

  const pan = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-node],[data-edge],button,input,select')) return;
    onBackground?.();
    const x0 = e.clientX, y0 = e.clientY, v0 = v;
    const mv = (ev: PointerEvent) => setV({ ...v0, x: v0.x + ev.clientX - x0, y: v0.y + ev.clientY - y0 });
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
  const dragNode = (e: React.PointerEvent, n: CNode) => {
    if (!onMove || (e.target as HTMLElement).closest('button,input,select')) return;
    const x0 = e.clientX, y0 = e.clientY; let moved = false;
    const mv = (ev: PointerEvent) => { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 3) moved = true; if (moved) onMove(n.id, n.x + (ev.clientX - x0) / v.k, n.y + (ev.clientY - y0) / v.k); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const s = 40;
    if (e.key === 'ArrowLeft') setV((o) => ({ ...o, x: o.x + s })); else if (e.key === 'ArrowRight') setV((o) => ({ ...o, x: o.x - s })); else if (e.key === 'ArrowUp') setV((o) => ({ ...o, y: o.y + s })); else if (e.key === 'ArrowDown') setV((o) => ({ ...o, y: o.y - s })); else if (e.key === '+' || e.key === '=') zoom(1.15); else if (e.key === '-') zoom(0.87); else if (e.key === '0') fit(); else return;
    e.preventDefault();
  };

  const lines = edges.map((e) => {
    const a = byId.get(e.from), b = byId.get(e.to); if (!a || !b) return null;
    const { p1, p2, h } = anchor(a, b);
    const dx = h ? Math.max(40, Math.abs(p2.x - p1.x) / 2) * Math.sign(p2.x - p1.x || 1) : 0, dy = h ? 0 : Math.max(40, Math.abs(p2.y - p1.y) / 2) * Math.sign(p2.y - p1.y || 1);
    return { e, d: `M${p1.x},${p1.y} C${p1.x + dx},${p1.y + dy} ${p2.x - dx},${p2.y - dy} ${p2.x},${p2.y}`, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, p1, p2 };
  }).filter(Boolean) as { e: CEdge; d: string; mid: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number } }[];

  const mm = { w: 150, h: 96 }, ms = Math.min(mm.w / Math.max(1, bounds.x1 - bounds.x0 + 80), mm.h / Math.max(1, bounds.y1 - bounds.y0 + 80));
  return (
    <div className="dw-canvas" ref={box} onPointerDown={pan} tabIndex={0} onKeyDown={onKey} role="application" aria-label={`${label}. Setas movem, + e − aproximam, 0 ajusta à tela.`}>
      <div className="dw-cv-layer" style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})` }}>
        <svg className="dw-cv-svg" width={bounds.x1 + 400} height={bounds.y1 + 400} aria-hidden="true">
          <defs><marker id="dw-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" /></marker></defs>
          {lines.map(({ e, d }) => (
            <g key={`${e.id}${fitKey}`} data-edge className={`dw-edge${e.dashed ? ' is-dash' : ''}${e.active ? ' is-active' : ''}${e.dim ? ' is-dim' : ''}${selectedEdge === e.id ? ' is-sel' : ''}${e.tone ? ` is-${e.tone}` : ''}`}>
              <path className="dw-edge-hit" d={d} onClick={() => onEdge?.(e.id)} />
              <path className="dw-edge-line" d={d} pathLength={1} markerEnd="url(#dw-arrow)" />
            </g>
          ))}
        </svg>
        {lines.map(({ e, mid, p1, p2 }) => (
          <div key={`l${e.id}`}>
            {e.fromEnd && <span className="dw-edge-end" style={{ left: p1.x + (p2.x > p1.x ? 6 : -22), top: p1.y - 16 }}>{e.fromEnd}</span>}
            {e.toEnd && <span className="dw-edge-end" style={{ left: p2.x + (p2.x > p1.x ? -22 : 6), top: p2.y - 16 }}>{e.toEnd}</span>}
            {e.label && <button type="button" data-edge className={`dw-edge-lbl${selectedEdge === e.id ? ' is-sel' : ''}${e.dim ? ' is-dim' : ''}`} style={{ left: mid.x, top: mid.y }} onClick={() => onEdge?.(e.id)}>{e.label}</button>}
          </div>
        ))}
        {nodes.map((n) => (
          <div key={n.id} data-node className={`dw-cv-node ${nodeClass?.(n.id) ?? ''}`} style={{ left: n.x, top: n.y, width: n.w }} onPointerDown={(e) => dragNode(e, n)}>{renderNode(n.id)}</div>
        ))}
      </div>
      <div className="dw-cv-ctrl" onPointerDown={(e) => e.stopPropagation()}>
        <IconButton icon="plus" label="Aproximar" size="sm" onPress={() => zoom(1.2)} /><IconButton icon="minus" label="Afastar" size="sm" onPress={() => zoom(0.83)} /><IconButton icon="fit" label="Ajustar à tela" size="sm" onPress={fit} />
        <span className="dw-cv-zoom bw-num">{Math.round(v.k * 100)}%</span>{extra}
      </div>
      {minimap && nodes.length > 1 && (
        <svg className="dw-minimap" width={mm.w} height={mm.h} viewBox={`0 0 ${mm.w} ${mm.h}`} onPointerDown={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const wx = (e.clientX - r.left) / ms + bounds.x0 - 40, wy = (e.clientY - r.top) / ms + bounds.y0 - 40; setV((s) => ({ ...s, x: size.w / 2 - wx * s.k, y: size.h / 2 - wy * s.k })); }} role="img" aria-label="Minimapa">
          {nodes.map((n) => <rect key={n.id} x={(n.x - bounds.x0 + 40) * ms} y={(n.y - bounds.y0 + 40) * ms} width={n.w * ms} height={n.h * ms} rx={2} />)}
          <rect className="dw-mm-v" x={((-v.x / v.k) - bounds.x0 + 40) * ms} y={((-v.y / v.k) - bounds.y0 + 40) * ms} width={(size.w / v.k) * ms} height={(size.h / v.k) * ms} />
        </svg>
      )}
      <span className="dw-cv-hint"><Icon name="info" size={12} />Arraste para mover · roda para zoom</span>
    </div>
  );
}
