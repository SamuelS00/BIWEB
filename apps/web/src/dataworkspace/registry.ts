import type { ColDef, Gen } from './sample';

/** Catálogo do workspace "NovaLink Operations": fontes, ativos, colunas e relacionamentos. Fonte única de números para todas as telas. */
export type Health = 'healthy' | 'warning' | 'critical';
export type Fresh = 'fresh' | 'stale' | 'live';
export type Family = 'database' | 'file' | 'api' | 'realtime' | 'legacy' | 'document' | 'geospatial';
export type IngestMode = 'full' | 'incremental' | 'push' | 'stream' | 'manual';
export type Special = 'db' | 'rest' | 'excel' | 'mqtt' | 'webhook' | 'doc' | 'geo' | 'odbc' | 'json' | 'xml' | 'csv' | 'generic';

export interface Source {
  id: string; name: string; type: string; family: Family; mode: IngestMode; health: Health; fresh: Fresh; env: 'production' | 'staging' | 'development';
  syncMin: number; volume: string; models: number; reports: number; owner: string; special: Special; connector: string; note?: string;
  /** Preenchido para fontes criadas pelo assistente. */
  created?: boolean; schedule: string;
}
export const FAMILY_LABEL: Record<Family, string> = { database: 'Banco de dados', file: 'Arquivo', api: 'API', realtime: 'Tempo real', legacy: 'Legado', document: 'Documento', geospatial: 'Geoespacial' };
export const MODE_LABEL: Record<IngestMode, string> = { full: 'Completo', incremental: 'Incremental', push: 'Push', stream: 'Stream', manual: 'Manual' };
export const HEALTH_LABEL: Record<Health, string> = { healthy: 'Saudável', warning: 'Atenção', critical: 'Crítico' };
export const FRESH_LABEL: Record<Fresh, string> = { fresh: 'Atualizado', stale: 'Desatualizado', live: 'Ao vivo' };

const S = (id: string, name: string, type: string, family: Family, mode: IngestMode, health: Health, fresh: Fresh, syncMin: number, volume: string, models: number, reports: number, special: Special, connector: string, schedule: string, owner = 'Dados Corporativos', env: Source['env'] = 'production', note?: string): Source =>
  ({ id, name, type, family, mode, health, fresh, env, syncMin, volume, models, reports, owner, special, connector, schedule, note });

