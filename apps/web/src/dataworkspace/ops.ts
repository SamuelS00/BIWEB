/** Dados operacionais do Data Workspace: modelos, mapeamentos, qualidade, ChangeSets, runs, datasets publicados, linhagem e enriquecimento. */
export type ChangeStatus = 'draft' | 'proposed' | 'approved' | 'applied' | 'rejected';
export type RunStatus = 'running' | 'completed' | 'failed' | 'paused' | 'pending' | 'interrupted';
export const CHANGE_LABEL: Record<ChangeStatus, string> = { draft: 'Rascunho', proposed: 'Proposto', approved: 'Aprovado', applied: 'Aplicado', rejected: 'Rejeitado' };
export const RUN_LABEL: Record<RunStatus, string> = { running: 'Em execução', completed: 'Concluída', failed: 'Falhou', paused: 'Pausada', pending: 'Na fila', interrupted: 'Interrompida' };

/* ───────────── modelos (ERD) ───────────── */
export interface MCol { n: string; flag?: 'PK' | 'FK'; t?: string }
export interface MNode { id: string; title: string; sub?: string; x: number; y: number; cols: MCol[]; metrics?: string[]; tone?: 'source' | 'entity' | 'dataset' | 'fact' | 'dim' }
export interface MEdge { id: string; from: string; to: string; card: 'N:1' | '1:1' | '1:N' | 'N:N'; label: string; conf?: number; kind: 'declared' | 'inferred' | 'suggested'; ev?: string[]; dashed?: boolean }
export interface ModelGraph { nodes: MNode[]; edges: MEdge[] }

const N = (id: string, title: string, x: number, y: number, cols: string[], extra: Partial<MNode> = {}): MNode =>
  ({ id, title, x, y, cols: cols.map((c) => { const [n = '', f, t] = c.split(':'); return { n, flag: f === 'PK' || f === 'FK' ? f : undefined, t: f === 'PK' || f === 'FK' ? t : f }; }), ...extra });
const E = (id: string, from: string, to: string, card: MEdge['card'], label: string, kind: MEdge['kind'] = 'declared', conf?: number, ev?: string[], dashed?: boolean): MEdge => ({ id, from, to, card, label, kind, conf, ev, dashed });

export const MODEL_GRAPHS: Record<string, ModelGraph> = {
  physical: {
    nodes: [
      N('erp.clientes', 'CLIENTES', 40, 40, ['COD_CLIENTE:PK:INT', 'NOME:VARCHAR(80)', 'CPF:VARCHAR(20)', 'EMAIL:VARCHAR(120)', 'CEP:VARCHAR(9)', 'UF:CHAR(2)'], { sub: 'ERP Production', tone: 'source' }),
      N('erp.pedidos', 'PEDIDOS', 360, 40, ['NUM_PEDIDO:PK:BIGINT', 'COD_CLIENTE:FK:INT', 'DT_PEDIDO:DATETIME2', 'VL_TOTAL:DECIMAL(14,2)', 'STATUS:VARCHAR(24)'], { sub: 'ERP Production', tone: 'source' }),
      N('erp.itens_pedido', 'ITENS_PEDIDO', 680, 40, ['NUM_PEDIDO:FK:BIGINT', 'COD_PRODUTO:FK:VARCHAR(12)', 'QTD:INT', 'VL_ITEM:DECIMAL(14,2)'], { sub: 'ERP Production', tone: 'source' }),
      N('erp.produtos', 'PRODUTOS', 680, 270, ['COD_PRODUTO:PK:VARCHAR(12)', 'DESCRICAO:VARCHAR(200)', 'CATEGORIA:VARCHAR(24)', 'VL_TABELA:DECIMAL(14,2)'], { sub: 'ERP Production', tone: 'source' }),
      N('erp.devolucoes', 'DEVOLUCOES', 360, 270, ['NUM_DEVOLUCAO:PK:BIGINT', 'NUM_PEDIDO:FK:BIGINT', 'VL_DEVOLVIDO:DECIMAL(14,2)'], { sub: 'ERP Production', tone: 'source' }),
      N('crm.customers', 'customers', 40, 330, ['customer_id:PK:integer', 'full_name:string', 'customer_document:string', 'segment:string'], { sub: 'CRM Cloud', tone: 'source' }),
      N('legacy.clientes', 'Clientes', 40, 520, ['CODIGO_CLIENTE:PK:número', 'NOME:texto', 'CPF:texto', 'REGIAO:texto'], { sub: 'Legacy Customers · xlsx', tone: 'source' }),
    ],
    edges: [
      E('p1', 'erp.pedidos', 'erp.clientes', 'N:1', 'COD_CLIENTE', 'declared', 100), E('p2', 'erp.itens_pedido', 'erp.pedidos', 'N:1', 'NUM_PEDIDO', 'declared', 100), E('p3', 'erp.itens_pedido', 'erp.produtos', 'N:1', 'COD_PRODUTO', 'declared', 100),
      E('p4', 'erp.devolucoes', 'erp.pedidos', 'N:1', 'NUM_PEDIDO', 'inferred', 97, ['Sobreposição 99,6%']),
      E('p5', 'crm.customers', 'erp.clientes', '1:1', 'customer_id ↔ COD_CLIENTE', 'suggested', 94, ['Sobreposição 94,3%', 'Conceito Customer'], true),
      E('p6', 'legacy.clientes', 'erp.clientes', '1:1', 'CPF ↔ CPF', 'suggested', 94, ['Mesmo conceito Customer.CPF'], true),
    ],
  },
  'logical:source': {
    nodes: [
      N('sales_raw', 'sales_raw', 300, 20, ['order_id:PK:BIGINT', 'order_date', 'customer_code', 'customer_name', 'customer_cpf', 'customer_email', 'customer_cep', 'region_name', 'product_code', 'product_name', 'item_qty', 'item_total', 'order_total', 'payment_method', '… +40 colunas'], { sub: '53 colunas · tabela larga', tone: 'source' }),
    ],
    edges: [],
  },
  'logical:proposed': {
    nodes: [
      N('Customer', 'CUSTOMER', 30, 150, ['customer_id:PK', 'name', 'email', 'document', 'region_id:FK'], { sub: 'Entidade', tone: 'entity', metrics: ['LTV', 'Pedidos'] }),
      N('Order', 'ORDER', 360, 150, ['order_id:PK', 'customer_id:FK', 'order_date', 'total_amount', 'status'], { sub: 'Entidade', tone: 'entity', metrics: ['Receita líquida'] }),
      N('OrderItem', 'ORDER_ITEM', 690, 150, ['order_id:FK', 'product_id:FK', 'qty', 'unit_price'], { sub: 'Entidade', tone: 'entity' }),
      N('Product', 'PRODUCT', 690, 380, ['product_id:PK', 'name', 'category', 'list_price'], { sub: 'Entidade', tone: 'entity' }),
      N('Region', 'REGION', 30, 380, ['region_id:PK', 'state', 'name', 'ibge_code'], { sub: 'Entidade · referência', tone: 'entity' }),
    ],
    edges: [
      E('l1', 'Order', 'Customer', 'N:1', 'customer_id', 'inferred', 98, ['Valor sobreposto 99,9%', 'Cliente repetido em 61% das linhas de sales_raw']), E('l2', 'OrderItem', 'Order', 'N:1', 'order_id', 'inferred', 99, ['Chave composta order_id + item']),
      E('l3', 'OrderItem', 'Product', 'N:1', 'product_id', 'inferred', 97, ['Descrição de produto repetida']), E('l4', 'Customer', 'Region', 'N:1', 'region_id', 'suggested', 93, ['UF + região em sales_raw', 'Dados de referência IBGE']),
    ],
  },
  curated: {
    nodes: [
      N('c.customers', 'Customers Curated', 30, 40, ['customer_id:PK', 'name', 'document', 'segment', 'region_id:FK', 'ltv'], { sub: 'v3 · publicado', tone: 'dataset', metrics: ['LTV', 'Pedidos'] }),
      N('c.orders', 'Orders Curated', 380, 40, ['order_id:PK', 'customer_id:FK', 'order_date', 'net_amount', 'status'], { sub: 'v7 · publicado', tone: 'dataset', metrics: ['Receita líquida'] }),
      N('c.items', 'Order Items Curated', 730, 40, ['order_id:FK', 'product_id:FK', 'qty', 'net_total'], { sub: 'v4 · publicado', tone: 'dataset' }),
      N('c.products', 'Products Curated', 730, 270, ['product_id:PK', 'name', 'category'], { sub: 'v2 · publicado', tone: 'dataset' }),
      N('c.regions', 'Regions Reference', 30, 300, ['region_id:PK', 'state', 'ibge_code', 'latitude', 'longitude'], { sub: 'v1 · referência', tone: 'dataset' }),
    ],
    edges: [E('k1', 'c.orders', 'c.customers', 'N:1', 'customer_id', 'declared', 100), E('k2', 'c.items', 'c.orders', 'N:1', 'order_id', 'declared', 100), E('k3', 'c.items', 'c.products', 'N:1', 'product_id', 'declared', 100), E('k4', 'c.customers', 'c.regions', 'N:1', 'region_id', 'declared', 100)],
  },
  dimensional: {
    nodes: [
      N('fact', 'FACT_ORDERS', 330, 150, ['order_key:PK', 'customer_key:FK', 'product_key:FK', 'region_key:FK', 'date_key:FK', 'net_amount', 'qty'], { sub: 'Fato', tone: 'fact', metrics: ['Receita líquida', 'Quantidade'] }),
      N('dim.customer', 'DIM_CUSTOMER', 30, 30, ['customer_key:PK', 'name', 'segment', 'document'], { sub: 'Dimensão', tone: 'dim' }),
      N('dim.product', 'DIM_PRODUCT', 640, 30, ['product_key:PK', 'name', 'category'], { sub: 'Dimensão', tone: 'dim' }),
      N('dim.region', 'DIM_REGION', 30, 340, ['region_key:PK', 'state', 'region'], { sub: 'Dimensão', tone: 'dim' }),
      N('dim.date', 'DIM_DATE', 640, 340, ['date_key:PK', 'year', 'quarter', 'month', 'weekday'], { sub: 'Dimensão', tone: 'dim' }),
    ],
    edges: [E('d1', 'fact', 'dim.customer', 'N:1', 'customer_key', 'declared', 100), E('d2', 'fact', 'dim.product', 'N:1', 'product_key', 'declared', 100), E('d3', 'fact', 'dim.region', 'N:1', 'region_key', 'declared', 100), E('d4', 'fact', 'dim.date', 'N:1', 'date_key', 'declared', 100)],
  },
};

