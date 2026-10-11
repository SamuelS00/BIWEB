import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Avatar, Icon, IconButton, Menu, PopoverButton, SegmentedControl, Switch, type IconName } from '@biweb/ui';
import { Copilot } from '@biweb/assistant-ui';
import { Button as AriaButton } from 'react-aria-components';
import { applyRootPrefs, asset, useUi } from '../state/ui-store';
import { reports, user } from '../fixtures/lume-varejo';
import { mockCopilot } from '../copilot/engine';
import { networkCopilot } from '../copilot/network';
import { useLibrary } from '../editor/library';
import { useEditor } from '../editor/store';
import { WORKSPACES } from '../routes/gallery';
import { REPORTS } from '../routes/maps/model';
import { CommandPalette } from './CommandPalette';
import { useT, type T } from '../i18n/intl';
import { LOCALES, LOCALE_NAMES, type Locale } from '../i18n/locales';
import { glossaryTerm } from '../i18n/glossary';
import type { MessageId } from '../i18n/catalog';

type Area = 'home' | 'reports' | 'data' | 'models' | 'copilot' | 'maps' | 'workflows' | 'migration';
function area(path: string): Area {
  if (path.startsWith('/reports')) return 'reports';
  if (path.startsWith('/connections') || path.startsWith('/data')) return 'data';
  if (path.startsWith('/models')) return 'models';
  if (path.startsWith('/copilot')) return 'copilot';
  if (path.startsWith('/maps')) return 'maps';
  if (path.startsWith('/workflows')) return 'workflows';
  if (path.startsWith('/migration')) return 'migration';
  return 'home';
}

/** Preferências de exibição: idioma, tema do app, tema do dashboard (independente), densidade e IA. */
function Preferences() {
  const ui = useUi();
  const t = useT();
  return (
    <div className="bw-popover" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="bw-label">{t('preferences.title')}</span>
      <SegmentedControl label={t('preferences.language')} value={ui.locale} onChange={(v) => ui.set({ locale: v })} options={LOCALES.map((l) => ({ id: l, label: LOCALE_NAMES[l] }))} />
      <SegmentedControl label={t('preferences.appTheme')} value={ui.appTheme} onChange={(v) => ui.set({ appTheme: v })} options={[{ id: 'system', label: t('preferences.appTheme.system') }, { id: 'light', label: t('preferences.appTheme.light') }, { id: 'dark', label: t('preferences.appTheme.dark') }]} />
      <SegmentedControl label={t('preferences.dashTheme')} value={ui.dashTheme} onChange={(v) => ui.set({ dashTheme: v })} options={[{ id: 'light', label: t('preferences.dashTheme.light') }, { id: 'dark', label: t('preferences.dashTheme.dark') }]} />
      <SegmentedControl label={t('preferences.density')} value={ui.density} onChange={(v) => ui.set({ density: v })} options={[{ id: 'default', label: t('preferences.density.default') }, { id: 'compact', label: t('preferences.density.compact') }]} />
      <Switch isSelected={ui.aiEnabled} onChange={(v) => ui.set({ aiEnabled: v, ...(v ? {} : { copilotOpen: false }) })}>{t('preferences.copilot')}</Switch>
    </div>
  );
}

/** Áreas do rail. `labelId` aponta para o catálogo, então o rótulo muda com o idioma. */
const NAV: { id: Area; labelId: MessageId; icon: IconName; to: string }[] = [
  { id: 'home', labelId: 'navigation.home', icon: 'home', to: '/' },
  { id: 'reports', labelId: 'navigation.reports', icon: 'report', to: '/reports' },
  { id: 'data', labelId: 'navigation.data', icon: 'data', to: '/connections' },
  { id: 'models', labelId: 'navigation.models', icon: 'model', to: '/models/sem_vendas_varejo' },
  { id: 'copilot', labelId: 'navigation.copilot', icon: 'copilot', to: '/copilot' },
  { id: 'maps', labelId: 'navigation.maps', icon: 'pin', to: '/maps' },
  { id: 'workflows', labelId: 'navigation.workflows', icon: 'share', to: '/workflows' },
  { id: 'migration', labelId: 'navigation.migration', icon: 'migrate', to: '/migration' },
];