export const SOURCES: Source[] = [
  S('erp', 'ERP Production', 'SQL Server', 'database', 'incremental', 'healthy', 'fresh', 4, '1,84 mi linhas/dia', 5, 9, 'db', 'mssql', 'A cada 15 min', 'Finanças & Vendas'),
  S('crm', 'CRM Cloud', 'REST API', 'api', 'incremental', 'warning', 'fresh', 4, '284 mil registros/dia', 4, 7, 'rest', 'rest', 'A cada 10 min', 'Comercial', 'production', 'Mudança de schema detectada'),
  S('legacy', 'Legacy Customers', 'Excel XLSX', 'file', 'manual', 'warning', 'stale', 12 * 1440, '839 linhas', 2, 1, 'excel', 'xlsx', 'Manual', 'Comercial'),
  S('telemetry', 'Network Telemetry', 'MQTT', 'realtime', 'stream', 'healthy', 'live', 0, '12,4 mil eventos/s', 2, 3, 'mqtt', 'mqtt', 'Contínuo', 'Operações de Rede'),
  S('svc', 'Service Orders', 'PostgreSQL', 'database', 'incremental', 'healthy', 'fresh', 9, '58 mil linhas/dia', 3, 4, 'db', 'postgres', 'A cada 15 min', 'Operações de Campo'),
  S('geo', 'Field Assets', 'GeoJSON', 'geospatial', 'full', 'healthy', 'fresh', 190, '82.419 feições', 1, 2, 'geo', 'geojson', 'Diário · 02:00', 'Engenharia'),
  S('invoices', 'Monthly Invoices', 'PDF Batch', 'document', 'manual', 'warning', 'fresh', 95, '320 arquivos', 1, 1, 'doc', 'pdf', 'Lote mensal', 'Financeiro'),
  S('salesimport', 'Sales Import', 'CSV via SFTP', 'file', 'incremental', 'healthy', 'fresh', 22, '412 mil linhas/lote', 2, 3, 'csv', 'sftp', 'Diário · 05:30', 'Comercial'),
  S('payments', 'Payment Events', 'Webhook', 'realtime', 'push', 'healthy', 'live', 0, '482 mil eventos/dia', 1, 2, 'webhook', 'webhook', 'Contínuo', 'Financeiro'),
  S('orderevents', 'Order Events API', 'REST API · JSON aninhado', 'api', 'incremental', 'healthy', 'fresh', 7, '96 mil pedidos/dia', 1, 1, 'json', 'rest', 'A cada 5 min', 'E-commerce'),
  S('nfe', 'NF-e Import', 'XML via SFTP', 'file', 'incremental', 'healthy', 'fresh', 41, '3,1 mil notas/dia', 1, 1, 'xml', 'sftp', 'A cada hora', 'Fiscal'),
  S('as400', 'Legacy ERP', 'Generic ODBC · IBM i', 'legacy', 'incremental', 'healthy', 'fresh', 63, '210 mil linhas/dia', 2, 2, 'odbc', 'odbc', 'A cada hora', 'TI Legado'),
  S('billing', 'Billing DB', 'PostgreSQL', 'database', 'incremental', 'healthy', 'fresh', 11, '120 mil linhas/dia', 2, 3, 'db', 'postgres', 'A cada 15 min', 'Finanças & Vendas'),
  S('ga4', 'Google Analytics 4', 'API de negócios', 'api', 'incremental', 'healthy', 'fresh', 38, '1,2 mi sessões/dia', 1, 2, 'rest', 'rest', 'A cada hora', 'Marketing'),
  S('shopify', 'Shopify Store', 'API de negócios', 'api', 'incremental', 'healthy', 'fresh', 14, '9,4 mil pedidos/dia', 1, 1, 'rest', 'rest', 'A cada 15 min', 'E-commerce', 'production'),
  S('s3lake', 'Data Lake (S3)', 'Parquet em S3', 'file', 'incremental', 'healthy', 'fresh', 140, '38 GB/dia', 2, 2, 'generic', 's3', 'Diário · 03:00', 'Engenharia de Dados', 'staging'),
  S('sheets', 'Sales Targets', 'Google Sheets', 'file', 'full', 'healthy', 'fresh', 300, '240 linhas', 1, 2, 'generic', 'gsheets', 'Diário · 07:00', 'Comercial'),
  S('kafka', 'Billing Events', 'Kafka', 'realtime', 'stream', 'critical', 'stale', 47, '0 eventos/s (pausado)', 1, 0, 'generic', 'kafka', 'Contínuo', 'Financeiro', 'staging', 'Consumer group sem offset há 47 min'),
];

