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

type Area = 'home' | 'reports' | 'data' | 'models' | 'copilot' | 'maps' | 'workflows';
function area(path: string): Area {
  if (path.startsWith('/reports')) return 'reports';
  if (path.startsWith('/connections')) return 'data';
  if (path.startsWith('/models')) return 'models';
  if (path.startsWith('/copilot')) return 'copilot';
  if (path.startsWith('/maps')) return 'maps';
  if (path.startsWith('/workflows')) return 'workflows';
  return 'home';
}

/** Preferências de exibição: tema do app, tema do dashboard (independente), densidade e IA. */
function Preferences() {
  const ui = useUi();
  return (
    <div className="bw-popover" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="bw-label">Exibição</span>
      <SegmentedControl label="Tema do app" value={ui.appTheme} onChange={(v) => ui.set({ appTheme: v })} options={[{ id: 'system', label: 'Sistema' }, { id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} />
      <SegmentedControl label="Tema dos relatórios" value={ui.dashTheme} onChange={(v) => ui.set({ dashTheme: v })} options={[{ id: 'light', label: 'Relatório claro' }, { id: 'dark', label: 'Relatório escuro' }]} />
      <SegmentedControl label="Densidade" value={ui.density} onChange={(v) => ui.set({ density: v })} options={[{ id: 'default', label: 'Padrão' }, { id: 'compact', label: 'Compacta' }]} />
      <Switch isSelected={ui.aiEnabled} onChange={(v) => ui.set({ aiEnabled: v, ...(v ? {} : { copilotOpen: false }) })}>Copilot (assistente de IA)</Switch>
    </div>
  );
}

const NAV: { id: Area; label: string; icon: IconName; to: string }[] = [
  { id: 'home', label: 'Início', icon: 'home', to: '/' },
  { id: 'reports', label: 'Relatórios', icon: 'report', to: '/reports' },
  { id: 'data', label: 'Dados', icon: 'data', to: '/connections' },
  { id: 'models', label: 'Modelos', icon: 'model', to: '/models/sem_vendas_varejo' },
  { id: 'copilot', label: 'Copilot', icon: 'copilot', to: '/copilot' },
  { id: 'maps', label: 'Mapas', icon: 'pin', to: '/maps' },
  { id: 'workflows', label: 'Fluxos', icon: 'share', to: '/workflows' },
];

export function AppShell() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ui = useUi();
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
  const showDock = ui.aiEnabled && ui.copilotOpen && cur !== 'copilot' && !inEditor;

  return (
    <div className="app">
      <nav className="app-rail" aria-label="Áreas">
        <Link to="/" className="app-rail-mark" aria-label="BIWEB Studio · Início"><img src={asset('brand/mark.webp')} alt="" width={26} height={24} /></Link>
        {NAV.filter((n) => (n.id !== 'copilot' || ui.aiEnabled) && (n.id !== 'models' || ui.workspace === 'comercial')).map((n) => (
          <Link key={n.id} to={n.to} className="app-rail-item" aria-current={cur === n.id ? 'page' : undefined}>
            <Icon name={n.icon} size={20} />
            <span>{n.label}</span>
          </Link>
        ))}
        <span style={{ flex: 1 }} />
        <PopoverButton label="Exibição e preferências" icon="sliders" className="app-rail-item app-rail-item--icon" placement="right bottom"><Preferences /></PopoverButton>
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
            <Icon name="search" size={12} />Buscar relatórios, métricas e ações<kbd>⌘K</kbd>
          </button>
          {ui.aiEnabled && (
            <button type="button" className="app-copilot-btn" aria-pressed={inEditor ? undefined : ui.copilotOpen} onClick={() => { if (inEditor) { useEditor.getState().set({ rightTab: 'ai' }); return; } ui.set({ copilotOpen: !ui.copilotOpen }); }}>
              <Icon name="copilot" size={16} />Copilot
            </button>
          )}
          <IconButton icon="clock" label="Notificações · 2 novas" />
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
  return (
    <Menu title="Workspaces" trigger={<AriaButton className="app-ws" aria-label={`Workspace: ${WORKSPACES[ws].label}. Trocar workspace`}>{WORKSPACES[ws].label}<Icon name="chevronDown" size={12} /></AriaButton>}
      items={(Object.keys(WORKSPACES) as (keyof typeof WORKSPACES)[]).map((k) => ({ id: k, label: `${WORKSPACES[k].label} · ${WORKSPACES[k].company}`, icon: k === ws ? 'check' as const : undefined, onAction: () => { set({ workspace: k, copilotMessages: [] }); navigate({ to: '/reports' }); } }))} />
  );
}

function Crumbs({ path, reportName }: { path: string; reportName?: string }) {
  const parts: { label: string; to?: string }[] = [];
  if (path.startsWith('/reports')) parts.push({ label: 'Relatórios', to: '/reports' });
  if (reportName) parts.push({ label: reportName });
  if (path.endsWith('/edit')) parts.push({ label: 'Editar' });
  if (path.startsWith('/models')) parts.push({ label: 'Modelos' }, { label: 'Vendas Varejo' });
  if (path.startsWith('/connections')) parts.push({ label: 'Dados e conexões' });
  if (path.startsWith('/copilot')) parts.push({ label: 'Copilot' });
  if (path.startsWith('/maps')) { const map = REPORTS.find((r) => path === `/maps/${r.id}`); parts.push({ label: 'Mapas', to: '/maps' }, ...(map ? [{ label: map.name }] : [])); }
  if (path.startsWith('/workflows')) parts.push({ label: 'Fluxos' });
  if (path === '/') parts.push({ label: 'Início' });
  return (
    <nav className="bw-crumbs" aria-label="Você está em">
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
