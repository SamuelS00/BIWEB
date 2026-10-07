import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/** Selo de estado curto. Sempre palavra ou ícone além da cor. */
export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return <span className={`bw-badge${tone !== 'neutral' ? ` bw-badge--${tone}` : ''}`}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}
export function Counter({ value, label }: { value: number; label?: string }) {
  return <span className="bw-counter" aria-label={label}>{value}</span>;
}

/** Aviso persistente no topo de uma área. Plano, sem sombra. */
export function Banner({ tone = 'info', children, action, onDismiss }: { tone?: 'info' | 'success' | 'warning' | 'danger'; children: ReactNode; action?: ReactNode; onDismiss?: () => void }) {
  const icon: IconName = tone === 'warning' || tone === 'danger' ? 'warning' : tone === 'success' ? 'check' : 'info';
  return (
    <div className={`bw-banner bw-banner--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={icon} className="bw-ico" />
      <span className="bw-msg">{children}</span>
      {action}
      {onDismiss && <button className="bw-iconbtn bw-iconbtn--sm" aria-label="Dispensar" onClick={onDismiss}><Icon name="close" size={12} /></button>}
    </div>
  );
}

/** Estado vazio acionável: título, uma frase e 2–4 ações com atalho. Sem ilustração. */
export function EmptyState({ title, description, actions }: { title: string; description: string; actions: { label: string; icon?: IconName; shortcut?: string; onAction: () => void }[] }) {
  return (
    <div className="bw-empty">
      <span className="bw-empty-title">{title}</span>
      <span className="bw-secondary">{description}</span>
      <div className="bw-empty-actions">
        {actions.map((a) => (
          <button key={a.label} type="button" className="bw-empty-action" onClick={a.onAction} style={{ background: 'none', border: 0, borderBottom: '1px solid var(--border-subtle)', font: 'inherit', textAlign: 'left' }}>
            {a.icon && <Icon name={a.icon} />}{a.label}{a.shortcut && <span className="bw-kbd">{a.shortcut}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export type FieldKind = 'dimension' | 'date' | 'geo' | 'measure' | 'metric' | 'calc' | 'hierarchy';
const FT: Record<FieldKind, { cls: string; glyph: ReactNode; label: string }> = {
  dimension: { cls: 'dimension', glyph: 'Aa', label: 'Dimensão' },
  date: { cls: 'dimension', glyph: <Icon name="calendar" size={12} />, label: 'Data' },
  geo: { cls: 'geo', glyph: <Icon name="pin" size={12} />, label: 'Geográfica' },
  measure: { cls: 'measure', glyph: 'Σ', label: 'Medida' },
  metric: { cls: 'metric', glyph: '◆', label: 'Métrica' },
  calc: { cls: 'calc', glyph: 'fx', label: 'Campo calculado' },
  hierarchy: { cls: 'calc', glyph: '⋮⋮', label: 'Hierarquia' },
};
/** Glifo de tipo de campo com cor `field-*`. A cor nunca é o único sinal. */
export function FieldTypeIcon({ kind }: { kind: FieldKind }) {
  const f = FT[kind];
  return <span className={`bw-ft bw-ft--${f.cls}`} role="img" aria-label={f.label}>{f.glyph}</span>;
}

/** Campo atribuído a um slot (FieldWell). Métricas não têm agregação livre: o menu traz só modificadores. */
export function FieldChip({ kind, name, modifier, onRemove, menu }: { kind: FieldKind; name: string; modifier?: string; onRemove?: () => void; menu?: ReactNode }) {
  return (
    <div className="bw-chip" tabIndex={0}>
      <FieldTypeIcon kind={kind} />
      <span className="bw-name">{name}</span>
      {modifier && <span className="bw-mod">{modifier}</span>}
      {menu}
      {onRemove && <button type="button" className="bw-iconbtn bw-iconbtn--sm" aria-label={`Remover ${name}`} onClick={onRemove}><Icon name="close" size={12} /></button>}
    </div>
  );
}

/** Slot por papel (encoding). Vazio = tracejado com instrução. */
export function FieldWell({ label, optional, hint, children }: { label: string; optional?: boolean; hint: string; children?: ReactNode }) {
  return (
    <div className="bw-well">
      <div className="bw-well-head"><span className="bw-label">{label}</span>{optional && <span className="bw-cap bw-muted">opcional</span>}</div>
      <div className="bw-slot">{children ?? <div className="bw-slot-empty">{hint}</div>}</div>
    </div>
  );
}

const AVATAR_TONES = ['brand-navy', 'brand-ink'];
/** Iniciais de uma pessoa. A cor é estável por nome; o nome completo vai no title. */
export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span title={name} aria-label={name} role="img" style={{ width: size, height: size, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', flex: 'none',
      background: `var(--${tone})`, color: 'var(--brand-mist)', font: `600 ${size <= 20 ? 9 : size === 24 ? 10 : 12}px/1 var(--font-sans)` }}>{initials}</span>
  );
}
/** Bloco de carregamento com o formato do conteúdo. */
export function Skeleton({ width = '100%', height = 12, radius }: { width?: number | string; height?: number | string; radius?: number }) {
  return <span className="bw-skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius }} />;
}