/* ───────────────────────── colunas ───────────────────────── */
type Style = 'sql' | 'pg' | 'file' | 'json';
const PHYS: Record<Style, Partial<Record<Gen, string>>> = {
  sql: { uuid: 'UNIQUEIDENTIFIER', int: 'INT', seq: 'BIGINT', name: 'VARCHAR(80)', cpf: 'VARCHAR(20)', cnpj: 'VARCHAR(18)', email: 'VARCHAR(120)', phone: 'VARCHAR(20)', cep: 'VARCHAR(9)', uf: 'CHAR(2)', date: 'DATE', datetime: 'DATETIME2', money: 'DECIMAL(14,2)', qty: 'INT', bool: 'BIT', enum: 'VARCHAR(24)', text: 'VARCHAR(200)', code: 'VARCHAR(12)', lat: 'FLOAT', lng: 'FLOAT', pct: 'DECIMAL(5,2)' },
  pg: { uuid: 'uuid', int: 'integer', seq: 'bigint', name: 'varchar(80)', cpf: 'varchar(14)', cnpj: 'varchar(18)', email: 'varchar(120)', phone: 'varchar(20)', cep: 'varchar(9)', uf: 'char(2)', date: 'date', datetime: 'timestamptz', money: 'numeric(14,2)', qty: 'integer', bool: 'boolean', enum: 'text', text: 'text', code: 'varchar(12)', lat: 'double precision', lng: 'double precision', pct: 'numeric(5,2)' },
  file: { uuid: 'texto', int: 'número', seq: 'número', name: 'texto', cpf: 'texto', cnpj: 'texto', email: 'texto', phone: 'texto', cep: 'texto', uf: 'texto', date: 'data', datetime: 'data e hora', money: 'número', qty: 'número', bool: 'booleano', enum: 'texto', text: 'texto', code: 'texto', lat: 'número', lng: 'número', pct: 'número' },
  json: { uuid: 'string', int: 'integer', seq: 'integer', name: 'string', cpf: 'string', cnpj: 'string', email: 'string', phone: 'string', cep: 'string', uf: 'string', date: 'string (date)', datetime: 'string (date-time)', money: 'number', qty: 'integer', bool: 'boolean', enum: 'string', text: 'string', code: 'string', lat: 'number', lng: 'number', pct: 'number' },
};
const SEM: Partial<Record<Gen, [string, string | undefined, boolean, ColDef['klass'], ColDef['via'], number]>> = {
  uuid: ['Identificador único (UUID)', undefined, false, 'Interno', 'Regra', 99], int: ['Identificador numérico', undefined, false, 'Interno', 'Estatística', 88], seq: ['Identificador sequencial', undefined, false, 'Interno', 'Estatística', 90],
  name: ['Nome de pessoa', 'Customer.Name', true, 'Pessoal', 'Estatística', 91], cpf: ['CPF brasileiro', 'Customer.CPF', true, 'Sensível', 'Regra', 98], cnpj: ['CNPJ brasileiro', 'Supplier.CNPJ', false, 'Interno', 'Regra', 99],
  email: ['E-mail', 'Customer.Email', true, 'Pessoal', 'Regra', 99], phone: ['Telefone BR', 'Customer.Phone', true, 'Pessoal', 'Regra', 96], cep: ['CEP', 'Location.CEP', false, 'Pessoal', 'Regra', 97],
  uf: ['UF / Estado', 'Region.State', false, 'Público', 'Regra', 95], date: ['Data', undefined, false, 'Interno', 'Regra', 97], datetime: ['Data e hora', undefined, false, 'Interno', 'Regra', 98],
  money: ['Valor monetário (BRL)', 'Order.Amount', false, 'Interno', 'Estatística', 90], qty: ['Quantidade', undefined, false, 'Interno', 'Estatística', 86], bool: ['Indicador (sim/não)', undefined, false, 'Interno', 'Regra', 96],
  enum: ['Categoria', undefined, false, 'Interno', 'Estatística', 84], text: ['Texto livre', undefined, false, 'Interno', 'Estatística', 80], code: ['Código de negócio', undefined, false, 'Interno', 'Estatística', 82],
  lat: ['Latitude', 'Geo.Coordinate', false, 'Interno', 'Regra', 99], lng: ['Longitude', 'Geo.Coordinate', false, 'Interno', 'Regra', 99], pct: ['Percentual', undefined, false, 'Interno', 'Estatística', 83],
};

