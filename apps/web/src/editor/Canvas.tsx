import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@biweb/ui';
import { CompFrame } from '../viz/Render';
import { useDashTheme } from '../viz/common';
import { COMP_META, PALETTE, type Comp, type Page } from './doc';
import { useData } from '../data/registry';
import { useUi } from '../state/ui-store';
import { useEditor } from './store';

type Rect = { x: number; y: number; w: number; h: number };
type Guide = { o: 'v' | 'h'; at: number; from: number; to: number };
const GRID = 8, SNAP = 6;
const snapG = (v: number) => Math.round(v / GRID) * GRID;

/** Snap de um retângulo às bordas/centros dos outros componentes e da página; devolve deslocamento e guias. */
function snapRect(r: Rect, others: Rect[], page: Page, zoom: number, edges?: { l?: boolean; r?: boolean; t?: boolean; b?: boolean }) {
  const T = SNAP / zoom;
  const xs = [0, page.w / 2, page.w, 24, page.w - 24, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const ys = [0, 24, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const mine = { x: edges ? [edges.l ? r.x : null, edges.r ? r.x + r.w : null] : [r.x, r.x + r.w / 2, r.x + r.w], y: edges ? [edges.t ? r.y : null, edges.b ? r.y + r.h : null] : [r.y, r.y + r.h / 2, r.y + r.h] };
  let dx = 0, dy = 0, bx = T + 1, by = T + 1, gx: number | null = null, gy: number | null = null;
  for (const m of mine.x) if (m != null) for (const t of xs) { const d = t - m; if (Math.abs(d) < bx) { bx = Math.abs(d); dx = d; gx = t; } }
  for (const m of mine.y) if (m != null) for (const t of ys) { const d = t - m; if (Math.abs(d) < by) { by = Math.abs(d); dy = d; gy = t; } }
  const guides: Guide[] = [];
  const nr = { ...r, x: r.x + (gx != null ? dx : 0), y: r.y + (gy != null ? dy : 0) };
  if (gx != null) { const rel = others.filter((o) => [o.x, o.x + o.w / 2, o.x + o.w].some((v) => Math.abs(v - gx!) < 0.5)); const ys2 = [nr.y, nr.y + nr.h, ...rel.flatMap((o) => [o.y, o.y + o.h])]; guides.push({ o: 'v', at: gx, from: Math.min(...ys2), to: Math.max(...ys2) }); }
  if (gy != null) { const rel = others.filter((o) => [o.y, o.y + o.h / 2, o.y + o.h].some((v) => Math.abs(v - gy!) < 0.5)); const xs2 = [nr.x, nr.x + nr.w, ...rel.flatMap((o) => [o.x, o.x + o.w])]; guides.push({ o: 'h', at: gy, from: Math.min(...xs2), to: Math.max(...xs2) }); }
  return { dx: gx != null ? dx : null, dy: gy != null ? dy : null, guides };
}

const CompBox = memo(function CompBox({ comp, selected, interactive, editing, mode, flash, onFocus, loading }: { comp: Comp; selected: boolean; interactive: boolean; editing: boolean; mode: 'edit' | 'preview'; flash?: number; onFocus: (id: string) => void; loading?: boolean }) {
  const fresh = flash && Date.now() - flash < 1600;
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef({ x: comp.x, y: comp.y, w: comp.w, h: comp.h });
  // FLIP: quando a IA reorganiza a página, cada componente desliza da posição anterior (só transform).
  useLayoutEffect(() => {
    const p = prev.current;
    prev.current = { x: comp.x, y: comp.y, w: comp.w, h: comp.h };
    if (Date.now() - useEditor.getState().layoutAnim > 1500 || (p.x === comp.x && p.y === comp.y && p.w === comp.w && p.h === comp.h) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate([{ transform: `translate(${p.x - comp.x}px, ${p.y - comp.y}px) scale(${p.w / comp.w}, ${p.h / comp.h})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' });
  }, [comp.x, comp.y, comp.w, comp.h]);
  return (
    <div ref={ref} className={`ed-comp${selected ? ' is-sel' : ''}${interactive ? ' is-live' : ''}${comp.hidden ? ' is-hidden' : ''}${comp.locked ? ' is-locked' : ''}${fresh ? ' is-flash' : ''}`} data-cid={comp.id}
      style={{ left: comp.x, top: comp.y, width: comp.w, height: comp.h, zIndex: comp.z }} aria-label={`${COMP_META[comp.type].label}: ${comp.name}`} role={mode === 'edit' ? 'group' : undefined}>
      {loading && comp.type !== 'text' && comp.type !== 'image' ? <div className="vz-skel" aria-busy="true"><i style={{ width: '40%', height: 12 }} /><i style={{ width: '25%', height: 10 }} /><i style={{ flex: 1 }} /></div>
        : <CompFrame comp={comp} interactive={interactive} editing={editing} mode={mode} onFocus={() => onFocus(comp.id)} />}
    </div>
  );
});

export function Canvas() {
  const doc = useEditor((s) => s.doc)!;
  const pageId = useEditor((s) => s.pageId);
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0]!;
  const mode = useEditor((s) => s.mode);
  const zoom = useEditor((s) => s.zoom);
  const fit = useEditor((s) => s.fit);
  const selection = useEditor((s) => s.selection);
  const interactiveId = useEditor((s) => s.interactive);
  const flash = useEditor((s) => s.flash);
  const dash = useDashTheme();
  const scroller = useRef<HTMLDivElement>(null);
  const pageEl = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [drop, setDrop] = useState<Rect | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0, sx: 0, sy: 0 });
  const [loading, setLoading] = useState(mode === 'preview');
  useEffect(() => { if (mode !== 'preview') { setLoading(false); return; } setLoading(true); const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t); }, [pageId, doc.id, mode]);
  const edit = mode === 'edit';
  const comps = [...page.comps].sort((a, b) => a.z - b.z);
  const contentH = Math.max(page.h, ...page.comps.map((c) => c.y + c.h + 24));

  // zoom "ajustar à largura"
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const upd = () => {
      setVp({ w: el.clientWidth, h: el.clientHeight, sx: el.scrollLeft, sy: el.scrollTop });
      if (useEditor.getState().fit) { const zw = (el.clientWidth - (edit ? 64 : 32)) / page.w, zh = (el.clientHeight - 32) / contentH; const z = Math.max(0.3, Math.min(1.25, edit ? zw : Math.max(Math.min(zw, zh), Math.min(zw, 0.62)))); if (Math.abs(z - useEditor.getState().zoom) > 0.005) useEditor.getState().set({ zoom: Math.round(z * 1000) / 1000 }); }
    };
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, [fit, page.w, edit, contentH]);

  const toPage = useCallback((cx: number, cy: number) => { const r = pageEl.current!.getBoundingClientRect(); return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom }; }, [zoom]);
  const el = (id: string) => pageEl.current?.querySelector<HTMLElement>(`[data-cid="${CSS.escape(id)}"]`);
  const selEls = (id: string) => pageEl.current?.querySelectorAll<HTMLElement>(`[data-sid="${CSS.escape(id)}"]`) ?? [];

  // ---------- mover ----------
  const startMove = (e: React.PointerEvent, c: Comp) => {
    const st = useEditor.getState();
    let sel = st.selection;
    if (e.shiftKey || e.metaKey || e.ctrlKey) { st.select([c.id], true); return; }
    if (!sel.includes(c.id)) { st.select([c.id]); sel = [c.id]; }
    const p = st.page()!;
    let moving = p.comps.filter((x) => sel.includes(x.id) && !x.locked);
    // container leva junto o que está inteiramente dentro dele
    for (const ct of moving.filter((x) => x.type === 'container')) for (const o of p.comps) if (!moving.includes(o) && !o.locked && o.x >= ct.x && o.y >= ct.y && o.x + o.w <= ct.x + ct.w && o.y + o.h <= ct.y + ct.h) moving = [...moving, o];
    if (!moving.length) return;
    const ids = moving.map((x) => x.id);
    const start = toPage(e.clientX, e.clientY);
    const bbox = { x: Math.min(...moving.map((m) => m.x)), y: Math.min(...moving.map((m) => m.y)), w: 0, h: 0 };
    bbox.w = Math.max(...moving.map((m) => m.x + m.w)) - bbox.x; bbox.h = Math.max(...moving.map((m) => m.y + m.h)) - bbox.y;
    const others = p.comps.filter((x) => !ids.includes(x.id) && !x.hidden);
    let moved = false, fdx = 0, fdy = 0;
    const onMove = (ev: PointerEvent) => {
      const cur = toPage(ev.clientX, ev.clientY);
      let dx = cur.x - start.x, dy = cur.y - start.y;
      if (!moved && Math.hypot(dx * zoom, dy * zoom) < 4) return;
      moved = true;
      const r = { ...bbox, x: bbox.x + dx, y: bbox.y + dy };
      const sn = ev.altKey ? { dx: null, dy: null, guides: [] } : snapRect(r, others, p, zoom);
      dx = sn.dx != null ? dx + sn.dx : snapG(bbox.x + dx) - bbox.x;
      dy = sn.dy != null ? dy + sn.dy : snapG(bbox.y + dy) - bbox.y;
      dx = Math.max(-bbox.x, Math.min(p.w - bbox.x - bbox.w, dx)); dy = Math.max(-bbox.y, dy);
      fdx = dx; fdy = dy;
      for (const id of ids) { const n = el(id); if (n) { n.style.transform = `translate(${dx}px, ${dy}px)`; n.classList.add('is-dragging'); } selEls(id).forEach((s) => { s.style.transform = `translate(${dx}px, ${dy}px)`; }); }
      setGuides(sn.guides);
    };
    const onUp = () => {
      removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
      setGuides([]);
      for (const id of ids) { const n = el(id); if (n) { n.style.transform = ''; n.classList.remove('is-dragging'); } selEls(id).forEach((s) => { s.style.transform = ''; }); }
      if (!moved || (fdx === 0 && fdy === 0)) return;
      const rects = Object.fromEntries(moving.map((m) => [m.id, { x: Math.round(m.x + fdx), y: Math.round(m.y + fdy), w: m.w, h: m.h }]));
      useEditor.getState().setRects(rects, moving.length > 1 ? `Mover ${moving.length} componentes` : `Mover ${moving[0]!.name}`);
    };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);
  };

  // ---------- redimensionar ----------
  const startResize = (e: React.PointerEvent, c: Comp, dir: string) => {
    e.stopPropagation(); e.preventDefault();
    if (c.locked) return;
    const p = useEditor.getState().page()!;
    const start = toPage(e.clientX, e.clientY);
    const others = p.comps.filter((x) => x.id !== c.id && !x.hidden);
    let last: Rect = { x: c.x, y: c.y, w: c.w, h: c.h };
    const onMove = (ev: PointerEvent) => {
      const cur = toPage(ev.clientX, ev.clientY);
      const dx = cur.x - start.x, dy = cur.y - start.y;
      let { x, y, w, h } = c;
      if (dir.includes('e')) w = c.w + dx; if (dir.includes('s')) h = c.h + dy;
      if (dir.includes('w')) { x = c.x + dx; w = c.w - dx; } if (dir.includes('n')) { y = c.y + dy; h = c.h - dy; }
      const sn = ev.altKey ? { dx: null, dy: null, guides: [] } : snapRect({ x, y, w, h }, others, p, zoom, { l: dir.includes('w'), r: dir.includes('e'), t: dir.includes('n'), b: dir.includes('s') });
      if (sn.dx != null) { if (dir.includes('e')) w += sn.dx; else if (dir.includes('w')) { x += sn.dx; w -= sn.dx; } } else { if (dir.includes('e')) w = snapG(x + w) - x; if (dir.includes('w')) { const nx = snapG(x); w += x - nx; x = nx; } }
      if (sn.dy != null) { if (dir.includes('s')) h += sn.dy; else if (dir.includes('n')) { y += sn.dy; h -= sn.dy; } } else { if (dir.includes('s')) h = snapG(y + h) - y; if (dir.includes('n')) { const ny = snapG(y); h += y - ny; y = ny; } }
      if (ev.shiftKey && (dir.length === 2)) { const ar = c.w / c.h; if (w / h > ar) w = h * ar; else h = w / ar; }
      w = Math.max(48, Math.min(p.w - x, w)); h = Math.max(32, h); x = Math.max(0, x); y = Math.max(0, y);
      last = { x, y, w, h };
      const n = el(c.id);
      if (n) Object.assign(n.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      selEls(c.id).forEach((s) => Object.assign(s.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }));
      const lbl = pageEl.current?.querySelector<HTMLElement>('.bw-sel-size'); if (lbl) lbl.textContent = `${Math.round(w)} × ${Math.round(h)}`;
      setGuides(sn.guides);
    };
    const onUp = () => {
      removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
      setGuides([]);
      if (last.x !== c.x || last.y !== c.y || last.w !== c.w || last.h !== c.h) useEditor.getState().setRects({ [c.id]: { x: Math.round(last.x), y: Math.round(last.y), w: Math.round(last.w), h: Math.round(last.h) } }, `Redimensionar ${c.name}`);
    };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);
  };

  // ---------- seleção por área ----------
  const startMarquee = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const st = useEditor.getState();
    const additive = e.shiftKey;
    if (!additive) st.set({ selection: [], interactive: null, picked: null });
    const s = toPage(e.clientX, e.clientY);
    const base = additive ? st.selection : [];
    let r: Rect | null = null;
    const onMove = (ev: PointerEvent) => {
      const c = toPage(ev.clientX, ev.clientY);
      r = { x: Math.min(s.x, c.x), y: Math.min(s.y, c.y), w: Math.abs(c.x - s.x), h: Math.abs(c.y - s.y) };
      if (r.w * zoom < 4 && r.h * zoom < 4) return;
      setMarquee(r);
      const hit = st.page()!.comps.filter((x) => !x.locked && x.x < r!.x + r!.w && x.x + x.w > r!.x && x.y < r!.y + r!.h && x.y + x.h > r!.y).map((x) => x.id);
      useEditor.getState().set({ selection: [...new Set([...base, ...hit])] });
    };
    const onUp = () => { removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); setMarquee(null); };
    addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);
  };

  // ---------- paleta → canvas (arrastar e soltar) ----------
  const paletteItem = (e: React.DragEvent) => PALETTE.find((p) => p.id === (e.dataTransfer.types.includes('application/x-biweb') ? (window as unknown as { __bwDrag?: string }).__bwDrag : ''));
  const onDragOver = (e: React.DragEvent) => {
    const it = paletteItem(e);
    if (!it || !edit) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
    const m = COMP_META[it.type], c = toPage(e.clientX, e.clientY);
    setDrop({ x: Math.max(0, Math.min(page.w - m.w, snapG(c.x - m.w / 2))), y: Math.max(0, snapG(c.y - m.h / 2)), w: m.w, h: m.h });
  };
  const onDrop = (e: React.DragEvent) => {
    const it = paletteItem(e);
    setDrop(null);
    if (!it || !drop) return;
    e.preventDefault();
    useEditor.getState().insert(it.type, { x: drop.x, y: drop.y }, it.preset, { label: `Inserir ${it.label}` });
  };

  const onFocus = useCallback((id: string) => useEditor.getState().set({ focusComp: id }), []);
  const sel = page.comps.filter((c) => selection.includes(c.id));
  const single = sel.length === 1 ? sel[0]! : null;

  // minimapa: só quando a página não cabe na área visível
  const showMini = edit && (page.w * zoom > vp.w + 8 || contentH * zoom > vp.h + 8);
  useEffect(() => { const el = scroller.current; if (!el) return; const f = () => setVp((v) => ({ ...v, sx: el.scrollLeft, sy: el.scrollTop })); el.addEventListener('scroll', f, { passive: true }); return () => el.removeEventListener('scroll', f); }, []);

  return (
    <div className={`ed-canvas${edit ? ' is-edit' : ' is-preview'}`} ref={scroller} onPointerDown={(e) => { if (edit && e.target === e.currentTarget) startMarquee(e); setMenu(null); }}
      onDragOver={onDragOver} onDrop={onDrop} onDragLeave={(e) => { if (e.currentTarget === e.target) setDrop(null); }}>
      <div className="ed-stage" style={{ width: Math.max(edit ? 0 : vp.w, page.w * zoom + (edit ? 64 : 32)), height: contentH * zoom + (edit ? 64 : 32) }} onPointerDown={(e) => { if (edit && e.target === e.currentTarget) startMarquee(e); }}>
        <div ref={pageEl} className={`ed-page dash-theme-${dash}`} style={{ width: page.w, height: contentH, transform: `scale(${zoom})`, left: edit ? 32 : Math.max(16, (vp.w - page.w * zoom) / 2), top: edit ? 32 : 16 }}
          onPointerDown={(e) => {
            if (!edit || e.button !== 0) return;
            const t = e.target as HTMLElement;
            const box = t.closest<HTMLElement>('[data-cid]');
            if (!box) { startMarquee(e); return; }
            const c = page.comps.find((x) => x.id === box.dataset.cid);
            if (!c || interactiveId === c.id) return;
            if (t.closest('button, input, textarea, select, [role="option"], [role="columnheader"], .vz-filter-btn, .vz-slicer, .vz-map-layers, .vz-route-list, .vz-detail')) { if (!selection.includes(c.id)) useEditor.getState().select([c.id]); return; }
            e.preventDefault();
            startMove(e, c);
          }}
          onDoubleClick={(e) => { if (!edit) return; const box = (e.target as HTMLElement).closest<HTMLElement>('[data-cid]'); if (box) useEditor.getState().set({ interactive: box.dataset.cid!, selection: [box.dataset.cid!] }); }}
          onContextMenu={(e) => { if (!edit) return; const box = (e.target as HTMLElement).closest<HTMLElement>('[data-cid]'); if (!box) return; e.preventDefault(); if (!selection.includes(box.dataset.cid!)) useEditor.getState().select([box.dataset.cid!]); const r = scroller.current!.getBoundingClientRect(); setMenu({ x: e.clientX - r.left + scroller.current!.scrollLeft, y: e.clientY - r.top + scroller.current!.scrollTop }); }}>
          {edit && <div className="ed-grid" aria-hidden="true" />}
          {comps.filter((c) => edit || !c.hidden).map((c) => (
            <CompBox key={c.id} comp={c} selected={selection.includes(c.id)} interactive={!edit || interactiveId === c.id} editing={edit && interactiveId === c.id} mode={mode} flash={flash[c.id]} onFocus={onFocus} loading={loading} />
          ))}
          {edit && sel.map((c) => (
            <div key={c.id} data-sid={c.id} className={`ed-selbox${interactiveId === c.id ? ' is-live' : ''}`} style={{ left: c.x, top: c.y, width: c.w, height: c.h, ['--z' as string]: 1 / zoom }}>
              <span className="bw-sel" />
              {single && !c.locked && interactiveId !== c.id && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((d) => <span key={d} className={`bw-handle ed-h ed-h--${d}`} onPointerDown={(e) => startResize(e, c, d)} />)}
              {single && <span className="bw-sel-size">{interactiveId === c.id ? (c.type === 'text' ? 'Editando texto · Esc para sair' : 'Interagindo · Esc para sair') : c.locked ? 'Bloqueado' : `${c.w} × ${c.h}`}</span>}
            </div>
          ))}
          {guides.map((g, i) => (g.o === 'v' ? <div key={i} className="bw-guide-v ed-guide" style={{ left: g.at, top: g.from, height: g.to - g.from }} /> : <div key={i} className="bw-guide-h ed-guide" style={{ top: g.at, left: g.from, width: g.to - g.from }} />))}
          {marquee && <div className="ed-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
          {drop && <div className="ed-drop" style={{ left: drop.x, top: drop.y, width: drop.w, height: drop.h }} />}
          {edit && page.comps.length === 0 && <EmptyPage />}
        </div>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
      {showMini && <Minimap page={page} contentH={contentH} zoom={zoom} vp={vp} onScroll={(x, y) => scroller.current?.scrollTo({ left: x, top: y })} />}
    </div>
  );
}

function EmptyPage() {
  const set = useEditor((s) => s.set), doc = useEditor((s) => s.doc)!, datasets = useData((s) => s.datasets), aiEnabled = useUi((s) => s.aiEnabled);
  const ds = datasets.find((d) => d.id === doc.datasets[0]) ?? datasets[0]!;
  return (
    <div className="ed-emptypage">
      <Icon name="chart" size={20} />
      <b>Comece a construir</b>
      <span>Escolha os dados, adicione uma visualização e ligue os campos. Tudo o que o Copilot criar continua editável aqui.</span>
      <label className="ed-empty-ds"><span>Dados</span><select aria-label="Dataset do relatório" value={ds.id} onChange={(e) => { const d = datasets.find((x) => x.id === e.target.value); if (d) useEditor.getState().commit(`Usar dataset ${d.name}`, (x) => { x.datasets = [d.id]; }); }}>{datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <div className="ed-emptypage-acts">
        <button type="button" className="bw-btn bw-btn--primary" onClick={() => set({ pickerOpen: true })}><Icon name="plus" size={12} />Adicionar visualização</button>
        {aiEnabled && <button type="button" className="bw-btn" onClick={() => set({ rightTab: 'ai' })}><Icon name="copilot" size={12} />Perguntar ao Copilot</button>}
        <button type="button" className="bw-btn" onClick={() => set({ rightTab: 'data' })}><Icon name="data" size={12} />Ver campos</button>
      </div>
      <small className="ed-empty-hint">Ou arraste um componente da paleta à esquerda para o canvas.</small>
    </div>
  );
}

function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const st = useEditor.getState();
  const sel = st.page()!.comps.filter((c) => st.selection.includes(c.id));
  const one = sel[0];
  const items: ([string, string, () => void, boolean?] | '-')[] = [
    ['Duplicar', '⌘D', () => st.duplicate()], ['Copiar', '⌘C', () => st.copy()], ['Colar', '⌘V', () => st.paste(), !st.clipboard], '-',
    ['Trazer para a frente', '⇧⌘]', () => st.order('front')], ['Avançar uma camada', '⌘]', () => st.order('forward')], ['Recuar uma camada', '⌘[', () => st.order('backward')], ['Enviar para trás', '⇧⌘[', () => st.order('back')], '-',
    [one?.locked ? 'Desbloquear' : 'Bloquear', '', () => sel.forEach((c) => st.update(c.id, (d) => { d.locked = !one?.locked; }, one?.locked ? 'Desbloquear' : 'Bloquear'))],
    [one?.hidden ? 'Mostrar' : 'Ocultar na visualização', '', () => sel.forEach((c) => st.update(c.id, (d) => { d.hidden = !one?.hidden; }, one?.hidden ? 'Mostrar' : 'Ocultar'))],
    ['Abrir em foco', '', () => one && st.set({ focusComp: one.id }), sel.length !== 1],
    ['Perguntar ao Copilot', '', () => st.set({ rightTab: 'ai' })], '-',
    ['Excluir', '⌫', () => st.remove()],
  ];
  return (
    <div className="bw-menu ed-ctx" style={{ left: x, top: y }} role="menu" onPointerDown={(e) => e.stopPropagation()}>
      {items.map((it, i) => (it === '-' ? <div key={i} className="bw-menu-sep" /> : (
        <button key={it[0]} type="button" role="menuitem" className={`bw-menu-item${it[0] === 'Excluir' ? ' bw-menu-item--danger' : ''}`} disabled={it[3]} onClick={() => { it[2](); onClose(); }}>{it[0]}{it[1] && <span className="bw-kbd">{it[1]}</span>}</button>
      )))}
    </div>
  );
}

function Minimap({ page, contentH, zoom, vp, onScroll }: { page: Page; contentH: number; zoom: number; vp: { w: number; h: number; sx: number; sy: number }; onScroll: (x: number, y: number) => void }) {
  const W = 168, k = W / page.w, H = Math.min(140, contentH * k);
  const go = (e: React.PointerEvent) => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / k, py = (e.clientY - r.top) / k; onScroll(px * zoom - vp.w / 2 + 32, py * zoom - vp.h / 2 + 32); };
  return (
    <div className="ed-mini" style={{ width: W, height: H }} aria-label="Minimapa" onPointerDown={(e) => { go(e); const mv = (ev: PointerEvent) => go(ev as unknown as React.PointerEvent); const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); }}>
      {page.comps.filter((c) => !c.hidden).map((c) => <i key={c.id} style={{ left: c.x * k, top: c.y * k, width: c.w * k, height: c.h * k }} />)}
      <b style={{ left: ((vp.sx - 32) / zoom) * k, top: ((vp.sy - 32) / zoom) * k, width: (vp.w / zoom) * k, height: (vp.h / zoom) * k }} />
    </div>
  );
}
