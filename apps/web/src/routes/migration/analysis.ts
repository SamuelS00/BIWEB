/* Migration Studio — resultados da análise do projeto de demonstração: projetos, descobertas, revisão, validação, blueprint. */
import { DATASETS, ITEMS, MAPS, MEASURES, PROCESSES, REPORTS, VISUALS, reportId } from './data';
import type { BpNode, BridgeChange, Check, HistoryEntry, Insight, Mapping, ModelTable, Project, Relationship, ReviewItem, Suggestion, Translation } from './model';

export const DEMO_ID = 'mp_commercial_ops';

export const PROJECTS: Project[] = [
  { id: DEMO_ID, name: 'Commercial & Operations Migration', platform: 'powerbi', workspace: 'Corporate Workspace', status: 'validation', statusNote: 'Em validação', phase: 'validate', objects: 12, objectsLabel: 'relatórios', progress: 78, owner: 'Marina Duarte', activity: 'há 8 min · Análise v3 concluída', lastAnalyzed: 'há 8 min', strategy: 'native', detail: 'full', bridge: true,
    scope: { reports: 12, pages: 48, visuals: 284, measures: 37, datasets: 9, maps: 3, processes: 2 }, mix: { native: 73, equivalent: 18, redesign: 7, review: 2 } },
  { id: 'mp_tableau_sales', name: 'Tableau Sales Migration', platform: 'tableau', workspace: 'Projeto Sales', status: 'review', statusNote: 'Análise concluída', phase: 'understand', objects: 8, objectsLabel: 'workbooks', progress: 34, owner: 'Rafael Prado', activity: 'ontem · Inventário gerado', lastAnalyzed: 'há 1 dia', strategy: 'native', detail: 'summary',
    scope: { reports: 8, pages: 21, visuals: 97, measures: 18, datasets: 5, maps: 1, processes: 0 }, mix: { native: 68, equivalent: 20, redesign: 9, review: 3 } },
  { id: 'mp_qlik_legacy', name: 'Qlik Legacy Operations', platform: 'qlik', workspace: 'Espaço Operations (shared)', status: 'review', statusNote: 'Precisa de revisão', phase: 'blueprint', objects: 24, objectsLabel: 'apps', progress: 46, owner: 'Bruno Tavares', activity: 'há 3 dias · 31 itens para revisar', lastAnalyzed: 'há 3 dias', strategy: 'fidelity', detail: 'summary',
    scope: { reports: 24, pages: 86, visuals: 402, measures: 133, datasets: 17, maps: 4, processes: 6 }, mix: { native: 54, equivalent: 24, redesign: 14, review: 8 } },
  { id: 'mp_looker_customer', name: 'Looker Customer Analytics', platform: 'looker', workspace: 'customer_analytics', status: 'reconstructing', statusNote: 'Reconstruindo', phase: 'reconstruct', objects: 6, objectsLabel: 'dashboards', progress: 61, owner: 'Helena Costa', activity: 'há 2 h · 4 de 6 dashboards reconstruídos', lastAnalyzed: 'há 2 dias', strategy: 'modernize', detail: 'summary',
    scope: { reports: 6, pages: 14, visuals: 73, measures: 41, datasets: 6, maps: 0, processes: 2 }, mix: { native: 71, equivalent: 19, redesign: 8, review: 2 } },
  { id: 'mp_domo_finance', name: 'Domo Finance Cockpit', platform: 'domo', workspace: 'Página Finance Cockpit', status: 'analyzing', statusNote: 'Analisando', phase: 'source', objects: 5, objectsLabel: 'páginas', progress: 22, owner: 'Ana Ribeiro', activity: 'agora · lendo DataSets e Beast Modes', lastAnalyzed: 'em andamento', strategy: 'native', detail: 'summary',
    scope: { reports: 5, pages: 11, visuals: 58, measures: 23, datasets: 7, maps: 0, processes: 1 }, mix: { native: 0, equivalent: 0, redesign: 0, review: 0 } },
  { id: 'mp_ts_retail', name: 'ThoughtSpot Retail Liveboards', platform: 'thoughtspot', workspace: 'Org Retail', status: 'completed', statusNote: 'Publicado', phase: 'publish', objects: 4, objectsLabel: 'liveboards', progress: 100, owner: 'Rafael Prado', activity: 'há 12 dias · Publicado v1', lastAnalyzed: 'há 12 dias', strategy: 'native', detail: 'summary', bridge: true,
    scope: { reports: 4, pages: 9, visuals: 44, measures: 16, datasets: 3, maps: 0, processes: 0 }, mix: { native: 79, equivalent: 15, redesign: 5, review: 1 } },
];

/** Inventário resumido dos projetos que não são o demo (árvore curta, mesma linguagem). */
export const SUMMARY_TREES: Record<string, { id: string; label: string; kind: string; children?: { id: string; label: string; kind: string; compat: string }[] }[]> = {
  mp_tableau_sales: [{ id: 'g1', label: 'Projeto Sales', kind: 'folder', children: ['Sales Overview', 'Pipeline Health', 'Regional Heatmap', 'Rep Performance', 'Forecast vs Actual', 'Discount Analysis', 'Customer Segments', 'Quarterly Review'].map((n, i) => ({ id: `t${i}`, label: n, kind: 'report', compat: i === 2 ? 'redesign' : i === 5 ? 'equivalent' : 'native' })) }],
  mp_qlik_legacy: [{ id: 'g1', label: 'Espaço Operations (shared)', kind: 'folder', children: ['Ops Control Tower', 'Maintenance KPIs', 'Warehouse Flow', 'Supplier Scorecard', 'Plant Efficiency', 'Safety Log', 'Logistics Map', 'Inventory Aging'].map((n, i) => ({ id: `q${i}`, label: n, kind: 'report', compat: i === 6 ? 'redesign' : i === 1 || i === 4 ? 'review' : 'equivalent' })) }],
  mp_looker_customer: [{ id: 'g1', label: 'customer_analytics', kind: 'folder', children: ['Customer 360', 'Churn Watch', 'Acquisition Funnel', 'LTV Cohorts', 'Support Load', 'NPS Trend'].map((n, i) => ({ id: `l${i}`, label: n, kind: 'report', compat: i === 1 ? 'equivalent' : 'native' })) }],
  mp_domo_finance: [{ id: 'g1', label: 'Página Finance Cockpit', kind: 'folder', children: ['Finance Cockpit', 'Cash Flow', 'Budget vs Actual', 'AP Aging', 'Expense Drivers'].map((n, i) => ({ id: `d${i}`, label: n, kind: 'report', compat: 'native' })) }],
  mp_ts_retail: [{ id: 'g1', label: 'Org Retail', kind: 'folder', children: ['Store Performance', 'Basket Analysis', 'Stock Availability', 'Promo Effectiveness'].map((n, i) => ({ id: `s${i}`, label: n, kind: 'report', compat: 'native' })) }],
};
export const SUMMARY_DIALECT: Record<string, { name: string; original: string; interp: string; biweb: string }> = {
  tableau: { name: 'Campo calculado · Tableau', original: 'SUM([Sales]) / COUNTD([Order ID])', interp: 'Ticket médio = receita ÷ pedidos distintos', biweb: 'Metric · Revenue.AvgTicket' },
  qlik: { name: 'Expressão · Qlik Sense', original: 'Sum({<Year={$(=Max(Year))}>} Amount)', interp: 'Soma de Amount no ano mais recente', biweb: 'Metric · Amount.Total com filtro de período' },
  looker: { name: 'LookML', original: 'measure: total_revenue { type: sum  sql: ${TABLE}.amount ;; }', interp: 'Soma de amount', biweb: 'Metric · Revenue.Total' },
  thoughtspot: { name: 'Fórmula · ThoughtSpot', original: 'sum ( revenue ) / unique count ( order id )', interp: 'Receita ÷ pedidos distintos', biweb: 'Metric · Revenue.AvgTicket' },
  domo: { name: 'Beast Mode · Domo', original: 'SUM(`amount`) / COUNT(DISTINCT `invoice`)', interp: 'Valor médio por fatura', biweb: 'Metric · Invoice.AvgValue' },
  powerbi: { name: 'DAX · Power BI', original: 'DIVIDE([Net Revenue], [Orders])', interp: 'Receita líquida ÷ pedidos', biweb: 'Metric · Revenue.AvgTicket' },
};