/** "NOME:gen[:PK|FK|?|n=0.2|e=a/b|c=Concept|i=0.4]". */
export function col(spec: string, style: Style = 'sql'): ColDef {
  const [name = '', g = 'text', ...flags] = spec.split(':');
  const gn = g as Gen, s = SEM[gn] ?? SEM.text!;
  const c: ColDef = { name, gen: gn, phys: PHYS[style][gn] ?? 'text', sem: s[0], concept: s[1], pii: s[2], klass: s[3], via: s[4], conf: s[5] };
  for (const f of flags) {
    if (f === 'PK' || f === 'FK') { c.flag = f; c.sem = f === 'PK' ? 'Chave primária' : 'Chave estrangeira'; c.concept = undefined; c.via = 'Regra'; c.conf = 99; }
    else if (f === '?') c.suggested = true;
    else if (f.startsWith('n=')) c.nullPct = parseFloat(f.slice(2));
    else if (f.startsWith('e=')) c.opts = f.slice(2).split('/');
    else if (f.startsWith('c=')) c.concept = f.slice(2);
    else if (f.startsWith('i=')) c.invalidPct = parseFloat(f.slice(2));
    else if (f.startsWith('sem=')) c.sem = f.slice(4);
    else if (f.startsWith('via=')) c.via = f.slice(4) as ColDef['via'];
  }
  if (c.opts) { c.sem = 'Categoria'; if (c.name.toLowerCase().includes('segment')) { c.concept = 'Customer.Segment'; } }
  return c;
}
const cols = (style: Style, ...specs: string[]) => specs.map((x) => col(x, style));

export type AssetKind = 'table' | 'view' | 'sheet' | 'file' | 'stream' | 'documents' | 'layer' | 'resource';
export interface Asset {
  id: string; source: string; schema: string; name: string; kind: AssetKind; rows: number; cols: ColDef[]; declaredCols?: number;
  fresh: Fresh; quality: number; owner: string; updated: string; concept?: string;
}
const A = (source: string, schema: string, name: string, kind: AssetKind, rows: number, c: ColDef[], quality: number, extra: Partial<Asset> = {}): Asset =>
  ({ id: `${source}.${name.toLowerCase()}`, source, schema, name, kind, rows, cols: c, fresh: 'fresh', quality, owner: SOURCES.find((s) => s.id === source)?.owner ?? '—', updated: 'há 4 min', ...extra });

/* sales_raw: tabela larga de 53 colunas (história de normalização). */
const RAW53 = [
  'order_id:seq:PK', 'order_date:datetime', 'order_status:enum:e=Faturado/Aberto/Cancelado', 'channel:enum:e=Loja/Online/Representante', 'customer_code:int', 'customer_name:name', 'customer_cpf:cpf:i=0.4', 'customer_email:email:n=4', 'customer_phone:phone:n=7', 'customer_birth:date:n=9', 'customer_segment:enum:e=Varejo/Corporativo/PME',
  'customer_cep:cep:n=2', 'customer_city:text', 'customer_uf:uf', 'region_name:enum:e=Sudeste/Sul/Nordeste/Centro-Oeste/Norte', 'region_manager:name', 'shipping_cep:cep', 'shipping_uf:uf', 'shipping_cost:money', 'product_code:code', 'product_name:text', 'product_category:enum:e=Fibra/Roteadores/Cabos/Acessórios', 'product_brand:enum:e=Nova/Link/Ubiq/TP',
  'product_list_price:money', 'item_qty:qty', 'item_unit_price:money', 'item_discount:money', 'item_total:money', 'order_subtotal:money', 'order_discount:money', 'order_total:money', 'tax_icms:money', 'tax_pis:money', 'tax_cofins:money', 'payment_method:enum:e=Cartão/Boleto/Pix', 'payment_installments:qty', 'payment_status:enum:e=Pago/Pendente/Estornado',
  'seller_code:int', 'seller_name:name', 'seller_team:enum:e=Norte/Sul/Leste', 'invoice_number:code', 'invoice_date:date', 'delivery_date:date:n=6', 'delivery_status:enum:e=Entregue/Em rota/Atrasada', 'carrier:enum:e=Rapido/FastBR/Correios', 'tracking_code:code:n=8', 'return_flag:bool', 'return_reason:enum:e=Defeito/Arrependimento/Erro:n=92', 'created_by:name', 'updated_at:datetime', 'source_file:code',
];