export function AppShell() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ui = useUi();
  const t = useT();
  useEffect(() => applyRootPrefs({ appTheme: ui.appTheme, density: ui.density }), [ui.appTheme, ui.density]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); useUi.getState().set({ paletteOpen: true }); } };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, []);
  const cur = area(path);
  const reportMatch = /^\/reports\/([^/]+)/.exec(path);
  const doc = useLibrary((s) => (reportMatch ? s.docs.find((d) => d.id === reportMatch[1]) : undefined));
  const report = reportMatch ? (doc ?? reports.find((r) => r.id === reportMatch[1])) : undefined;
  const inEditor = path.endsWith('/edit');
  const engine = ui.workspace === 'rede' ? networkCopilot : mockCopilot;
  const context = report ? { label: `Relatório: ${report.name}`, reportId: report.id } : { label: `Workspace ${WORKSPACES[ui.workspace].label}` };
  const showDock = ui.aiEnabled && ui.copilotOpen && cur !== 'copilot' && cur !== 'migration' && cur !== 'data' && !inEditor;

  return (
    <div className="app">
      <nav className="app-rail" aria-label={t('navigation.area')}>
        <Link to="/" className="app-rail-mark" aria-label={t('navigation.homeBrand')}><img src={asset('brand/mark.webp')} alt="" width={26} height={24} /></Link>
        {NAV.filter((n) => (n.id !== 'copilot' || ui.aiEnabled) && (n.id !== 'models' || ui.workspace === 'comercial')).map((n) => (
          <Link key={n.id} to={n.to} className="app-rail-item" aria-current={cur === n.id ? 'page' : undefined}>
            <Icon name={n.icon} size={20} />
            <span>{t(n.labelId)}</span>
          </Link>
        ))}
        <span style={{ flex: 1 }} />
        <PopoverButton label={t('preferences.trigger')} icon="sliders" className="app-rail-item app-rail-item--icon" placement="right bottom"><Preferences /></PopoverButton>
      </nav>
      <div className="app-main">
        <header className="app-top">
          <Link to="/" className="app-logo" aria-label="BIWEB Studio">
            <img className="logo-on-light" src={asset('brand/logo-light.webp')} alt="BIWEB Studio" height={24} />
            <img className="logo-on-dark" src={asset('brand/logo-dark.webp')} alt="" height={24} />
          </Link>
          <span className="app-divider" />
          <Crumbs path={path} reportName={report?.name} />
          <span className="flex-1" />
          <button type="button" className="app-search" onClick={() => ui.set({ paletteOpen: true })}>
            <Icon name="search" size={12} />{t('palette.openButton')}<kbd>⌘K</kbd>
          </button>
          {ui.aiEnabled && (
            <button type="button" className="app-copilot-btn" aria-pressed={inEditor || cur === 'migration' || cur === 'data' ? undefined : ui.copilotOpen} onClick={() => { if (inEditor) { useEditor.getState().set({ rightTab: 'ai' }); return; } if (cur === 'migration') { dispatchEvent(new Event('biweb:migration-copilot')); return; } if (cur === 'data') { dispatchEvent(new Event('biweb:data-copilot')); return; } ui.set({ copilotOpen: !ui.copilotOpen }); }}>
              <Icon name="copilot" size={16} />Copilot
            </button>
          )}
          <IconButton icon="clock" label={t('common.notifications', { count: 2 })} />
          <span className="app-user" title={`${user.name} · ${user.role}`}><Avatar name={user.name} size={28} /></span>
        </header>
        <div className="app-body">
          <main className="app-content" id="conteudo">
            <div key={path} className="bw-page app-page"><Outlet /></div>
          </main>
          {showDock && (
            <Copilot variant="dock" engine={engine} context={context} userName={user.name} brandMark={asset('brand/mark.webp')} dashTheme={ui.dashTheme}
              messages={ui.copilotMessages} setMessages={ui.setCopilotMessages} prompt={ui.copilotPrompt}
              onClose={() => ui.set({ copilotOpen: false })}
              onOpenReport={(id) => navigate({ to: '/reports/$reportId', params: { reportId: id } })}
              onAction={(id) => { if (id === 'create-analysis') navigate({ to: '/reports/$reportId', params: { reportId: 'rpt_analise_queda' } }); if (id === 'open-model') navigate({ to: '/models/$modelId', params: { modelId: 'sem_vendas_varejo' } }); }} />
          )}
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}

