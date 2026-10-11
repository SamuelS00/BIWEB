import { useState } from 'react';
import { Button, Dialog, IconButton, Menu, type MenuEntry } from '@biweb/ui';
import { useUi } from '../../state/ui-store';
import { useT } from '../../i18n/intl';
import type { MessageId } from '../../i18n/catalog';
import type { EntityCandidate, EntityType, Frequency, SourceType } from '../data/types';
import { useDs } from '../store';
import { dpath, useGo } from '../ui';

let pendingTab: string | null = null;
/** Abre o detalhe da entidade já em uma aba (também avisa o detalhe, se ele já estiver aberto). */
export function useOpenEntityTab() {
  const go = useGo();
  return (id: string, tab: string) => { pendingTab = tab; dispatchEvent(new CustomEvent('ds-entity-tab', { detail: tab })); go(dpath('entities', id)); };
}
export const takePendingTab = () => { const t = pendingTab; pendingTab = null; return t; };

/** Vocabulário de UI: ids literais por valor de enumeração (o catálogo exige ids literais). */
export const ENTITY_TYPE_ID: Record<EntityType, MessageId> = {
  Organization: 'discovery.entities.type.Organization', Product: 'discovery.entities.type.Product', Service: 'discovery.entities.type.Service', Technology: 'discovery.entities.type.Technology',
  Location: 'discovery.entities.type.Location', Market: 'discovery.entities.type.Market', Regulation: 'discovery.entities.type.Regulation', Publication: 'discovery.entities.type.Publication', Event: 'discovery.entities.type.Event',
};
export const SRC_TYPE_ID: Record<SourceType, MessageId> = {
  'Official Website': 'discovery.entities.srcType.officialWebsite', Documentation: 'discovery.entities.srcType.documentation', 'Pricing Page': 'discovery.entities.srcType.pricingPage', 'Open Data': 'discovery.entities.srcType.openData',
  Government: 'discovery.entities.srcType.government', News: 'discovery.entities.srcType.news', RSS: 'discovery.entities.srcType.rss', 'Public API': 'discovery.entities.srcType.publicApi',
  Repository: 'discovery.entities.srcType.repository', Document: 'discovery.entities.srcType.document', 'Public Database': 'discovery.entities.srcType.publicDatabase',
};
const FREQ_ID: Record<Frequency, MessageId> = { 'One time': 'discovery.entities.freq.once', Daily: 'discovery.entities.freq.daily', Weekly: 'discovery.entities.freq.weekly', Monthly: 'discovery.entities.freq.monthly' };

/** "há 5 min", "5 min ago"… no idioma ativo (mesma regra de `ago` em data/derive). */
export function useAgo() {
  const t = useT();
  return (min: number) => (min < 60 ? t('discovery.entities.ago.min', { n: min }) : min < 1440 ? t('discovery.entities.ago.hour', { n: Math.round(min / 60) }) : t('discovery.entities.ago.day', { n: Math.round(min / 1440) }));
}