/* ───────────── Descobertas (Legacy cleanup) ───────────── */
const vz = (n: number) => VISUALS.filter((v) => v.compat === 'native').slice(n, n + 2).map((v) => ({ id: v.id, label: v.name }));
export const INSIGHTS: Insight[] = [
  { id: 'in_dup', title: 'Medidas duplicadas', count: 4, tone: 'warning', evidence: ['Total Revenue e Gross Revenue têm expressão idêntica: SUM(Orders[Total])', 'Revenue Total (old) soma a coluna legada VL_TOTAL, mesma origem', 'Margin % e Gross Margin têm a mesma fórmula, com nomes diferentes'], affected: ['total_revenue', 'revenue_total_old', 'margin_pct', 'margem_bruta'].map((id) => ({ id: `ms:${id}`, label: MEASURES.find((m) => m.id === id)!.name })), action: 'Consolidar em uma definição por conceito', actionLabel: 'Propor consolidação' },
  { id: 'in_equiv', title: 'Medidas semanticamente equivalentes', count: 6, tone: 'accent', evidence: ['Gross Margin, Margin %, Margem Bruta calculam (receita − custo) ÷ receita', 'Revenue Selected Region repete Net Revenue com filtro de contexto', 'Net Revenue e Total Revenue divergem só por devoluções'], affected: ['gross_margin', 'margin_pct', 'margem_bruta', 'rev_selected', 'net_revenue', 'total_revenue'].map((id) => ({ id: `ms:${id}`, label: MEASURES.find((m) => m.id === id)!.name })), action: 'Mapear para uma métrica e manter apelidos', actionLabel: 'Revisar equivalências' },
  { id: 'in_unused', title: 'Campos sem uso', count: 12, tone: 'warning', evidence: ['12 colunas não aparecem em visuais, filtros, medidas ou relacionamentos', 'Nenhuma delas é usada por regras de segurança', '9 pertencem a CUSTOMERS_OLD e ORDERS'], affected: ['CUSTOMERS_OLD.FAX', 'CUSTOMERS_OLD.OBS', 'ORDERS.COD_LEGADO', 'ORDERS.FLG_TMP', 'ORDERS.USR_ALT', 'PRODUCTS.EAN_OLD', 'PRODUCTS.IMG_URL', 'RETURNS.OBS', 'DIM_DATE.SEMANA_ISO', 'REGIONS.COD_IBGE_OLD', 'CHANNELS.ICON', 'CHANNELS.SORT_OLD'].map((n, i) => ({ id: `col:${i}`, label: n })), action: 'Não migrar estas colunas', actionLabel: 'Excluir do escopo' },
  { id: 'in_pages', title: 'Páginas com propósito parecido', count: 3, tone: 'accent', evidence: ['Sudeste, Sul e Nordeste têm o mesmo layout com filtro de região diferente', 'Mesmas 6 métricas e 6 tipos de visual', '94% de sobreposição de campos'], affected: [{ id: 'pg:region:sudeste', label: 'Regional Sales · Sudeste' }, { id: 'pg:region:sul', label: 'Regional Sales · Sul' }, { id: 'pg:region:nordeste', label: 'Regional Sales · Nordeste' }], action: 'Uma página com filtro de região', actionLabel: 'Consolidar páginas' },
  { id: 'in_deprecated', title: 'Componentes descontinuados', count: 2, tone: 'warning', evidence: ['2 visuais usam "Card (old)", removido do Power BI Desktop em 2023', 'Aparecem em Operations SLA e Incidents'], affected: vz(10), action: 'Reconstruir com KPI nativo', actionLabel: 'Aplicar KPI nativo' },
  { id: 'in_broken', title: 'Dependência quebrada', count: 1, tone: 'danger', evidence: ['Visual "Margin Bucket" referencia o campo [Margem_Antiga], removido do modelo', 'O visual abre com erro no original desde 14/09'], affected: [{ id: 'ms:margin_bucket', label: 'Margin Bucket' }], action: 'Apontar para Gross Margin', actionLabel: 'Corrigir referência' },
  { id: 'in_reports', title: 'Relatórios sem acesso nos últimos 90 dias', count: 3, tone: 'accent', evidence: ['Margin & Pricing, Field Service e Executive Weekly sem visualizações em 90 dias', 'Executive Weekly ainda é enviado por assinatura'], affected: ['margin', 'field', 'weekly'].map((id) => ({ id: reportId(id), label: REPORTS.find((r) => r.id === id)!.name })), action: 'Remover do escopo ou migrar como arquivo', actionLabel: 'Ajustar escopo' },
];

