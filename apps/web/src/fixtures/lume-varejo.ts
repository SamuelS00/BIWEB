import { asset } from '../state/ui-store';
/**
 * Dados de exemplo do universo Lume Varejo (design-handoff/04-MOCK_DATA.md). Os números fecham entre si.
 * Só para o shell enquanto a Management API e o Query Service não existem.
 */
export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type FieldKind = 'dimension' | 'date' | 'geo' | 'measure' | 'metric' | 'calc' | 'hierarchy';

export const user = { name: 'Marina Costa', role: 'Analista de BI', workspace: 'Comercial', company: 'Lume Varejo' };

// ---- séries (jan–set/2026) ----
export const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set'];
export const receitaMes = [1.85, 1.92, 2.10, 2.05, 2.18, 2.25, 2.31, 2.22, 1.52];
export const pedidosMes = [4390, 4480, 4810, 4700, 4980, 5140, 5290, 5150, 3441];
export const ticketMes = [421, 429, 437, 436, 438, 438, 437, 431, 442];
export const categorias: [string, number][] = [['Eletrônicos', 6.2], ['Casa e Cozinha', 4.3], ['Moda', 3.5], ['Esporte', 2.6], ['Beleza', 1.8]];
export const regioes: [string, number][] = [['Sudeste', 8.1], ['Sul', 3.9], ['Nordeste', 3.6], ['Centro-Oeste', 1.7], ['Norte', 1.1]];
export const estados: [string, number][] = [['SP', 4.3], ['RJ', 1.9], ['MG', 1.6], ['RS', 1.5], ['PR', 1.3], ['BA', 1.2], ['SC', 1.1], ['PE', 0.9], ['GO', 0.8], ['CE', 0.7]];
export const demaisEstados = 3.1;
export const produtos: [string, number][] = [['Smart TV 55" 4K', 1.42], ['Fritadeira Elétrica 5 L', 0.98], ['Tênis Corrida Pulse', 0.87], ['Notebook 15" i5', 0.84], ['Cafeteira Expresso', 0.71]];
export const canais: [string, number][] = [['Loja física', 48], ['E-commerce', 37], ['Marketplace', 15]];
export const quedaCategoria: [string, number][] = [['Eletrônicos', -0.41], ['Casa e Cozinha', -0.12], ['Moda', -0.09], ['Esporte', -0.05], ['Beleza', -0.03]];
export const quedaRegiao: [string, number][] = [['Sudeste', -0.38], ['Nordeste', -0.13], ['Sul', -0.12], ['Centro-Oeste', -0.04], ['Norte', -0.03]];

export interface Kpi { id: string; label: string; value: string; delta: string; up: boolean; base: string; spark?: number[]; draft?: boolean }
export const kpis: Kpi[] = [
  { id: 'receita', label: 'Receita', value: 'R$ 18,4 mi', delta: '+9,6%', up: true, base: 'vs jan–set/2025', spark: receitaMes },
  { id: 'margem', label: 'Margem', value: '27,8%', delta: '−0,4 p.p.', up: false, base: 'vs 2025' },
  { id: 'pedidos', label: 'Pedidos', value: '42.381', delta: '+7,1%', up: true, base: 'vs 2025', spark: pedidosMes },
  { id: 'ticket', label: 'Ticket médio', value: 'R$ 434', delta: '+2,4%', up: true, base: 'vs 2025', spark: ticketMes },
];
export const kpisSetembro: Kpi[] = [
  { id: 'receita-set', label: 'Receita · set', value: 'R$ 1,52 mi', delta: '−31,5%', up: false, base: 'vs ago (R$ 2,22 mi)' },
  { id: 'pedidos-set', label: 'Pedidos · set', value: '3.441', delta: '−33,2%', up: false, base: 'vs ago (5.150)' },
  { id: 'ticket-set', label: 'Ticket médio · set', value: 'R$ 442', delta: '+2,6%', up: true, base: 'vs ago (R$ 431)' },
  { id: 'ruptura-set', label: 'Taxa de ruptura · set', value: '14,2%', delta: '+9,4 p.p.', up: false, base: 'vs ago (4,8%)', draft: true },
];

// ---- relatórios ----
export type Category = 'Vendas' | 'Operações' | 'Clientes' | 'Financeiro';
export type ReportType = 'Dashboard' | 'Relatório paginado' | 'Apresentação';
export type Status = 'Publicado' | 'Rascunho' | 'Depreciado';
export type Widget =
  | { kind: 'kpis'; set: 'ano' | 'setembro'; span: 12 }
  | { kind: 'bar'; title: string; sub: string; data: 'receitaMes' | 'pedidosMes'; span: number; highlightLast?: boolean }
  | { kind: 'hbar'; title: string; sub: string; data: 'categorias' | 'regioes' | 'produtos' | 'estados' | 'canais'; unit: 'R$ mi' | '%'; span: number; crossFilter?: boolean }
  | { kind: 'diverging'; title: string; sub: string; data: 'quedaCategoria' | 'quedaRegiao'; span: number }
  | { kind: 'line'; title: string; sub: string; data: 'receitaMes'; span: number }
  | { kind: 'share'; title: string; sub: string; span: number }
  | { kind: 'map'; title: string; sub: string; span: number }
  | { kind: 'matrix'; title: string; sub: string; data: 'regioes' | 'categorias'; span: number }
  | { kind: 'note'; title: string; text: string; span: number };

