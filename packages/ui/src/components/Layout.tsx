import { useState, type ReactNode } from 'react';
import { Collection, Tree, TreeItem, TreeItemContent, Button as AriaButton, type Key, type Selection } from 'react-aria-components';
import { Icon, type IconName } from './Icon';

/** Painel docked (Dados, Formato, Estrutura, Assistente). O cabeçalho sempre nomeia o objeto editado. */
export function Panel({ title, subtitle, actions, children, width, label }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; width?: number; label?: string }) {
  return (
    <aside className="bw-panel" aria-label={label ?? title} style={{ width, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="bw-panel-head"><span className="bw-panel-title">{title}{subtitle && <span className="bw-panel-sub"> · {subtitle}</span>}</span>{actions}</div>
      <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>{children}</div>
    </aside>
  );
}

/** Seção do Inspector separada por filete. Recolhida, mostra resumo ou contador. */
export function PropertySection({ label, defaultOpen = true, summary, trailing, children }: { label: string; defaultOpen?: boolean; summary?: ReactNode; trailing?: ReactNode; children?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bw-section" data-collapsed={open ? undefined : ''}>
      <div className="bw-section-head">
        <button type="button" className="bw-iconbtn bw-iconbtn--sm" aria-expanded={open} aria-label={`${open ? 'Recolher' : 'Expandir'} ${label}`} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
        </button>
        <span className="bw-label">{label}</span>
        {!open && summary && <span className="bw-summary">{summary}</span>}
        {trailing}
      </div>
      {open && children}
    </div>
  );
}
/** Linha de propriedade de 28 px: rótulo à esquerda, controle à direita. */
export function PropertyRow({ label, disabledReason, children }: { label: string; disabledReason?: string; children: ReactNode }) {
  return <div className="bw-prop" data-disabled={disabledReason ? '' : undefined} title={disabledReason}><span className="bw-label">{label}</span>{children}</div>;
}

export interface TreeNode { id: string; label: ReactNode; textValue: string; icon?: ReactNode; trailing?: ReactNode; children?: TreeNode[] }
/** Árvore acessível (React Aria Tree): DatasetTree, Estrutura (Outline), camadas de mapa. */
export function TreeView({ label, items, selected, onSelect, defaultExpanded }: { label: string; items: TreeNode[]; selected?: Key[]; onSelect?: (keys: Key[]) => void; defaultExpanded?: Key[] }) {
  const render = (n: TreeNode): ReactNode => (
    <TreeItem id={n.id} textValue={n.textValue} className="bw-tree-item" style={{ paddingLeft: 0 }}>
      <TreeItemContent>
        {({ level }) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', paddingLeft: `calc(var(--space-2) + ${level - 1} * var(--space-4))` }}>
            <AriaButton slot="chevron" className="bw-chev-btn" aria-label="Expandir"><Icon name="chevronRight" size={12} /></AriaButton>
            {n.icon}<span className="bw-name">{n.label}</span>{n.trailing}
          </span>
        )}
      </TreeItemContent>
      {n.children && <Collection items={n.children}>{render}</Collection>}
    </TreeItem>
  );
  return (
    <Tree aria-label={label} items={items} className="bw-tree" selectionMode={onSelect ? 'single' : 'none'}
      {...(selected ? { selectedKeys: selected } : {})} defaultExpandedKeys={defaultExpanded}
      onSelectionChange={(s: Selection) => onSelect?.(s === 'all' ? [] : [...s])}>
      {render}
    </Tree>
  );
}

/** Rail de áreas (48 px). Áreas sem permissão não aparecem; em embed, o rail não existe. */
export function ViewRail({ items, current, onNavigate, footer }: { items: { id: string; label: string; icon: IconName; disabledReason?: string }[]; current?: string; onNavigate: (id: string) => void; footer?: ReactNode }) {
  return (
    <nav className="bw-rail" aria-label="Áreas">
      {items.map((it) => (
        <button key={it.id} type="button" className="bw-rail-btn" aria-label={it.label} title={it.disabledReason ?? it.label} aria-current={current === it.id ? 'page' : undefined}
          aria-disabled={it.disabledReason ? true : undefined} onClick={() => !it.disabledReason && onNavigate(it.id)} style={it.disabledReason ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}>
          <Icon name={it.icon} size={20} />
        </button>
      ))}
      <span style={{ flex: 1 }} />
      {footer}
    </nav>
  );
}

/** Barra de status de 24 px do Builder. */
export function StatusBar({ children }: { children: ReactNode }) {
  return <div className="bw-statusbar" role="status">{children}</div>;
}
/** Abas das páginas do dashboard no rodapé do canvas. */
export function PageTabs({ pages, current, onSelect, onAdd }: { pages: { id: string; label: string }[]; current: string; onSelect: (id: string) => void; onAdd?: () => void }) {
  return (
    <div className="bw-pagetabs" role="tablist" aria-label="Páginas">
      {pages.map((p) => <button key={p.id} type="button" role="tab" className="bw-pagetab" aria-selected={p.id === current} onClick={() => onSelect(p.id)}>{p.label}</button>)}
      {onAdd && <button type="button" className="bw-iconbtn bw-iconbtn--sm" style={{ alignSelf: 'center' }} aria-label="Nova página" title="Nova página" onClick={onAdd}><Icon name="plus" /></button>}
    </div>
  );
}
/** Coluna de 44 px que abre e fecha painéis docked. O Assistente só aparece com a IA ligada. */
export function PaneSwitcher({ panes, open, onToggle }: { panes: { id: string; label: string; icon: IconName }[]; open: string[]; onToggle: (id: string) => void }) {
  return (
    <nav className="bw-paneswitch" aria-label="Painéis">
      {panes.map((p) => <button key={p.id} type="button" className="bw-pane-btn" aria-label={p.label} title={p.label} aria-pressed={open.includes(p.id)} onClick={() => onToggle(p.id)}><Icon name={p.icon} /></button>)}
    </nav>
  );
}
