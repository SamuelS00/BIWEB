/**
 * Dados de exemplo do universo Lume Varejo (design-handoff/04-MOCK_DATA.md).
 * Só para o shell enquanto a Management API e o Query Service não existem. Os números fecham entre si.
 */
export const dashboards = [
  { id: 'dsh_visao_executiva', name: 'Visão Executiva de Vendas', state: 'Publicado (v12)', tone: 'success', owner: 'Marina Costa', updated: 'hoje 08:12', certified: true },
  { id: 'dsh_regiao', name: 'Desempenho por Região', state: 'Publicado', tone: 'success', owner: 'Marina Costa', updated: '02/10/2026', certified: true },
  { id: 'dsh_estoque', name: 'Estoque e Ruptura', state: 'Rascunho', tone: 'warning', owner: 'Marina Costa', updated: 'hoje 09:40', certified: false },
  { id: 'dsh_clientes', name: 'Clientes e Retenção', state: 'Publicado', tone: 'success', owner: 'Paula Teixeira', updated: '28/09/2026', certified: false },
  { id: 'dsh_lojas', name: 'Mapa de Lojas', state: 'Publicado', tone: 'success', owner: 'Marina Costa', updated: '15/09/2026', certified: false },
  { id: 'dsh_margem_antigo', name: 'Margem por Categoria (antigo)', state: 'Depreciado', tone: 'warning', owner: 'Rafael Lima', updated: '11/03/2026', certified: false },
] as const;

export const connections = [
  { id: 'pg-erp-producao', type: 'PostgreSQL (live)', state: 'Conectado', ok: true },
  { id: 'bq-ecommerce', type: 'BigQuery (live)', state: 'Conectado', ok: true },
  { id: 'metas_2026.csv', type: 'Upload (importado)', state: 'Ingestão concluída · 1,2 mil linhas', ok: true },
  { id: 'sap-estoque', type: 'API (sync)', state: 'Falha de credencial', ok: false },
] as const;

export const kpis = [
  { label: 'Receita', value: 'R$ 18,4 mi', delta: '+9,6%', up: true },
  { label: 'Margem', value: '27,8%', delta: '−0,4 p.p.', up: false },
  { label: 'Pedidos', value: '42.381', delta: '+7,1%', up: true },
  { label: 'Ticket médio', value: 'R$ 434', delta: '+2,4%', up: true },
] as const;

export const pages = [
  { id: 'geral', label: 'Visão geral' }, { id: 'produtos', label: 'Produtos' }, { id: 'regioes', label: 'Regiões' }, { id: 'lojas', label: 'Lojas' },
];

export type FieldKind = 'dimension' | 'date' | 'geo' | 'measure' | 'metric' | 'calc' | 'hierarchy';
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