function WorkspaceSwitch() {
  const ws = useUi((s) => s.workspace), set = useUi((s) => s.set);
  const navigate = useNavigate();
  const t = useT();
  return (
    <Menu title={t('navigation.workspaces')} trigger={<AriaButton className="app-ws" aria-label={t('navigation.switchWorkspace', { name: WORKSPACES[ws].label })}>{WORKSPACES[ws].label}<Icon name="chevronDown" size={12} /></AriaButton>}
      items={(Object.keys(WORKSPACES) as (keyof typeof WORKSPACES)[]).map((k) => ({ id: k, label: `${WORKSPACES[k].label} · ${WORKSPACES[k].company}`, icon: k === ws ? 'check' as const : undefined, onAction: () => { set({ workspace: k, copilotMessages: [] }); navigate({ to: '/reports' }); } }))} />
  );
}

/** Seções do Data Workspace nos breadcrumbs. */
const DATA_SECTION: Record<string, MessageId> = {
  sources: 'navigation.section.sources', catalog: 'navigation.section.catalog', model: 'navigation.section.model',
  quality: 'navigation.section.quality', published: 'navigation.section.published', transformations: 'navigation.section.transformations',
  lineage: 'navigation.section.lineage', enrichment: 'navigation.section.enrichment', changes: 'navigation.section.changes', runs: 'navigation.section.runs',
};

function Crumbs({ path, reportName }: { path: string; reportName?: string }) {
  const t: T = useT();
  const parts: { label: string; to?: string }[] = [];
  if (path.startsWith('/reports')) parts.push({ label: t('navigation.reports'), to: '/reports' });
  if (reportName) parts.push({ label: reportName });
  if (path.endsWith('/edit')) parts.push({ label: t('navigation.edit') });
  if (path.startsWith('/models')) parts.push({ label: t('navigation.models') }, { label: 'Vendas Varejo' });
  if (path.startsWith('/connections')) parts.push({ label: t('navigation.data'), to: '/data' }, { label: t('navigation.overview') });
  if (path.startsWith('/data')) {
    const [, , sec, item] = path.split('/');
    const label = sec && DATA_SECTION[sec] ? t(DATA_SECTION[sec]) : sec;
    parts.push(sec ? { label: t('navigation.data'), to: '/data' } : { label: t('navigation.data') });
    if (sec) parts.push(item ? { label: label ?? sec, to: `/data/${sec}` } : { label: label ?? sec });
    if (item) parts.push({ label: decodeURIComponent(item) });
  }
  if (path.startsWith('/copilot')) parts.push({ label: t('navigation.copilot') });
  if (path.startsWith('/maps')) { const map = REPORTS.find((r) => path === `/maps/${r.id}`); parts.push({ label: t('navigation.maps'), to: '/maps' }, ...(map ? [{ label: map.name }] : [])); }
  if (path.startsWith('/workflows')) parts.push(path === '/workflows' ? { label: t('navigation.workflows') } : { label: t('navigation.workflows'), to: '/workflows' }, ...(path === '/workflows' ? [] : [{ label: t('navigation.workflowEditor') }]));
  if (path.startsWith('/migration')) parts.push(path === '/migration' ? { label: 'Migration Studio' } : { label: 'Migration Studio', to: '/migration' }, ...(path === '/migration' ? [] : [{ label: t('navigation.migrationProject') }]));
  if (path === '/') parts.push({ label: t('navigation.home') });
  return (
    <nav className="bw-crumbs" aria-label={t('navigation.youAreHere')}>
      <WorkspaceSwitch />
      {parts.map((p, i) => (
        <span key={p.label + i} className="bw-row" style={{ gap: 4, flexWrap: 'nowrap' }}>
          <Icon name="chevronRight" size={12} />
          {i === parts.length - 1 ? <b>{p.label}</b> : p.to ? <Link to={p.to} className="bw-link">{p.label}</Link> : p.label}
        </span>
      ))}
    </nav>
  );
}