/* ───────────── Fila de revisão ───────────── */
export const REVIEW: ReviewItem[] = [
  { id: 'rv1', title: 'Mapeamento de visual personalizado', kind: 'visual', issue: 'Custom visual · Sankey XYZ não tem equivalente exato.', evidence: ['Usado em Executive Sales · Channels', 'Modo de marcação de fluxos não existe no Sankey nativo', 'Dados de origem compatíveis com Sankey de 2 níveis'], recommendation: 'Usar Sankey nativo e manter a tabela de apoio.', confidence: 62, itemId: 'vz:exec:channels:1', blocks: [{ kind: 'report', id: 'exec' }] },
  { id: 'rv2', title: 'Interpretação da métrica Churn Rate', kind: 'metric', issue: 'A janela de 180 dias está fixa no código e a definição de "perdido" não é explícita.', evidence: ['TODAY() − 180 dias em FILTER', 'Customer Analytics usa a medida em 5 visuais', 'Metric "Customers.Churn" existe no BIWEB com janela configurável'], recommendation: 'Criar métrica com parâmetro de janela (padrão 180 dias).', confidence: 71, itemId: 'ms:churn_rate', blocks: [{ kind: 'report', id: 'customer' }, { kind: 'model', id: 'cust360' }] },
  { id: 'rv3', title: 'Regra de segurança por linha', kind: 'security', issue: 'RLS usa USERPRINCIPALNAME() para restringir região.', evidence: ['3 papéis com RLS: Gerente Regional, Supervisor, Analista', 'Mapeamento de usuários depende do Entra ID', 'Sem regra equivalente definida no workspace BIWEB'], recommendation: 'Mapear para política de acesso por atributo "região" do perfil.', confidence: 58, itemId: 'ms:rls_region', blocks: [{ kind: 'model', id: 'sales' }, { kind: 'report', id: 'region' }] },
  { id: 'rv4', title: 'Fonte de dados desconhecida', kind: 'source', issue: 'Legacy_FTP_Targets.csv é lido por Targets 2026 e não tem conexão registrada.', evidence: ['Caminho: \\\\ftp-legacy\\metas\\2026', 'Atualizado manualmente toda segunda', 'Mesmas colunas de Targets.xlsx (92% de sobreposição)'], recommendation: 'Usar Targets.xlsx e aposentar o CSV.', confidence: 44, blocks: [{ kind: 'model', id: 'targets' }, { kind: 'report', id: 'targets' }] },
  { id: 'rv5', title: 'Relacionamento ambíguo', kind: 'relationship', issue: 'ORDERS.COD_PRODUTO pode ligar a PRODUCTS ou a PRODUCTS_V2.', evidence: ['Sobreposição de valores: 99,1% com PRODUCTS, 71% com PRODUCTS_V2', 'Nomes iguais nas duas tabelas', 'PRODUCTS_V2 não tem uso em visuais'], recommendation: 'Ligar a PRODUCTS e descartar PRODUCTS_V2.', confidence: 67, blocks: [{ kind: 'model', id: 'sales' }] },
  { id: 'rv6', title: 'Interação sem suporte', kind: 'interaction', issue: 'Bookmark alterna entre Tabela e Gráfico com ocultação de visuais.', evidence: ['Bookmark "Alternar Tabela/Gráfico" em Product Mix', 'O BIWEB usa troca de tipo no próprio visual', 'Sem perda de dados'], recommendation: 'Substituir por alternância Tabela/Gráfico no widget.', confidence: 55, blocks: [{ kind: 'report', id: 'product' }] },
  { id: 'rv7', title: 'Visual em Python', kind: 'visual', issue: 'Script em Python gera gráfico de coortes em Customer Analytics.', evidence: ['Script de 38 linhas com pandas + matplotlib', 'Coortes aparecem no catálogo como Tabela de calor', 'Entradas: cliente, primeira compra, mês'], recommendation: 'Reconstruir como Tabela de calor de retenção.', confidence: 49, blocks: [{ kind: 'report', id: 'customer' }] },
  { id: 'rv8', title: 'Visual em R', kind: 'visual', issue: 'Previsão de metas feita com forecast::auto.arima em Sales Targets.', evidence: ['Linha de previsão com intervalo de 80%', 'Linha de tendência nativa não replica ARIMA', 'Copilot propõe previsão sazonal'], recommendation: 'Usar linha com previsão nativa e validar com o time de planejamento.', confidence: 52, blocks: [{ kind: 'report', id: 'targets' }] },
  { id: 'rv9', title: 'Semântica de Top N Product Revenue', kind: 'metric', issue: 'ALL(Products) ignora filtros do usuário dentro do TOPN.', evidence: ['No original, o Top 10 é global e não responde ao slicer de categoria', 'No BIWEB, Top N respeita filtros por padrão'], recommendation: 'Manter o comportamento original com "ignorar filtros de categoria".', confidence: 78, itemId: 'ms:topn_revenue', blocks: [{ kind: 'report', id: 'product' }] },
  { id: 'rv10', title: 'Camada de tiles personalizada', kind: 'map', issue: 'Network Map usa tile raster próprio hospedado em servidor interno.', evidence: ['URL: tiles.corp.local/terrain/{z}/{x}/{y}', 'O Map Workspace oferece base Terrain e Satélite', 'Tile próprio mostra sítios sem cobertura pública'], recommendation: 'Usar base Terrain e registrar tile como camada raster, se disponível.', confidence: 69, itemId: 'map:network', blocks: [{ kind: 'map', id: 'map:network' }] },
  { id: 'rv11', title: 'Política de refresh incremental', kind: 'refresh', issue: 'Incidents usa RangeStart/RangeEnd com janela móvel de 30 dias.', evidence: ['Parâmetros de data no Power Query', 'Workflow tem nó de carga incremental', 'Detecção de alteração por coluna UpdatedAt'], recommendation: 'Criar carga incremental com janela de 30 dias no Workflow.', confidence: 73, blocks: [{ kind: 'workflow', id: 'proc:refresh' }, { kind: 'model', id: 'incidents' }] },
  { id: 'rv12', title: 'Medida Legacy KPI Flag', kind: 'metric', issue: 'PATHCONTAINS sobre hierarquia pai-filho sem equivalente direto.', evidence: ['Usada em 1 visual de Margin & Pricing (sem acesso há 90 dias)', 'Hierarquia pode virar dimensão com níveis no LDE'], recommendation: 'Não migrar: relatório não é usado. Registrar como descartado.', confidence: 41, itemId: 'ms:legacy_kpi', blocks: [{ kind: 'report', id: 'margin' }] },
];

/* ───────────── Sugestões de modernização ───────────── */
export const SUGGESTIONS: Suggestion[] = [
  { id: 'sg_consol', title: '6 visuais comunicam a mesma informação', reason: 'Em Regional Sales, seis visuais mostram receita por região com cortes quase idênticos (94% de sobreposição).', impact: '−5 visuais · mesma informação · 1 interação a mais (drill por região)', preview: 'consolidate', itemIds: ['pg:region:brasil'], to: 'Uma visualização interativa com drill' },
  { id: 'sg_map', title: 'A visualização geográfica atual é limitada', reason: 'Revenue by State é um mapa de formas sem camadas. Há coordenadas e regiões suficientes para análise geoespacial.', impact: '+3 camadas · rotas e pontos · mesmo dado', preview: 'map', itemIds: ['map:regional', 'vz:exec:regional:1'], to: 'Map Workspace · Network Intelligence' },
  { id: 'sg_wf', title: 'Três operações agendadas podem ser unificadas', reason: 'Refresh diário, alerta de KPI e e-mail para Comercial rodam em três lugares diferentes.', impact: '−2 agendas · 1 fluxo auditável', preview: 'workflow', itemIds: ['proc:refresh'], to: 'Workflow · Atualização diária Comercial' },
  { id: 'sg_metric', title: 'Duas métricas parecem semanticamente equivalentes', reason: 'Gross Margin e Margin % calculam a mesma razão com nomes diferentes.', impact: '−1 definição · 14 visuais apontam para a mesma métrica', preview: 'metric', itemIds: ['ms:gross_margin', 'ms:margin_pct'], to: 'Metric Margin.Gross (apelido: Margin %)' },
];

