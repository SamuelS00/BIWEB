import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Icon, type IconName, type Tone } from '@biweb/ui';
import type { Fresh, Health } from './registry';
import { FRESH_LABEL, HEALTH_LABEL } from './registry';
import { AVAIL_LABEL, type Avail } from './connectors';
import { CHANGE_LABEL, RUN_LABEL, type ChangeStatus, type RunStatus } from './ops';

/** Navegação interna do workspace: /data/<seção>[/<id>]. */
export function useGo() {
  const navigate = useNavigate();
  return (path: string) => {
    if (path.startsWith('/data') || path.startsWith('/reports') || path.startsWith('/maps') || path.startsWith('/workflows')) navigate({ to: path as '/' });
  };
}

export const pct = (n: number, d = 1) => `${n.toFixed(d).replace('.', ',')}%`;
export const toneOfQuality = (q: number): Tone => (q >= 97 ? 'success' : q >= 93 ? 'warning' : 'danger');

export function Dot({ tone = 'neutral', live }: { tone?: Tone | 'live'; live?: boolean }) { return <i className={`dw-dot is-${tone}${live ? ' is-pulse' : ''}`} aria-hidden="true" />; }

export function HealthBadge({ h }: { h: Health }) { return <Badge tone={h === 'healthy' ? 'success' : h === 'warning' ? 'warning' : 'danger'} icon={h === 'healthy' ? 'check' : 'warning'}>{HEALTH_LABEL[h]}</Badge>; }
export function FreshBadge({ f }: { f: Fresh }) { return f === 'live' ? <span className="dw-live"><Dot tone="live" live />Ao vivo</span> : <Badge tone={f === 'fresh' ? 'success' : 'warning'} icon={f === 'fresh' ? 'clock' : 'warning'}>{FRESH_LABEL[f]}</Badge>; }
export function AvailBadge({ a }: { a: Avail }) { return <Badge tone={a === 'available' ? 'success' : a === 'prepared' ? 'accent' : 'neutral'}>{AVAIL_LABEL[a]}</Badge>; }
export function ChangeBadge({ s }: { s: ChangeStatus }) { return <Badge tone={s === 'applied' ? 'success' : s === 'approved' ? 'accent' : s === 'rejected' ? 'danger' : s === 'proposed' ? 'warning' : 'neutral'}>{CHANGE_LABEL[s]}</Badge>; }
export function RunBadge({ s }: { s: RunStatus }) { return <Badge tone={s === 'completed' ? 'success' : s === 'failed' ? 'danger' : s === 'running' ? 'accent' : s === 'interrupted' || s === 'paused' ? 'warning' : 'neutral'} icon={s === 'completed' ? 'check' : s === 'failed' ? 'warning' : undefined}>{RUN_LABEL[s]}</Badge>; }
export function RiskBadge({ r }: { r: string }) { const t: Tone = r === 'Breaking' || r === 'Alto' ? 'danger' : r === 'Compatível' || r === 'Médio' ? 'warning' : 'success'; return <Badge tone={t}>{r}</Badge>; }
export function ClassBadge({ c }: { c: 'ADDITIVE' | 'COMPATIBLE' | 'BREAKING' }) { return <Badge tone={c === 'BREAKING' ? 'danger' : c === 'COMPATIBLE' ? 'warning' : 'success'}>{c === 'ADDITIVE' ? 'Aditivo' : c === 'COMPATIBLE' ? 'Compatível' : 'Breaking'}</Badge>; }
export function ConfBadge({ v }: { v: number }) { return <span className={`dw-conf ${v >= 95 ? 'is-hi' : v >= 85 ? 'is-mid' : 'is-lo'}`} title={`Confiança ${v}%`}><span className="dw-conf-t" aria-hidden="true"><i style={{ width: `${v}%` }} /></span><b className="bw-num">{v}%</b></span>; }