/** Colunas genéricas para ativos que não precisam de detalhe individual. */
const GENERIC = (style: Style) => cols(style, 'id:int:PK', 'name:text', 'status:enum:e=ativo/inativo/pendente', 'created_at:datetime', 'updated_at:datetime');
const EXTRA = (source: string, schema: string, names: string[], style: Style, rows = 8400, kind: AssetKind = 'table') =>
  names.map((n, i) => A(source, schema, n, kind, Math.round(rows * (1 + ((i * 37) % 9) / 3)), GENERIC(style), 94 + (i % 5), { updated: i % 7 === 0 ? 'há 2 h' : 'há 4 min' }));

export const ASSETS: Asset[] = [
  A('erp', 'sales', 'CLIENTES', 'table', 412806, cols('sql', 'COD_CLIENTE:int:PK', 'NOME:name', 'CPF:cpf:n=0.2:i=0.9', 'EMAIL:email:n=4', 'TELEFONE:phone:n=7', 'CEP:cep:n=2', 'UF:uf', 'SEGMENTO:enum:e=Varejo/Corporativo/Residencial/PME', 'DT_NASC:date:n=9', 'DT_CADASTRO:date', 'ATIVO:bool', 'LIMITE_CREDITO:money'), 98.4, { concept: 'Customer' }),
  A('erp', 'sales', 'PEDIDOS', 'table', 1824239, cols('sql', 'NUM_PEDIDO:seq:PK', 'COD_CLIENTE:int:FK', 'DT_PEDIDO:datetime', 'VL_TOTAL:money', 'VL_DESCONTO:money', 'STATUS:enum:e=Faturado/Aberto/Cancelado/Devolvido', 'COD_VENDEDOR:int', 'CANAL:enum:e=Loja/Online/Representante', 'UF_ENTREGA:uf'), 96.8, { concept: 'Order' }),
  A('erp', 'sales', 'ITENS_PEDIDO', 'table', 5120733, cols('sql', 'NUM_PEDIDO:seq:FK', 'SEQ_ITEM:qty', 'COD_PRODUTO:code:FK', 'QTD:qty', 'VL_UNIT:money', 'VL_ITEM:money'), 97.9, { concept: 'OrderItem' }),
  A('erp', 'sales', 'PRODUTOS', 'table', 9482, cols('sql', 'COD_PRODUTO:code:PK', 'DESCRICAO:text', 'CATEGORIA:enum:e=Fibra/Roteadores/Cabos/Acessórios', 'VL_TABELA:money', 'ATIVO:bool', 'DT_CADASTRO:date'), 99.1, { concept: 'Product' }),
  A('erp', 'sales', 'DEVOLUCOES', 'table', 94820, cols('sql', 'NUM_DEVOLUCAO:seq:PK', 'NUM_PEDIDO:seq:FK', 'VL_DEVOLVIDO:money', 'MOTIVO:enum:e=Defeito/Arrependimento/Erro de pedido', 'DT_DEVOLUCAO:date'), 97.2),
  A('erp', 'sales', 'sales_raw', 'table', 1824239, cols('sql', ...RAW53), 91.3, { declaredCols: 53 }),
  ...EXTRA('erp', 'sales', ['VENDEDORES', 'CANAIS', 'REGIOES', 'CONDICOES_PGTO', 'TABELA_PRECO'], 'sql'),
  ...EXTRA('erp', 'estoque', ['ESTOQUE_SALDO', 'ESTOQUE_MOV', 'DEPOSITOS', 'FORNECEDORES', 'COMPRAS', 'ITENS_COMPRA', 'INVENTARIO'], 'sql', 22000),
  ...EXTRA('erp', 'fiscal', ['NOTAS_SAIDA', 'NOTAS_ENTRADA', 'CFOP', 'IMPOSTOS', 'LIVRO_FISCAL'], 'sql', 31000),
  ...EXTRA('erp', 'financeiro', ['TITULOS_RECEBER', 'TITULOS_PAGAR', 'BANCOS', 'CONCILIACAO', 'PLANO_CONTAS'], 'sql', 52000),

  A('crm', 'api', 'customers', 'resource', 398420, cols('json', 'customer_id:int:PK', 'full_name:name', 'customer_document:cpf:?:n=0.4', 'email:email', 'phone:phone:n=6', 'segment:enum:?:e=Enterprise/Mid-market/SMB/Consumer:via=Assistido por IA', 'account_manager:name', 'created_at:datetime', 'revenue:money', 'region:uf'), 95.7, { concept: 'Customer' }),
  A('crm', 'api', 'opportunities', 'resource', 61204, cols('json', 'opportunity_id:int:PK', 'customer_id:int:FK', 'stage:enum:e=Prospect/Proposta/Negociação/Ganha/Perdida', 'amount:money', 'close_date:date', 'owner:name'), 96.1),
  A('crm', 'api', 'activities', 'resource', 884130, cols('json', 'activity_id:int:PK', 'customer_id:int:FK', 'type:enum:e=Ligação/E-mail/Reunião/Visita', 'due_at:datetime', 'done:bool'), 97.4),
  ...EXTRA('crm', 'api', ['contacts', 'accounts', 'campaigns', 'quotes', 'tickets', 'notes', 'tasks', 'users', 'pipelines'], 'json', 12000, 'resource'),

  A('legacy', 'clientes.xlsx', 'Clientes', 'sheet', 839, cols('file', 'CODIGO_CLIENTE:int:PK', 'NOME:name', 'CPF:cpf:n=0.2', 'REGIAO:uf', 'TELEFONE:phone:n=12', 'DT_CADASTRO:date'), 88.2, { fresh: 'stale', updated: 'há 12 dias', concept: 'Customer' }),
  A('legacy', 'clientes.xlsx', 'Resumo', 'sheet', 39, cols('file', 'REGIAO:uf', 'QTD_CLIENTES:qty', 'META:money', 'REALIZADO:money'), 90.5, { fresh: 'stale', updated: 'há 12 dias' }),

  A('svc', 'public', 'service_orders', 'table', 1302400, cols('pg', 'id:uuid:PK', 'customer_id:int:FK', 'asset_id:code:FK', 'technician_id:int:FK', 'opened_at:datetime', 'closed_at:datetime:n=18', 'status:enum:e=Aberta/Em campo/Concluída/Cancelada', 'sla_min:qty', 'type:enum:e=Instalação/Reparo/Troca/Preventiva'), 97.6),
  A('svc', 'public', 'technicians', 'table', 412, cols('pg', 'id:int:PK', 'name:name', 'team:enum:e=Norte/Sul/Leste', 'phone:phone', 'active:bool'), 99.4),
  A('svc', 'public', 'maintenance', 'table', 218040, cols('pg', 'id:int:PK', 'asset_id:code:FK', 'kind:enum:e=Preventiva/Corretiva', 'performed_at:datetime', 'cost:money'), 96.2),
  ...EXTRA('svc', 'public', ['customers', 'orders', 'order_items', 'products', 'warehouses', 'routes'], 'pg'),

  A('geo', 'layers', 'assets', 'layer', 82419, cols('json', 'asset_id:code:PK', 'type:enum:e=Poste/Caixa/Cabine/Torre', 'lat:lat', 'lng:lng', 'status:enum:e=Operacional/Manutenção/Desativado', 'installed:date'), 99.0, { concept: 'Asset' }),
  A('telemetry', 'mqtt', 'telemetry_events', 'stream', 38400000, cols('json', 'event_id:uuid:PK', 'ts:datetime', 'device_id:code', 'metric:enum:e=rx_power/tx_power/latency/temperature', 'value:pct', 'site:code', 'quality:enum:e=good/degraded'), 99.2, { fresh: 'live', updated: 'agora' }),
  A('invoices', 'pdf', 'invoice_documents', 'documents', 320, cols('json', 'file_name:code:PK', 'supplier_cnpj:cnpj', 'issue_date:date', 'total:money', 'service_description:text:via=Assistido por IA', 'extraction_status:enum:e=Pronto/Revisão/Processado'), 94.8),
  A('salesimport', 'sftp', 'sales_2026.csv', 'file', 412860, cols('file', 'order_ref:code:PK', 'customer_cpf:cpf:i=2', 'product_code:code', 'qty:qty', 'unit_price:money', 'sold_at:date', 'region:uf'), 92.4),
  A('payments', 'webhook', 'payment_events', 'stream', 482100, cols('json', 'event_id:uuid:PK', 'type:enum:e=payment.paid/payment.failed/refund', 'amount:money', 'customer_id:int:FK', 'received_at:datetime'), 98.3, { fresh: 'live', updated: 'há 2 s' }),
  A('orderevents', 'api', 'orders', 'resource', 96000, cols('json', 'id:seq:PK', 'date:datetime', 'customer:code', 'items:text', 'total:money'), 96.0),
  A('nfe', 'xml', 'nfe.xml', 'file', 3100, cols('json', 'chave:code:PK', 'emit_cnpj:cnpj', 'dest_cpf:cpf', 'dh_emi:datetime', 'v_nf:money'), 97.0),
  A('as400', 'LIB_ERP', 'CLIMAST', 'table', 266000, cols('sql', 'CLCOD:int:PK', 'CLNOM:name', 'CLCGC:cpf', 'CLUF:uf', 'CLDTCAD:date'), 90.1),
  A('billing', 'public', 'invoices', 'table', 2210400, cols('pg', 'id:uuid:PK', 'customer_id:int:FK', 'amount:money', 'due_date:date', 'paid:bool'), 98.0),
  ...EXTRA('billing', 'public', ['subscriptions', 'plans', 'payments', 'credits', 'refunds', 'dunning', 'tax_rules', 'ledger'], 'pg', 40000),
  ...EXTRA('ga4', 'api', ['sessions', 'events', 'conversions', 'campaigns', 'pages', 'audiences'], 'json', 90000, 'resource'),
  ...EXTRA('shopify', 'api', ['orders', 'customers', 'products', 'inventory', 'refunds', 'discounts', 'checkouts', 'fulfillments'], 'json', 14000, 'resource'),
  ...EXTRA('s3lake', 'lake', ['events_2026', 'clicks', 'sessions', 'catalog_snapshot', 'cdr', 'logs_edge', 'billing_export', 'crm_export'], 'file', 3100000, 'file'),
  ...EXTRA('sheets', 'drive', ['targets_2026', 'regional_budget'], 'file', 240, 'sheet'),
  ...EXTRA('kafka', 'topics', ['billing.events', 'billing.retries'], 'json', 500000, 'stream'),
  ...EXTRA('payments', 'webhook', ['refund_events'], 'json', 12000, 'stream'),
  ...EXTRA('nfe', 'xml', ['nfe_items', 'nfe_cancel'], 'json', 3100, 'file'),
  ...EXTRA('orderevents', 'api', ['order_items', 'customers'], 'json', 96000, 'resource'),
  ...EXTRA('geo', 'layers', ['sites', 'routes'], 'json', 4200, 'layer'),
  ...EXTRA('as400', 'LIB_ERP', ['PEDMAST', 'PRDMAST', 'ESTMAST'], 'sql', 80000),
];
export const assetById = (id: string) => ASSETS.find((a) => a.id === id);
export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
export const assetsOf = (sid: string) => ASSETS.filter((a) => a.source === sid);
export const colCount = (a: Asset) => a.declaredCols ?? a.cols.length;