export const MODELS = [
  { id: 'customer', name: 'Customer 360', status: 'Publicado', sources: 3 }, { id: 'sales', name: 'Sales Model', status: 'Proposta', sources: 2 }, { id: 'ops', name: 'Field Operations', status: 'Publicado', sources: 2 },
  { id: 'billing', name: 'Billing & Revenue', status: 'Publicado', sources: 2 }, { id: 'network', name: 'Network Quality', status: 'Publicado', sources: 1 }, { id: 'assets', name: 'Asset Registry', status: 'Publicado', sources: 2 },
  { id: 'product', name: 'Product Catalog', status: 'Publicado', sources: 2 }, { id: 'fiscal', name: 'Fiscal Documents', status: 'Publicado', sources: 2 }, { id: 'marketing', name: 'Marketing Funnel', status: 'Publicado', sources: 2 },
  { id: 'ecom', name: 'E-commerce Orders', status: 'Publicado', sources: 2 }, { id: 'targets', name: 'Sales Targets', status: 'Proposta', sources: 1 }, { id: 'payments', name: 'Payments', status: 'Publicado', sources: 2 },
];
export const ALTERNATIVES = [
  { id: 'normalized', name: 'Normalizado', best: 'Integridade e reuso de entidades', complexity: 'Média', redundancy: 'Baixa', joins: 'Mais junções (4 adicionais)', use: 'Aplicações operacionais e Customer 360', rec: true },
  { id: 'dimensional', name: 'Dimensional', best: 'Relatórios e painéis de BI', complexity: 'Média', redundancy: 'Moderada', joins: 'Poucas, em estrela', use: 'Report Builder e consultas agregadas' },
  { id: 'analytical', name: 'Analítico (tabela larga)', best: 'Exploração rápida e ML', complexity: 'Baixa', redundancy: 'Alta', joins: 'Nenhuma', use: 'Análises ad hoc e notebooks' },
];

/* ───────────── mapeamentos & transformações ───────────── */
export interface MapRow { id: string; src: string; tgt: string; tr: string; strategy: string; dedup: string; load: string; conf: number; ver: string; sample: [string, string]; fail: number }
export interface MapSet { id: string; name: string; from: string; to: string; rows: MapRow[]; version: string }
const M = (id: string, src: string, tgt: string, tr: string, sample: [string, string], conf: number, fail = 0, strategy = 'Chave natural', load = 'Incremental (upsert)'): MapRow =>
  ({ id, src, tgt, tr, strategy, dedup: 'Última versão por chave', load, conf, ver: 'v14', sample, fail });