export interface Report {
  id: string; name: string; description: string; category: Category; type: ReportType; status: Status; version?: string;
  certified?: boolean; owner: string; updated: string; updatedOrder: number; cover: string; pages: string[];
  origin?: 'copilot'; views: number; widgets: Widget[];
}
const visaoGeral: Widget[] = [
  { kind: 'kpis', set: 'ano', span: 12 },
  { kind: 'bar', title: 'Receita', sub: 'por mês · jan–set/2026 (R$ mi)', data: 'receitaMes', span: 8, highlightLast: true },
  { kind: 'hbar', title: 'Receita', sub: 'por categoria (R$ mi)', data: 'categorias', unit: 'R$ mi', span: 4, crossFilter: true },
  { kind: 'hbar', title: 'Receita', sub: 'por região (R$ mi)', data: 'regioes', unit: 'R$ mi', span: 4 },
  { kind: 'hbar', title: 'Receita', sub: 'por produto · top 5 (R$ mi)', data: 'produtos', unit: 'R$ mi', span: 4 },
  { kind: 'share', title: 'Participação na receita', sub: 'por canal', span: 4 },
];
export const reports: Report[] = [
  { id: 'rpt_visao_executiva', name: 'Visão Executiva de Vendas', description: 'Receita, margem, pedidos e ticket do ano, com evolução mensal e quebras por categoria, região e canal.', category: 'Vendas', type: 'Dashboard', status: 'Publicado', version: 'v12', certified: true, owner: 'Marina Costa', updated: 'hoje 08:12', updatedOrder: 1, cover: 'visao-executiva', pages: ['Visão geral', 'Produtos', 'Regiões', 'Lojas'], views: 1284, widgets: visaoGeral },
  { id: 'rpt_regiao', name: 'Desempenho por Região', description: 'Receita por região e estado, com mapa e participação de cada região no total.', category: 'Vendas', type: 'Dashboard', status: 'Publicado', certified: true, owner: 'Marina Costa', updated: '02/10/2026', updatedOrder: 4, cover: 'desempenho-regiao', pages: ['Regiões', 'Estados'], views: 642,
    widgets: [{ kind: 'kpis', set: 'ano', span: 12 }, { kind: 'hbar', title: 'Receita', sub: 'por região (R$ mi)', data: 'regioes', unit: 'R$ mi', span: 5 }, { kind: 'map', title: 'Receita', sub: 'por estado · mapa esquemático', span: 7 }, { kind: 'matrix', title: 'Receita', sub: 'por região · participação', data: 'regioes', span: 12 }] },
  { id: 'rpt_estoque', name: 'Estoque e Ruptura', description: 'Acompanha a ruptura de estoque e seu efeito na receita. Usa a métrica Taxa de ruptura, ainda em rascunho.', category: 'Operações', type: 'Dashboard', status: 'Rascunho', owner: 'Marina Costa', updated: 'hoje 09:40', updatedOrder: 2, cover: 'estoque-ruptura', pages: ['Ruptura'], views: 38,
    widgets: [{ kind: 'kpis', set: 'setembro', span: 12 }, { kind: 'diverging', title: 'Queda da receita', sub: 'por categoria · set vs ago (R$ mi)', data: 'quedaCategoria', span: 6 }, { kind: 'note', title: 'Sobre a ruptura', text: 'A taxa de ruptura subiu de 4,8% em agosto para 14,2% em setembro, concentrada em Smart TV 55" 4K em SP. A métrica está em rascunho no modelo Vendas Varejo e ainda não foi certificada.', span: 6 }] },
  { id: 'rpt_clientes', name: 'Clientes e Retenção', description: 'Pedidos por canal e comportamento de compra dos clientes ao longo do ano.', category: 'Clientes', type: 'Dashboard', status: 'Publicado', owner: 'Paula Teixeira', updated: '28/09/2026', updatedOrder: 6, cover: 'clientes-retencao', pages: ['Visão geral'], views: 311,
    widgets: [{ kind: 'bar', title: 'Pedidos', sub: 'por mês · jan–set/2026', data: 'pedidosMes', span: 8 }, { kind: 'share', title: 'Participação na receita', sub: 'por canal', span: 4 }] },
  { id: 'rpt_lojas', name: 'Mapa de Lojas', description: 'Distribuição geográfica da receita pelas 312 lojas da rede.', category: 'Operações', type: 'Dashboard', status: 'Publicado', owner: 'Marina Costa', updated: '15/09/2026', updatedOrder: 8, cover: 'mapa-lojas', pages: ['Mapa'], views: 497,
    widgets: [{ kind: 'map', title: 'Receita', sub: 'por estado · mapa esquemático', span: 7 }, { kind: 'hbar', title: 'Receita', sub: 'top 10 estados (R$ mi)', data: 'estados', unit: 'R$ mi', span: 5 }] },
  { id: 'rpt_margem_antigo', name: 'Margem por Categoria (antigo)', description: 'Substituído pela Visão Executiva. Usa Margem bruta (legado), depreciada em favor de Margem %.', category: 'Financeiro', type: 'Dashboard', status: 'Depreciado', owner: 'Rafael Lima', updated: '11/03/2026', updatedOrder: 12, cover: 'margem-antigo', pages: ['Margem'], views: 12,
    widgets: [{ kind: 'hbar', title: 'Receita', sub: 'por categoria (R$ mi)', data: 'categorias', unit: 'R$ mi', span: 6 }, { kind: 'note', title: 'Relatório depreciado', text: 'Este relatório usa o campo Margem bruta (legado), que tem 3 dependentes e foi substituído por Margem %. Use a Visão Executiva de Vendas.', span: 6 }] },
  { id: 'rpt_fechamento_set', name: 'Fechamento de setembro', description: 'Resultado do mês com a queda de 31,5% na receita explicada por categoria e região.', category: 'Financeiro', type: 'Relatório paginado', status: 'Publicado', certified: true, owner: 'Marina Costa', updated: '01/10/2026', updatedOrder: 5, cover: 'fechamento-setembro', pages: ['Resumo', 'Categorias', 'Regiões'], views: 205,
    widgets: [{ kind: 'kpis', set: 'setembro', span: 12 }, { kind: 'diverging', title: 'Queda da receita', sub: 'por categoria · set vs ago (R$ mi)', data: 'quedaCategoria', span: 6 }, { kind: 'diverging', title: 'Queda da receita', sub: 'por região · set vs ago (R$ mi)', data: 'quedaRegiao', span: 6 }] },
  { id: 'rpt_ranking_produtos', name: 'Ranking de produtos', description: 'Os produtos que mais faturam no ano e a receita por categoria.', category: 'Vendas', type: 'Relatório paginado', status: 'Publicado', owner: 'Rafael Lima', updated: '30/09/2026', updatedOrder: 7, cover: 'ranking-produtos', pages: ['Ranking'], views: 268,
    widgets: [{ kind: 'hbar', title: 'Receita', sub: 'por produto · top 5 (R$ mi)', data: 'produtos', unit: 'R$ mi', span: 6 }, { kind: 'matrix', title: 'Receita', sub: 'por categoria · participação', data: 'categorias', span: 6 }] },
  { id: 'rpt_canais', name: 'Canais de venda', description: 'Quanto cada canal representa na receita: loja física, e-commerce e marketplace.', category: 'Vendas', type: 'Dashboard', status: 'Publicado', owner: 'Paula Teixeira', updated: '22/09/2026', updatedOrder: 9, cover: 'canais-venda', pages: ['Canais'], views: 176,
    widgets: [{ kind: 'share', title: 'Participação na receita', sub: 'por canal', span: 6 }, { kind: 'hbar', title: 'Participação', sub: 'por canal (%)', data: 'canais', unit: '%', span: 6 }] },
  { id: 'rpt_comite', name: 'Apresentação mensal ao comitê', description: 'Slides do resultado do trimestre para o comitê comercial, com destaques e próximos passos.', category: 'Vendas', type: 'Apresentação', status: 'Rascunho', owner: 'Rafael Lima', updated: 'ontem 18:05', updatedOrder: 3, cover: 'apresentacao-comite', pages: ['Capa', 'Resultados', 'Próximos passos'], views: 22,
    widgets: [{ kind: 'kpis', set: 'ano', span: 12 }, { kind: 'line', title: 'Receita', sub: 'por mês · jan–set/2026 (R$ mi)', data: 'receitaMes', span: 12 }] },
  { id: 'rpt_analise_queda', name: 'Análise da queda de setembro', description: 'Rascunho criado com o Copilot a partir da pergunta "Por que caiu em setembro?". Revise antes de publicar.', category: 'Vendas', type: 'Relatório paginado', status: 'Rascunho', owner: 'Marina Costa', updated: 'hoje 10:02', updatedOrder: 0, cover: 'analise-queda', pages: ['Análise'], views: 4, origin: 'copilot',
    widgets: [{ kind: 'line', title: 'Receita', sub: 'por mês · jan–set/2026 (R$ mi)', data: 'receitaMes', span: 12 }, { kind: 'diverging', title: 'Queda da receita', sub: 'por categoria · set vs ago (R$ mi)', data: 'quedaCategoria', span: 6 }, { kind: 'diverging', title: 'Queda da receita', sub: 'por região · set vs ago (R$ mi)', data: 'quedaRegiao', span: 6 }] },
  { id: 'rpt_metas', name: 'Metas 2026', description: 'Atingimento das metas de receita por região, a partir do arquivo metas_2026.csv.', category: 'Financeiro', type: 'Dashboard', status: 'Publicado', owner: 'Paula Teixeira', updated: '20/09/2026', updatedOrder: 10, cover: 'metas-2026', pages: ['Metas'], views: 154,
    widgets: [{ kind: 'kpis', set: 'ano', span: 12 }, { kind: 'note', title: 'Meta por região', text: 'O arquivo metas_2026.csv foi importado (1,2 mil linhas), mas os valores de meta não fazem parte dos dados de exemplo deste protótipo.', span: 12 }] },
];
export const statusTone: Record<Status, Tone> = { Publicado: 'success', Rascunho: 'warning', Depreciado: 'neutral' };
export const coverUrl = (c: string, small = false) => asset(`covers/${c}${small ? '-sm' : ''}.webp`);

