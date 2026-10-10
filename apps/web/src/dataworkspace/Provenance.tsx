import { Button, Dialog } from '@biweb/ui';
import { useDw } from './store';
import { Kv } from './ui';

/** Proveniência: mostra o SourceRef até a origem, conforme o tipo da fonte. */
export function ProvenanceDialog() {
  const p = useDw((s) => s.provenance), hide = useDw((s) => s.hideOrigin), tech = useDw((s) => s.technical);
  const k = p.kind ?? 'db';
  return (
    <Dialog title="Origem do dado" isOpen={p.open} onOpenChange={(o) => { if (!o) hide(); }} footer={<Button size="sm" onPress={hide}>Fechar</Button>}>
      <div className="dw-prov">
        <p className="dw-muted">{p.label}</p>
        {(k === 'excel') && <div className="dw-facts dw-facts--col"><Kv k="Arquivo" v="clientes.xlsx" mono /><Kv k="Aba" v="Clientes" /><Kv k="Linha" v="1482" /><Kv k="Coluna" v="CPF" /><Kv k="Célula" v="C1482" mono /></div>}
        {(k === 'doc') && <><div className="dw-facts dw-facts--col"><Kv k="Arquivo" v="invoice.pdf" mono /><Kv k="Página" v="2" /><Kv k="Região" v="bbox [58, 78, 34, 7]" mono /></div><div className="dw-page dw-page--sm"><div className="dw-page-sheet"><div className="dw-ln w60" /><div className="dw-ln w80" /><span className="dw-bbox is-on" style={{ left: '58%', top: '78%', width: '34%', height: '7%' }} /></div></div></>}
        {(k === 'rest' || k === 'json') && <div className="dw-facts dw-facts--col"><Kv k="Endpoint" v="GET /v2/customers" mono /><Kv k="Página" v="cursor=eyJ1IjoiMjAyNi0xMC0xMCJ9" mono /><Kv k="Requisição" v="req_8f31a2 · 13:42:07" mono /><Kv k="Posição" v="data[418]" mono /></div>}
        {(k === 'mqtt' || k === 'webhook') && <div className="dw-facts dw-facts--col"><Kv k="Event ID" v="evt_01HX9Q3N6K" mono /><Kv k="Recebido em" v="2026-10-10 13:41:58.204" mono /><Kv k="Tópico" v="telemetry/events" mono /></div>}
        {(k === 'db' || k === 'odbc' || k === 'generic' || k === 'csv' || k === 'xml' || k === 'geo') && <div className="dw-facts dw-facts--col"><Kv k="Banco" v="ERP Production" /><Kv k="Tabela" v="sales.CLIENTES" mono /><Kv k="Chave" v="COD_CLIENTE = 1048" mono /><Kv k="Coluna" v="CPF" /></div>}
        {tech && <div className="dw-facts dw-facts--col"><Kv k="SourceRef" v="src_erp_01hx9/sales.CLIENTES#1048/CPF" mono /><Kv k="load id" v="ld_28492_a3" mono /></div>}
      </div>
    </Dialog>
  );
}