/* ───────────── Validação ───────────── */
const C = (id: string, group: string, label: string, original: string, biweb: string, status: Check['status'], note?: string, itemId?: string): Check => ({ id, group, label, original, biweb, status, note, itemId });
export const CHECKS: Check[] = [
  C('c1', 'Valores', 'Revenue · total do ano', 'R$ 18,42 mi', 'R$ 18,42 mi', 'match', undefined, 'ms:net_revenue'),
  C('c2', 'Valores', 'Orders · total do ano', '42.381', '42.381', 'match', undefined, 'ms:orders'),
  C('c3', 'Valores', 'Average Ticket', 'R$ 434,60', 'R$ 434,60', 'match', undefined, 'ms:avg_ticket'),
  C('c4', 'Valores', 'Receita por UF (27 valores)', '27/27', '27/27', 'match'),
  C('c5', 'Totais', 'Total geral da matriz de receita', 'R$ 18.421.907', 'R$ 18.421.907', 'match'),
  C('c6', 'Totais', 'Subtotais por canal', '4/4', '4/4', 'match'),
  C('c7', 'Totais', 'Total de incidentes abertos', '1.208', '1.208', 'match', undefined, 'ms:open_incidents'),
  C('c8', 'Métricas', 'Margin', '27,84%', '27,84%', 'match', undefined, 'ms:gross_margin'),
  C('c9', 'Métricas', 'Net Revenue YTD', 'R$ 14,06 mi', 'R$ 14,06 mi', 'match', 'Mesmo calendário fiscal', 'ms:net_revenue_ytd'),
  C('c10', 'Métricas', 'Revenue YoY %', '+6,2%', '+6,2%', 'match', undefined, 'ms:revenue_yoy'),
  C('c11', 'Métricas', 'SLA Compliance %', '93,7%', '93,7%', 'match', undefined, 'ms:sla_compliance'),
  C('c12', 'Métricas', 'MTTR (h)', '4,81', '4,81', 'match', undefined, 'ms:mttr'),
  C('c13', 'Métricas', 'Churn Rate', '4,12%', '4,09%', 'failed', 'Diferença de 0,03 p.p. acima da tolerância (0,01). A janela de 180 dias precisa de revisão.', 'ms:churn_rate'),
  C('c14', 'Métricas', 'Top N Product Revenue', 'R$ 6,91 mi', 'R$ 6,91 mi', 'equivalent', 'Mesmo valor; comportamento de filtro difere (ver revisão).', 'ms:topn_revenue'),
  C('c15', 'Filtros', 'Region Filter', 'Sudeste → 7.214 pedidos', 'Sudeste → 7.214 pedidos', 'equivalent', 'Slicer virou filtro em botões', 'vz:exec:overview:7'),
  C('c16', 'Filtros', 'Filtro de data relativo (12 meses)', '2025-10 → 2026-09', '2025-10 → 2026-09', 'match'),
  C('c17', 'Filtros', 'Filtros de visual (Top 10)', '10 itens', '10 itens', 'match'),
  C('c18', 'Drill', 'Drill-down Região → Estado → Cidade', '3 níveis', '3 níveis', 'match'),
  C('c19', 'Drill', 'Drill-through · Cliente', 'Abre página Customers', 'Abre página Customers', 'match'),
  C('c20', 'Interações', 'Cross-filter entre visuais', '12 de 12', '12 de 12', 'match'),
  C('c21', 'Interações', 'Tooltip de página', 'Tooltip nativo', 'Tooltip rico', 'equivalent', 'Mais campos no tooltip do BIWEB'),
  C('c22', 'Interações', 'Bookmark "Alternar Tabela/Gráfico"', 'Oculta visuais', 'Troca de tipo no widget', 'review', 'Interação reconstruída de outra forma', 'vz:product:mix:1'),
  C('c23', 'Páginas', 'Páginas por relatório', '48', '48', 'match'),
  C('c24', 'Páginas', 'Ordem das páginas', 'Idêntica', 'Idêntica', 'match'),
  C('c25', 'Navegação', 'Botões de navegação', '18', '18', 'match'),
  C('c26', 'Navegação', 'Navegador de páginas Regional', '5 itens', '5 itens', 'match'),
  C('c27', 'Layout', 'Executive Sales · Overview', '9 visuais', '9 visuais', 'equivalent', 'Pequenas diferenças de grade (12 colunas)', 'pg:exec:overview'),
  C('c28', 'Layout', 'Product Mix · Mix', '7 visuais', '6 visuais', 'review', 'Rosca de 14 categorias virou Treemap e o filtro foi incorporado', 'pg:product:mix'),
  C('c29', 'Mapas', 'Revenue by State', '27 estados', '27 estados', 'equivalent', 'Choropleth reconstruído no Map Workspace', 'map:regional'),
  C('c30', 'Mapas', 'Network Map · sítios', '1.204 pontos', '1.204 pontos', 'match', undefined, 'map:network'),
  C('c31', 'Mapas', 'Network Map · camada de terreno', 'Tile personalizado', 'Base Terrain', 'review', 'Tile próprio não replicado', 'map:network'),
  C('c32', 'Visual', 'Custom visual · Sankey XYZ', 'Fluxos com marcação', 'Sankey nativo', 'failed', 'Modo de marcação não existe no BIWEB', 'vz:exec:channels:1'),
];
export const CHECK_GROUPS = ['Valores', 'Totais', 'Métricas', 'Filtros', 'Drill', 'Interações', 'Páginas', 'Navegação', 'Layout', 'Mapas', 'Visual'];