export const activity = [
  { who: 'Paula Teixeira', what: 'certificou a métrica', target: 'Margem %', when: 'há 25 min', icon: 'check' as const },
  { who: 'Marina Costa', what: 'criou com o Copilot', target: 'Análise da queda de setembro', when: 'hoje 10:02', icon: 'copilot' as const, reportId: 'rpt_analise_queda' },
  { who: 'Rafael Lima', what: 'editou', target: 'Apresentação mensal ao comitê', when: 'ontem 18:05', icon: 'brush' as const, reportId: 'rpt_comite' },
  { who: 'Sistema', what: 'detectou falha de credencial em', target: 'sap-estoque', when: 'ontem 22:10', icon: 'warning' as const },
  { who: 'Marina Costa', what: 'publicou', target: 'Visão Executiva de Vendas v12', when: 'hoje 08:12', icon: 'report' as const, reportId: 'rpt_visao_executiva' },
];

export const connections = [
  { id: 'pg-erp-producao', type: 'PostgreSQL (live)', state: 'Conectado', ok: true, detail: 'latência 42 ms' },
  { id: 'bq-ecommerce', type: 'BigQuery (live)', state: 'Conectado', ok: true, detail: 'latência 180 ms' },
  { id: 'metas_2026.csv', type: 'Upload (importado)', state: 'Ingestão concluída · 1,2 mil linhas', ok: true, detail: 'importado em 20/09/2026' },
  { id: 'sap-estoque', type: 'API (sync)', state: 'Falha de credencial', ok: false, detail: 'desde ontem 22:10' },
] as const;