export const MAPPINGS: MapSet[] = [
  { id: 'map-customer-erp', name: 'ERP.CLIENTES → Customer', from: 'ERP Production', to: 'Customer', version: 'v14', rows: [
    M('m1', 'COD_CLIENTE', 'customer_id', 'Cast para texto', ['1048', '"1048"'], 99),
    M('m2', 'NOME', 'name', 'Trim · Capitalizar', ['  maria SILVA ', 'Maria Silva'], 97),
    M('m3', 'CPF', 'document', 'normalizeCpf()', ['123.456.789-09', '12345678909'], 94, 842),
    M('m4', 'EMAIL', 'email', 'Minúsculas · Validar', ['Ana.Lima@Gmail.com', 'ana.lima@gmail.com'], 98, 31),
    M('m5', 'UF', 'region_id', 'Junção com Regions (referência)', ['SP', 'REG-SP'], 92),
    M('m6', 'DT_CADASTRO', 'created_at', 'Normalizar datas', ['10/10/26', '2026-10-10'], 96, 16),
  ] },
  { id: 'map-customer-crm', name: 'CRM.customers → Customer', from: 'CRM Cloud', to: 'Customer', version: 'v9', rows: [
    M('m7', 'customer_id', 'customer_id', 'Cast para texto', ['5521', '"5521"'], 95), M('m8', 'full_name', 'name', 'Trim · Capitalizar', ['JOÃO  PEREIRA', 'João Pereira'], 97),
    M('m9', 'customer_document', 'document', 'normalizeCpf()', ['987.654.321-00', '98765432100'], 96, 12), M('m10', 'segment', 'segment', 'Mapa de valores', ['Mid-market', 'MID_MARKET'], 88),
  ] },
  { id: 'map-order', name: 'ERP.PEDIDOS → Order', from: 'ERP Production', to: 'Order', version: 'v11', rows: [
    M('m11', 'NUM_PEDIDO', 'order_id', 'Cast', ['1830021', '1830021'], 99), M('m12', 'COD_CLIENTE', 'customer_id', 'Resolver cliente', ['1048', 'C-1048'], 91, 1284), M('m13', 'DT_PEDIDO', 'order_date', 'Normalizar datas', ['2026-10-10 09:12', '2026-10-10T09:12Z'], 97),
    M('m14', 'VL_TOTAL − devoluções', 'total_amount', 'Normalizar moeda · subtrair devoluções', ['R$ 1.249,90', '1249.90'], 93),
  ] },
];
export const PIPELINES = [
  { id: 'pl-sales', name: 'Sales Import → Orders Curated', steps: [
    { id: 's0', label: 'Sales CSV', kind: 'Fonte', rows: 412860, zone: '' }, { id: 's1', label: 'RAW Sales', kind: 'Zona RAW', rows: 412860, zone: 'RAW' }, { id: 's2', label: 'Cast Types', kind: 'Transformação', rows: 412860, zone: 'STAGING' },
    { id: 's3', label: 'Normalize Dates', kind: 'Transformação', rows: 412844, zone: 'STAGING' }, { id: 's4', label: 'Resolve Customer', kind: 'Transformação', rows: 411560, zone: 'STAGING' }, { id: 's5', label: 'Validate (G2)', kind: 'Quality gate', rows: 410312, zone: 'QUARANTINE' }, { id: 's6', label: 'Orders Curated', kind: 'Dataset', rows: 410312, zone: 'CURATED' },
  ] },
];
export const RULES = [
  { id: 'ru1', name: 'normalizeCpf', desc: 'Remove máscara e valida dígito verificador', used: 4, status: 'Ativa' }, { id: 'ru2', name: 'normalizeDate', desc: 'dd/mm/aa, dd/mm/aaaa e ISO 8601 → ISO 8601', used: 6, status: 'Ativa' },
  { id: 'ru3', name: 'trimAndTitleCase', desc: 'Remove espaços e capitaliza nomes', used: 5, status: 'Ativa' }, { id: 'ru4', name: 'normalizeCurrency', desc: 'Converte R$ 1.249,90 → 1249.90 (BRL)', used: 3, status: 'Ativa' }, { id: 'ru5', name: 'resolveCustomer', desc: 'Busca cliente por CPF e código legado', used: 2, status: 'Em revisão' },
];

/* ───────────── qualidade ───────────── */
export interface QDataset { id: string; name: string; health: number; completeness: number; validity: number; uniqueness: number; consistency: number; refint: number; freshness: number; recon: number; g1: 'pass' | 'warn' | 'fail'; g2: 'pass' | 'warn' | 'fail'; g3: 'pass' | 'warn' | 'fail'; fresh: string; lastRun: string; issues: { id: string; title: string; count: number; sev: 'high' | 'medium' | 'low'; col: string }[]; rows: number; amount?: string; quarantine?: number }
const Q = (id: string, name: string, h: number, c: number, v: number, u: number, co: number, r: number, f: number, rc: number, g: [QDataset['g1'], QDataset['g2'], QDataset['g3']], fresh: string, lastRun: string, rows: number, issues: QDataset['issues'] = [], extra: Partial<QDataset> = {}): QDataset =>
  ({ id, name, health: h, completeness: c, validity: v, uniqueness: u, consistency: co, refint: r, freshness: f, recon: rc, g1: g[0], g2: g[1], g3: g[2], fresh, lastRun, rows, issues, ...extra });
export const QUALITY: QDataset[] = [
  Q('orders', 'Orders Curated', 96.8, 99.4, 98.9, 97.1, 96.0, 94.2, 100, 100, ['pass', 'warn', 'pass'], 'Saudável · 4 min', '13:42', 1824239, [
    { id: 'qi1', title: 'CPF inválido', count: 842, sev: 'high', col: 'document' }, { id: 'qi2', title: 'Cliente ausente (customer_id)', count: 312, sev: 'medium', col: 'customer_id' }, { id: 'qi3', title: 'order_id duplicado', count: 94, sev: 'low', col: 'order_id' },
  ], { amount: 'R$ 82,41 mi', quarantine: 1248 }),
  Q('customers', 'Customers Curated', 98.4, 99.1, 99.0, 98.7, 97.9, 98.2, 100, 100, ['pass', 'pass', 'pass'], 'Saudável · 4 min', '13:42', 412806, [{ id: 'qi4', title: 'E-mail com formato inválido', count: 31, sev: 'low', col: 'email' }]),
  Q('items', 'Order Items Curated', 97.5, 99.7, 99.2, 100, 96.1, 93.9, 100, 99.9, ['pass', 'pass', 'warn'], 'Saudável · 4 min', '13:42', 5120733, [{ id: 'qi5', title: 'Produto não encontrado', count: 118, sev: 'medium', col: 'product_id' }]),
  Q('products', 'Products Curated', 99.1, 99.8, 99.5, 99.9, 98.8, 99.3, 100, 100, ['pass', 'pass', 'pass'], 'Saudável · 1 h', '12:10', 9482),
  Q('serviceorders', 'Service Orders Curated', 95.2, 97.8, 96.9, 99.4, 93.8, 91.2, 92, 99.8, ['pass', 'warn', 'pass'], 'Saudável · 9 min', '13:37', 1302400, [{ id: 'qi6', title: 'closed_at anterior a opened_at', count: 2230, sev: 'medium', col: 'closed_at' }, { id: 'qi7', title: 'asset_id sem ativo correspondente', count: 3981, sev: 'medium', col: 'asset_id' }]),
  Q('assets', 'Field Assets Curated', 99.0, 99.6, 99.4, 100, 98.1, 97.5, 96, 100, ['pass', 'pass', 'pass'], 'Saudável · 3 h', '10:30', 82419),
  Q('invoices', 'Invoices Extracted', 94.8, 96.4, 95.0, 99.0, 93.0, 92.0, 98, 99.0, ['warn', 'warn', 'pass'], 'Revisão pendente', '13:10', 320, [{ id: 'qi8', title: 'Campo com baixa confiança', count: 3, sev: 'medium', col: 'service_description' }]),
  Q('legacy', 'Legacy Customers (staging)', 88.2, 91.0, 87.5, 98.0, 84.0, 80.1, 38, 96.0, ['pass', 'warn', 'fail'], 'Desatualizado · 12 dias', '01/10', 839, [{ id: 'qi9', title: 'Planilha sem atualização há 12 dias', count: 1, sev: 'high', col: '—' }, { id: 'qi10', title: 'CPF duplicado entre linhas', count: 17, sev: 'medium', col: 'CPF' }]),
  Q('billing', 'Billing Invoices', 98.0, 99.4, 98.8, 100, 97.0, 96.8, 100, 100, ['pass', 'pass', 'pass'], 'Saudável · 11 min', '13:35', 2210400),
];
export const QUARANTINE = { total: 1248, reasons: [{ id: 'cpf', label: 'CPF inválido', n: 842, fixable: 811 }, { id: 'cust', label: 'Cliente ausente', n: 312, fixable: 0 }, { id: 'date', label: 'Data inválida', n: 94, fixable: 62 }] };
export const GATES = [
  { id: 'G1', name: 'Ingestão', checks: ['Schema esperado', 'Integridade do arquivo/lote', 'Volume dentro da faixa'], zone: 'RAW' },
  { id: 'G2', name: 'Transformação', checks: ['Tipos e conversões', 'Nulos obrigatórios', 'Chaves únicas', 'Relacionamentos'], zone: 'STAGING' },
  { id: 'G3', name: 'Publicação', checks: ['Reconciliação com a origem', 'Regras de negócio', 'Frescor / SLA'], zone: 'CURATED' },
];