/* ───────────── Mapeamentos ───────────── */
const MP = (id: string, type: Mapping['type'], group: Mapping['group'], from: string, to: string, target: string, state: Mapping['state'], confidence: number, itemId?: string): Mapping => ({ id, type, group, from, to, target, state, confidence, itemId });
export const MAPPINGS: Mapping[] = [
  MP('m1', 'Visual', 'visuals', 'Power BI Line Chart', 'BIWEB Time Series', 'Report Builder', 'auto', 98),
  MP('m2', 'Visual', 'visuals', 'Clustered column chart', 'BIWEB Colunas', 'Report Builder', 'auto', 98),
  MP('m3', 'Visual', 'visuals', 'Matrix', 'BIWEB Matriz', 'Report Builder', 'auto', 97),
  MP('m4', 'Visual', 'visuals', 'Donut chart', 'BIWEB Rosca', 'Report Builder', 'auto', 97),
  MP('m5', 'Visual', 'visuals', 'Waterfall chart', 'BIWEB Cascata', 'Report Builder', 'confirmed', 93),
  MP('m6', 'Visual', 'visuals', 'Decomposition tree', 'BIWEB Hierarquia com drill', 'Report Builder', 'pending', 84),
  MP('m7', 'Visual', 'visuals', 'Pie chart · 14 categorias', 'BIWEB Treemap', 'Report Builder', 'pending', 82, 'vz:exec:products:1'),
  MP('m8', 'Visual', 'visuals', 'Custom visual · Sankey XYZ', 'BIWEB Sankey', 'Report Builder', 'pending', 62, 'vz:exec:channels:1'),
  MP('m9', 'Métrica', 'metrics', 'Total Revenue', 'Revenue.Total', 'Semantic layer', 'auto', 96, 'ms:total_revenue'),
  MP('m10', 'Métrica', 'metrics', 'Net Revenue', 'Revenue.Net', 'Semantic layer', 'confirmed', 96, 'ms:net_revenue'),
  MP('m11', 'Métrica', 'metrics', 'Gross Margin', 'Margin.Gross', 'Semantic layer', 'confirmed', 95, 'ms:gross_margin'),
  MP('m12', 'Métrica', 'metrics', 'Margem Bruta', 'Margin.Gross (apelido)', 'Semantic layer', 'pending', 86, 'ms:margem_bruta'),
  MP('m13', 'Métrica', 'metrics', 'Churn Rate', 'Customers.Churn(window=180d)', 'Semantic layer', 'pending', 71, 'ms:churn_rate'),
  MP('m14', 'Tabela', 'data', 'CUSTOMERS_OLD', 'Customer', 'Data Workspace · LDE', 'confirmed', 94, 'tb:sales:customers_old'),
  MP('m15', 'Tabela', 'data', 'ORDERS', 'Order', 'Data Workspace · LDE', 'auto', 97, 'tb:sales:orders'),
  MP('m16', 'Tabela', 'data', 'PRODUCTS', 'Product', 'Data Workspace · LDE', 'auto', 97, 'tb:sales:products'),
  MP('m17', 'Tabela', 'data', 'DIM_DATE', 'Calendar', 'Data Workspace · LDE', 'auto', 99, 'tb:sales:dim_date'),
  MP('m18', 'Campo', 'data', 'COD_CLIENTE', 'customer_id', 'Data Workspace · LDE', 'auto', 96),
  MP('m19', 'Campo', 'data', 'VL_TOTAL', 'total_amount', 'Data Workspace · LDE', 'auto', 95),
  MP('m20', 'Campo', 'data', 'DT_PEDIDO', 'order_date', 'Data Workspace · LDE', 'auto', 97),
  MP('m21', 'Campo', 'data', 'UF', 'state', 'Data Workspace · LDE', 'auto', 98),
  MP('m22', 'Mapa', 'maps', 'ArcGIS Visual · Revenue by State', 'Map Workspace · Coverage', 'Map Builder', 'confirmed', 88, 'map:regional'),
  MP('m23', 'Mapa', 'maps', 'Azure Map · Network Map', 'Map Workspace · Network Intelligence', 'Map Builder', 'pending', 76, 'map:network'),
  MP('m24', 'Mapa', 'maps', 'Shape map · Crew Routes', 'Map Workspace · Field Ops', 'Map Builder', 'auto', 83, 'map:field'),
  MP('m25', 'Interação', 'interactions', 'Cross-filter', 'Cross-filter BIWEB', 'Report Builder', 'auto', 99),
  MP('m26', 'Interação', 'interactions', 'Drill-through · Cliente', 'Drill-through BIWEB', 'Report Builder', 'auto', 96),
  MP('m27', 'Interação', 'interactions', 'Tooltip de página', 'Tooltip rico', 'Report Builder', 'confirmed', 91),
  MP('m28', 'Interação', 'interactions', 'Bookmark · Alternar Tabela/Gráfico', 'Alternar tipo no widget', 'Report Builder', 'pending', 55),
  MP('m29', 'Filtro', 'interactions', 'Slicer · Region', 'Filtro em botões', 'Report Builder', 'auto', 95),
  MP('m30', 'Refresh', 'automation', 'Daily Refresh 06:00', 'Workflow Builder · Schedule', 'Workflow Builder', 'confirmed', 94, 'proc:refresh'),
  MP('m31', 'Refresh', 'automation', 'KPI alert: Net Revenue', 'Workflow Builder · Condição + Notificação', 'Workflow Builder', 'confirmed', 90, 'proc:refresh'),
  MP('m32', 'Refresh', 'automation', 'Assinatura semanal + PDF', 'Workflow Builder · Exportar + Enviar', 'Workflow Builder', 'pending', 87, 'proc:subs'),
];

