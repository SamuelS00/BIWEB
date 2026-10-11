import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from '@biweb/ui';
import { useFormat, useT, type T } from '../../i18n/intl';

/** Product Pulse: composição viva (dados → modelo → relatório, mapa e fluxo) com os mesmos componentes do produto, em escala reduzida. */
export type PulseMode = 'idle' | 'connecting' | 'connected';

export function useReducedMotion() {
  const [r, setR] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia('(prefers-reduced-motion: reduce)'); const on = () => setR(m.matches);
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

// ---------- Geometria (palco lógico de 720 × 500; escalado para caber no painel) ----------
const W = 720, H = 500;
const NODES = {
  s1: { x: 0, y: 70, w: 172, h: 64 }, s2: { x: 0, y: 188, w: 172, h: 64 },
  n: { x: 238, y: 124, w: 172, h: 64 }, m: { x: 238, y: 262, w: 172, h: 64 },
  o1: { x: 480, y: 0, w: 240, h: 142 }, o2: { x: 480, y: 160, w: 240, h: 142 }, o3: { x: 480, y: 320, w: 240, h: 108 },
} as const;
type NodeId = keyof typeof NODES;
const mid = (id: NodeId) => ({ x: NODES[id].x + NODES[id].w / 2, y: NODES[id].y + NODES[id].h / 2 });
const curve = (x1: number, y1: number, x2: number, y2: number) => { const dx = (x2 - x1) / 2; return `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`; };
const right = (id: NodeId) => ({ x: NODES[id].x + NODES[id].w, y: mid(id).y }), left = (id: NodeId) => ({ x: NODES[id].x, y: mid(id).y });
const EDGES = {
  sn1: { d: curve(right('s1').x, right('s1').y, left('n').x, left('n').y), dur: 650 },
  sn2: { d: curve(right('s2').x, right('s2').y, left('n').x, left('n').y), dur: 650 },
  nm: { d: `M${mid('n').x} ${NODES.n.y + NODES.n.h}V${NODES.m.y}`, dur: 420 },
  mo1: { d: curve(right('m').x, right('m').y, left('o1').x, NODES.o1.y + 70), dur: 760 },
  mo2: { d: curve(right('m').x, right('m').y, left('o2').x, NODES.o2.y + 70), dur: 640 },
  mo3: { d: curve(right('m').x, right('m').y, left('o3').x, NODES.o3.y + 54), dur: 760 },
} as const;
type EdgeId = keyof typeof EDGES;
const EDGE_ORDER: EdgeId[] = ['sn1', 'sn2', 'nm', 'mo1', 'mo2', 'mo3'];

// ---------- Marca em blocos (carregador do botão e da cadeia) ----------
export function BiwebMark({ state = 'done', size = 16 }: { state?: 'loading' | 'done'; size?: number }) {
  return (
    <svg className={`lp-mark is-${state}`} width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" fill="currentColor" strokeLinejoin="round">
      <path style={{ '--i': 0 } as CSSProperties} opacity=".55" d="M2 8.4c0-1.3.8-2.3 2-2.7l6.6-2.1v6L2 12.1z" />
      <path style={{ '--i': 3 } as CSSProperties} d="M12.8 3.4c0-.9.6-1.7 1.5-1.9l3.4-.6c.9-.2 1.7.5 1.7 1.4v7L12.8 11z" />
      <rect style={{ '--i': 1 } as CSSProperties} opacity=".4" x="2" y="14" width="4.4" height="6" rx="1.2" />
      <rect style={{ '--i': 2 } as CSSProperties} opacity=".7" x="8.2" y="12.4" width="4.4" height="7.6" rx="1.2" />
      <rect style={{ '--i': 4 } as CSSProperties} x="14.4" y="11.6" width="4.6" height="8.4" rx="1.2" />
    </svg>
  );
}

const CHAIN = ['pulse.chain.data', 'pulse.chain.models', 'pulse.chain.reports', 'pulse.chain.maps', 'pulse.chain.workflows', 'pulse.chain.operations'] as const;
/** Cadeia do produto em uma linha: aparece uma vez, em ordem, e fica quieta. */
export function Chain({ className = '' }: { className?: string }) {
  const t = useT();
  return (
    <ol className={`lp-chain ${className}`} aria-label={t('pulse.chainLabel')}>
      {CHAIN.map((c, i) => <li key={c} style={{ '--i': i } as CSSProperties}><i aria-hidden="true" />{t(c)}</li>)}
    </ol>
  );
}

// ---------- Nós ----------
type Dot = 'off' | 'busy' | 'ok';
function Node({ id, cat, icon, type, name, line, dot, converge, children, className = '' }: { id: NodeId; cat: string; icon: IconName; type: string; name: string; line?: ReactNode; dot?: Dot; converge: { x: number; y: number }; children?: ReactNode; className?: string }) {
  const n = NODES[id];
  const style = { left: n.x, top: n.y, width: n.w, height: n.h, '--cat': cat, '--cx': `${converge.x}px`, '--cy': `${converge.y}px` } as CSSProperties;
  return (
    <div className={`lp-node lp-node--${id} ${className}`} style={style}>
      <div className="lp-node-top"><span className="lp-glyph"><Icon name={icon} size={12} /></span><span className="lp-node-type">{type}</span>{dot && <span className={`lp-dot is-${dot}`} aria-hidden="true" />}</div>
      <div className="lp-node-name">{name}</div>
      {line !== undefined && <div className="lp-node-line">{line}</div>}
      {children}
    </div>
  );
}

const sparkPath = (pts: number[], w: number, h: number) => pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - (v / 100) * h).toFixed(1)}`).join('');
const MARKERS: [number, number][] = [[46, 30], [92, 58], [140, 36], [178, 70], [118, 78], [64, 74], [206, 40], [28, 62]];
const FLOW_STEPS = ['pulse.flow.collect', 'pulse.flow.validate', 'pulse.flow.approve', 'pulse.flow.publish'] as const;

export function ProductPulse({ mode }: { mode: PulseMode }) {
  const t: T = useT();
  const f = useFormat();
  const nfmt = (v: number, d = 2) => f.decimal(v, d);
  const now = () => f.time(Date.now());
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [step, setStep] = useState(reduced ? 6 : 0);
  const [spark, setSpark] = useState([34, 40, 38, 47, 52, 49, 58, 55, 63, 60, 68, 66, 74]);
  const [kpi, setKpi] = useState(4.82);
  const [markers, setMarkers] = useState(3);
  const [flow, setFlow] = useState(2);
  const [norm, setNorm] = useState<'busy' | 'ok'>('busy');
  const [rows, setRows] = useState(1.24);
  const [stamp, setStamp] = useState('');
  const [pulses, setPulses] = useState<{ id: number; edge: EdgeId }[]>([]);
  const timers = useRef<number[]>([]);
  const seq = useRef(0), evt = useRef(0), liveRef = useRef(false);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useLayoutEffect(() => {
    const el = host.current; if (!el) return;
    const fit = () => setScale(Math.max(0.55, Math.min((el.clientWidth - 96) / W, (el.clientHeight - 128) / H, 1.3)));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);

  // Entrada: estrutura → conexões → nós online → LIVE. Termina em ~3 s e não volta a se repetir.
  useEffect(() => {
    if (reduced) { setStep(6); setNorm('ok'); setStamp(now()); return; }
    const t = [[1, 350], [2, 800], [3, 1450], [4, 1900], [5, 2700], [6, 3200]] as const;
    t.forEach(([s, ms]) => later(() => { setStep(s); if (s === 5) setNorm('ok'); if (s === 6) { setStamp(now()); liveRef.current = true; } }, ms));
  }, [reduced]);

  const pulse = (edge: EdgeId) => {
    if (reduced) return;
    const id = ++seq.current; setPulses((p) => [...p, { id, edge }]);
    later(() => setPulses((p) => p.filter((x) => x.id !== id)), EDGES[edge].dur + 80);
  };
  /** Percorre as conexões em sequência; ao chegar, aplica o efeito no destino. */
  const chain = (edges: EdgeId[], arrive: () => void) => {
    let t = 0; edges.forEach((e) => { later(() => pulse(e), t); t += EDGES[e].dur; }); later(() => { arrive(); setStamp(now()); }, reduced ? 0 : t);
  };
  const fire = (k: number) => {
    if (k === 0) chain(['sn1', 'nm', 'mo1'], () => { setSpark((s) => [...s.slice(1), Math.max(18, Math.min(92, (s[s.length - 1] ?? 60) + (Math.random() * 16 - 5)))]); setKpi((v) => v + 0.01); });
    else if (k === 1) chain(['sn2', 'nm', 'mo2'], () => setMarkers((m) => (m >= MARKERS.length ? 3 : m + 1)));
    else if (k === 2) chain(['mo3'], () => setFlow((f) => (f >= 4 ? 1 : f + 1)));
    else { setNorm('busy'); chain(['sn2', 'nm'], () => { setRows((r) => r + 0.01); later(() => setNorm('ok'), reduced ? 0 : 900); }); }
  };
  // Eventos ocasionais, um por vez, ritmo lento.
  useEffect(() => {
    if (step < 6 || reduced) return;
    const id = window.setInterval(() => { if (mode === 'idle') fire(evt.current++ % 4); }, 4600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reduced, mode]);
  // Ao conectar, a plataforma responde com um fluxo completo.
  useEffect(() => { if (mode === 'connecting' && liveRef.current && !reduced) { fire(0); later(() => fire(1), 500); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);

  const cls = ['lp-stage', ...Array.from({ length: step }, (_, i) => `s${i + 1}`), mode === 'connected' ? 'is-converge' : '', mode === 'connecting' ? 'is-connecting' : ''].join(' ');
  const mc = mid('m');
  const pull = (id: NodeId) => { const c = mid(id); return { x: Math.round((mc.x - c.x) * 0.6), y: Math.round((mc.y - c.y) * 0.6) }; };
  const on = step >= 3, ready = step >= 5;
  const line = sparkPath(spark, 216, 40);
  const live = step >= 6;

  return (
    <div className="lp-pulse" ref={host} aria-hidden="true">
      <div className={cls} style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <svg className="lp-edges" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {EDGE_ORDER.map((e, i) => <path key={e} className={`lp-edge${ready && i >= 3 ? ' is-on' : ''}`} d={EDGES[e].d} pathLength={1} style={{ '--i': i } as CSSProperties} />)}
          {pulses.map((p) => (
            <circle key={p.id} r="3.5" className="lp-travel">
              <animateMotion dur={`${EDGES[p.edge].dur}ms`} path={EDGES[p.edge].d} fill="freeze" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1" />
            </circle>
          ))}
        </svg>

        <Node id="s1" cat="var(--brand-slate)" icon="data" type={t('pulse.source')} name="PostgreSQL · vendas" converge={pull('s1')} dot={on ? 'ok' : 'busy'}
          line={on ? `${t('pulse.connected')} · 42 ms` : t('pulse.connecting')} />
        <Node id="s2" cat="var(--brand-slate)" icon="data" type={t('pulse.source')} name="API · ERP Lume" converge={pull('s2')} dot={on ? 'ok' : 'busy'}
          line={on ? `${t('pulse.connected')} · 118 ms` : t('pulse.connecting')} className="d2" />
        <Node id="n" cat="var(--brand-teal)" icon="bolt" type={t('pulse.transform')} name="Normalizar" converge={pull('n')} dot={step < 4 ? 'off' : norm}
          line={step < 4 ? t('pulse.waiting') : norm === 'busy' ? t('pulse.processing') : `${t('pulse.ready')} · ${nfmt(rows)} ${t('pulse.metric.million')} ${t('pulse.metric.records')}`} />
        <Node id="m" cat="var(--accent)" icon="model" type={t('pulse.semanticModel')} name="Vendas Varejo" converge={{ x: 0, y: 0 }} dot={ready ? 'ok' : 'off'}
          line={ready ? `${t('pulse.ready')} · 14 ${t('pulse.metric.metrics')}` : t('pulse.waiting')} className="is-model" />

        <div className="lp-node lp-out lp-node--o1" style={{ left: NODES.o1.x, top: NODES.o1.y, width: NODES.o1.w, height: NODES.o1.h, '--cat': 'var(--accent)', '--cx': `${pull('o1').x}px`, '--cy': `${pull('o1').y}px` } as CSSProperties}>
          <div className="lp-node-top"><span className="lp-glyph"><Icon name="report" size={12} /></span><span className="lp-node-type">{t('pulse.report')}</span></div>
          <div className="lp-kpi"><b>R$ {nfmt(kpi)} M</b><span className="lp-delta">+{nfmt(3.1 + (kpi - 4.82) * 2, 1)}%</span></div>
          <svg className="lp-spark" viewBox="0 0 216 44" preserveAspectRatio="none">
            <path className="lp-spark-area" d={`${line}L216 44L0 44Z`} /><path className="lp-spark-line" d={line} />
            <circle key={spark.join()} className="lp-spark-end" cx="216" cy={(40 - ((spark[spark.length - 1] ?? 0) / 100) * 40).toFixed(1)} r="3" />
          </svg>
        </div>

        <div className="lp-node lp-out lp-node--o2" style={{ left: NODES.o2.x, top: NODES.o2.y, width: NODES.o2.w, height: NODES.o2.h, '--cat': 'var(--brand-teal)', '--cx': `${pull('o2').x}px`, '--cy': `${pull('o2').y}px` } as CSSProperties}>
          <div className="lp-node-top"><span className="lp-glyph"><Icon name="pin" size={12} /></span><span className="lp-node-type">{t('pulse.map')}</span></div>
          <svg className="lp-map" viewBox="0 0 216 96" preserveAspectRatio="xMidYMid slice">
            <path className="lp-land" d="M0 20L38 8L84 16L118 6L170 14L216 4V96H0Z" /><path className="lp-land lp-land--2" d="M120 96L132 60L168 48L216 52V96Z" />
            <path className="lp-river" d="M0 66C40 60 70 80 110 70S180 60 216 76" />
            {MARKERS.slice(0, markers).map(([x, y], i) => <g key={i} className="lp-marker" transform={`translate(${x} ${y})`}><circle r="8" className="lp-marker-ring" /><circle r="3.5" /></g>)}
          </svg>
        </div>

        <div className="lp-node lp-out lp-node--o3" style={{ left: NODES.o3.x, top: NODES.o3.y, width: NODES.o3.w, height: NODES.o3.h, '--cat': 'var(--brand-slate)', '--cx': `${pull('o3').x}px`, '--cy': `${pull('o3').y}px` } as CSSProperties}>
          <div className="lp-node-top"><span className="lp-glyph"><Icon name="share" size={12} /></span><span className="lp-node-type">{t('pulse.workflow')}</span></div>
          <ol className="lp-flow">
            {FLOW_STEPS.map((s, i) => <li key={s} className={i < flow - 1 ? 'is-done' : i === flow - 1 ? 'is-run' : ''}><i>{i < flow - 1 ? <Icon name="check" size={12} /> : null}</i><span>{t(s)}</span></li>)}
          </ol>
        </div>

        <div className="lp-live"><span className="lp-tag">{t('common.live')}</span><span>{mode === 'connected' ? t('pulse.connectedWorkspace') : t('pulse.liveWorkspace')}</span><time>{stamp && t('pulse.updated', { time: stamp })}</time></div>
      </div>
      <Chain className="lp-chain--pane" />
    </div>
  );
}
