import {
  Button as AriaButton, DialogTrigger,
  Dialog as AriaDialog, Heading, Menu as AriaMenu, MenuItem, MenuTrigger, Modal, ModalOverlay, Popover, Separator,
  Tab, TabList, TabPanel, Tabs as AriaTabs, type Key,
} from 'react-aria-components';
import type { ReactElement, ReactNode } from 'react';
import { IconButton } from './Button';
import { Icon, type IconName } from './Icon';

export type MenuEntry = { id: string; label: string; icon?: IconName; shortcut?: string; danger?: boolean; disabledReason?: string; onAction: () => void } | 'separator';
export interface MenuProps { trigger: ReactElement; items: MenuEntry[]; title?: string }
/** Menu de comandos (menu do widget, de contexto, dropdown). Desabilitado continua listado, com motivo no tooltip. */
export function Menu({ trigger, items, title }: MenuProps) {
  const disabled = items.filter((i): i is Exclude<MenuEntry, 'separator'> => i !== 'separator' && !!i.disabledReason).map((i) => i.id);
  return (
    <MenuTrigger>
      {trigger}
      <Popover className="bw-menu" placement="bottom end" offset={4}>
        <AriaMenu aria-label={title ?? 'Ações'} disabledKeys={disabled} onAction={(k) => { const it = items.find((i) => i !== 'separator' && i.id === k); if (it && it !== 'separator') it.onAction(); }}>
          {items.map((it, i) => it === 'separator'
            ? <Separator key={`sep-${i}`} className="bw-menu-sep" />
            : <MenuItem key={it.id} id={it.id} textValue={it.label} className={`bw-menu-item${it.danger ? ' bw-menu-item--danger' : ''}`}>
                <span title={it.disabledReason} style={{ display: 'contents' }}>{it.icon && <Icon name={it.icon} />}{it.label}{it.shortcut && <span className="bw-kbd">{it.shortcut}</span>}</span>
              </MenuItem>)}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

export interface TabsProps<K extends Key> { label: string; tabs: { id: K; label: string; count?: number; panel: ReactNode }[]; selected?: K; onChange?: (k: K) => void }
/** Abas sublinhadas dentro de um painel (no máximo 4). Páginas do dashboard usam PageTabs. */
export function Tabs<K extends Key>({ label, tabs, selected, onChange }: TabsProps<K>) {
  return (
    <AriaTabs {...(selected !== undefined ? { selectedKey: selected } : {})} onSelectionChange={(k) => onChange?.(k as K)}>
      <TabList aria-label={label} className="bw-tabs">
        {tabs.map((t) => <Tab key={String(t.id)} id={t.id} className="bw-tab">{t.label}{t.count != null && <span className="bw-count">{t.count}</span>}</Tab>)}
      </TabList>
      {tabs.map((t) => <TabPanel key={String(t.id)} id={t.id}>{t.panel}</TabPanel>)}
    </AriaTabs>
  );
}

export interface DialogProps { title: string; isOpen: boolean; onOpenChange: (open: boolean) => void; children: ReactNode; footer: ReactNode }
/** Só para confirmar decisões irreversíveis (publicar, excluir). Configuração vive no Inspector. */
export function Dialog({ title, isOpen, onOpenChange, children, footer }: DialogProps) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="bw-modal-overlay">
      <Modal>
        <AriaDialog className="bw-dialog">
          {({ close }) => (
            <>
              <div className="bw-dialog-head"><Heading slot="title" className="bw-panel-title">{title}</Heading><IconButton icon="close" label="Fechar" onPress={close} /></div>
              <div className="bw-dialog-body">{children}</div>
              <div className="bw-dialog-foot">{footer}</div>
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Botão de ícone que abre um popover não modal (preferências, seletor de cor, seletor de visualização). */
export function PopoverButton({ label, icon, children, className = 'bw-iconbtn', placement = 'bottom end' }: { label: string; icon: IconName; children: ReactNode; className?: string; placement?: 'bottom end' | 'right bottom' | 'bottom start' }) {
  return (
    <DialogTrigger>
      <AriaButton aria-label={label} className={className}><Icon name={icon} size={className.includes('rail') ? 20 : 16} /></AriaButton>
      <Popover placement={placement} offset={6}>
        <AriaDialog aria-label={label} style={{ outline: 'none' }}>{children}</AriaDialog>
      </Popover>
    </DialogTrigger>
  );
}
