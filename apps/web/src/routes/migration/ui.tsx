import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, Icon } from '@biweb/ui';
import type { IconName } from '@biweb/ui';
import { BUILDER_PATH } from './analysis';
import { COMPAT, PHASES, PLATFORMS, STRATEGIES, TARGET_BUILDER, compatLabel, compatTone, phaseIndex } from './model';
import type { Builder, Compat, Phase, PlatformId, Strategy, TabId } from './model';

/** Cores de marca das ferramentas: única exceção à regra de tokens, autorizada para identificar os conectores. */
const BRAND: Record<PlatformId, string> = { powerbi: '#F2C811', tableau: '#4E79A7', qlik: '#2BAA4A', looker: '#8B6CF0', thoughtspot: '#3D8BFD', domo: '#5FA8E0' };
/** Glifos simplificados de cada ferramenta, coloridos pela marca. */
const GLYPH: Record<PlatformId, React.ReactNode> = {
  powerbi: <><rect x="4" y="12" width="4.5" height="8" rx="1.2" /><rect x="9.75" y="7" width="4.5" height="13" rx="1.2" /><rect x="15.5" y="3" width="4.5" height="17" rx="1.2" /></>,
  tableau: <path d="M11 3h2v3.5h3.5v2H13V12h3.5v-1.5h2V12H22v2h-3.5v1.5h-2V14H13v3.5h-2V14H7.5v1.5h-2V14H2v-2h3.5v-1.5h2V12H11V8.5H7.5v-2H11zM11 17.5h2V21h-2z" />,
  qlik: <><circle cx="11" cy="11" r="6.5" fill="none" strokeWidth="3" /><path d="M13.5 13.5L19.5 19.5" strokeWidth="3.2" strokeLinecap="round" /></>,
  looker: <><circle cx="12" cy="12" r="7.5" fill="none" strokeWidth="3" /><circle cx="12" cy="12" r="2" /></>,
  thoughtspot: <path d="M5 4h14v3.6h-5.2V20h-3.6V7.6H5z" />,
  domo: <><circle cx="12" cy="12" r="8" fill="none" strokeWidth="3" /><rect x="14.6" y="3.5" width="2.8" height="13" rx="1.2" /></>,
};
export function PlatformMark({ id, size = 28 }: { id: PlatformId; size?: number }) {
  const p = PLATFORMS.find((x) => x.id === id)!;
  return <span className="ms-plat" style={{ width: size, height: size }} role="img" aria-label={p.name} title={p.name}>
    <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="currentColor" stroke="currentColor" strokeWidth="0" style={{ color: BRAND[id] }} aria-hidden="true">{GLYPH[id]}</svg></span>;
}
export const CompatBadge = ({ c }: { c: Compat }) => <Badge tone={compatTone(c)}>{compatLabel(c)}</Badge>;
export function StrategyChip({ s, from }: { s: Strategy; from?: string }) {
  const d = STRATEGIES.find((x) => x.id === s)!;
  return <span className={`ms-strat is-${s}`} title={from ? `${d.desc} (definida em ${from})` : d.desc}><i />{d.label}</span>;
}

/** Barra empilhada: nativo · equivalente · redesenhar · revisão. Cresce ao montar. */
export function MixBar({ mix, height = 8 }: { mix: { native: number; equivalent: number; redesign: number; review: number }; height?: number }) {
  const total = mix.native + mix.equivalent + mix.redesign + mix.review || 1;
  return <div className="ms-mix" style={{ height }} role="img" aria-label={`${mix.native}% nativo, ${mix.equivalent}% equivalente, ${mix.redesign}% redesenhar, ${mix.review}% revisão`}>
    {(['native', 'equivalent', 'redesign', 'review'] as const).map((k, i) => mix[k] > 0 && <span key={k} className={`is-${k}`} style={{ flexGrow: mix[k] / total * 100, animationDelay: `${i * 90}ms` }} />)}
  </div>;
}
export const MixLegend = ({ mix, pct = true }: { mix: { native: number; equivalent: number; redesign: number; review: number }; pct?: boolean }) => <ul className="ms-legend">
  {COMPAT.slice(0, 4).map((c) => <li key={c.id}><i className={`is-${c.id}`} /><b>{mix[c.id as 'native']}{pct ? '%' : ''}</b>{c.label}</li>)}
</ul>;

export function Progress({ value, tone }: { value: number; tone?: 'success' | 'accent' }) {
  return <span className={`ms-prog${tone ? ` is-${tone}` : ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${value}%` }} /></span>;
}

/** Abre o Builder existente (nunca recria um editor dentro do Migration Studio). */
export function OpenIn({ builder, refId, size = 'sm', variant = 'default', label }: { builder: Builder; refId: string; size?: 'sm' | 'md'; variant?: 'default' | 'primary' | 'ghost'; label?: string }) {
  const navigate = useNavigate();
  const b = TARGET_BUILDER[builder], p = BUILDER_PATH(builder, refId);
  const icon: IconName = builder === 'report' ? 'report' : builder === 'map' ? 'pin' : builder === 'workflow' ? 'share' : 'data';
  return <Button size={size} variant={variant} icon={icon} onPress={() => { void navigate({ to: p.to, params: p.params } as never); }}>{label ?? b.open}</Button>;
}

export function Section({ title, hint, actions, children, className }: { title: string; hint?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`ms-sec ${className ?? ''}`}><header><h3>{title}</h3>{hint && <small>{hint}</small>}<span className="flex-1" />{actions}</header>{children}</section>;
}
export const Conf = ({ n }: { n: number }) => <span className={`ms-conf ${n >= 85 ? 'is-hi' : n >= 65 ? 'is-mid' : 'is-lo'}`} title={`Confiança ${n}%`}><i style={{ width: `${n}%` }} /><b>{n}%</b></span>;
export const Evidence = ({ items }: { items: string[] }) => <ul className="ms-evidence">{items.map((e, i) => <li key={i}><Icon name="check" size={12} />{e}</li>)}</ul>;
export const nf = (n: number) => n.toLocaleString('pt-BR');

export const PHASE_TAB: Record<Phase, TabId> = { source: 'overview', understand: 'inventory', blueprint: 'blueprint', reconstruct: 'reconstruct', validate: 'validation', publish: 'publish' };
/** Trilha de fluxo: SOURCE → UNDERSTAND → BLUEPRINT → RECONSTRUCT → VALIDATE → PUBLISH. */
export function Pipeline({ phase, onGo, compact }: { phase: Phase; onGo?: (t: TabId) => void; compact?: boolean }) {
  const cur = phaseIndex(phase);
  return <ol className={`ms-pipe${compact ? ' is-compact' : ''}`} aria-label="Etapa da migração">
    {PHASES.map((p, i) => <li key={p.id} className={i < cur ? 'is-done' : i === cur ? 'is-now' : ''}>
      <button type="button" onClick={() => onGo?.(PHASE_TAB[p.id])} aria-current={i === cur ? 'step' : undefined}>
        <span className="ms-pipe-dot">{i < cur ? <Icon name="check" size={12} /> : i + 1}</span><span><b>{p.label}</b>{!compact && <small>{p.sub}</small>}</span></button>
      {i < PHASES.length - 1 && <i className="ms-pipe-line" />}
    </li>)}
  </ol>;
}