/* ───────────── ChangeSets & drift ───────────── */
export interface Diff { op: '+' | '~' | '-'; text: string; cls: 'ADDITIVE' | 'COMPATIBLE' | 'BREAKING' }
export interface ChangeSet {
  id: string; title: string; type: string; risk: 'Aditivo' | 'Compatível' | 'Breaking'; status: ChangeStatus; created: string; author: string; summary: string;
  diff: { entity: string; changes: Diff[] }[]; mappings: string[]; quality: { name: string; ok: boolean }[];
  impact: { models: number; mappings: number; datasets: number; reports: number; maps: number; workflows: number }; affected: { kind: string; name: string; to: string }[]; history: { at: string; who: string; what: string }[];
}
export const CHANGESETS: ChangeSet[] = [
  { id: 'CS-184', title: 'Normalize Customer Model', type: 'Modelo', risk: 'Compatível', status: 'proposed', created: 'hoje 13:21', author: 'Data Copilot', summary: 'Separa sales_raw (53 colunas) em CUSTOMER, ORDER, ORDER_ITEM, PRODUCT e REGION. Reduz duplicação de dados de clientes e habilita uma entidade Customer reutilizável.',
    diff: [
      { entity: 'CUSTOMER', changes: [{ op: '+', text: 'customer_segment', cls: 'ADDITIVE' }, { op: '~', text: 'document  VARCHAR(20) → VARCHAR(14)', cls: 'COMPATIBLE' }, { op: '-', text: 'legacy_flag', cls: 'BREAKING' }] },
      { entity: 'ORDER', changes: [{ op: '+', text: 'customer_id (FK → CUSTOMER)', cls: 'ADDITIVE' }, { op: '~', text: 'order_total → total_amount', cls: 'COMPATIBLE' }] },
      { entity: 'REGION', changes: [{ op: '+', text: 'Nova entidade de referência (state, name, ibge_code)', cls: 'ADDITIVE' }] },
    ], mappings: ['ERP.CLIENTES → Customer (v14 → v15)', 'ERP.PEDIDOS → Order (v11 → v12)', 'CRM.customers → Customer (v9)'],
    quality: [{ name: 'Chave única customer_id', ok: true }, { name: 'Integridade ORDER → CUSTOMER', ok: true }, { name: 'Reconciliação de contagem de linhas', ok: true }, { name: 'legacy_flag usado por 1 relatório', ok: false }],
    impact: { models: 2, mappings: 3, datasets: 6, reports: 4, maps: 2, workflows: 1 },
    affected: [{ kind: 'Modelo', name: 'Customer 360', to: '/data/model' }, { kind: 'Dataset', name: 'Customers Curated', to: '/data/published/customers' }, { kind: 'Dataset', name: 'Orders Curated', to: '/data/published/orders' }, { kind: 'Relatório', name: 'Executive Commercial', to: '/reports/net_executiva' }, { kind: 'Mapa', name: 'Field Operations & Routes', to: '/maps/field' }, { kind: 'Fluxo', name: 'Ingestão e normalização', to: '/workflows/ingestao' }],
    history: [{ at: '13:21', who: 'Data Copilot', what: 'Proposta criada a partir de "Normalize this dataset"' }, { at: '13:22', who: 'Sistema', what: 'Dry run em 10.000 linhas: 9.984 ok, 16 falhas' }] },
  { id: 'CS-183', title: 'CRM: novo campo customer_tier', type: 'Schema drift', risk: 'Aditivo', status: 'proposed', created: 'hoje 13:36', author: 'Schema watcher', summary: 'A API do CRM passou a expor customer_tier. Sugestão: classificar como Customer.Tier e incluir em Customers Curated.',
    diff: [{ entity: 'CRM.customers', changes: [{ op: '+', text: 'customer_tier  string', cls: 'ADDITIVE' }, { op: '~', text: 'revenue  Integer → Decimal', cls: 'COMPATIBLE' }, { op: '-', text: 'legacy_code', cls: 'BREAKING' }] }],
    mappings: ['CRM.customers → Customer (v9 → v10)'], quality: [{ name: 'Novo campo sem nulos obrigatórios', ok: true }, { name: 'revenue Integer → Decimal preserva valores', ok: true }, { name: 'legacy_code usado em 1 mapeamento', ok: false }],
    impact: { models: 2, mappings: 1, datasets: 2, reports: 4, maps: 1, workflows: 0 },
    affected: [{ kind: 'Modelo', name: 'Customer 360', to: '/data/model' }, { kind: 'Mapeamento', name: 'CRM.customers → Customer', to: '/data/transformations' }, { kind: 'Dataset', name: 'Customers Curated', to: '/data/published/customers' }, { kind: 'Relatório', name: 'Customer Intelligence', to: '/reports/net_executiva' }, { kind: 'Mapa', name: 'Field Operations', to: '/maps/field' }],
    history: [{ at: '13:36', who: 'Schema watcher', what: 'Mudança de schema detectada em CRM Cloud' }] },
  { id: 'CS-182', title: 'Enriquecer Customer com CEP → Localização', type: 'Enriquecimento', risk: 'Aditivo', status: 'draft', created: 'hoje 11:05', author: 'Marina Alves', summary: 'Adiciona município, UF, região e código IBGE a partir de CEP usando base de referência (sem transferência externa).',
    diff: [{ entity: 'CUSTOMER', changes: [{ op: '+', text: 'municipality, state, region, ibge_code', cls: 'ADDITIVE' }] }], mappings: ['Enrich: CEP → Location'], quality: [{ name: 'Cobertura ≥ 95%', ok: true }],
    impact: { models: 1, mappings: 1, datasets: 1, reports: 0, maps: 1, workflows: 0 }, affected: [{ kind: 'Dataset', name: 'Customers Curated', to: '/data/published/customers' }], history: [{ at: '11:05', who: 'Marina Alves', what: 'Rascunho criado' }] },
  { id: 'CS-181', title: 'Regra normalizeCpf em Sales Import', type: 'Mapeamento', risk: 'Compatível', status: 'approved', created: 'ontem 17:40', author: 'Data Copilot', summary: 'Aplica normalização de CPF na importação de vendas. 811 dos 842 valores em quarentena podem ser corrigidos.',
    diff: [{ entity: 'Sales Import', changes: [{ op: '~', text: 'customer_cpf: sem transformação → normalizeCpf()', cls: 'COMPATIBLE' }] }], mappings: ['Sales Import → Orders Curated'], quality: [{ name: '811 valores corrigidos', ok: true }, { name: '31 valores permanecem inválidos', ok: false }],
    impact: { models: 0, mappings: 1, datasets: 1, reports: 2, maps: 0, workflows: 1 }, affected: [{ kind: 'Dataset', name: 'Orders Curated', to: '/data/published/orders' }], history: [{ at: 'ontem 17:40', who: 'Data Copilot', what: 'Proposta criada' }, { at: 'ontem 18:12', who: 'Rafael Costa', what: 'Aprovado' }] },
  { id: 'CS-180', title: 'Renomear customer_code → customer_id', type: 'Schema drift', risk: 'Compatível', status: 'applied', created: '08/10', author: 'Schema watcher', summary: 'Renomeação detectada com 99% de similaridade de fingerprint; mapeamento preservado.',
    diff: [{ entity: 'ERP.CLIENTES', changes: [{ op: '~', text: 'customer_code → customer_id (mapeamento preservado)', cls: 'COMPATIBLE' }] }], mappings: ['ERP.CLIENTES → Customer'], quality: [{ name: 'Sem perda de dados', ok: true }],
    impact: { models: 1, mappings: 1, datasets: 1, reports: 1, maps: 0, workflows: 0 }, affected: [{ kind: 'Dataset', name: 'Customers Curated', to: '/data/published/customers' }], history: [{ at: '08/10', who: 'Schema watcher', what: 'Detectado' }, { at: '08/10', who: 'Rafael Costa', what: 'Aprovado e aplicado' }] },
  { id: 'CS-179', title: 'Remover legacy_flag de CUSTOMER', type: 'Modelo', risk: 'Breaking', status: 'rejected', created: '07/10', author: 'Marina Alves', summary: 'Remoção quebraria o relatório "Base legada". Rejeitado até migração do consumidor.',
    diff: [{ entity: 'CUSTOMER', changes: [{ op: '-', text: 'legacy_flag', cls: 'BREAKING' }] }], mappings: [], quality: [{ name: 'Consumidor ativo detectado', ok: false }],
    impact: { models: 1, mappings: 0, datasets: 1, reports: 1, maps: 0, workflows: 0 }, affected: [{ kind: 'Relatório', name: 'Base legada', to: '/reports' }], history: [{ at: '07/10', who: 'Marina Alves', what: 'Proposto' }, { at: '07/10', who: 'Rafael Costa', what: 'Rejeitado: consumidor ativo' }] },
  { id: 'CS-178', title: 'Publicar Field Assets Curated v2', type: 'Publicação', risk: 'Aditivo', status: 'applied', created: '06/10', author: 'Eng. Dados', summary: 'Adiciona camada de ativos com coordenadas validadas.', diff: [{ entity: 'Field Assets Curated', changes: [{ op: '+', text: 'lat, lng (EPSG:4326)', cls: 'ADDITIVE' }] }], mappings: [], quality: [{ name: 'Coordenadas válidas', ok: true }],
    impact: { models: 1, mappings: 0, datasets: 1, reports: 0, maps: 2, workflows: 0 }, affected: [{ kind: 'Mapa', name: 'Field Operations', to: '/maps/field' }], history: [{ at: '06/10', who: 'Eng. Dados', what: 'Aplicado' }] },
];
export const DRIFT = {
  source: 'crm', title: 'Mudança de schema detectada', where: 'CRM Cloud · customers', fields: [
    { op: '+' as const, name: 'customer_tier', note: 'string · sugestão: Customer.Tier', cls: 'ADDITIVE' as const }, { op: '~' as const, name: 'revenue', note: 'Integer → Decimal', cls: 'COMPATIBLE' as const }, { op: '-' as const, name: 'legacy_code', note: 'removido da API', cls: 'BREAKING' as const },
  ], rename: { removed: 'customer_code', added: 'customer_id', sim: 99 }, affected: ['Customer Model', 'Orders Mapping', 'Sales Dataset', 'Executive Commercial', 'Customer Map'],
};

