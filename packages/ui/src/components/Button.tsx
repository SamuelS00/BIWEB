import { Button as AriaButton, type ButtonProps as AriaButtonProps, Tooltip, TooltipTrigger, ToggleButton, ToggleButtonGroup, type Key } from 'react-aria-components';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  /** primary: uma por região (Aplicar, Publicar). ghost: baixa ênfase em toolbars. danger: destrutivo, sempre com confirmação. */
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  /** sm = 24 px, md = 28 px (padrão), lg = 32 px (barra superior e Cancelar/Aplicar). */
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  children: ReactNode;
  className?: string;
}
/** Botão de texto. O rótulo é um verbo no infinitivo ("Aplicar", "Adicionar filtro"). */
export function Button({ variant = 'default', size = 'md', icon, children, className, ...rest }: ButtonProps) {
  return (
    <AriaButton {...rest} className={cx('bw-btn', variant !== 'default' && `bw-btn--${variant}`, size !== 'md' && `bw-btn--${size}`, className)}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </AriaButton>
  );
}

export interface IconButtonProps extends Omit<AriaButtonProps, 'className' | 'children'> {
  icon: IconName;
  /** Nome acessível e texto do tooltip. Obrigatório. */
  label: string;
  /** Atalho exibido no tooltip, ex.: "⌘Z". */
  shortcut?: string;
  size?: 'sm' | 'md';
  className?: string;
}
/** Botão só com ícone; sempre com tooltip (também em foco de teclado). */
export function IconButton({ icon, label, shortcut, size = 'md', className, ...rest }: IconButtonProps) {
  return (
    <TooltipTrigger delay={500}>
      <AriaButton {...rest} aria-label={label} className={cx('bw-iconbtn', size === 'sm' && 'bw-iconbtn--sm', className)}>
        <Icon name={icon} />
      </AriaButton>
      <Tooltip className="bw-tooltip" offset={6}>{shortcut ? `${label} · ${shortcut}` : label}</Tooltip>
    </TooltipTrigger>
  );
}

export interface SegmentedControlProps<K extends Key> {
  /** Nome acessível do grupo. */
  label: string;
  options: { id: K; label: string; disabledReason?: string }[];
  value: K;
  onChange: (value: K) => void;
}
/** Escolha exclusiva entre 2–5 opções curtas (ex.: Grade · Pilha · Livre · Abas). */
export function SegmentedControl<K extends Key>({ label, options, value, onChange }: SegmentedControlProps<K>) {
  return (
    <ToggleButtonGroup aria-label={label} className="bw-seg" selectionMode="single" disallowEmptySelection
      selectedKeys={[value]} onSelectionChange={(keys) => { const k = [...keys][0]; if (k !== undefined) onChange(k as K); }}>
      {options.map((o) => (
        <ToggleButton key={String(o.id)} id={o.id} isDisabled={!!o.disabledReason}>
          <span title={o.disabledReason}>{o.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
