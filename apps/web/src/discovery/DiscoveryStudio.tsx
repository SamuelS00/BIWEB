import { lazy, Suspense, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { Badge, Button, Icon, IconButton, type IconName } from '@biweb/ui';
import { useT } from '../i18n/intl';
import type { MessageId } from '../i18n/catalog';
import type { DiscoverySection } from './data/types';
import { stats } from './data/derive';
import { Inspector } from './panels/Inspector';
import { useDs } from './store';
import { DemoTag, EvidenceViewer, Toasts, dpath, useGo } from './ui';
import { useUi } from '../state/ui-store';
import '../dataworkspace/dataworkspace.css';
import './discovery.css';

const Overview = lazy(() => import('./views/Overview').then((m) => ({ default: m.Overview })));
const ExploreView = lazy(() => import('./views/Explore').then((m) => ({ default: m.ExploreView })));
const MissionsView = lazy(() => import('./views/Missions').then((m) => ({ default: m.MissionsView })));
const WatchlistsView = lazy(() => import('./views/Watchlists').then((m) => ({ default: m.WatchlistsView })));
const ChangesView = lazy(() => import('./views/Changes').then((m) => ({ default: m.ChangesView })));
const EntitiesView = lazy(() => import('./views/Entities').then((m) => ({ default: m.EntitiesView })));
const SourcesView = lazy(() => import('./views/Sources').then((m) => ({ default: m.SourcesView })));
const ObservationsView = lazy(() => import('./views/Observations').then((m) => ({ default: m.ObservationsView })));
const EvidenceView = lazy(() => import('./views/Evidence').then((m) => ({ default: m.EvidenceView })));
const ConflictsView = lazy(() => import('./views/Conflicts').then((m) => ({ default: m.ConflictsView })));
const DatasetsView = lazy(() => import('./views/Datasets').then((m) => ({ default: m.DatasetsView })));
const RunsView = lazy(() => import('./views/Runs').then((m) => ({ default: m.RunsView })));
const PoliciesView = lazy(() => import('./views/Governance').then((m) => ({ default: m.PoliciesView })));
const SettingsView = lazy(() => import('./views/Governance').then((m) => ({ default: m.SettingsView })));

const NAV: { id: DiscoverySection; labelId: MessageId; icon: IconName; adv?: boolean }[] = [
  { id: 'overview', labelId: 'discovery.nav.overview', icon: 'home' }, { id: 'explore', labelId: 'discovery.nav.explore', icon: 'discovery' }, { id: 'missions', labelId: 'discovery.nav.missions', icon: 'target' },
  { id: 'watchlists', labelId: 'discovery.nav.watchlists', icon: 'eye' }, { id: 'entities', labelId: 'discovery.nav.entities', icon: 'cube' }, { id: 'sources', labelId: 'discovery.nav.sources', icon: 'data' },
  { id: 'observations', labelId: 'discovery.nav.observations', icon: 'list' }, { id: 'changes', labelId: 'discovery.nav.changes', icon: 'timeline' }, { id: 'evidence', labelId: 'discovery.nav.evidence', icon: 'book' },
  { id: 'datasets', labelId: 'discovery.nav.datasets', icon: 'layers' },
  { id: 'conflicts', labelId: 'discovery.nav.conflicts', icon: 'warning', adv: true }, { id: 'policies', labelId: 'discovery.nav.policies', icon: 'lock', adv: true },
  { id: 'runs', labelId: 'discovery.nav.runs', icon: 'play', adv: true }, { id: 'settings', labelId: 'discovery.nav.settings', icon: 'sliders', adv: true },
];

export function DiscoveryStudio() {
  const params = useParams({ strict: false }) as { section?: string; itemId?: string };
  const section = (NAV.some((n) => n.id === params.section) ? params.section : 'overview') as DiscoverySection;
  const itemId = params.itemId ? decodeURIComponent(params.itemId) : undefined;
  const t = useT();
  const go = useGo();
  const st = useDs();
  const aiEnabled = useUi((s) => s.aiEnabled);
  const live = { resolved: st.resolved, proposals: st.proposals, extraMissions: st.missions.length - 12 };
  const s = stats(live);
  useEffect(() => { useDs.getState().select(null, false); useDs.getState().setContext(`Discovery Studio · ${t(NAV.find((n) => n.id === section)!.labelId)}${itemId ? ` · ${itemId}` : ''}`); }, [section, itemId, t]);

  const center = (
    <Suspense fallback={<div className="dw-loading" role="status">{t('discovery.loading')}</div>}>
      {section === 'overview' && <Overview />}
      {section === 'explore' && <ExploreView id={itemId} />}
      {section === 'missions' && <MissionsView id={itemId} />}
      {section === 'watchlists' && <WatchlistsView id={itemId} />}
      {section === 'entities' && <EntitiesView id={itemId} />}
      {section === 'sources' && <SourcesView id={itemId} />}
      {section === 'observations' && <ObservationsView id={itemId} />}
      {section === 'changes' && <ChangesView id={itemId} />}
      {section === 'evidence' && <EvidenceView id={itemId} />}
      {section === 'conflicts' && <ConflictsView id={itemId} />}
      {section === 'datasets' && <DatasetsView id={itemId} />}
      {section === 'runs' && <RunsView id={itemId} />}
      {section === 'policies' && <PoliciesView />}
      {section === 'settings' && <SettingsView />}
    </Suspense>
  );
  const badge = (id: DiscoverySection) => (id === 'conflicts' ? s.conflicts : id === 'changes' ? s.changesWeek : undefined);
  return (
    <div className={`dw ds${st.leftOpen ? '' : ' no-left'}${st.rightOpen ? '' : ' no-right'}`}>
      <header className="dw-head">
        <IconButton icon="list" label={st.leftOpen ? t('discovery.nav.collapse') : t('discovery.nav.expand')} onPress={() => st.setPane({ leftOpen: !st.leftOpen })} />
        <div className="dw-title"><h1>{t('discovery.title')}</h1><p>{t('discovery.subtitle')} · NovaLink Operations</p></div>
        <DemoTag />
        <span className="flex-1" />
        <Badge tone="neutral" icon="lock">{t('discovery.studio.publicOnly')}</Badge>
        {aiEnabled && <Button size="sm" icon="copilot" onPress={() => useUi.getState().set({ copilotOpen: true })}>{t('discovery.action.copilot')}</Button>}
        <Button variant="primary" size="sm" icon="plus" onPress={() => go(dpath('missions', 'new'))}>{t('discovery.action.newMission')}</Button>
      </header>
      <nav className="dw-mnav" aria-label={t('discovery.nav.label')}>
        <select value={section} aria-label={t('discovery.studio.section')} onChange={(e) => go(dpath(e.target.value))}>{NAV.map((n) => <option key={n.id} value={n.id}>{t(n.labelId)}</option>)}</select>
      </nav>
      {st.leftOpen && (
        <aside className="dw-left" aria-label={t('discovery.nav.label')}>
          <ul className="dw-nav">
            {NAV.filter((n) => !n.adv).map((n) => <NavItem key={n.id} id={n.id} label={t(n.labelId)} icon={n.icon} on={section === n.id} />)}
            <li className="dw-nav-sep"><span>{t('discovery.nav.governance')}</span></li>
            {NAV.filter((n) => n.adv).map((n) => <NavItem key={n.id} id={n.id} label={t(n.labelId)} icon={n.icon} on={section === n.id} badge={badge(n.id)} />)}
          </ul>
          <div className="ds-rule"><Icon name="lock" size={12} /><p><b>{t('discovery.studio.ruleLead')}</b> {t('discovery.studio.ruleRest')}</p></div>
        </aside>
      )}
      <main className="dw-center" id="ds-center">{center}</main>
      {st.rightOpen && (
        <aside className="dw-right" aria-label={t('discovery.pane.inspector')}>
          <div className="dw-rtabs" role="tablist"><button type="button" role="tab" aria-selected>{t('discovery.pane.inspector')}</button><span className="flex-1" /><IconButton icon="close" label={t('discovery.pane.close')} size="sm" onPress={() => st.setPane({ rightOpen: false })} /></div>
          <div className="dw-rbody"><Inspector /></div>
        </aside>
      )}
      {!st.rightOpen && <button type="button" className="dw-rtoggle" onClick={() => st.setPane({ rightOpen: true })} aria-label={t('discovery.pane.open')}><Icon name="chevronRight" size={12} /></button>}
      <EvidenceViewer />
      <Toasts />
    </div>
  );
}

function NavItem({ id, label, icon, on, badge }: { id: DiscoverySection; label: string; icon: IconName; on: boolean; badge?: number }) {
  const go = useGo();
  return (
    <li><button type="button" className={`dw-nav-i${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => go(dpath(id))}><Icon name={icon} size={16} /><span>{label}</span>{badge ? <em className="bw-num">{badge}</em> : null}</button></li>
  );
}
