import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Icon, IconButton } from '@biweb/ui';
import { BP_EDGES, BP_NODES } from '../analysis';
import { BP_LAYERS } from '../model';
import type { BpNode } from '../model';
import { ITEMS } from '../data';
import { useMig } from '../store';

const NW = 172, NH = 48, GX = 190, GY = 104, X0 = 168, Y0 = 34;
const pos = (n: BpNode) => ({ x: X0 + n.col * GX, y: Y0 + n.layer * GY });
const byId = new Map(BP_NODES.map((n) => [n.id, n]));
const adj = (dir: 'up' | 'down') => { const m = new Map<string, string[]>(); for (const [a, b] of BP_EDGES) { const [k, v] = dir === 'down' ? [a, b] : [b, a]; m.set(k, [...(m.get(k) ?? []), v]); } return m; };
const DOWN = adj('down'), UP = adj('up');
function reach(id: string, m: Map<string, string[]>) { const seen = new Set<string>(), st = [id]; while (st.length) { const c = st.pop()!; for (const n of m.get(c) ?? []) if (!seen.has(n)) { seen.add(n); st.push(n); } } return seen; }
/** Um caminho legível através do nó: fonte → … → nó → … → operação. */
function pathThrough(id: string): BpNode[] {
  const out: BpNode[] = [byId.get(id)!];
  for (let c = id, guard = 0; guard < 9; guard++) { const p = (UP.get(c) ?? [])[0]; if (!p) break; out.unshift(byId.get(p)!); c = p; }
  for (let c = id, guard = 0; guard < 9; guard++) { const p = (DOWN.get(c) ?? [])[0]; if (!p) break; out.push(byId.get(p)!); c = p; }
  return out;
}