/* ───────────── execuções ───────────── */
export interface Stage { id: string; name: string; state: 'ok' | 'running' | 'pending' | 'failed' | 'skipped'; dur: string; rows: number; bytes: string; warn: number; note?: string }
export interface Run { id: number; name: string; target: string; mode: string; started: string; dur: string; processed: number; status: RunStatus; stages: Stage[]; checkpoint?: string; error?: { gate: string; text: string }; flow?: { zone: string; rows: number }[] }
const ST = (...x: [string, Stage['state'], string, number, string, number?, string?][]): Stage[] => x.map(([name, state, dur, rows, bytes, warn = 0, note]) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, state, dur, rows, bytes, warn, note }));
const OK = (n: number) => ST(['Extract', 'ok', '12s', n, '84 MB'], ['RAW', 'ok', '4s', n, '84 MB'], ['Transform', 'ok', '9s', n, '71 MB'], ['Quality G2', 'ok', '3s', n, '—'], ['Merge', 'ok', '6s', n, '71 MB'], ['Reconcile', 'ok', '2s', n, '—'], ['Publish', 'ok', '2s', n, '—']);
export const RUNS: Run[] = [
  { id: 28497, name: 'ERP Incremental', target: 'ERP Production', mode: 'Incremental', started: '13:44', dur: '—', processed: 284000, status: 'running', stages: ST(['Extract', 'running', '—', 284000, '72 MB/s'], ['RAW', 'pending', '—', 0, '—'], ['Transform', 'pending', '—', 0, '—'], ['Quality G2', 'pending', '—', 0, '—'], ['Merge', 'pending', '—', 0, '—'], ['Reconcile', 'pending', '—', 0, '—'], ['Publish', 'pending', '—', 0, '—']) },
  { id: 28492, name: 'CRM Incremental', target: 'CRM Cloud', mode: 'Incremental', started: '13:42', dur: '38s', processed: 284000, status: 'completed', stages: OK(284000), flow: [{ zone: 'SOURCE', rows: 284000 }, { zone: 'RAW', rows: 284000 }, { zone: 'STAGING', rows: 283980 }, { zone: 'QUARANTINE', rows: 20 }, { zone: 'CURATED', rows: 283960 }, { zone: 'SERVING', rows: 283960 }] },
  { id: 28491, name: 'Service Orders Incremental', target: 'Service Orders', mode: 'Incremental', started: '13:37', dur: '21s', processed: 58120, status: 'completed', stages: OK(58120) },
  { id: 28488, name: 'Orders Curated', target: 'Orders Curated', mode: 'Full', started: '13:05', dur: '4m 12s', processed: 1840000, status: 'failed',
    stages: ST(['Extract', 'ok', '1m 02s', 1840000, '412 MB'], ['RAW', 'ok', '31s', 1840000, '412 MB'], ['Transform', 'ok', '1m 40s', 1820000, '388 MB', 2], ['Quality G2', 'failed', '59s', 1820000, '—', 1, '1.284 IDs de cliente não resolvidos'], ['Merge', 'skipped', '—', 0, '—'], ['Reconcile', 'skipped', '—', 0, '—'], ['Publish', 'skipped', '—', 0, '—']),
    error: { gate: 'G2', text: '1.284 IDs de cliente não resolvidos em Orders Curated.' }, flow: [{ zone: 'SOURCE', rows: 1840000 }, { zone: 'RAW', rows: 1840000 }, { zone: 'STAGING', rows: 1820000 }, { zone: 'QUARANTINE', rows: 20000 }, { zone: 'CURATED', rows: 1800000 }, { zone: 'SERVING', rows: 1800000 }] },
  { id: 28485, name: 'Legacy Customers Snapshot', target: 'Legacy Customers', mode: 'Snapshot', started: '12:20', dur: '1m 48s', processed: 839, status: 'interrupted', checkpoint: 'Partição 7 / 12', stages: ST(['Extract', 'failed', '1m 48s', 640, '2 MB', 0, 'Conexão com a pasta de rede interrompida'], ['RAW', 'skipped', '—', 0, '—'], ['Transform', 'skipped', '—', 0, '—'], ['Quality G2', 'skipped', '—', 0, '—'], ['Merge', 'skipped', '—', 0, '—'], ['Reconcile', 'skipped', '—', 0, '—'], ['Publish', 'skipped', '—', 0, '—']) },
  { id: 28480, name: 'Sales Import (SFTP)', target: 'Sales Import', mode: 'Incremental', started: '05:30', dur: '2m 03s', processed: 412860, status: 'completed', stages: OK(412860) },
  { id: 28476, name: 'Monthly Invoices Extraction', target: 'Monthly Invoices', mode: 'Manual', started: '13:10', dur: '6m 20s', processed: 320, status: 'completed', stages: OK(320) },
  { id: 28470, name: 'Field Assets Full', target: 'Field Assets', mode: 'Full', started: '02:00', dur: '48s', processed: 82419, status: 'completed', stages: OK(82419) },
  { id: 28461, name: 'Billing Events Stream', target: 'Billing Events', mode: 'Stream', started: '12:58', dur: '—', processed: 0, status: 'paused', stages: OK(0) },
  { id: 28455, name: 'Data Lake Daily', target: 'Data Lake (S3)', mode: 'Incremental', started: '03:00', dur: '14m 11s', processed: 3100000, status: 'completed', stages: OK(3100000) },
  { id: 28499, name: 'Billing DB Incremental', target: 'Billing DB', mode: 'Incremental', started: '13:50', dur: '—', processed: 0, status: 'pending', stages: OK(0) },
];

