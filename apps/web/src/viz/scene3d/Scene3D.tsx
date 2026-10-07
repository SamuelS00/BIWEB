/**
 * Gêmeo digital 3D (three.js). Carregado sob demanda: React.lazy(() => import('./viz/scene3d/Scene3D')).
 * Preenche o pai (100% × 100%). Em modo não interativo renderiza um quadro estático e não captura o ponteiro.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { IconButton, PopoverButton, SegmentedControl, Switch } from '@biweb/ui';
import type { Scene3DProps } from '../../editor/doc';
import type { NetStatus } from '../../net/generate';
import { LOS_DEMO, losDemo } from '../../net/los';
import { network } from '../../data/registry';
import { buildArea } from './area';
import { Scene3DEngine, type LayerKey, type Perspective } from './engine';
import { STATUS_WORD, readPalette } from './format';
import { DetailPanel, LosPanel } from './panels';
import './scene3d.css';

export interface Scene3DViewProps {
  props: Scene3DProps;
  dashTheme: 'light' | 'dark';
  /** false no modo de edição: quadro estático, sem controles nem captura de ponteiro. */
  interactive: boolean;
  /** status efetivo (após regras de negócio) de um nó ou enlace */
  statusOf: (id: string) => NetStatus;
  picked: string | null;
  onPick: (id: string | null) => void;
  onPropsChange?: (patch: Partial<Scene3DProps>) => void;
}

const LAYERS: { k: LayerKey; label: string }[] = [
  { k: 'terreno', label: 'Terreno' }, { k: 'edificios', label: 'Edificações' }, { k: 'torres', label: 'Torres e POPs' },
  { k: 'fibras', label: 'Fibras e rádio' }, { k: 'cobertura', label: 'Cobertura 5G' }, { k: 'visada', label: 'Linha de visada' }, { k: 'fluxo', label: 'Fluxo de tráfego' },
];
const PERSPECTIVES: { id: Perspective; label: string }[] = [{ id: 'orbital', label: 'Orbital' }, { id: 'topo', label: 'Topo' }, { id: 'rua', label: 'Rua' }];
const DEFAULT_LAYERS: Scene3DProps['layers'] = { terreno: true, edificios: true, torres: true, fibras: true, cobertura: true, visada: true, fluxo: true };

