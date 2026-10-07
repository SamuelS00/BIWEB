import { Badge, Banner, Button } from '@biweb/ui';
import { connections } from '../fixtures/lume-varejo';

/** S02 · Conexões e datasets (estrutura). */
export function ConnectionsPage() {
  return (
    <div className="bg-surface-panel px-6 py-4" style={{ minHeight: '100%' }}>
      <h1 className="text-page-title font-semibold m-0 mb-3">Dados e conexões</h1>
      <Banner tone="danger" action={<Button>Reconectar</Button>}><b>sap-estoque</b>: falha de credencial. Widgets de estoque mostram o último dado válido.</Banner>
      <table className="bw-table w-full mt-3">
        <thead><tr><th>Conexão</th><th>Tipo</th><th>Estado</th></tr></thead>
        <tbody>{connections.map((c) => <tr key={c.id}><td className="bw-mono font-semibold">{c.id}</td><td>{c.type}</td><td><Badge tone={c.ok ? 'success' : 'danger'} icon={c.ok ? 'check' : 'warning'}>{c.state}</Badge></td></tr>)}</tbody>
      </table>
    </div>
  );
}