/* ───────────── Blueprint ───────────── */
const B = (id: string, layer: number, col: number, label: string, sub?: string, ref?: string): BpNode => ({ id, layer, col, label, sub, ref });
export const BP_NODES: BpNode[] = [
  B('s_oracle', 0, 0, 'Oracle Sales', 'Oracle 19c', 'src:oracle'), B('s_erp', 0, 1, 'ERP Orders', 'SAP HANA', 'src:erp'), B('s_crm', 0, 2, 'CRM Customers', 'Dynamics 365', 'src:crm'), B('s_nms', 0, 3, 'Telecom NMS', 'PostgreSQL', 'src:nms'), B('s_sheet', 0, 4, 'Targets.xlsx', 'SharePoint', 'src:sheet'),
  B('d_sales', 1, 0, 'Sales Model', '8 tabelas', 'ds:sales'), B('d_cust', 1, 1, 'Customer 360', '5 tabelas', 'ds:cust360'), B('d_prod', 1, 2, 'Product Catalog', '4 tabelas', 'ds:catalog'), B('d_ops', 1, 3, 'Operations SLA · Incidents', '8 tabelas', 'ds:sla'), B('d_net', 1, 4, 'Network · Field', '8 tabelas', 'ds:network'),
  B('m_sales', 2, 0, 'Revenue model', 'Receita · custo · devolução'), B('m_cust', 2, 1, 'Customer model', 'Clientes · segmentos'), B('m_ops', 2, 3, 'Operations model', 'SLA · incidentes'), B('m_net', 2, 4, 'Network model', 'Links · capacidade'),
  B('k_net', 3, 0, 'Net Revenue', 'SUM − devoluções', 'ms:net_revenue'), B('k_margin', 3, 1, 'Gross Margin', '(receita − custo) ÷ receita', 'ms:gross_margin'), B('k_orders', 3, 2, 'Orders', 'Pedidos distintos', 'ms:orders'), B('k_ticket', 3, 3, 'Average Ticket', 'Receita ÷ pedidos', 'ms:avg_ticket'), B('k_sla', 3, 4, 'SLA Compliance %', 'No prazo ÷ total', 'ms:sla_compliance'), B('k_avail', 3, 5, 'Network Availability %', 'Uptime ÷ total', 'ms:availability'),
  B('p_exec', 4, 0, 'Executive Dashboard', '6 páginas', 'rep:exec'), B('p_region', 4, 1, 'Regional Sales', '5 páginas', 'rep:region'), B('p_ops', 4, 3, 'Operations SLA', '5 páginas', 'rep:sla'), B('p_netmap', 4, 4, 'Network Map', '3 páginas', 'rep:netmap'), B('p_weekly', 4, 5, 'Executive Weekly', '3 páginas', 'rep:weekly'),
  B('v_rev', 5, 0, 'Revenue Chart', 'Linha · Net Revenue', 'vz:exec:overview:5'), B('v_kpi', 5, 1, 'KPI Row', '4 cartões', 'vz:exec:overview:1'), B('v_state', 5, 2, 'Revenue by State', 'ArcGIS Map', 'vz:exec:regional:1'), B('v_mix', 5, 3, 'Product Mix', 'Pizza · 14 categorias', 'vz:exec:products:1'), B('v_sla', 5, 4, 'SLA Gauge', 'Medidor', undefined), B('v_site', 5, 5, 'Site Map', 'Azure Map', 'vz:netmap:map:1'),
  B('i_cross', 6, 0, 'Cross-filter', '12 visuais'), B('i_drill', 6, 1, 'Drill Região → Estado', '3 níveis'), B('i_nav', 6, 2, 'Navegação', '18 botões'), B('i_rls', 6, 4, 'RLS por região', '3 papéis', 'ms:rls_region'),
  B('o_refresh', 7, 0, 'Daily Refresh', '06:00', 'proc:refresh'), B('o_alert', 7, 1, 'KPI alert', 'Net Revenue < meta', 'proc:refresh'), B('o_subs', 7, 2, 'Weekly subscription', 'PDF · segunda', 'proc:subs'),
];
export const BP_EDGES: [string, string][] = [
  ['s_oracle', 'd_sales'], ['s_erp', 'd_sales'], ['s_erp', 'd_prod'], ['s_crm', 'd_cust'], ['s_nms', 'd_ops'], ['s_nms', 'd_net'], ['s_sheet', 'd_sales'],
  ['d_sales', 'm_sales'], ['d_cust', 'm_cust'], ['d_prod', 'm_sales'], ['d_ops', 'm_ops'], ['d_net', 'm_net'],
  ['m_sales', 'k_net'], ['m_sales', 'k_margin'], ['m_sales', 'k_orders'], ['m_cust', 'k_ticket'], ['m_ops', 'k_sla'], ['m_net', 'k_avail'], ['k_net', 'k_margin'], ['k_net', 'k_ticket'], ['k_orders', 'k_ticket'],
  ['k_net', 'p_exec'], ['k_margin', 'p_exec'], ['k_orders', 'p_exec'], ['k_net', 'p_region'], ['k_sla', 'p_ops'], ['k_avail', 'p_netmap'], ['k_net', 'p_weekly'], ['k_avail', 'p_weekly'],
  ['p_exec', 'v_rev'], ['p_exec', 'v_kpi'], ['p_exec', 'v_state'], ['p_exec', 'v_mix'], ['p_ops', 'v_sla'], ['p_netmap', 'v_site'], ['p_region', 'v_state'],
  ['v_rev', 'i_cross'], ['v_state', 'i_drill'], ['v_kpi', 'i_cross'], ['v_mix', 'i_nav'], ['v_site', 'i_rls'], ['v_sla', 'i_rls'],
  ['i_cross', 'o_refresh'], ['i_drill', 'o_alert'], ['i_nav', 'o_subs'], ['i_rls', 'o_alert'],
];

/* ───────────── Modelo de dados (Sales Model) ───────────── */
const col = (name: string, type: string, o: Partial<{ pk: boolean; fk: boolean; renamed: string; calc: boolean }> = {}) => ({ name, type, ...o });
export const ORIGINAL_MODEL: ModelTable[] = [
  { id: 'cust', name: 'CUSTOMERS_OLD', x: 20, y: 150, cols: [col('COD_CLIENTE', 'texto', { pk: true, renamed: 'customer_id' }), col('NOME', 'texto', { renamed: 'name' }), col('UF', 'texto', { fk: true, renamed: 'state' }), col('SEGMENTO', 'texto', { renamed: 'segment' }), col('DT_CAD', 'data', { renamed: 'created_at' }), col('FAX', 'texto')] },
  { id: 'orders', name: 'ORDERS', x: 300, y: 110, cols: [col('ORDER_ID', 'inteiro', { pk: true, renamed: 'order_id' }), col('COD_CLIENTE', 'texto', { fk: true, renamed: 'customer_id' }), col('COD_PRODUTO', 'texto', { fk: true, renamed: 'product_id' }), col('DT_PEDIDO', 'data', { fk: true, renamed: 'order_date' }), col('VL_TOTAL', 'decimal', { renamed: 'total_amount' }), col('VL_DESC', 'decimal', { renamed: 'discount_amount' }), col('CANAL', 'texto', { renamed: 'channel' })] },
  { id: 'prod', name: 'PRODUCTS', x: 580, y: 150, cols: [col('COD_PRODUTO', 'texto', { pk: true, renamed: 'product_id' }), col('DESC_PROD', 'texto', { renamed: 'name' }), col('CATEGORIA', 'texto', { renamed: 'category' }), col('CUSTO_UNIT', 'decimal', { renamed: 'unit_cost' }), col('EAN_OLD', 'texto')] },
  { id: 'ret', name: 'RETURNS', x: 300, y: 330, cols: [col('RETURN_ID', 'inteiro', { pk: true }), col('ORDER_ID', 'inteiro', { fk: true }), col('VL_DEVOL', 'decimal'), col('DT_DEVOL', 'data')] },
  { id: 'date', name: 'DIM_DATE', x: 300, y: -70, cols: [col('DATA', 'data', { pk: true }), col('ANO', 'inteiro'), col('MES', 'inteiro'), col('TRIMESTRE', 'inteiro')] },
  { id: 'reg', name: 'REGIONS', x: 20, y: -20, cols: [col('UF', 'texto', { pk: true }), col('REGIAO', 'texto'), col('COD_IBGE_OLD', 'texto')] },
];
export const PROPOSED_MODEL: ModelTable[] = [
  { id: 'cust', name: 'customers', newName: 'customers', tag: 'renamed', x: 20, y: 150, note: 'Renomeado de CUSTOMERS_OLD', cols: [col('customer_id', 'texto', { pk: true }), col('name', 'texto'), col('state', 'texto', { fk: true }), col('segment', 'texto'), col('created_at', 'data')] },
  { id: 'orders', name: 'orders', tag: 'renamed', x: 300, y: 110, note: '4 campos normalizados', cols: [col('order_id', 'inteiro', { pk: true }), col('customer_id', 'texto', { fk: true }), col('product_id', 'texto', { fk: true }), col('order_date', 'data', { fk: true }), col('total_amount', 'decimal'), col('discount_amount', 'decimal'), col('channel', 'texto')] },
  { id: 'prod', name: 'products', tag: 'renamed', x: 580, y: 150, cols: [col('product_id', 'texto', { pk: true }), col('name', 'texto'), col('category', 'texto'), col('unit_cost', 'decimal')] },
  { id: 'ret', name: 'returns', x: 300, y: 330, cols: [col('return_id', 'inteiro', { pk: true }), col('order_id', 'inteiro', { fk: true }), col('return_amount', 'decimal'), col('returned_at', 'data')] },
  { id: 'date', name: 'calendar', tag: 'merged', x: 300, y: -70, note: 'Mescla DIM_DATE + CALENDARIO_OLD', cols: [col('date', 'data', { pk: true }), col('year', 'inteiro'), col('month', 'inteiro'), col('quarter', 'inteiro'), col('fiscal_quarter', 'inteiro', { calc: true })] },
  { id: 'reg', name: 'regions', tag: 'new', x: 20, y: -20, note: 'Dimensão geográfica para o Map Workspace', cols: [col('state', 'texto', { pk: true }), col('region', 'texto'), col('geometry', 'geo')] },
];
export const ORIGINAL_RELS: Relationship[] = [
  { id: 'r1', from: 'cust', fromCol: 'COD_CLIENTE', to: 'orders', toCol: 'COD_CLIENTE', card: '1:*', state: 'known' },
  { id: 'r2', from: 'prod', fromCol: 'COD_PRODUTO', to: 'orders', toCol: 'COD_PRODUTO', card: '1:*', state: 'known' },
  { id: 'r3', from: 'orders', fromCol: 'ORDER_ID', to: 'ret', toCol: 'ORDER_ID', card: '1:*', state: 'known' },
  { id: 'r4', from: 'date', fromCol: 'DATA', to: 'orders', toCol: 'DT_PEDIDO', card: '1:*', state: 'known' },
  { id: 'r5', from: 'reg', fromCol: 'UF', to: 'cust', toCol: 'UF', card: '1:*', state: 'known' },
];
export const PROPOSALS: Relationship[] = [
  { id: 'p1', from: 'orders', fromCol: 'customer_id', to: 'customers', toCol: 'id', card: '1:*', state: 'proposed', confidence: 94, evidence: ['Tipos compatíveis (texto, 12 caracteres)', 'Forte sobreposição de valores (99,6%)', 'Similaridade de nomes: customer_id ↔ COD_CLIENTE', 'Mapeamento anterior em 2 relatórios'] },
  { id: 'p2', from: 'returns', fromCol: 'order_id', to: 'orders', toCol: 'order_id', card: '1:*', state: 'proposed', confidence: 98, evidence: ['Chave primária de ORDERS', 'Sobreposição de valores 100%', 'Mesma ordem de grandeza (1 devolução para ~34 pedidos)'] },
  { id: 'p3', from: 'orders', fromCol: 'product_id', to: 'products', toCol: 'product_id', card: '1:*', state: 'proposed', confidence: 67, evidence: ['Sobreposição de 99,1% com PRODUCTS e 71% com PRODUCTS_V2', 'Nomes iguais nas duas tabelas', 'PRODUCTS_V2 sem uso em relatórios'] },
  { id: 'p4', from: 'visits', fromCol: 'site_id', to: 'sites', toCol: 'id', card: '1:*', state: 'proposed', confidence: 88, evidence: ['Tipos compatíveis', 'Sobreposição de valores 96%', 'Mesma chave usada em Network Inventory'] },
];
export const LDE = [
  { label: 'Esquema compreendido', detail: '6 tabelas · 36 colunas · 5 relacionamentos', ok: true },
  { label: 'Relacionamentos identificados', detail: '4 propostos pelo LDE · 1 ambíguo', ok: true },
  { label: 'Oportunidade de normalização', detail: 'CUSTOMERS_OLD: colunas em português e legadas', ok: false },
  { label: 'Mapeamentos legados encontrados', detail: '14 campos com renome conhecido', ok: true },
  { label: 'Problemas de qualidade detectados', detail: '2.140 CPFs fora do formato · 12 colunas sem uso', ok: false },
];