/** Histograma compacto. Rótulos de eixo só no primeiro/último. */
export function Hist({ data, h = 56, tone = 'accent' }: { data: { label: string; v: number }[]; h?: number; tone?: 'accent' | 'warning' }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="dw-hist" role="img" aria-label={`Distribuição: ${data.map((d) => `${d.label} ${d.v}`).join(', ')}`}>
      <div className="dw-hist-bars" style={{ height: h }}>{data.map((d, i) => <i key={i} className={`is-${tone}`} style={{ height: `${Math.max(3, (d.v / max) * 100)}%` }} title={`${d.label}: ${d.v}`} />)}</div>
      <div className="dw-hist-ax"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </div>
  );
}
export function Spark({ data, w = 120, h = 28 }: { data: number[]; w?: number; h?: number }) {
  const max = Math.max(1, ...data), step = w / Math.max(1, data.length);
  return <svg className="dw-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Volume por execução">{data.map((v, i) => <rect key={i} x={i * step + 1} width={Math.max(2, step - 2)} y={h - (v / max) * (h - 2) - 1} height={(v / max) * (h - 2) + 1} rx={1} />)}</svg>;
}
export function Meter({ v, tone }: { v: number; tone?: Tone }) { return <span className={`dw-meter is-${tone ?? toneOfQuality(v)}`} role="img" aria-label={`${v}%`}><i style={{ width: `${v}%` }} /></span>; }

export function Tabs2<K extends string>({ tabs, value, onChange, label }: { tabs: { id: K; label: string; n?: number | string; icon?: IconName }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div className="dw-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => <button key={t.id} type="button" role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)}>{t.icon && <Icon name={t.icon} size={12} />}{t.label}{t.n !== undefined && <em className="bw-num">{t.n}</em>}</button>)}
    </div>
  );
}

export function Kv({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) { return <div className="dw-kv"><span>{k}</span><b className={mono ? 'bw-mono' : undefined}>{v}</b></div>; }
export function Section({ title, hint, actions, children, className }: { title: string; hint?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`dw-sec ${className ?? ''}`}><header className="dw-sec-h"><h3>{title}</h3>{hint && <span className="dw-muted">{hint}</span>}<span className="flex-1" />{actions}</header>{children}</section>;
}
export function ViewHead({ title, sub, actions, children }: { title: string; sub?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return <header className="dw-vh"><div className="dw-vh-t"><h2>{title}</h2>{sub && <p>{sub}</p>}</div><span className="flex-1" />{actions}{children}</header>;
}
export function Search({ value, onChange, placeholder, label, w }: { value: string; onChange: (v: string) => void; placeholder: string; label?: string; w?: number }) {
  return <label className="dw-search" style={w ? { width: w } : undefined}><Icon name="search" size={12} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label ?? placeholder} />{value && <button type="button" aria-label="Limpar busca" onClick={() => onChange('')}><Icon name="close" size={12} /></button>}</label>;
}
export function Chip({ on, onClick, children, n }: { on?: boolean; onClick: () => void; children: ReactNode; n?: number }) { return <button type="button" className={`dw-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onClick}>{children}{n !== undefined && <em className="bw-num">{n}</em>}</button>; }

/** Lista de passos com ✓ ◌ ○ — usada em descoberta, análise e re-análise. Avança sozinha; `onDone` quando termina. */
export function useSteps(total: number, ms: number, run: boolean, onDone?: () => void) {
  const [i, setI] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => { if (!run) { setI(0); return; } if (i >= total) { done.current?.(); return; } const t = setTimeout(() => setI((x) => x + 1), ms); return () => clearTimeout(t); }, [i, run, total, ms]);
  return i;
}
export function StepList({ steps, at, sub }: { steps: string[]; at: number; sub?: Record<number, string> }) {
  return (
    <ul className="dw-steps" aria-live="polite">
      {steps.map((s, i) => <li key={s} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}><span aria-hidden="true">{i < at ? '✓' : i === at ? '◌' : '○'}</span>{s}{i === at && sub?.[i] ? <em>{sub[i]}</em> : null}</li>)}
    </ul>
  );
}
/** Contador que sobe suavemente até o alvo (respeita reduced motion). */
export function useTicker(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    const t0 = performance.now(); let raf = 0;
    const f = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
export function Empty({ icon = 'data', title, text, action }: { icon?: IconName; title: string; text: string; action?: ReactNode }) {
  return <div className="dw-empty"><Icon name={icon} size={20} /><b>{title}</b><p>{text}</p>{action}</div>;
}
export function Pill({ children, tone }: { children: ReactNode; tone?: 'pii' | 'sem' | 'key' | 'concept' }) { return <span className={`dw-pill${tone ? ` is-${tone}` : ''}`}>{children}</span>; }
export function Banner2({ children }: { children: ReactNode }) { return <p className="dw-note"><Icon name="info" size={12} />{children}</p>; }