/* ───────────── datasets publicados ───────────── */
export interface Consumer { kind: 'Relatório' | 'Mapa' | 'Fluxo'; name: string; to: string }
export interface PDataset { id: string; name: string; version: string; quality: number; fresh: string; published: string; owner: string; rows: number; sla: string; consumers: Consumer[]; geo?: boolean; realtime?: boolean; asset?: string }
const R = (name: string, to = '/reports/net_executiva'): Consumer => ({ kind: 'Relatório', name, to }), P = (name: string, to = '/maps/field'): Consumer => ({ kind: 'Mapa', name, to }), W = (name: string, to = '/workflows/ingestao'): Consumer => ({ kind: 'Fluxo', name, to });
export const PUBLISHED: PDataset[] = [
  { id: 'customers', name: 'Customers Curated', version: 'v3', quality: 98.4, fresh: '4 min', published: 'hoje 13:29', owner: 'Comercial', rows: 412806, sla: '15 min', asset: 'erp.clientes', consumers: [R('Executive Commercial'), R('Customer Intelligence', '/reports/rpt_visao_executiva'), P('Field Operations'), W('Customer Sync', '/workflows/legado'), R('Churn Watch', '/reports/rpt_visao_executiva'), R('Carteira por região', '/reports/rpt_fechamento_set'), R('Aniversariantes', '/reports/net_executiva')] },
  { id: 'orders', name: 'Orders Curated', version: 'v7', quality: 96.8, fresh: '4 min', published: 'hoje 13:42', owner: 'Comercial', rows: 1824239, sla: '15 min', asset: 'erp.pedidos', consumers: [R('Executive Commercial'), R('Fechamento mensal', '/reports/rpt_fechamento_set'), W('Ingestão e normalização')] },
  { id: 'items', name: 'Order Items Curated', version: 'v4', quality: 97.5, fresh: '4 min', published: 'hoje 13:42', owner: 'Comercial', rows: 5120733, sla: '15 min', asset: 'erp.itens_pedido', consumers: [R('Mix de produtos')] },
  { id: 'products', name: 'Products Curated', version: 'v2', quality: 99.1, fresh: '1 h', published: 'hoje 12:10', owner: 'Comercial', rows: 9482, sla: '4 h', asset: 'erp.produtos', consumers: [R('Mix de produtos')] },
  { id: 'serviceorders', name: 'Service Orders Curated', version: 'v5', quality: 95.2, fresh: '9 min', published: 'hoje 13:37', owner: 'Operações de Campo', rows: 1302400, sla: '15 min', asset: 'svc.service_orders', geo: true, consumers: [P('Field Operations'), R('SLA de campo', '/reports/net_executiva'), W('Operações de campo', '/workflows/campo')] },
  { id: 'assets', name: 'Field Assets Curated', version: 'v2', quality: 99.0, fresh: '3 h', published: 'hoje 10:30', owner: 'Engenharia', rows: 82419, sla: '24 h', asset: 'geo.assets', geo: true, consumers: [P('Field Operations'), P('Street Light Management', '/maps/lights')] },
  { id: 'telemetry', name: 'Network Telemetry (1 min)', version: 'v6', quality: 99.2, fresh: 'ao vivo', published: 'agora', owner: 'Operações de Rede', rows: 38400000, sla: '5 s', asset: 'telemetry.telemetry_events', realtime: true, consumers: [P('Network Intelligence', '/maps/network'), W('Incidente de rede em tempo real', '/workflows/incidente-rede'), R('Operações de rede')] },
  { id: 'payments', name: 'Payments Events', version: 'v3', quality: 98.3, fresh: 'ao vivo', published: 'agora', owner: 'Financeiro', rows: 482100, sla: '10 s', asset: 'payments.payment_events', realtime: true, consumers: [R('Receita em tempo real')] },
  { id: 'billing', name: 'Billing Invoices', version: 'v4', quality: 98.0, fresh: '11 min', published: 'hoje 13:35', owner: 'Finanças', rows: 2210400, sla: '30 min', asset: 'billing.invoices', consumers: [R('Fechamento mensal', '/reports/rpt_fechamento_set'), R('Inadimplência')] },
  { id: 'invoices', name: 'Invoices Extracted', version: 'v1', quality: 94.8, fresh: '2 h', published: 'hoje 11:30', owner: 'Financeiro', rows: 320, sla: 'Mensal', asset: 'invoices.invoice_documents', consumers: [R('Contas a pagar')] },
  { id: 'targets', name: 'Sales Targets', version: 'v2', quality: 99.5, fresh: '5 h', published: 'hoje 08:00', owner: 'Comercial', rows: 240, sla: '24 h', asset: 'sheets.targets_2026', consumers: [R('Executive Commercial')] },
  { id: 'regions', name: 'Regions Reference', version: 'v1', quality: 100, fresh: '3 d', published: '07/10', owner: 'Dados Corporativos', rows: 5570, sla: 'Estático', consumers: [P('Field Operations'), R('Carteira por região', '/reports/rpt_fechamento_set')] },
];