/* ───────────── Tradução semântica ───────────── */
const OVERRIDES: Record<string, Partial<Translation>> = {
  net_revenue: { concept: 'Receita líquida: vendas menos devoluções no período', evidence: ['Usada em 41 visuais e 9 relatórios', 'Valor confere com o relatório financeiro (R$ 18,42 mi)', 'Mesma definição no dicionário do Comercial'], notes: 'Sem filtros ocultos.' },
  gross_margin: { concept: 'Margem bruta: (receita líquida − CMV) ÷ receita líquida', evidence: ['Depende de Net Revenue e COGS', 'Três medidas calculam a mesma razão (ver Descobertas)'], notes: 'Margin % e Margem Bruta viram apelidos.' },
  churn_rate: { concept: 'Taxa de clientes perdidos: sem compra em 180 dias ÷ clientes ativos', evidence: ['Janela de 180 dias embutida no código', 'Diferença de 0,03 p.p. na validação', 'Definição de "ativo" difere entre modelos'], notes: 'Precisa de decisão: parametrizar janela.' },
  rls_region: { concept: 'Regra de acesso: cada usuário vê apenas a região do seu perfil', evidence: ['Lookup por e-mail do Entra ID', '3 papéis dependem desta regra'], notes: 'Segurança nunca é aplicada sem revisão.' },
  topn_revenue: { concept: 'Receita dos 10 maiores produtos, ignorando filtros de categoria', evidence: ['ALL(Products) remove filtros do usuário', 'Comportamento intencional segundo o autor do relatório'] },
};
export function translationOf(measureId: string): Translation | undefined {
  const m = MEASURES.find((x) => x.id === measureId);
  if (!m) return undefined;
  const o = OVERRIDES[m.id] ?? {};
  return { measureId: m.id, original: m.dax, concept: o.concept ?? m.concept ?? `${m.name}: ${m.agg.toLowerCase()} sobre ${m.inputs.join(', ')}`, inputs: m.inputs, aggregation: m.agg, metric: m.bi ?? 'Sem alvo definido', status: m.compat === 'native' || m.compat === 'equivalent' ? 'ready' : m.compat === 'review' ? 'review' : 'redesign', confidence: m.conf,
    evidence: o.evidence ?? [`Tipos de entrada compatíveis (${m.inputs.length} campo${m.inputs.length > 1 ? 's' : ''})`, 'Valor conferido contra o relatório original', m.deps?.length ? `Depende de ${m.deps.length} outra${m.deps.length > 1 ? 's' : ''} medida${m.deps.length > 1 ? 's' : ''}` : 'Sem dependência de outras medidas'], notes: o.notes, biweb: m.bi ? `${m.bi}` : 'Sem alvo' };
}
export const DIALECTS = [
  { id: 'dax', name: 'DAX · Power BI', original: 'CALCULATE([Net Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))', interp: 'Receita líquida deslocada um ano', biweb: 'Revenue.Net · comparar com ano anterior' },
  { id: 'tableau', name: 'Campo calculado · Tableau', original: 'SUM([Sales]) / COUNTD([Order ID])', interp: 'Ticket médio = receita ÷ pedidos distintos', biweb: 'Revenue.AvgTicket' },
  { id: 'qlik', name: 'Expressão · Qlik Sense', original: 'Sum({<Year={$(=Max(Year))}>} Amount)', interp: 'Soma de Amount no ano mais recente', biweb: 'Amount.Total · filtro Ano = mais recente' },
  { id: 'lookml', name: 'LookML · Looker', original: 'measure: total_revenue { type: sum  sql: ${TABLE}.amount ;; }', interp: 'Soma de amount', biweb: 'Revenue.Total' },
  { id: 'ts', name: 'Fórmula · ThoughtSpot', original: 'sum ( revenue ) / unique count ( order id )', interp: 'Receita ÷ pedidos distintos', biweb: 'Revenue.AvgTicket' },
];