function useReducedMotion() {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [v, setV] = useState(() => !!q?.matches);
  useEffect(() => {
    if (!q) return;
    const on = () => setV(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, [q]);
  return v;
}

export default function Scene3D({ props, dashTheme, interactive, statusOf, picked, onPick, onPropsChange }: Scene3DViewProps) {
  const rootRef = useRef<HTMLDivElement>(null), hostRef = useRef<HTMLDivElement>(null), labelRef = useRef<HTMLDivElement>(null), tipRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Scene3DEngine | null>(null);
  const [failed, setFailed] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const reduced = useReducedMotion();

  // camadas e perspectiva: controladas pelo documento quando há onPropsChange, senão estado local
  const [localLayers, setLocalLayers] = useState(props.layers ?? DEFAULT_LAYERS);
  const [localPersp, setLocalPersp] = useState<Perspective>(props.perspective ?? 'orbital');
  useEffect(() => { if (props.layers) setLocalLayers(props.layers); }, [props.layers]);
  useEffect(() => { if (props.perspective) setLocalPersp(props.perspective); }, [props.perspective]);
  const layers = onPropsChange ? props.layers ?? DEFAULT_LAYERS : localLayers;
  const perspective = onPropsChange ? props.perspective ?? 'orbital' : localPersp;
  const setLayer = (k: LayerKey, v: boolean) => { const next = { ...layers, [k]: v }; if (onPropsChange) onPropsChange({ layers: next }); else setLocalLayers(next); };
  const setPerspective = (p: Perspective) => { if (onPropsChange) onPropsChange({ perspective: p }); else setLocalPersp(p); };

  const area = useMemo(() => buildArea(props.focus, props.exaggeration ?? 3), [props.focus, props.exaggeration]);

  // assinatura de status: só reestiliza quando algum status efetivo muda (statusOf pode mudar de identidade a cada render)
  const statusRef = useRef(statusOf); statusRef.current = statusOf;
  const statusSig = area ? area.nodes.map((n) => statusOf(n.node.id)[0]).join('') + '|' + area.links.map((l) => statusOf(l.id)[0]).join('') : '';
  const onPickRef = useRef(onPick); onPickRef.current = onPick;

  // ---- motor ----
  useLayoutEffect(() => {
    const host = hostRef.current, labels = labelRef.current, root = rootRef.current;
    if (!host || !labels || !root) return;
    let e: Scene3DEngine;
    try { e = new Scene3DEngine(host, labels); } catch { setFailed(true); return; }
    engineRef.current = e;
    const ro = new ResizeObserver((entries) => { const r = entries[0]?.contentRect; if (r) e.resize(r.width, r.height); });
    ro.observe(host);
    const r0 = host.getBoundingClientRect(); e.resize(r0.width, r0.height);
    const io = new IntersectionObserver((entries) => { const v = entries.some((x) => x.isIntersecting); setOnScreen(v); }, { threshold: 0 });
    io.observe(root);
    return () => { ro.disconnect(); io.disconnect(); e.dispose(); engineRef.current = null; };
  }, []);

  const mounted = useRef(false);
  useEffect(() => { engineRef.current?.view(perspective, mounted.current && !reduced); }, [perspective]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (area) engineRef.current?.build(area); }, [area]);
  useEffect(() => { const e = engineRef.current, root = rootRef.current; if (e && root) e.restyle(readPalette(root), statusRef.current); }, [dashTheme, statusSig, area]);
  useEffect(() => { engineRef.current?.setLayers(layers); }, [layers]);
  useEffect(() => { engineRef.current?.setInteractive(interactive); if (!interactive && tipRef.current) tipRef.current.hidden = true; }, [interactive]);
  useEffect(() => { engineRef.current?.setPicked(picked); }, [picked, area]);
  useEffect(() => { const e = engineRef.current; if (!e) return; e.setVisible(onScreen); e.setAnimationAllowed(interactive && !reduced && onScreen); }, [interactive, reduced, onScreen]);
  useEffect(() => { mounted.current = true; }, []);

  // ---- ponteiro (só interativo) ----
  const down = useRef<{ x: number; y: number } | null>(null);
  const hoverRaf = useRef(0), hoverPos = useRef({ x: 0, y: 0 });
  useEffect(() => () => cancelAnimationFrame(hoverRaf.current), []);
  const nameOf = (id: string) => network().nodes.find((n) => n.id === id)?.nome ?? network().links.find((l) => l.id === id)?.nome ?? id;
  const hover = () => {
    hoverRaf.current = 0;
    const e = engineRef.current, tip = tipRef.current, host = hostRef.current, root = rootRef.current;
    if (!e || !tip || !host || !root) return;
    const { x, y } = hoverPos.current;
    const id = e.hitTest(x, y);
    host.style.cursor = id ? 'pointer' : '';
    if (!id) { tip.hidden = true; return; }
    const r = root.getBoundingClientRect(), s = statusRef.current(id);
    tip.textContent = `${nameOf(id)} · ${STATUS_WORD[s]}`;
    tip.hidden = false;
    const tx = Math.min(x - r.left + 12, r.width - tip.offsetWidth - 4), ty = Math.max(4, y - r.top - tip.offsetHeight - 10);
    tip.style.transform = `translate(${tx}px, ${ty}px)`;
  };
  const handlers = interactive ? {
    onPointerDown: (ev: PointerEvent) => { down.current = { x: ev.clientX, y: ev.clientY }; if (tipRef.current) tipRef.current.hidden = true; },
    onWheel: () => { if (tipRef.current) tipRef.current.hidden = true; },
    onPointerUp: (ev: PointerEvent) => {
      const d = down.current; down.current = null;
      if (!d || ev.button !== 0 || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 5) return;
      onPickRef.current(engineRef.current?.hitTest(ev.clientX, ev.clientY) ?? null);
    },
    onDoubleClick: (ev: { clientX: number; clientY: number }) => {
      const id = engineRef.current?.hitTest(ev.clientX, ev.clientY);
      if (id) { onPickRef.current(id); engineRef.current?.focusOn(id, !reduced); }
    },
    onPointerMove: (ev: PointerEvent) => { hoverPos.current = { x: ev.clientX, y: ev.clientY }; if (!hoverRaf.current && !ev.buttons) hoverRaf.current = requestAnimationFrame(hover); },
    onPointerLeave: () => { if (tipRef.current) tipRef.current.hidden = true; },
  } : {};
  // rótulos de torre também são alvos de clique (delegação; o contêiner em si não captura o ponteiro)
  const labelId = (t: EventTarget) => (t instanceof Element ? (t.closest('[data-id]') as HTMLElement | null)?.dataset.id : undefined);
  const labelHandlers = interactive ? {
    onClick: (ev: MouseEvent<HTMLDivElement>) => { const id = labelId(ev.target); if (id) onPickRef.current(id); },
    onDoubleClick: (ev: MouseEvent<HTMLDivElement>) => { const id = labelId(ev.target); if (id) { onPickRef.current(id); engineRef.current?.focusOn(id, !reduced); } },
  } : {};
  const onKeyDown = (ev: KeyboardEvent) => { if (interactive && ev.key === 'Escape' && picked) { ev.stopPropagation(); onPickRef.current(null); } };

  // o painel abre sob o ponteiro em ~1/4 da largura: nos primeiros 300 ms ele deixa o 2º clique de um duplo clique passar para a cena
  const hasPick = interactive && !!picked;
  const [panelArmed, setPanelArmed] = useState(false);
  useEffect(() => { if (!hasPick) { setPanelArmed(false); return; } const t = setTimeout(() => setPanelArmed(true), 300); return () => clearTimeout(t); }, [hasPick]);

  // ---- texto acessível ----
  const ariaLabel = useMemo(() => {
    if (!area) return 'Gêmeo digital 3D: nenhuma torre em foco';
    const torres = area.nodes.filter((n) => n.node.tipo === 'Torre').length;
    let s = `Gêmeo digital 3D em torno da ${area.focusId}: ${torres} torres, ${area.links.length} enlaces`;
    if (area.byId.has(LOS_DEMO.from) && area.byId.has(LOS_DEMO.to) && LOS_DEMO.from !== LOS_DEMO.to) {
      s += losDemo().blocked ? `, visada obstruída entre ${LOS_DEMO.from} e ${LOS_DEMO.to}` : `, visada livre entre ${LOS_DEMO.from} e ${LOS_DEMO.to}`;
      if (LOS_DEMO.relay) s += ` (repetidora sugerida: ${LOS_DEMO.relay})`;
    }
    return s;
  }, [area]);
  const losVisible = !!area && layers.visada && area.byId.has(LOS_DEMO.from) && area.byId.has(LOS_DEMO.to) && LOS_DEMO.from !== LOS_DEMO.to;

  return (
    <div ref={rootRef} className="s3d" data-interactive={interactive ? 'true' : 'false'} tabIndex={interactive ? 0 : undefined} onKeyDown={onKeyDown}>
      <div ref={hostRef} className="s3d-host" role="img" aria-label={ariaLabel} {...handlers} />
      <div ref={labelRef} className="s3d-labels" aria-hidden="true" {...labelHandlers} />
      {failed && <div className="s3d-empty">Não foi possível iniciar a visualização 3D neste navegador (WebGL indisponível).</div>}
      {!area && !failed && <div className="s3d-empty">Defina uma torre em foco para montar o gêmeo digital.</div>}

      {interactive && (
        <div className="s3d-toolbar" role="toolbar" aria-label="Controles da cena 3D">
          <SegmentedControl label="Perspectiva" options={PERSPECTIVES} value={perspective} onChange={setPerspective} />
          <PopoverButton label="Camadas" icon="layers">
            <div className="bw-popover s3d-layers">
              <div className="s3d-layers-title">Camadas</div>
              {LAYERS.map(({ k, label }) => (
                <Switch key={k} isSelected={layers[k]} onChange={(v) => setLayer(k, v)}
                  isDisabled={k === 'fluxo' && reduced} title={k === 'fluxo' && reduced ? 'Desativado: o sistema pede movimento reduzido' : undefined}>{label}</Switch>
              ))}
            </div>
          </PopoverButton>
          <IconButton icon="fit" label="Centralizar" size="sm" onPress={() => engineRef.current?.view(perspective, !reduced)} />
        </div>
      )}

      {losVisible && <LosPanel />}

      <div className="s3d-legend" aria-label="Legenda de status">
        {(['normal', 'warning', 'critical', 'offline'] as const).map((s) => (
          <span key={s} className="s3d-status" data-status={s}><span className="s3d-dot" aria-hidden="true" />{STATUS_WORD[s]}</span>
        ))}
      </div>

      {interactive && picked && <DetailPanel armed={panelArmed} id={picked} statusOf={statusOf} onPick={(id) => onPickRef.current(id)} onClose={() => onPickRef.current(null)} />}

      <div ref={tipRef} className="s3d-tip" role="status" hidden />
      {!interactive && <div className="s3d-hint">Clique duas vezes para interagir</div>}
    </div>
  );
}
