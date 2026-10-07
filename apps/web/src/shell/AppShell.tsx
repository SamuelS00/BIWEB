import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useIntl } from 'react-intl';
import { Icon, PopoverButton, ViewRail, Switch, SegmentedControl } from '@biweb/ui';
import { applyRootPrefs, useUi } from '../state/ui-store';

function area(path: string) {
  if (path.startsWith('/connections')) return 'data';
  if (path.startsWith('/models')) return 'models';
  return 'dashboards';
}

/** Preferências de exibição: tema do app, tema do dashboard (independente), densidade e IA. */
function Preferences() {
  const ui = useUi();
  return (
    <div className="bw-popover" style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="bw-label">Exibição</span>
      <SegmentedControl label="Tema do app" value={ui.appTheme} onChange={(v) => ui.set({ appTheme: v })} options={[{ id: 'system', label: 'Sistema' }, { id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} />
      <SegmentedControl label="Tema do dashboard" value={ui.dashTheme} onChange={(v) => ui.set({ dashTheme: v })} options={[{ id: 'light', label: 'Dashboard claro' }, { id: 'dark', label: 'Escuro' }]} />
      <SegmentedControl label="Densidade" value={ui.density} onChange={(v) => ui.set({ density: v })} options={[{ id: 'default', label: 'Padrão' }, { id: 'compact', label: 'Compacta' }]} />
      <Switch isSelected={ui.aiEnabled} onChange={(v) => ui.set({ aiEnabled: v })}>Assistente de IA</Switch>
    </div>
  );
}

export function AppShell() {
  const intl = useIntl();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const appTheme = useUi((s) => s.appTheme), density = useUi((s) => s.density);
  useEffect(() => applyRootPrefs({ appTheme, density }), [appTheme, density]);
  const t = (id: string) => intl.formatMessage({ id });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--rail-width) minmax(0,1fr)', height: '100%' }}>
      <ViewRail
        current={area(path)}
        onNavigate={(id) => navigate({ to: id === 'data' ? '/connections' : id === 'models' ? '/models/$modelId' : '/', params: { modelId: 'sem_vendas_varejo' } as never })}
        items={[
          { id: 'dashboards', label: t('rail.dashboards'), icon: 'grid' },
          { id: 'data', label: t('rail.data'), icon: 'data' },
          { id: 'models', label: t('rail.models'), icon: 'model' },
          { id: 'catalog', label: t('rail.catalog'), icon: 'book', disabledReason: t('rail.catalog.disabled') },
        ]}
        footer={<PrefsButton />}
      />
      <div style={{ display: 'grid', gridTemplateRows: '44px minmax(0,1fr)', minWidth: 0, minHeight: 0 }}>
        <header className="bw-toolbar">
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, flex: 'none' }}>BIWEB Studio</Link>
          <Crumbs path={path} />
          <span className="bw-spacer" />
          <span className="bw-search-global" role="search"><Icon name="search" size={12} />{t('search.placeholder')}<span className="bw-kbd">⌘K</span></span>
        </header>
        <main style={{ minHeight: 0, overflow: 'auto' }}><Outlet /></main>
      </div>
    </div>
  );
}

function PrefsButton() {
  return <PopoverButton label="Exibição e preferências" icon="sliders" className="bw-rail-btn" placement="right bottom"><Preferences /></PopoverButton>;
}

function Crumbs({ path }: { path: string }) {
  const parts: string[] = ['Comercial'];
  if (path.startsWith('/dashboards/')) parts.push('Visão Executiva de Vendas');
  if (path.endsWith('/edit')) parts.push('Editar');
  if (path.startsWith('/models')) parts.splice(0, 1, 'Modelos', 'Vendas Varejo');
  if (path.startsWith('/connections')) parts.push('Dados e conexões');
  return (
    <nav className="bw-crumbs" aria-label="Você está em" style={{ marginLeft: 8 }}>
      {parts.map((p, i) => <span key={p} className="bw-row" style={{ gap: 4, flexWrap: 'nowrap' }}>{i > 0 && <Icon name="chevronRight" size={12} />}{i === parts.length - 1 ? <b>{p}</b> : p}</span>)}
    </nav>
  );
}