/* ───────────── Reconstrução e Bridge ───────────── */
export interface ReconTarget { id: string; name: string; from: string; builder: 'report' | 'map' | 'workflow' | 'data'; ref: string; initial: number; pieces: string[]; itemId?: string }
export const RECON: ReconTarget[] = [
  ...REPORTS.map((r) => ({ id: `rt:${r.id}`, name: r.name, from: 'Relatório Power BI', builder: 'report' as const, ref: r.ref, initial: ['margin', 'weekly', 'field'].includes(r.id) ? 0 : r.id === 'targets' ? 82 : 100, pieces: ['Layout', 'Widgets', 'Gráficos', 'Tabelas', 'Filtros', 'Interações', 'Navegação'], itemId: reportId(r.id) })),
  ...MAPS.map((m) => ({ id: `rt:${m.id}`, name: m.name, from: 'Visual de mapa', builder: 'map' as const, ref: m.ref, initial: m.id === 'map:network' ? 64 : m.id === 'map:regional' ? 100 : 0, pieces: ['Camadas', 'Coordenadas', 'Regiões', 'Rotas', 'Pontos', 'Relacionamentos'], itemId: m.id })),
  ...PROCESSES.map((p) => ({ id: `rt:${p.id}`, name: p.name, from: 'Agenda e alertas', builder: 'workflow' as const, ref: p.ref, initial: p.id === 'proc:refresh' ? 100 : 0, pieces: p.parts, itemId: p.id })),
  ...['Sales Model', 'Customer 360', 'Operations & Incidents', 'Network Inventory'].map((n, i) => ({ id: `rt:data${i}`, name: n, from: 'Modelo semântico', builder: 'data' as const, ref: '', initial: i === 3 ? 70 : 100, pieces: ['Tabelas', 'Relacionamentos', 'Métricas', 'Qualidade'], itemId: i === 0 ? 'ds:sales' : i === 1 ? 'ds:cust360' : i === 2 ? 'ds:incidents' : 'ds:network' })),
];
export const BUILDER_PATH = (b: ReconTarget['builder'], ref: string) => b === 'report' ? { to: '/reports/$reportId/edit', params: { reportId: ref } } : b === 'map' ? { to: '/maps/$mapId', params: { mapId: ref } } : b === 'workflow' ? { to: '/workflows/$workflowId', params: { workflowId: ref } } : { to: '/connections', params: {} };

export const BRIDGE_CHANGES: BridgeChange[] = [
  { id: 'bc1', sign: '~', title: 'Medida “Net Revenue” alterada', detail: 'A expressão passou a excluir impostos retidos: SUM(Orders[Total]) − SUM(Returns[Total]) − SUM(Orders[Tax]).', affected: ['3 relatórios BIWEB', '7 visualizações', '1 workflow de alerta'], when: 'há 22 min' },
  { id: 'bc2', sign: '+', title: 'Nova página “Forecast” em Sales Targets', detail: 'Página com 5 visuais, 2 usam a nova medida Forecast Revenue.', affected: ['1 relatório BIWEB', '5 visualizações'], when: 'há 1 h' },
  { id: 'bc3', sign: '−', title: 'Visual removido: “Revenue Gauge (legacy)”', detail: 'Removido de Executive Weekly. Nenhuma outra página dependia dele.', affected: ['1 relatório BIWEB', '1 visualização'], when: 'há 3 h' },
];
export const HISTORY: HistoryEntry[] = [
  { id: 'h7', v: 'v3', title: 'Re-análise v3', detail: 'Reanálise após mudança na origem: 3 diferenças encontradas.', when: 'há 8 min', kind: 'analysis' },
  { id: 'h6', v: '', title: 'Origem alterada', detail: '3 mudanças detectadas pelo Bridge Mode.', when: 'há 22 min', kind: 'source' },
  { id: 'h5', v: 'v1', title: 'Publicado v1', detail: '8 relatórios, 2 mapas e 1 fluxo publicados no BIWEB.', when: '6 dias atrás', kind: 'publish' },
  { id: 'h4', v: '', title: 'Validação executada', detail: '32 comparações: 22 iguais, 5 equivalentes, 3 para revisar, 2 com falha.', when: '7 dias atrás', kind: 'validation' },
  { id: 'h3', v: 'v2', title: 'Reconstrução v2', detail: 'Relatórios, mapas e fluxos reconstruídos com estratégia Native.', when: '9 dias atrás', kind: 'reconstruction' },
  { id: 'h2', v: '', title: 'Mapeamentos revisados', detail: '28 de 32 mapeamentos confirmados por Marina Duarte.', when: '11 dias atrás', kind: 'mapping' },
  { id: 'h1', v: 'v1', title: 'Análise v1', detail: 'Inventário de 12 relatórios, 284 visuais e 37 medidas.', when: '14 dias atrás', kind: 'analysis' },
];

/** Passos do processamento de análise (usado ao criar e ao reanalisar um projeto). */
export const ANALYSIS_STEPS = [
  { id: 'a1', label: 'Descobrindo relatórios', total: 12, unit: 'relatórios' },
  { id: 'a2', label: 'Lendo modelos semânticos', total: 9, unit: 'modelos' },
  { id: 'a3', label: 'Analisando cálculos', total: 37, unit: 'medidas' },
  { id: 'a4', label: 'Mapeando visualizações', total: 284, unit: 'visuais' },
  { id: 'a5', label: 'Construindo o Analytics Blueprint', total: 8, unit: 'camadas' },
] as const;

/** Layout esquemático de uma página para o Antes/Depois: grade de 12 colunas. */
export interface Widget { id: string; x: number; y: number; w: number; h: number; type: string; name: string; compat: string; target: string; reason?: string }
export function boardOf(pageIdStr: string): Widget[] {
  const vis = VISUALS.filter((v) => v.page === pageIdStr);
  const out: Widget[] = []; let x = 0, y = 0, rowH = 0;
  for (const v of vis) {
    const kpi = /Card|Gauge/.test(v.type), slicer = /Slicer/.test(v.type), w = kpi ? 3 : slicer ? 12 : /Table|Matrix|Waterfall/.test(v.type) ? 6 : 6, h = kpi ? 1 : slicer ? 1 : 2;
    if (x + w > 12) { x = 0; y += rowH; rowH = 0; }
    out.push({ id: v.id, x, y, w: slicer ? Math.min(w, 12) : w, h, type: v.type, name: v.name, compat: v.compat, target: v.target, reason: v.reason });
    x += w; rowH = Math.max(rowH, h);
  }
  return out;
}
export const demoItem = (id: string) => ITEMS.get(id);
export const DEMO_DATASETS = DATASETS;