/* ───────────────────────── relacionamentos ───────────────────────── */
export interface Rel {
  id: string; from: string; to: string; kind: 'declared' | 'inferred' | 'suggested'; card: 'N:1' | '1:1' | '1:N' | 'N:N'; conf: number;
  evidence: string[]; overlap?: number; cross?: boolean;
}
export const RELS: Rel[] = [
  { id: 'r1', from: 'erp.pedidos.COD_CLIENTE', to: 'erp.clientes.COD_CLIENTE', kind: 'declared', card: 'N:1', conf: 100, evidence: ['Chave estrangeira declarada no banco', 'Sobreposição de valores 100%'], overlap: 100 },
  { id: 'r2', from: 'erp.itens_pedido.NUM_PEDIDO', to: 'erp.pedidos.NUM_PEDIDO', kind: 'declared', card: 'N:1', conf: 100, evidence: ['Chave estrangeira declarada no banco', 'Sobreposição de valores 100%'], overlap: 100 },
  { id: 'r3', from: 'erp.itens_pedido.COD_PRODUTO', to: 'erp.produtos.COD_PRODUTO', kind: 'declared', card: 'N:1', conf: 100, evidence: ['Chave estrangeira declarada no banco'], overlap: 100 },
  { id: 'r4', from: 'erp.devolucoes.NUM_PEDIDO', to: 'erp.pedidos.NUM_PEDIDO', kind: 'inferred', card: 'N:1', conf: 97, evidence: ['Compatibilidade de tipo (BIGINT)', 'Sobreposição de valores 99,6%', 'Similaridade de nome'], overlap: 99.6 },
  { id: 'r5', from: 'crm.customers.customer_id', to: 'erp.clientes.COD_CLIENTE', kind: 'suggested', card: '1:1', conf: 94, evidence: ['Compatibilidade de tipo (inteiro)', 'Sobreposição de valores 94,3%', 'Conceito existente: Customer', 'Decisão anterior aceita em Legacy Customers'], overlap: 94.3, cross: true },
  { id: 'r6', from: 'crm.opportunities.customer_id', to: 'crm.customers.customer_id', kind: 'inferred', card: 'N:1', conf: 98, evidence: ['Compatibilidade de tipo', 'Sobreposição de valores 98,2%', 'Similaridade de nome'], overlap: 98.2 },
  { id: 'r7', from: 'legacy.clientes.CPF', to: 'erp.clientes.CPF', kind: 'suggested', card: '1:1', conf: 94, evidence: ['Ambos classificados como CPF brasileiro', 'Sobreposição de valores 91,7%', 'Mesmo conceito: Customer.CPF'], overlap: 91.7, cross: true },
  { id: 'r8', from: 'svc.maintenance.asset_id', to: 'geo.assets.asset_id', kind: 'suggested', card: 'N:1', conf: 91, evidence: ['Padrão de código idêntico (AA-9999)', 'Sobreposição de valores 96,4%', 'Conceito: Asset'], overlap: 96.4, cross: true },
  { id: 'r9', from: 'svc.service_orders.customer_id', to: 'erp.clientes.COD_CLIENTE', kind: 'inferred', card: 'N:1', conf: 92, evidence: ['Compatibilidade de tipo', 'Sobreposição de valores 92,0%'], overlap: 92, cross: true },
  { id: 'r10', from: 'crm.customers.customer_document', to: 'erp.clientes.CPF', kind: 'suggested', card: '1:1', conf: 96, evidence: ['Ambos CPF brasileiro (dígito verificador válido)', 'Sobreposição de valores 83%', 'Mesmo conceito: Customer.CPF'], overlap: 83, cross: true },
];
/** Entidade de negócio que reúne colunas equivalentes de fontes diferentes. */
export const ENTITY_LINKS = [
  { concept: 'Customer.CPF', members: ['erp.clientes.CPF', 'crm.customers.customer_document', 'legacy.clientes.CPF'], conf: 96 },
  { concept: 'Customer.Code', members: ['erp.clientes.COD_CLIENTE', 'crm.customers.customer_id', 'legacy.clientes.CODIGO_CLIENTE'], conf: 94 },
];
export const relsOfAsset = (id: string) => RELS.filter((r) => r.from.startsWith(`${id}.`) || r.to.startsWith(`${id}.`));
export const colLabel = (ref: string) => { const [s, a, ...c] = ref.split('.'); const as = assetById(`${s}.${a}`); return `${sourceById(s ?? '')?.name.split(' ')[0] ?? s}.${as?.name ?? a}.${c.join('.')}`; };