/* ───────────── linhagem ───────────── */
export type LKind = 'source' | 'raw' | 'transform' | 'dataset' | 'model' | 'report' | 'map' | 'workflow' | 'kpi';
export interface LNode { id: string; kind: LKind; label: string; sub: string; layer: number; row: number; owner: string; quality: number; ver: string; updated: string; consumers: number; col?: boolean }
const L = (id: string, kind: LKind, label: string, sub: string, layer: number, row: number, quality = 97, ver = 'v1', consumers = 1, owner = 'Dados Corporativos', col = false): LNode => ({ id, kind, label, sub, layer, row, owner, quality, ver, updated: 'hoje 13:42', consumers, col });
export const LNODES: LNode[] = [
  L('src.total', 'source', 'ERP.PEDIDOS.VL_TOTAL', 'SQL Server · ERP Production', 0, 0, 96.8, 'schema a41f'), L('src.ret', 'source', 'ERP.DEVOLUCOES.VL_DEVOLVIDO', 'SQL Server · ERP Production', 0, 1, 97.2, 'schema a41f'),
  L('src.cli', 'source', 'ERP.CLIENTES.CPF', 'SQL Server · ERP Production', 0, 3, 98.4, 'schema a41f'), L('src.crm', 'source', 'CRM.customers.customer_document', 'REST · CRM Cloud', 0, 4, 95.7, 'schema 7c02'), L('src.leg', 'source', 'Legacy.Clientes.CPF', 'Excel · Legacy Customers', 0, 5, 88.2, 'sheet 2f9'),
  L('raw.total', 'raw', 'raw.orders.total', 'Zona RAW', 1, 0, 96.8), L('raw.ret', 'raw', 'raw.returns.amount', 'Zona RAW', 1, 1, 97.2), L('raw.cpf', 'raw', 'raw.customers.cpf (3 origens)', 'Zona RAW', 1, 4, 94),
  L('tr.cur', 'transform', 'Normalize Currency', 'Mapeamento · v11', 2, 0, 97, 'v11'), L('tr.net', 'transform', 'Subtrair devoluções', 'Regra', 2, 1, 97, 'v3'), L('tr.cpf', 'transform', 'normalizeCpf()', 'Regra · 811 correções', 2, 4, 94, 'v2'),
  L('ds.orders', 'dataset', 'orders.net_amount', 'Orders Curated v7', 3, 0, 96.8, 'v7', 4), L('ds.cust', 'dataset', 'customers.document', 'Customers Curated v3', 3, 4, 98.4, 'v3', 7),
  L('sm.rev', 'model', 'Revenue.Net', 'Modelo semântico · Sales Model', 4, 0, 96.8, 'v4', 3), L('sm.cust', 'model', 'Customer.Document', 'Modelo · Customer 360', 4, 4, 98.4, 'v14', 3),
  L('rp.exec', 'report', 'Executive Commercial', 'Report Builder', 5, 0, 96.8, 'v12', 1, 'Comercial'), L('rp.cust', 'report', 'Customer Intelligence', 'Report Builder', 5, 3, 98.4, 'v6', 1, 'Comercial'), L('mp.field', 'map', 'Field Operations', 'Map Builder', 5, 4, 98.4, 'v8', 1, 'Operações'), L('wf.sync', 'workflow', 'Customer Sync', 'Workflow Builder', 5, 5, 98.4, 'v3', 1, 'Operações'),
  L('kpi.rev', 'kpi', 'Revenue KPI', 'KPI · Executive Commercial', 6, 0, 96.8, 'v12', 0, 'Comercial', true),
];
export const LEDGES: [string, string][] = [
  ['src.total', 'raw.total'], ['src.ret', 'raw.ret'], ['raw.total', 'tr.cur'], ['raw.ret', 'tr.net'], ['tr.cur', 'ds.orders'], ['tr.net', 'ds.orders'], ['ds.orders', 'sm.rev'], ['sm.rev', 'rp.exec'], ['rp.exec', 'kpi.rev'],
  ['src.cli', 'raw.cpf'], ['src.crm', 'raw.cpf'], ['src.leg', 'raw.cpf'], ['raw.cpf', 'tr.cpf'], ['tr.cpf', 'ds.cust'], ['ds.cust', 'sm.cust'], ['sm.cust', 'rp.cust'], ['sm.cust', 'mp.field'], ['sm.cust', 'wf.sync'],
];
export const KPI_TRACE = [
  { t: 'Revenue KPI', d: 'KPI no relatório Executive Commercial' }, { t: 'Revenue.Net', d: 'Medida do modelo semântico Sales Model' }, { t: 'orders.net_amount', d: 'Coluna de Orders Curated v7' },
  { t: 'orders.total − returns.amount', d: 'Normalize Currency + Subtrair devoluções' }, { t: 'ERP.PEDIDOS.VL_TOTAL · ERP.DEVOLUCOES.VL_DEVOLVIDO', d: 'Colunas de origem no SQL Server' },
];

