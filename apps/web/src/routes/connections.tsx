import { Badge, Banner, Button, Icon } from '@biweb/ui';
import { connections } from '../fixtures/lume-varejo';

const datasets = [['vendas_pedidos', '42.381 pedidos no período · tabela principal'], ['vendas_itens', 'itens dos pedidos'], ['produtos', 'catálogo'], ['clientes', 'cadastro (PII mascarada)'], ['lojas', '312 lojas'], ['calendario', 'datas'], ['metas_2026', 'importado de metas_2026.csv']];

/** S02 · Conexões e datasets. */
export function ConnectionsPage() {
  return (
    <div className="pg">
      <header className="pg-head"><div><h1 className="pg-title">Dados e conexões</h1><p className="pg-sub">4 conexões · 7 datasets no modelo Vendas Varejo</p></div><span className="flex-1" /><Button variant="primary" icon="plus" isDisabled>Nova conexão</Button></header>
      <Banner tone="danger" action={<Button>Reconectar</Button>}><b>sap-estoque</b>: falha de credencial desde ontem 22:10. Relatórios de estoque mostram o último dado válido.</Banner>
      <div className="conn-grid bw-stagger">
        {connections.map((c, i) => (
          <article key={c.id} className={`conn-card bw-lift${c.ok ? '' : ' conn-card--bad'}`} style={{ ['--i' as string]: i }}>
            <span className="conn-ico"><Icon name="data" size={20} /></span>
            <div><b className="bw-mono">{c.id}</b><small>{c.type}</small></div>
            <Badge tone={c.ok ? 'success' : 'danger'} icon={c.ok ? 'check' : 'warning'}>{c.state}</Badge>
            <span className="bw-cap bw-muted">{c.detail}</span>
          </article>
        ))}
      </div>
      <h2 className="sec-title" style={{ margin: '24px 0 8px' }}>Datasets</h2>
      <table className="bw-table w-full"><thead><tr><th>Dataset</th><th>Uso</th></tr></thead><tbody>{datasets.map(([d, u]) => <tr key={d}><td className="bw-mono">{d}</td><td className="bw-secondary">{u}</td></tr>)}</tbody></table>
    </div>
  );
}
