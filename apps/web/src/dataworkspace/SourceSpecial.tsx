import { useEffect, useState } from 'react';
import { Badge, Button, Icon } from '@biweb/ui';
import type { Source } from './registry';
import { useDw } from './store';
import { Kv, Section, Pill, ConfBadge, useGo } from './ui';

function useTick(ms: number) { const [t, setT] = useState(0); useEffect(() => { const i = setInterval(() => setT((x) => x + 1), ms); return () => clearInterval(i); }, [ms]); return t; }

export function SpecialPanel({ src }: { src: Source }) {
  switch (src.special) {
    case 'doc': return <DocReview />;
    case 'excel': return <ExcelRegions />;
    case 'rest': return <RestPanel src={src} />;
    case 'webhook': return <WebhookPanel />;
    case 'mqtt': return <MqttPanel />;
    case 'geo': return <GeoPanel />;
    case 'odbc': return <OdbcPanel />;
    case 'json': return <JsonPanel />;
    case 'xml': return <XmlPanel />;
    case 'csv': return <CsvPanel />;
    default: return null;
  }
}

function ExcelRegions() {
  const [fix, setFix] = useState(false);
  const toast = useDw((s) => s.toast);
  const [a, setA] = useState('A4:H842');
  return (
    <Section title="Regiões detectadas" hint="Legacy Customers · clientes.xlsx" actions={<Button size="sm" onPress={() => setFix(!fix)}>{fix ? 'Fechar' : 'Corrigir estrutura'}</Button>}>
      <div className="dw-xl">
        <div className="dw-xl-grid" aria-label="Pré-visualização da planilha">
          <div className="dw-xl-sheet"><span className="dw-xl-title">Relatório de clientes — 2026 (célula mesclada · ignorada)</span>
            <div className="dw-xl-a"><b>Tabela A</b><small>{a}</small></div><div className="dw-xl-b"><b>Tabela B</b><small>J3:M42</small></div><div className="dw-xl-tot">Linha de total · ignorada</div></div>
        </div>
        <div>
          <ul className="dw-bul"><li><Icon name="check" size={12} />Aba <b>Clientes</b></li><li><Icon name="check" size={12} />Tabela A <b className="bw-mono">{a}</b> · 839 linhas</li><li><Icon name="check" size={12} />Tabela B <b className="bw-mono">J3:M42</b> · resumo por região</li><li><Icon name="check" size={12} />Cabeçalho começa na linha 4</li><li><Icon name="check" size={12} />Título mesclado ignorado</li><li><Icon name="check" size={12} />Linha de total ignorada</li></ul>
          {fix && <div className="dw-fix"><label className="dw-field"><span>Intervalo da Tabela A</span><input value={a} onChange={(e) => setA(e.target.value)} /></label><Button size="sm" variant="primary" onPress={() => { setFix(false); toast(`Estrutura corrigida: Tabela A em ${a}`); }}>Aplicar</Button></div>}
        </div>
      </div>
    </Section>
  );
}
function RestPanel({ src }: { src: Source }) {
  return (
    <Section title="Recursos e paginação">
      <div className="dw-cards dw-cards--sm">{(src.id === 'crm' ? ['Customers', 'Deals', 'Activities'] : ['Resource A', 'Resource B']).map((r) => <div key={r} className="dw-card"><span className="dw-k">Recurso</span><b>{r}</b><small>/{r.toLowerCase()} · incremental</small></div>)}</div>
      <div className="dw-facts"><Kv k="Paginação" v="Cursor" /><Kv k="Campo incremental" v="updated_at" mono /><Kv k="Limite" v="500 req/min" /><Kv k="Autenticação" v="Bearer ••••••••" /></div>
    </Section>
  );
}
function WebhookPanel() {
  const t = useTick(1000);
  return (
    <Section title="Webhook · Payment Events" hint={<span className="dw-live"><i className="dw-dot is-live is-pulse" />Ao vivo</span>}>
      <div className="dw-facts"><Kv k="Endpoint" v="/v1/ingest/ws_novalink/pay••••" mono /><Kv k="Autenticação" v="HMAC-SHA256" /><Kv k="Eventos hoje" v={(482000 + t * 3).toLocaleString('pt-BR')} /><Kv k="Duplicados ignorados" v={214 + Math.floor(t / 7)} /><Kv k="Último evento" v={`há ${(t % 4) + 1} s`} /></div>
    </Section>
  );
}
function MqttPanel() {
  const t = useTick(900);
  const bars = [...Array(40)].map((_, i) => 40 + Math.round(Math.sin((i + t) / 3.2) * 14 + Math.sin((i * 7 + t) / 5) * 8));
  return (
    <Section title="MQTT · Network Telemetry" hint={<span className="dw-live"><i className="dw-dot is-live is-pulse" />Ao vivo</span>}>
      <div className="dw-mqtt"><div className="dw-facts"><Kv k="Taxa" v={`${(12.4 + Math.sin(t / 3) * 0.2).toFixed(1).replace('.', ',')} mil eventos/s`} /><Kv k="Lag" v="1,7 s" /><Kv k="Último evento" v="agora" /><Kv k="QoS" v="1" /></div>
        <svg className="dw-spark dw-spark--wide" viewBox="0 0 400 60" preserveAspectRatio="none" role="img" aria-label="Eventos por segundo, últimos 40 intervalos">{bars.map((v, i) => <rect key={i} x={i * 10 + 1} width={8} y={60 - v * 0.9} height={v * 0.9} rx={1} />)}</svg></div>
    </Section>
  );
}
function GeoPanel() {
  const go = useGo();
  return (
    <Section title="Camada geoespacial" actions={<Button size="sm" variant="primary" icon="pin" onPress={() => go('/maps/field')}>Abrir no Map Builder</Button>}>
      <div className="dw-facts"><Kv k="Feições" v="82.419" /><Kv k="Geometria" v="Point" /><Kv k="CRS" v="EPSG:4326" /><Kv k="Campos geográficos" v="lat, lng" /></div>
      <p className="dw-muted">Relacionamento sugerido: <b>assets.asset_id ← Service Orders.maintenance.asset_id</b> (91%). Habilita rotas e despacho no mapa Field Operations.</p>
    </Section>
  );
}
function OdbcPanel() {
  return <Section title="Sistema legado"><div className="dw-facts"><Kv k="Sistema" v="IBM i / AS400" /><Kv k="Driver" v="Generic ODBC" /><Kv k="Codificação" v="CP850" /><Kv k="Modo" v="Incremental (CLDTCAD)" /></div><p className="dw-muted">Ambientes antigos entram como fontes comuns: o catálogo, o perfil e a linhagem funcionam da mesma forma.</p></Section>;
}
function JsonPanel() {
  return (
    <Section title="Estrutura aninhada detectada">
      <div className="dw-nest"><pre className="dw-code" aria-label="Estrutura JSON">{`Order
  id            integer
  date          date-time
  customer {}   → Customer
    code, name, document
  items []      → OrderItem
    sku, qty, price`}</pre>
        <div><b>Tabelas geradas</b><ul className="dw-bul"><li><Pill tone="key">orders</Pill></li><li><Pill tone="key">customers</Pill></li><li><Pill tone="key">order_items</Pill></li></ul>
          <b>Relacionamentos sugeridos</b><ul className="dw-bul"><li>order_items.order_id → orders.id <ConfBadge v={99} /></li><li>orders.customer_code → customers.code <ConfBadge v={97} /></li></ul></div></div>
    </Section>
  );
}
function XmlPanel() {
  return (
    <Section title="NF-e · estrutura XML">
      <div className="dw-nest"><pre className="dw-code" aria-label="Estrutura XML">{`NFe
├ emit      → issuer
├ dest      → recipient
├ det[]     → items
└ total     → invoice`}</pre>
        <div><b>Tabelas geradas</b><ul className="dw-bul"><li><Pill tone="key">invoice</Pill></li><li><Pill tone="key">issuer</Pill></li><li><Pill tone="key">recipient</Pill></li><li><Pill tone="key">items</Pill></li></ul></div></div>
    </Section>
  );
}
function CsvPanel() {
  return <Section title="Entrega por SFTP"><div className="dw-facts"><Kv k="Caminho" v="/exports/vendas" mono /><Kv k="Padrão" v="sales_*.csv" mono /><Kv k="Agenda" v="Diário · 05:30" /><Kv k="Último arquivo" v="sales_20261010.csv · 412 mil linhas" /><Kv k="Codificação" v="ISO-8859-1 · ; · vírgula decimal" /></div></Section>;
}