/* ───────────── enriquecimento ───────────── */
export type EnrichType = 'Derivado' | 'Dados de referência' | 'Entre fontes' | 'Externo' | 'Assistido por IA';
export interface Enrich { id: string; title: string; type: EnrichType; status: 'suggested' | 'available' | 'applied' | 'rejected'; inputs: string; outputs: string[]; coverage: number; transfer: string; source: string; ai?: boolean; note?: string; sample: [string, string][] }
export const ENRICHMENTS: Enrich[] = [
  { id: 'e1', title: 'CEP → Localização', type: 'Dados de referência', status: 'suggested', inputs: 'Customer.CEP', outputs: ['Município', 'UF', 'Região', 'Código IBGE'], coverage: 98.7, transfer: 'Nenhuma', source: 'Base de referência IBGE', sample: [['01310-100', 'São Paulo · SP · Sudeste · 3550308'], ['20040-020', 'Rio de Janeiro · RJ · Sudeste · 3304557'], ['30130-110', 'Belo Horizonte · MG · Sudeste · 3106200']] },
  { id: 'e2', title: 'Data → Ano, mês, trimestre, dia da semana', type: 'Derivado', status: 'available', inputs: 'Order.order_date', outputs: ['Ano', 'Mês', 'Trimestre', 'Dia da semana'], coverage: 100, transfer: 'Nenhuma', source: 'Cálculo determinístico', sample: [['2026-10-10', '2026 · Out · T4 · Sábado']] },
  { id: 'e3', title: 'Nascimento → Idade e faixa etária', type: 'Derivado', status: 'available', inputs: 'Customer.birth_date', outputs: ['Idade', 'Faixa etária'], coverage: 91.0, transfer: 'Nenhuma', source: 'Cálculo determinístico', sample: [['1988-04-12', '38 · 35–44']] },
  { id: 'e4', title: 'E-mail → Domínio', type: 'Derivado', status: 'applied', inputs: 'Customer.email', outputs: ['Domínio'], coverage: 96.0, transfer: 'Nenhuma', source: 'Cálculo determinístico', sample: [['ana.lima@gmail.com', 'gmail.com']] },
  { id: 'e5', title: 'Telefone → DDD e UF', type: 'Derivado', status: 'available', inputs: 'Customer.phone', outputs: ['DDD', 'UF'], coverage: 93.0, transfer: 'Nenhuma', source: 'Plano de numeração Anatel', sample: [['(11) 98765-4321', '11 · SP']] },
  { id: 'e6', title: 'Enriquecer clientes com CRM', type: 'Entre fontes', status: 'suggested', inputs: 'Sales Customers (CPF, nome)', outputs: ['Segmento', 'Data de cadastro', 'Gerente de conta'], coverage: 83, transfer: 'Nenhuma', source: 'CRM Cloud · customers', note: 'Hoje o dataset de vendas só tem CPF e nome. O CRM contém segmento, data de cadastro e gerente de conta.', sample: [['123.456.789-09', 'Enterprise · 2021-03-02 · Camila Rocha']] },
  { id: 'e7', title: 'Descrição do produto → Categoria e tags', type: 'Assistido por IA', status: 'suggested', inputs: 'Product.description', outputs: ['Categoria', 'Subcategoria', 'Tags'], coverage: 87, transfer: 'Metadados + amostras mascaradas', source: 'Provedor de IA externo (política: somente metadados)', ai: true, note: 'Requer IA habilitada. Carga estimada: 9.482 produtos · ~3 min.', sample: [['Roteador Wi-Fi 6 AX3000', 'Roteadores · Wi-Fi 6 · [mesh, dual-band]']] },
  { id: 'e8', title: 'Endereço → Coordenadas (geocoding)', type: 'Externo', status: 'suggested', inputs: 'Customer.address', outputs: ['Latitude', 'Longitude'], coverage: 76, transfer: 'Endereços enviados a serviço externo', source: 'Serviço de geocodificação (requer aprovação)', note: 'Envia dados pessoais a terceiro. Exige aprovação explícita.', sample: [['Av. Paulista, 1000', '-23.5614, -46.6559']] },
  { id: 'e9', title: 'UF → Região geográfica', type: 'Dados de referência', status: 'rejected', inputs: 'Customer.state', outputs: ['Região'], coverage: 100, transfer: 'Nenhuma', source: 'Base de referência IBGE', sample: [['SP', 'Sudeste']] },
];

/* ───────────── revisão & atividade ───────────── */
export interface ReviewItem { id: string; type: 'Tipo semântico' | 'Relacionamento' | 'Mapeamento' | 'Enriquecimento' | 'Campo de documento' | 'Schema drift' | 'ChangeSet'; title: string; where: string; conf?: number; risk: 'Alto' | 'Médio' | 'Baixo'; ai?: boolean; breaking?: boolean; to: string }
export const REVIEW: ReviewItem[] = [
  { id: 'sem:crm.customers.customer_document', type: 'Tipo semântico', title: 'CPF brasileiro', where: 'CRM.customers.customer_document', conf: 98, risk: 'Baixo', to: '/data/catalog/crm.customers' },
  { id: 'sem:crm.customers.segment', type: 'Tipo semântico', title: 'Customer.Segment', where: 'CRM.customers.segment', conf: 84, risk: 'Médio', ai: true, to: '/data/catalog/crm.customers' },
  { id: 'r5', type: 'Relacionamento', title: 'CRM.customer_id → ERP.COD_CLIENTE', where: 'Entre fontes', conf: 94, risk: 'Médio', to: '/data/model' },
  { id: 'r7', type: 'Relacionamento', title: 'Legacy.CPF → ERP.CPF', where: 'Entre fontes', conf: 94, risk: 'Médio', to: '/data/model' },
  { id: 'r8', type: 'Relacionamento', title: 'Maintenance.asset_id → Field Assets', where: 'Entre fontes', conf: 91, risk: 'Médio', to: '/data/model' },
  { id: 'm12', type: 'Mapeamento', title: 'ERP.PEDIDOS.COD_CLIENTE → Order.customer_id', where: 'Resolver cliente · 1.284 falhas', conf: 91, risk: 'Alto', to: '/data/transformations' },
  { id: 'e1', type: 'Enriquecimento', title: 'CEP → Localização', where: 'Customer', conf: 99, risk: 'Baixo', to: '/data/enrichment' },
  { id: 'e7', type: 'Enriquecimento', title: 'Categoria de produto por IA', where: 'Product', conf: 87, risk: 'Médio', ai: true, to: '/data/enrichment' },
  { id: 'doc:inv-0319', type: 'Campo de documento', title: 'Service Description (62%)', where: 'Monthly Invoices · NF-0319', conf: 62, risk: 'Médio', ai: true, to: '/data/sources/invoices' },
  { id: 'cs-drift', type: 'Schema drift', title: 'customer_tier adicionado', where: 'CRM Cloud', risk: 'Baixo', to: '/data/changes/CS-183' },
  { id: 'cs-184', type: 'ChangeSet', title: 'CS-184 · Normalize Customer Model', where: 'Modelo', risk: 'Médio', to: '/data/changes/CS-184' },
  { id: 'cs-181', type: 'ChangeSet', title: 'CS-181 · Regra normalizeCpf', where: 'Mapeamento', risk: 'Médio', breaking: false, to: '/data/changes/CS-181' },
];
export const ACTIVITY = [
  { t: '13:42', text: 'ERP sync concluído', sub: '284 mil registros · 38 s', to: '/data/runs/28492' }, { t: '13:40', text: '184 mil eventos ingeridos', sub: 'Network Telemetry', to: '/data/sources/telemetry' }, { t: '13:36', text: 'Schema do CRM analisado', sub: '1 mudança detectada', to: '/data/changes/CS-183' },
  { t: '13:29', text: 'Customer Model v14 publicado', sub: 'Customers Curated v3', to: '/data/published/customers' }, { t: '13:10', text: 'Monthly Invoices extraído', sub: '3 documentos aguardam revisão', to: '/data/sources/invoices' }, { t: '13:05', text: 'Orders Curated falhou no G2', sub: '1.284 IDs não resolvidos', to: '/data/runs/28488' },
];