function WatchlistDialog({ e, isOpen, onClose }: { e: EntityCandidate; isOpen: boolean; onClose: () => void }) {
  const go = useGo();
  const t = useT();
  const lists = useDs((s) => s.watchlists);
  const add = (id: string) => {
    const w = lists.find((x) => x.id === id); if (!w) return;
    useDs.setState((s) => ({ watchlists: s.watchlists.map((x) => (x.id === id && !x.entityIds.includes(e.id) ? { ...x, entityIds: [...x.entityIds, e.id] } : x)) }));
    useDs.getState().toast(t('discovery.entities.actions.toastAdded', { name: e.name, list: w.name })); onClose(); go(dpath('watchlists', id));
  };
  const create = () => {
    const id = useDs.getState().addWatchlist({ name: t('discovery.entities.actions.watchName', { name: e.name }), entityIds: [e.id], sources: e.sources, frequency: 'Daily', monitors: ['Pricing', 'Features', 'Documentation'], missionId: e.missionIds[0] ?? 'm1' });
    useDs.getState().toast(t('discovery.entities.actions.toastCreated', { name: e.name })); onClose(); go(dpath('watchlists', id));
  };
  return (
    <Dialog title={t('discovery.entities.actions.dialogTitle', { name: e.name })} isOpen={isOpen} onOpenChange={(o) => { if (!o) onClose(); }} footer={<><Button size="sm" variant="ghost" onPress={onClose}>{t('discovery.entities.actions.cancel')}</Button><Button size="sm" variant="primary" icon="plus" onPress={create}>{t('discovery.entities.actions.createNew')}</Button></>}>
      <ul className="dw-rels" aria-label={t('discovery.entities.actions.listLabel')}>
        {lists.map((w) => <li key={w.id}><button type="button" className="dw-rel" onClick={() => add(w.id)} disabled={w.entityIds.includes(e.id)}><b>{w.name}</b><span className="dw-muted">{t(w.entityIds.includes(e.id) ? 'discovery.entities.actions.listMetaWatching' : 'discovery.entities.actions.listMeta', { n: w.entityIds.length, freq: t(FREQ_ID[w.frequency]) })}</span></button></li>)}
      </ul>
    </Dialog>
  );
}

/** Menu de ações da entidade (usado no cabeçalho e como menu de linha). */
export function EntityMenu({ e, trigger }: { e: EntityCandidate; trigger?: React.ReactElement }) {
  const go = useGo();
  const t = useT();
  const ai = useUi((s) => s.aiEnabled);
  const openTab = useOpenEntityTab();
  const [wl, setWl] = useState(false);
  const items: MenuEntry[] = [
    { id: 'open', label: t('discovery.entities.actions.open'), icon: 'cube', onAction: () => go(dpath('entities', e.id)) },
    'separator',
    { id: 'research', label: t('discovery.entities.actions.research'), icon: 'copilot', ...(ai ? {} : { disabledReason: t('discovery.entities.actions.aiOff') }), onAction: () => useUi.getState().askCopilot(t('discovery.entities.actions.researchPrompt', { name: e.name })) },
    { id: 'compare', label: t('discovery.entities.actions.compare'), icon: 'matrix', onAction: () => { useDs.getState().setCompare([e.id, ...useDs.getState().compare.filter((x) => x !== e.id)].slice(0, 3)); go(dpath('entities', 'compare')); } },
    { id: 'watch', label: t('discovery.entities.actions.watch'), icon: 'eye', onAction: () => setWl(true) },
    { id: 'changes', label: t('discovery.entities.actions.changes'), icon: 'timeline', onAction: () => openTab(e.id, 'changes') },
    { id: 'evidence', label: t('discovery.entities.actions.evidence'), icon: 'book', onAction: () => openTab(e.id, 'evidence') },
    'separator',
    { id: 'lde', label: t('discovery.entities.actions.lde'), icon: 'send', onAction: () => { useDs.getState().toast(t('discovery.entities.actions.toastLde', { name: e.name })); go(dpath('datasets', 'enrichment')); } },
  ];
  return (
    <span onClick={(ev) => ev.stopPropagation()} onKeyDown={(ev) => ev.stopPropagation()} style={{ display: 'inline-flex' }}>
      <Menu title={t('discovery.entities.actions.menuTitle', { name: e.name })} items={items} trigger={trigger ?? <IconButton icon="more" label={t('discovery.entities.actions.menuTitle', { name: e.name })} size="sm" />} />
      <WatchlistDialog e={e} isOpen={wl} onClose={() => setWl(false)} />
    </span>
  );
}

/** Nome clicável dentro de uma linha de Grid: não dispara a seleção da linha. */
export function RecLink({ onOpen, children, label }: { onOpen: () => void; children: React.ReactNode; label?: string }) {
  return <button type="button" className="ds-rec-link" aria-label={label} onClick={(e) => { e.stopPropagation(); onOpen(); }} onKeyDown={(e) => e.stopPropagation()}>{children}</button>;
}
