import { Link, useNavigate } from '@tanstack/react-router';
import { FormattedMessage } from 'react-intl';
import { Badge, Button } from '@biweb/ui';
import { dashboards } from '../fixtures/lume-varejo';

/** S01 · Home / Workspace. */
export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-panel" style={{ minHeight: '100%' }}>
      <div className="flex items-center gap-3 px-6 pt-4">
        <h1 className="text-page-title font-semibold m-0"><FormattedMessage id="home.title" /></h1>
        <span className="bw-cap bw-muted"><FormattedMessage id="home.count" values={{ count: dashboards.length }} /> · Workspace Comercial</span>
        <span className="flex-1" />
        <Button variant="primary" icon="plus" onPress={() => navigate({ to: '/dashboards/$dashboardId/edit', params: { dashboardId: 'dsh_visao_executiva' } })}><FormattedMessage id="home.new" /></Button>
      </div>
      <div className="px-6 pb-6 pt-3">
        <table className="bw-table w-full">
          <thead><tr><th>Nome</th><th>Estado</th><th>Dono</th><th>Atualizado</th><th>Certificação</th></tr></thead>
          <tbody>
            {dashboards.map((d) => (
              <tr key={d.id}>
                <td className="font-semibold"><Link to="/dashboards/$dashboardId" params={{ dashboardId: d.id }} className="bw-link" style={d.state === 'Depreciado' ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : undefined}>{d.name}</Link></td>
                <td><Badge tone={d.tone}>{d.state}</Badge></td>
                <td>{d.owner}</td>
                <td className="bw-secondary">{d.updated}</td>
                <td>{d.certified ? <Badge tone="success" icon="check">Certificado</Badge> : d.state === 'Depreciado' ? <Badge tone="warning">Depreciado</Badge> : <span className="bw-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
