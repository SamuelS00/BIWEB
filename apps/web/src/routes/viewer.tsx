import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button, Icon } from '@biweb/ui';
import { kpis, pages } from '../fixtures/lume-varejo';
import { useUi } from '../state/ui-store';

/**
 * S06 · Modo leitura. Estrutura com GlobalContextBar e faixa de KPIs.
 * Widgets reais virão do dashboard-runtime (E2.4) com dados do Query Service.
 */
export function ViewerPage() {
  const { dashboardId } = useParams({ from: '/dashboards/$dashboardId' });
  const navigate = useNavigate();
  const dashTheme = useUi((s) => s.dashTheme);
  const [page, setPage] = useState('geral');
  return (
    <div className={`dash-theme-${dashTheme}`} style={{ background: 'var(--dash-background)', minHeight: '100%', color: 'var(--dash-title)' }}>
      <div className="bw-ctxbar">
        <span className="bw-filter"><span className="bw-k">Período</span> <b>Últimos 9 meses</b><Icon name="chevronDown" size={12} /></span>
        <span className="bw-filter"><span className="bw-k">Região</span> <b>Todas</b><Icon name="chevronDown" size={12} /></span>
        <span className="flex-1" />
        <span className="bw-live">Ao vivo · atualizado 08:12</span>
        <Button size="sm" icon="brush" onPress={() => navigate({ to: '/dashboards/$dashboardId/edit', params: { dashboardId } })}>Editar</Button>
      </div>
      <div className="flex gap-3 px-6" role="tablist" style={{ height: 36, borderBottom: '1px solid var(--dash-widget-border)', background: 'var(--dash-widget-surface)' }}>
        {pages.map((p) => (
          <button key={p.id} role="tab" aria-selected={page === p.id} onClick={() => setPage(p.id)} className="text-body"
            style={{ border: 0, background: 'none', cursor: 'pointer', color: page === p.id ? 'var(--dash-title)' : 'var(--dash-subtitle)', fontWeight: page === p.id ? 600 : 500, boxShadow: page === p.id ? 'inset 0 -2px 0 var(--viz-cat-1)' : 'none' }}>{p.label}</button>
        ))}
      </div>
      <div className="grid gap-4 p-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {kpis.map((k) => (
          <div key={k.label} className="bw-widget">
            <div className="bw-kpi-label">{k.label}</div>
            <div className="bw-kpi-value">{k.value}</div>
            <div className={`bw-kpi-delta bw-kpi-delta--${k.up ? 'up' : 'down'}`}>{k.up ? '▲' : '▼'} {k.delta} <span className="bw-base">vs 2025</span></div>
          </div>
        ))}
      </div>
      <p className="px-6 bw-cap" style={{ color: 'var(--dash-subtitle)' }}>Os demais widgets são renderizados pelo dashboard-runtime (épico E2.4). Referência de interação: docs/design/prototype/index.html.</p>
    </div>
  );
}