export const model = {
  name: 'Vendas Varejo', draft: 'v13', published: 'v12',
  metrics: [
    { id: 'met_receita', name: 'Receita', certified: true, synonyms: ['faturamento', 'vendas líquidas'] },
    { id: 'met_margem', name: 'Margem %', certified: true, synonyms: [] },
    { id: 'met_pedidos', name: 'Pedidos', certified: true, synonyms: [] },
    { id: 'met_ticket', name: 'Ticket médio', certified: true, synonyms: [] },
    { id: 'met_receita_yoy', name: 'Receita vs ano anterior', certified: false, synonyms: [] },
    { id: 'met_ruptura', name: 'Taxa de ruptura', certified: false, synonyms: [] },
  ],
  entities: [
    { id: 'ent_pedido', name: 'Pedido', fields: [['Canal', 'dimension'], ['soma_valor_liquido', 'measure'], ['contagem_pedidos', 'measure'], ['Margem bruta (legado)', 'calc']] },
    { id: 'ent_produto', name: 'Produto', fields: [['Produto', 'hierarchy'], ['Categoria', 'dimension'], ['Marca', 'dimension']] },
    { id: 'ent_loja', name: 'Loja', fields: [['Geografia', 'hierarchy'], ['Região', 'dimension'], ['Estado', 'geo'], ['Cidade', 'geo']] },
    { id: 'ent_cliente', name: 'Cliente', fields: [['Segmento do cliente', 'dimension'], ['E-mail do cliente', 'dimension']] },
    { id: 'ent_calendario', name: 'Calendário', fields: [['Data', 'date']] },
  ] as { id: string; name: string; fields: [string, FieldKind][] }[],
};
export const pages = reports[0]!.pages.map((p, i) => ({ id: `p${i}`, label: p }));