/** Analytics Blueprint: o mapa estrutural neutro da aplicação original (não é um workflow). */
export function Blueprint() {
  const st = useMig();
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 20, y: 10, k: 0.82 }), [sel, setSel] = useState<string | null>('k_net'), [q, setQ] = useState(''), [collapsed, setCollapsed] = useState<number[]>([]), [only, setOnly] = useState(false), [run, setRun] = useState(0);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const hot = useMemo(() => sel ? new Set([sel, ...reach(sel, UP), ...reach(sel, DOWN)]) : null, [sel]);
  const match = useMemo(() => { const t = q.trim().toLowerCase(); return t ? new Set(BP_NODES.filter((n) => `${n.label} ${n.sub ?? ''}`.toLowerCase().includes(t)).map((n) => n.id)) : null; }, [q]);
  const visible = (n: BpNode) => !only || !hot || hot.has(n.id);
  const dim = (id: string) => (match ? !match.has(id) : hot ? !hot.has(id) : false);
  const fit = () => { const el = box.current; if (!el) return; const w = el.clientWidth, h = el.clientHeight, cw = X0 + 6 * GX + 20, ch = Y0 + 7.6 * GY, k = Math.min(1.1, Math.min(w / cw, h / ch)); setView({ k, x: (w - cw * k) / 2, y: (h - ch * k) / 2 + 6 }); };
  useEffect(() => { const t = setTimeout(fit, 30); return () => clearTimeout(t); }, []);
  const zoom = (f: number, cx?: number, cy?: number) => setView((v) => { const k = Math.min(2, Math.max(0.35, v.k * f)), el = box.current, px = cx ?? (el?.clientWidth ?? 800) / 2, py = cy ?? (el?.clientHeight ?? 500) / 2; return { k, x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k) }; });
  const center = (id: string) => { const n = byId.get(id), el = box.current; if (!n || !el) return; const p = pos(n); setView((v) => ({ ...v, x: el.clientWidth / 2 - (p.x + NW / 2) * v.k, y: el.clientHeight / 2 - (p.y + NH / 2) * v.k })); };
  const pick = (n: BpNode) => { setSel(n.id); if (n.ref && ITEMS.has(n.ref)) st.set({ sel: n.ref }); };
  const path = sel ? pathThrough(sel) : [];
  const total = BP_NODES.length;
  const visibleNodes = BP_NODES.filter(visible);

  return <div className="ms-bp">
    <div className="ms-bp-tools" role="toolbar" aria-label="Ferramentas do blueprint">
      <div className="ms-bp-search"><Icon name="search" size={12} /><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && match?.size) { const id = [...match][0]!; setSel(id); center(id); } }} placeholder="Buscar no blueprint" aria-label="Buscar no blueprint" />{q && <button type="button" onClick={() => setQ('')} aria-label="Limpar busca"><Icon name="close" size={12} /></button>}</div>
      <IconButton icon="minus" label="Diminuir zoom" size="sm" onPress={() => zoom(1 / 1.2)} /><span className="ms-zoom">{Math.round(view.k * 100)}%</span><IconButton icon="plus" label="Aumentar zoom" size="sm" onPress={() => zoom(1.2)} /><IconButton icon="fit" label="Ajustar à tela" size="sm" onPress={fit} />
      <span className="wf-sep" />
      <Button size="sm" variant="ghost" icon="target" isDisabled={!sel} onPress={() => { setOnly(!only); }}>{only ? 'Mostrar tudo' : 'Focar no caminho'}</Button>
      <Button size="sm" variant="ghost" icon={collapsed.length ? 'expand' : 'minus'} onPress={() => setCollapsed(collapsed.length ? [] : [0, 1, 2, 6, 7])}>{collapsed.length ? 'Expandir camadas' : 'Recolher camadas'}</Button>
      <Button size="sm" variant="ghost" icon="refresh" onPress={() => setRun(run + 1)}>Reconstruir blueprint</Button>
      <span className="flex-1" /><small className="wf-muted" title="Cada faixa é uma camada estrutural da aplicação original. As ligações mostram dependência de dados, não ordem de execução. O blueprint é neutro e serve de base para reconstruir em qualquer Builder do BIWEB.">{visibleNodes.length} de {total} nós · mapa estrutural, não um fluxo · arraste e ⌘+rolagem</small>
    </div>
    <div className="ms-bp-canvas" ref={box}
      onPointerDown={(e) => { if ((e.target as Element).closest('.ms-bp-node')) return; drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const d = drag.current; if (d) setView((v) => ({ ...v, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y })); }}
      onPointerUp={() => { drag.current = null; }}
      onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); const r = box.current!.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top); } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); }}>
      <svg className="ms-bp-svg" width="100%" height="100%" role="group" aria-label="Analytics Blueprint">
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`} key={run}>
          {BP_LAYERS.map((l, i) => { const c = collapsed.includes(i); return <g key={l} className={`ms-bp-lane l${i}`} style={{ ['--d' as string]: `${i * 140}ms` }}>
            <rect x={0} y={Y0 + i * GY - 16} width={X0 + 6 * GX + 12} height={c ? 36 : NH + 32} rx={10} className="ms-bp-band" />
            <g className="ms-bp-label" onClick={() => setCollapsed(c ? collapsed.filter((x) => x !== i) : [...collapsed, i])} role="button" tabIndex={0} aria-label={`${c ? 'Expandir' : 'Recolher'} ${l}`} onKeyDown={(e) => { if (e.key === 'Enter') setCollapsed(c ? collapsed.filter((x) => x !== i) : [...collapsed, i]); }}>
              <text x={14} y={Y0 + i * GY + 4}>{String(i + 1).padStart(2, '0')}</text><text x={40} y={Y0 + i * GY + 4} className="t">{l}</text><text x={14} y={Y0 + i * GY + 20} className="s">{BP_NODES.filter((n) => n.layer === i).length} nós {c ? '· recolhida' : ''}</text></g>
          </g>; })}
          <g className="ms-bp-edges">{BP_EDGES.map(([a, b]) => { const A = byId.get(a)!, B = byId.get(b)!; if (!visible(A) || !visible(B)) return null; const pa = pos(A), pb = pos(B), c1 = collapsed.includes(A.layer), c2 = collapsed.includes(B.layer);
            const x1 = pa.x + NW / 2, y1 = pa.y + (c1 ? 2 : NH), x2 = pb.x + NW / 2, y2 = pb.y + (c2 ? 2 : 0), my = (y1 + y2) / 2, isHot = !!hot && hot.has(a) && hot.has(b);
            return <path key={`${a}>${b}`} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} className={`ms-bp-edge${isHot ? ' is-hot' : ''}${(hot && !isHot) || (match && !(match.has(a) || match.has(b))) ? ' is-dim' : ''}`} style={{ ['--d' as string]: `${B.layer * 140 + 200}ms` }} />; })}</g>
          {BP_NODES.filter(visible).map((n) => { const p = pos(n), c = collapsed.includes(n.layer); return <g key={n.id} className={`ms-bp-node l${n.layer}${sel === n.id ? ' is-sel' : ''}${dim(n.id) ? ' is-dim' : ''}${match?.has(n.id) ? ' is-match' : ''}`} style={{ ['--d' as string]: `${n.layer * 140 + n.col * 40}ms` }} transform={`translate(${p.x} ${p.y})`}
            tabIndex={0} role="button" aria-label={`${BP_LAYERS[n.layer]}: ${n.label}`} aria-pressed={sel === n.id} onClick={() => pick(n)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n); } }}>
            {c ? <><circle cx={NW / 2} cy={2} r={5} /><title>{n.label}</title></> : <><rect width={NW} height={NH} rx={8} /><rect width={4} height={NH} rx={2} className="ms-bp-tag" /><text x={14} y={20} className="t">{n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}</text>{n.sub && <text x={14} y={36} className="s">{n.sub.length > 26 ? `${n.sub.slice(0, 25)}…` : n.sub}</text>}</>}
          </g>; })}
        </g>
      </svg>
    </div>
    <div className="ms-bp-path" aria-live="polite">{path.length ? <><b>Caminho</b><ol>{path.map((n, i) => <li key={n.id}><button type="button" className={n.id === sel ? 'is-cur' : ''} onClick={() => { setSel(n.id); center(n.id); }}>{n.label}</button>{i < path.length - 1 && <Icon name="arrowRight" size={12} />}</li>)}</ol></> : <span className="wf-muted">Selecione um nó para focar upstream e downstream.</span>}</div>
  </div>;
}