/* ───────── documentos: PDF à esquerda, campos extraídos à direita ───────── */
interface DocField { id: string; label: string; value: string; conf: number; box: [number, number, number, number] }
const DOCS = [
  { id: 'NF-0318', status: 'Pronto', layout: 'A' }, { id: 'NF-0319', status: 'Revisão', layout: 'A' }, { id: 'NF-0320', status: 'Revisão', layout: 'A' }, { id: 'NF-0321', status: 'Revisão', layout: 'B' }, { id: 'NF-0322', status: 'Pronto', layout: 'A' },
];
const FIELDS = (d: string): DocField[] => [
  { id: `${d}:cnpj`, label: 'CNPJ do fornecedor', value: '12.345.678/0001-90', conf: 98, box: [8, 12, 46, 6] }, { id: `${d}:date`, label: 'Data de emissão', value: '2026-09-28', conf: 96, box: [58, 12, 34, 6] },
  { id: `${d}:desc`, label: 'Service Description', value: d === 'NF-0319' ? 'Manut. prev. rede — p/ fibra ót1ca' : 'Manutenção preventiva de rede de fibra óptica', conf: d === 'NF-0319' ? 62 : d === 'NF-0320' ? 71 : 94, box: [8, 34, 84, 10] }, { id: `${d}:total`, label: 'Total', value: 'R$ 18.420,00', conf: 99, box: [58, 78, 34, 7] },
];
function DocReview() {
  const st = useDw();
  const [doc, setDoc] = useState('NF-0319');
  const [sel, setSel] = useState<string>(`NF-0319:desc`);
  const fields = FIELDS(doc);
  const meta = DOCS.find((d) => d.id === doc)!;
  const recognized = st.layoutLearned && meta.layout === 'A' && doc !== 'NF-0319';
  const f = fields.find((x) => x.id === sel);
  const [edit, setEdit] = useState('');
  useEffect(() => { setEdit(st.corrected[sel] ?? f?.value ?? ''); }, [sel, doc]); // eslint-disable-line react-hooks/exhaustive-deps
  const saved = (id: string) => st.corrected[id] !== undefined;
  const conf = (x: DocField) => (saved(x.id) ? 100 : recognized && x.label === 'Service Description' ? 97 : x.conf);
  const pending = DOCS.filter((d) => d.status === 'Revisão' && !st.corrected[`${d.id}:desc`] && !(st.layoutLearned && d.layout === 'A')).length;
  return (
    <Section title="Monthly Invoices · revisão de documentos" hint={`320 arquivos · 29 prontos · ${pending} em revisão · 288 processados`}>
      <div className="dw-doc">
        <ul className="dw-doclist" aria-label="Documentos">
          {DOCS.map((d) => <li key={d.id}><button type="button" className={doc === d.id ? 'is-on' : ''} onClick={() => { setDoc(d.id); setSel(`${d.id}:desc`); }}><Icon name="report" size={12} /><b>{d.id}.pdf</b><Badge tone={d.status === 'Pronto' ? 'success' : 'warning'}>{d.status === 'Pronto' ? 'Pronto' : st.corrected[`${d.id}:desc`] || (st.layoutLearned && d.layout === 'A') ? 'Corrigido' : 'Revisão'}</Badge></button></li>)}
        </ul>
        <div className="dw-page" aria-label={`Prévia de ${doc}.pdf, página 1`}>
          <div className="dw-page-sheet">
            <div className="dw-ln w60" /><div className="dw-ln w30" />
            <div className="dw-ln w40 mt" /><div className="dw-ln w80" /><div className="dw-ln w80" /><div className="dw-ln w50" />
            <div className="dw-ln w70 mt" /><div className="dw-ln w90" /><div className="dw-ln w60" />
            <div className="dw-ln w30 mt2" /><div className="dw-ln w40" />
            {fields.map((x) => <button key={x.id} type="button" className={`dw-bbox${sel === x.id ? ' is-on' : ''}${conf(x) < 80 ? ' is-low' : ''}`} style={{ left: `${x.box[0]}%`, top: `${x.box[1]}%`, width: `${x.box[2]}%`, height: `${x.box[3]}%` }} aria-label={`${x.label}: ${x.value}`} onClick={() => setSel(x.id)} />)}
          </div>
        </div>
        <div className="dw-extract">
          <b className="dw-k">Campos extraídos</b>
          <ul>{fields.map((x) => (
            <li key={x.id}><button type="button" className={`dw-ex-i${sel === x.id ? ' is-on' : ''}`} onClick={() => setSel(x.id)}><span><small>{x.label}</small><b>{st.corrected[x.id] ?? x.value}</b></span><ConfBadge v={conf(x)} /></button></li>))}</ul>
          {recognized && <p className="dw-note is-ok"><Icon name="check" size={12} />Layout reconhecido. Decisões anteriores reaplicadas automaticamente.</p>}
          {f && conf(f) < 80 && !saved(f.id) && (
            <div className="dw-fix"><p className="dw-note"><Icon name="warning" size={12} />{f.label} com {conf(f)}% de confiança. Revise o texto.</p>
              <label className="dw-field"><span>Valor correto</span><input value={edit} onChange={(e) => setEdit(e.target.value)} /></label>
              <Button size="sm" variant="primary" onPress={() => { st.setCorrected(f.id, edit); st.learnLayout(); st.decide('doc:inv-0319', 'accepted'); st.toast('Correção salva. Layout reconhecido.'); }}>Salvar correção</Button></div>)}
          {st.layoutLearned && <p className="dw-note is-ok"><Icon name="check" size={12} />Correção salva. Layout reconhecido: próximos documentos desse layout reutilizam esta decisão.</p>}
        </div>
      </div>
    </Section>
  );
}
