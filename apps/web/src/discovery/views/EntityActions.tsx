import { useState } from 'react';
import { Button, Dialog, IconButton, Menu, type MenuEntry } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import type { EntityCandidate } from '../data/types';
import { useDs } from '../store';
import { dpath, useGo } from '../ui';

let pendingTab: string | null = null;
/** Abre o detalhe da entidade já em uma aba (também avisa o detalhe, se ele já estiver aberto). */
export function useOpenEntityTab() {
  const go = useGo();
  return (id: string, tab: string) => { pendingTab = tab; dispatchEvent(new CustomEvent('ds-entity-tab', { detail: tab })); go(dpath('entities', id)); };
}
export const takePendingTab = () => { const t = pendingTab; pendingTab = null; return t; };

function WatchlistDialog({ e, isOpen, onClose }: { e: EntityCandidate; isOpen: boolean; onClose: () => void }) {
  const go = useGo();
  const lists = useDs((s) => s.watchlists);
  const add = (id: string) => {
    const w = lists.find((x) => x.id === id); if (!w) return;
    useDs.setState((s) => ({ watchlists: s.watchlists.map((x) => (x.id === id && !x.entityIds.includes(e.id) ? { ...x, entityIds: [...x.entityIds, e.id] } : x)) }));
    useDs.getState().toast(`${e.name} added to ${w.name}`); onClose(); go(dpath('watchlists', id));
  };
  const create = () => {
    const id = useDs.getState().addWatchlist({ name: `${e.name} watch`, entityIds: [e.id], sources: e.sources, frequency: 'Daily', monitors: ['Pricing', 'Features', 'Documentation'], missionId: e.missionIds[0] ?? 'm1' });
    useDs.getState().toast(`Watchlist created for ${e.name}`); onClose(); go(dpath('watchlists', id));
  };
  return (
    <Dialog title={`Add ${e.name} to a watchlist`} isOpen={isOpen} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>Cancel</Button><Button size="sm" variant="primary" icon="plus" onPress={create}>Create new watchlist</Button></>}>
      <ul className="dw-rels" aria-label="Watchlists">
        {lists.map((w) => <li key={w.id}><button type="button" className="dw-rel" onClick={() => add(w.id)} disabled={w.entityIds.includes(e.id)}><b>{w.name}</b><span className="dw-muted">{w.entityIds.length} entities · {w.frequency}{w.entityIds.includes(e.id) ? ' · already watching' : ''}</span></button></li>)}
      </ul>
    </Dialog>
  );
}

/** Menu de ações da entidade (usado no cabeçalho e como menu de linha). */
export function EntityMenu({ e, trigger }: { e: EntityCandidate; trigger?: React.ReactElement }) {
  const go = useGo();
  const ai = useUi((s) => s.aiEnabled);
  const openTab = useOpenEntityTab();
  const [wl, setWl] = useState(false);
  const items: MenuEntry[] = [
    { id: 'open', label: 'Open entity', icon: 'cube', onAction: () => go(dpath('entities', e.id)) },
    'separator',
    { id: 'research', label: 'Research more', icon: 'copilot', ...(ai ? {} : { disabledReason: 'AI is turned off. The platform works without it.' }), onAction: () => useUi.getState().askCopilot(`Research more about ${e.name}: what evidence is missing and which public sources could confirm it?`) },
    { id: 'compare', label: 'Compare', icon: 'matrix', onAction: () => { useDs.getState().setCompare([e.id, ...useDs.getState().compare.filter((x) => x !== e.id)].slice(0, 3)); go(dpath('entities', 'compare')); } },
    { id: 'watch', label: 'Add to watchlist', icon: 'eye', onAction: () => setWl(true) },
    { id: 'changes', label: 'Find changes', icon: 'timeline', onAction: () => openTab(e.id, 'changes') },
    { id: 'evidence', label: 'View evidence', icon: 'book', onAction: () => openTab(e.id, 'evidence') },
    'separator',
    { id: 'lde', label: 'Send to LDE', icon: 'send', onAction: () => { useDs.getState().toast(`${e.name} proposed to the LDE for validation`); go(dpath('datasets', 'enrichment')); } },
  ];
  return (
    <span onClick={(ev) => ev.stopPropagation()} onKeyDown={(ev) => ev.stopPropagation()} style={{ display: 'inline-flex' }}>
      <Menu title={`Actions for ${e.name}`} items={items} trigger={trigger ?? <IconButton icon="more" label={`Actions for ${e.name}`} size="sm" />} />
      <WatchlistDialog e={e} isOpen={wl} onClose={() => setWl(false)} />
    </span>
  );
}

/** Nome clicável dentro de uma linha de Grid: não dispara a seleção da linha. */
export function RecLink({ onOpen, children, label }: { onOpen: () => void; children: React.ReactNode; label?: string }) {
  return <button type="button" className="ds-rec-link" aria-label={label} onClick={(e) => { e.stopPropagation(); onOpen(); }} onKeyDown={(e) => e.stopPropagation()}>{children}</button>;
}
