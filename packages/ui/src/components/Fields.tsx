import {
  Checkbox as AriaCheckbox, FieldError, Group, Input, Label, ListBox, ListBoxItem, NumberField as AriaNumberField, Popover,
  Select as AriaSelect, SelectValue, Switch as AriaSwitch, Text, TextField as AriaTextField, Button as AriaButton, type Key,
} from 'react-aria-components';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface FieldBase { label: string; description?: string; errorMessage?: string; isDisabled?: boolean; className?: string }

export interface TextFieldProps extends FieldBase { value?: string; defaultValue?: string; onChange?: (v: string) => void; placeholder?: string; icon?: IconName; quiet?: boolean; mono?: boolean; hideLabel?: boolean }
/** Campo de texto de 28 px. `quiet` (sem borda em repouso) só dentro do Inspector. */
export function TextField({ label, description, errorMessage, icon, quiet, mono, hideLabel, placeholder, className, ...rest }: TextFieldProps) {
  return (
    <AriaTextField {...rest} isInvalid={!!errorMessage} className={['bw-field', className].filter(Boolean).join(' ')}>
      <Label className={hideLabel ? 'sr-only' : 'bw-label'}>{label}</Label>
      <Group className={`bw-input${quiet ? ' bw-input--quiet' : ''}`}>
        {icon && <Icon name={icon} size={12} />}
        <Input placeholder={placeholder} className={mono ? 'bw-mono' : undefined} />
      </Group>
      {description && !errorMessage && <Text slot="description">{description}</Text>}
      <FieldError className="bw-field-error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}

export interface NumberFieldProps extends FieldBase { value?: number; defaultValue?: number; onChange?: (v: number) => void; prefix?: string; unit?: string; minValue?: number; maxValue?: number; step?: number; quiet?: boolean; hideLabel?: boolean }
/** Numérico com prefixo (L, A, X) e unidade (px, col, %). Setas alteram 1; Shift altera 10 (React Aria). */
export function NumberField({ label, description, errorMessage, prefix, unit, quiet, hideLabel, className, ...rest }: NumberFieldProps) {
  return (
    <AriaNumberField {...rest} isInvalid={!!errorMessage} className={['bw-field', className].filter(Boolean).join(' ')}>
      <Label className={hideLabel ? 'sr-only' : 'bw-label'}>{label}</Label>
      <Group className={`bw-input${quiet ? ' bw-input--quiet' : ''}`}>
        {prefix && <span className="bw-prefix" aria-hidden="true">{prefix}</span>}
        <Input />
        {unit && <span className="bw-unit">{unit}</span>}
      </Group>
      {description && !errorMessage && <Text slot="description">{description}</Text>}
      <FieldError className="bw-field-error">{errorMessage}</FieldError>
    </AriaNumberField>
  );
}

export interface SelectProps<K extends Key> extends FieldBase { options: { id: K; label: string; swatch?: string }[]; value?: K; onChange?: (v: K) => void; placeholder?: string; hideLabel?: boolean }
/** Lista de opções em popover. Para cor, use `swatch` (nome do token) junto com o nome da cor. */
export function Select<K extends Key>({ label, options, value, onChange, placeholder, description, isDisabled, hideLabel, className }: SelectProps<K>) {
  const sw = (s?: string) => s ? <span className="bw-swatch" style={{ background: `var(--${s})` }} /> : null;
  return (
    <AriaSelect className={['bw-field', className].filter(Boolean).join(' ')} {...(value !== undefined ? { selectedKey: value } : {})} placeholder={placeholder ?? 'Escolher'}
      isDisabled={isDisabled} onSelectionChange={(k) => k != null && onChange?.(k as K)}>
      <Label className={hideLabel ? 'sr-only' : 'bw-label'}>{label}</Label>
      <AriaButton className="bw-select">
        <SelectValue<{ id: K; label: string; swatch?: string }>>{({ selectedItem, defaultChildren }) => selectedItem ? <span className="bw-row" style={{ gap: 6, flexWrap: 'nowrap' }}>{sw(selectedItem.swatch)}{selectedItem.label}</span> : <span className="bw-muted">{defaultChildren}</span>}</SelectValue>
        <Icon name="chevronDown" size={12} />
      </AriaButton>
      {description && <Text slot="description">{description}</Text>}
      <Popover className="bw-menu" offset={4}>
        <ListBox className="bw-listbox" items={options}>
          {(o) => <ListBoxItem id={o.id} textValue={o.label} className="bw-menu-item">{sw(o.swatch)}{o.label}</ListBoxItem>}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export interface ToggleProps { children: ReactNode; isSelected?: boolean; defaultSelected?: boolean; onChange?: (v: boolean) => void; isDisabled?: boolean; isIndeterminate?: boolean; 'aria-label'?: string; title?: string }
/** Liga/desliga com efeito imediato. Ligado = `accent`; desligado = contorno `border-control`. */
export function Switch({ children, ...rest }: ToggleProps) {
  return <AriaSwitch {...rest} className="bw-switch-field"><span className="bw-switch" aria-hidden="true" />{children}</AriaSwitch>;
}
/** Marca opções independentes; aceita estado indeterminado. */
export function Checkbox({ children, ...rest }: ToggleProps) {
  return (
    <AriaCheckbox {...rest} className="bw-check-field">
      {({ isSelected, isIndeterminate }) => (
        <>
          <span className="bw-checkbox" aria-hidden="true">
            {isIndeterminate ? <svg viewBox="0 0 10 10"><path d="M2 5h6" /></svg> : isSelected ? <svg viewBox="0 0 10 10"><path d="M1.5 5.2l2.3 2.3L8.5 2.8" /></svg> : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}
