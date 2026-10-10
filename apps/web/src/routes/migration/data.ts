/* Migration Studio — inventário determinístico do projeto de demonstração (Power BI → BIWEB). */
import type { Builder, Compat, Item, Kind, TreeEntry } from './model';

/** PRNG determinístico (mulberry32): os mesmos números em toda sessão e nos testes. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/* ───────────── Fontes, modelos e tabelas ───────────── */
export const SOURCES = [
  { id: 'src:oracle', name: 'Oracle Sales', tech: 'Oracle Database 19c', tables: 9 },
  { id: 'src:erp', name: 'ERP Orders', tech: 'SAP HANA (view)', tables: 14 },
  { id: 'src:crm', name: 'CRM Customers', tech: 'Dynamics 365', tables: 8 },
  { id: 'src:nms', name: 'Telecom NMS', tech: 'PostgreSQL 14', tables: 7 },
  { id: 'src:sheet', name: 'Targets.xlsx', tech: 'SharePoint · Excel', tables: 3 },
] as const;

interface DsDef { id: string; name: string; source: string; compat: Compat; note?: string; tables: string[] }
export const DATASETS: DsDef[] = [
  { id: 'sales', name: 'Sales Model', source: 'src:oracle', compat: 'native', tables: ['ORDERS', 'ORDER_ITEMS', 'CUSTOMERS_OLD', 'PRODUCTS', 'RETURNS', 'DIM_DATE', 'REGIONS', 'CHANNELS'] },
  { id: 'cust360', name: 'Customer 360', source: 'src:crm', compat: 'native', tables: ['CUSTOMER', 'CONTACTS', 'SEGMENTS', 'INTERACTIONS', 'CHURN_SCORE'] },
  { id: 'catalog', name: 'Product Catalog', source: 'src:erp', compat: 'native', tables: ['PRODUCT', 'CATEGORY', 'PRICE_LIST', 'SUPPLIER'] },
  { id: 'targets', name: 'Targets 2026', source: 'src:sheet', compat: 'equivalent', note: 'Planilha com colunas mescladas: o LDE normaliza antes de importar.', tables: ['TARGETS', 'REPS', 'QUOTA_PERIODS'] },
  { id: 'margin', name: 'Margin & Pricing', source: 'src:erp', compat: 'equivalent', note: 'Tabela calculada em DAX vira visão materializada no LDE.', tables: ['COST_ROLLUP', 'DISCOUNTS', 'PRICE_RULES', 'MARGIN_BRIDGE', 'EXCEPTIONS'] },
  { id: 'sla', name: 'Operations SLA', source: 'src:erp', compat: 'native', tables: ['TICKETS', 'SLA_POLICY', 'TEAMS', 'BACKLOG_SNAP'] },
  { id: 'incidents', name: 'Incidents', source: 'src:nms', compat: 'native', tables: ['INCIDENTS', 'ROOT_CAUSE', 'ALARMS', 'REPEAT_FLAGS'] },
  { id: 'field', name: 'Field Service', source: 'src:nms', compat: 'review', note: 'Modelo composto com DirectQuery: decidir entre consulta direta e importação.', tables: ['VISITS', 'CREWS', 'ROUTES', 'SITES_GEO'] },
  { id: 'network', name: 'Network Inventory', source: 'src:nms', compat: 'native', tables: ['LINKS', 'SITES', 'CAPACITY', 'AVAILABILITY'] },
];

/* ───────────── Medidas ───────────── */
export interface MeasureDef { id: string; name: string; table: string; dax: string; compat: Compat; conf: number; agg: string; inputs: string[]; deps?: string[]; bi?: string; concept?: string }
const M = (id: string, name: string, table: string, dax: string, compat: Compat, conf: number, agg: string, inputs: string[], deps: string[] = [], bi?: string, concept?: string): MeasureDef => ({ id, name, table, dax, compat, conf, agg, inputs, deps, bi, concept });
export const MEASURES: MeasureDef[] = [
  M('net_revenue', 'Net Revenue', 'ORDERS', 'SUM(Orders[Total]) - SUM(Returns[Total])', 'native', 96, 'SUM', ['Orders.Total', 'Returns.Total'], [], 'Revenue.Net'),
  M('gross_revenue', 'Gross Revenue', 'ORDERS', 'SUM(Orders[Total])', 'native', 98, 'SUM', ['Orders.Total'], [], 'Revenue.Gross'),
  M('cogs', 'COGS', 'ORDERS', 'SUMX(Orders, Orders[Qty] * RELATED(Products[UnitCost]))', 'equivalent', 88, 'SUMX', ['Orders.Qty', 'Products.UnitCost'], [], 'Cost.COGS'),
  M('gross_margin', 'Gross Margin', 'ORDERS', 'DIVIDE([Net Revenue] - [COGS], [Net Revenue])', 'native', 95, 'RATIO', ['Net Revenue', 'COGS'], ['net_revenue', 'cogs'], 'Margin.Gross'),
  M('orders', 'Orders', 'ORDERS', 'DISTINCTCOUNT(Orders[OrderID])', 'native', 99, 'COUNT DISTINCT', ['Orders.OrderID'], [], 'Orders.Count'),
  M('avg_ticket', 'Average Ticket', 'ORDERS', 'DIVIDE([Net Revenue], [Orders])', 'native', 97, 'RATIO', ['Net Revenue', 'Orders'], ['net_revenue', 'orders'], 'Revenue.AvgTicket'),
  M('net_revenue_ytd', 'Net Revenue YTD', 'ORDERS', 'TOTALYTD([Net Revenue], Calendar[Date])', 'equivalent', 91, 'YTD', ['Net Revenue', 'Calendar.Date'], ['net_revenue'], 'Revenue.Net · período acumulado no ano'),
  M('net_revenue_py', 'Net Revenue PY', 'ORDERS', 'CALCULATE([Net Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))', 'equivalent', 92, 'PERIOD SHIFT', ['Net Revenue', 'Calendar.Date'], ['net_revenue'], 'Revenue.Net · ano anterior'),
  M('revenue_yoy', 'Revenue YoY %', 'ORDERS', 'DIVIDE([Net Revenue] - [Net Revenue PY], [Net Revenue PY])', 'native', 94, 'VARIATION', ['Net Revenue', 'Net Revenue PY'], ['net_revenue', 'net_revenue_py'], 'Revenue.YoY'),
  M('total_revenue', 'Total Revenue', 'ORDERS', 'SUM(Orders[Total])', 'equivalent', 93, 'SUM', ['Orders.Total'], [], 'Revenue.Gross', 'Duplicada de Gross Revenue'),
  M('revenue_total_old', 'Revenue Total (old)', 'ORDERS', 'SUM(Orders[VL_TOTAL])', 'equivalent', 90, 'SUM', ['Orders.VL_TOTAL'], [], 'Revenue.Gross', 'Duplicada de Gross Revenue'),
  M('margin_pct', 'Margin %', 'ORDERS', 'DIVIDE([Net Revenue] - [COGS], [Net Revenue])', 'equivalent', 94, 'RATIO', ['Net Revenue', 'COGS'], ['net_revenue', 'cogs'], 'Margin.Gross', 'Duplicada de Gross Margin'),
  M('margem_bruta', 'Margem Bruta', 'ORDERS', 'DIVIDE(SUM(Orders[Total]) - SUM(Orders[Custo]), SUM(Orders[Total]))', 'equivalent', 86, 'RATIO', ['Orders.Total', 'Orders.Custo'], [], 'Margin.Gross', 'Equivalente a Gross Margin'),
  M('active_customers', 'Active Customers', 'CUSTOMER', 'DISTINCTCOUNT(Orders[CustomerID])', 'native', 98, 'COUNT DISTINCT', ['Orders.CustomerID'], [], 'Customers.Active'),
  M('new_customers', 'New Customers', 'CUSTOMER', 'CALCULATE(DISTINCTCOUNT(Orders[CustomerID]), FILTER(Customers, Customers[FirstOrder] >= MIN(Calendar[Date])))', 'equivalent', 85, 'COUNT DISTINCT', ['Orders.CustomerID', 'Customers.FirstOrder'], [], 'Customers.New'),
  M('churn_rate', 'Churn Rate', 'CUSTOMER', 'VAR Lost = COUNTROWS(FILTER(Customers, [LastOrder] < TODAY() - 180)) RETURN DIVIDE(Lost, [Active Customers])', 'review', 71, 'RATIO', ['Customers.LastOrder', 'Active Customers'], ['active_customers'], 'Customers.Churn', 'Janela de 180 dias fixa no código'),
  M('return_rate', 'Return Rate', 'ORDERS', 'DIVIDE(SUM(Returns[Total]), SUM(Orders[Total]))', 'native', 97, 'RATIO', ['Returns.Total', 'Orders.Total'], [], 'Returns.Rate'),
  M('target_revenue', 'Target Revenue', 'TARGETS', 'SUM(Targets[Target])', 'native', 96, 'SUM', ['Targets.Target'], [], 'Target.Revenue'),
  M('target_attainment', 'Target Attainment %', 'TARGETS', 'DIVIDE([Net Revenue], [Target Revenue])', 'native', 96, 'RATIO', ['Net Revenue', 'Target Revenue'], ['net_revenue', 'target_revenue'], 'Target.Attainment'),
  M('topn_revenue', 'Top N Product Revenue', 'PRODUCTS', 'CALCULATE([Net Revenue], TOPN(10, ALL(Products), [Net Revenue]))', 'review', 78, 'TOP N', ['Net Revenue', 'Products'], ['net_revenue'], 'Revenue.Net · Top 10', 'ALL() remove filtros do usuário'),
  M('rank_region', 'Rank by Region', 'REGIONS', 'RANKX(ALL(Regions[Region]), [Net Revenue])', 'equivalent', 90, 'RANK', ['Net Revenue', 'Regions.Region'], ['net_revenue'], 'Revenue.Net · ranking'),
  M('sla_compliance', 'SLA Compliance %', 'TICKETS', 'DIVIDE(COUNTROWS(FILTER(Tickets, Tickets[Resolved] <= Tickets[SLA])), COUNTROWS(Tickets))', 'native', 95, 'RATIO', ['Tickets.Resolved', 'Tickets.SLA'], [], 'SLA.Compliance'),
  M('open_incidents', 'Open Incidents', 'INCIDENTS', 'CALCULATE(COUNTROWS(Incidents), Incidents[Status] = "Open")', 'native', 98, 'COUNT', ['Incidents.Status'], [], 'Incidents.Open'),
  M('mttr', 'MTTR (h)', 'INCIDENTS', 'AVERAGEX(Incidents, DATEDIFF(Incidents[Opened], Incidents[Closed], HOUR))', 'equivalent', 92, 'AVG', ['Incidents.Opened', 'Incidents.Closed'], [], 'Incidents.MTTR'),
  M('inc_per_1k', 'Incidents per 1k Customers', 'INCIDENTS', 'DIVIDE([Open Incidents], [Active Customers] / 1000)', 'native', 93, 'RATIO', ['Open Incidents', 'Active Customers'], ['open_incidents', 'active_customers'], 'Incidents.PerThousand'),
  M('field_visits', 'Field Visits', 'VISITS', 'COUNTROWS(Visits)', 'native', 99, 'COUNT', ['Visits'], [], 'Field.Visits'),
  M('first_time_fix', 'First-Time Fix %', 'VISITS', 'DIVIDE(CALCULATE(COUNTROWS(Visits), Visits[Revisit] = FALSE()), COUNTROWS(Visits))', 'native', 94, 'RATIO', ['Visits.Revisit'], [], 'Field.FirstTimeFix'),
  M('signal_margin', 'Avg Signal Margin (dB)', 'LINKS', 'AVERAGE(Links[Margin])', 'native', 98, 'AVG', ['Links.Margin'], [], 'Network.SignalMargin'),
  M('links_below', 'Links Below Threshold', 'LINKS', 'CALCULATE(COUNTROWS(Links), Links[Margin] < 3)', 'native', 97, 'COUNT', ['Links.Margin'], [], 'Network.LinksBelow'),
  M('availability', 'Network Availability %', 'AVAILABILITY', 'DIVIDE(SUM(Availability[UpMinutes]), SUM(Availability[TotalMinutes]))', 'native', 96, 'RATIO', ['Availability.UpMinutes', 'Availability.TotalMinutes'], [], 'Network.Availability'),
  M('utilization', 'Capacity Utilization %', 'CAPACITY', 'DIVIDE(SUM(Capacity[Used]), SUM(Capacity[Total]))', 'native', 96, 'RATIO', ['Capacity.Used', 'Capacity.Total'], [], 'Network.Utilization'),
  M('rev_selected', 'Revenue Selected Region', 'REGIONS', 'CALCULATE([Net Revenue], Regions[Region] = SELECTEDVALUE(Regions[Region]))', 'equivalent', 89, 'CONTEXT', ['Net Revenue', 'Regions.Region'], ['net_revenue'], 'Revenue.Net · região selecionada'),
  M('dynamic_title', 'Dynamic Title', 'REGIONS', '"Revenue — " & SELECTEDVALUE(Regions[Region], "All regions")', 'equivalent', 90, 'TEXT', ['Regions.Region'], [], 'Título dinâmico do visual'),
  M('weighted_price', 'Weighted Price', 'PRODUCTS', 'SUMX(Orders, Orders[Qty] * Orders[Price]) / SUM(Orders[Qty])', 'equivalent', 91, 'WEIGHTED AVG', ['Orders.Qty', 'Orders.Price'], [], 'Price.Weighted'),
  M('margin_bucket', 'Margin Bucket', 'MARGIN_BRIDGE', 'SWITCH(TRUE(), [Gross Margin] < .2, "Low", [Gross Margin] < .35, "Mid", "High")', 'equivalent', 93, 'BUCKET', ['Gross Margin'], ['gross_margin'], 'Margin.Bucket'),
  M('rls_region', 'RLS Region Filter', 'REGIONS', 'Regions[Region] = LOOKUPVALUE(Users[Region], Users[Email], USERPRINCIPALNAME())', 'review', 58, 'ROW FILTER', ['Users.Region', 'Users.Email'], [], 'Regra de acesso por linha', 'Segurança: exige mapear usuários do Entra ID'),
  M('legacy_kpi', 'Legacy KPI Flag', 'MARGIN_BRIDGE', 'IF(PATHCONTAINS(Hierarchy[Path], SELECTEDVALUE(Hierarchy[ID])), 1, 0)', 'redesign', 41, 'FLAG', ['Hierarchy.Path'], [], undefined, 'Hierarquia pai-filho com PATH()'),
];
const measureByName = (n: string) => MEASURES.find((m) => m.name === n)?.id ?? 'net_revenue';

/* ───────────── Relatórios, páginas e visuais ───────────── */
export interface ReportDef { id: string; name: string; folder: 'Sales' | 'Executive' | 'Operations' | 'Network'; owner: string; views90: number; ref: string; topic: string[]; pages: [name: string, visuals: number][] }
export const REPORTS: ReportDef[] = [
  { id: 'exec', name: 'Executive Sales', folder: 'Sales', owner: 'Marina Duarte', views90: 1840, ref: 'rpt_visao_executiva', topic: ['Net Revenue', 'Gross Margin', 'Orders', 'Average Ticket'], pages: [['Overview', 9], ['Regional', 8], ['Products', 7], ['Channels', 6], ['Customers', 7], ['Targets', 5]] },
  { id: 'region', name: 'Regional Sales', folder: 'Sales', owner: 'Marina Duarte', views90: 962, ref: 'rpt_regiao', topic: ['Net Revenue', 'Rank by Region', 'Revenue YoY %', 'Orders'], pages: [['Brasil', 7], ['Sudeste', 6], ['Sul', 6], ['Nordeste', 6], ['Norte e Centro-Oeste', 5]] },
  { id: 'product', name: 'Product Mix', folder: 'Sales', owner: 'Rafael Prado', views90: 610, ref: 'rpt_ranking_produtos', topic: ['Net Revenue', 'Weighted Price', 'Top N Product Revenue', 'Gross Margin'], pages: [['Mix', 7], ['Ranking', 6], ['Pricing', 6], ['Lifecycle', 5]] },
  { id: 'customer', name: 'Customer Analytics', folder: 'Sales', owner: 'Rafael Prado', views90: 744, ref: 'rpt_clientes', topic: ['Active Customers', 'New Customers', 'Churn Rate', 'Average Ticket'], pages: [['Base', 7], ['Retention', 7], ['Segments', 6], ['Cohorts', 6]] },
  { id: 'margin', name: 'Margin & Pricing', folder: 'Sales', owner: 'Helena Costa', views90: 0, ref: 'rpt_margem_antigo', topic: ['Gross Margin', 'Margin Bucket', 'COGS', 'Weighted Price'], pages: [['Margin', 6], ['Discounts', 6], ['Price waterfall', 5], ['Exceptions', 5]] },
  { id: 'targets', name: 'Sales Targets', folder: 'Sales', owner: 'Helena Costa', views90: 388, ref: 'rpt_metas', topic: ['Target Revenue', 'Target Attainment %', 'Net Revenue', 'Revenue YoY %'], pages: [['Attainment', 7], ['By rep', 6], ['Forecast', 5]] },
  { id: 'sla', name: 'Operations SLA', folder: 'Operations', owner: 'Bruno Tavares', views90: 1215, ref: 'net_operacoes', topic: ['SLA Compliance %', 'Open Incidents', 'MTTR (h)', 'Incidents per 1k Customers'], pages: [['Overview', 8], ['By team', 6], ['Backlog', 6], ['Trends', 5], ['Detail', 5]] },
  { id: 'inc', name: 'Incidents', folder: 'Operations', owner: 'Bruno Tavares', views90: 1502, ref: 'net_incidentes', topic: ['Open Incidents', 'MTTR (h)', 'Incidents per 1k Customers', 'SLA Compliance %'], pages: [['Live', 7], ['Root cause', 6], ['MTTR', 6], ['Repeat', 5]] },
  { id: 'field', name: 'Field Service', folder: 'Operations', owner: 'Bruno Tavares', views90: 0, ref: 'net_operacoes', topic: ['Field Visits', 'First-Time Fix %', 'MTTR (h)'], pages: [['Visits', 6], ['Routes', 6], ['Crew', 4]] },
  { id: 'net', name: 'Network Overview', folder: 'Network', owner: 'Ana Ribeiro', views90: 1330, ref: 'net_operacoes', topic: ['Network Availability %', 'Capacity Utilization %', 'Avg Signal Margin (dB)', 'Links Below Threshold'], pages: [['Health', 6], ['Capacity', 6], ['Links', 5], ['Alarms', 5]] },
  { id: 'netmap', name: 'Network Map', folder: 'Network', owner: 'Ana Ribeiro', views90: 1075, ref: 'net_geografica', topic: ['Avg Signal Margin (dB)', 'Links Below Threshold', 'Network Availability %'], pages: [['Map', 8], ['Sites', 5], ['Coverage', 5]] },
  { id: 'weekly', name: 'Executive Weekly', folder: 'Executive', owner: 'Marina Duarte', views90: 0, ref: 'rpt_fechamento_set', topic: ['Net Revenue', 'Gross Margin', 'Open Incidents', 'Network Availability %'], pages: [['Summary', 5], ['Alerts', 4], ['Appendix', 3]] },
];
export const FOLDERS = ['Sales', 'Executive', 'Operations', 'Network'] as const;

export const pageId = (rep: string, name: string) => `pg:${rep}:${slug(name)}`;
export const reportId = (rep: string) => `rep:${rep}`;

type VT = [type: string, target: string, builder?: Builder];
const POOL: Record<Exclude<Compat, 'unsupported'>, VT[]> = {
  native: [['Card', 'KPI'], ['Clustered column chart', 'Colunas'], ['Clustered bar chart', 'Barras horizontais'], ['Line chart', 'Linha'], ['Stacked column chart', 'Barras empilhadas'], ['Area chart', 'Área'], ['Table', 'Tabela'], ['Matrix', 'Matriz'], ['Slicer', 'Filtro / Slicer'], ['Gauge', 'Medidor'], ['Scatter chart', 'Dispersão'], ['Donut chart', 'Rosca'], ['Line and clustered column chart', 'Combinado']],
  equivalent: [['Waterfall chart', 'Cascata'], ['Funnel', 'Funil'], ['Ribbon chart', 'Área empilhada · ranking'], ['Decomposition tree', 'Hierarquia com drill'], ['Key influencers', 'Insights do Copilot'], ['Smart narrative', 'Narrativa'], ['Multi-row card', 'Grupo de KPIs'], ['Small multiples', 'Pequenos múltiplos']],
  redesign: [['ArcGIS Map', 'Map Workspace'], ['Filled map', 'Map Workspace'], ['Shape map', 'Map Workspace'], ['Pie chart · 12+ categorias', 'Treemap'], ['Azure Map', 'Map Workspace']],
  review: [['Custom visual · Chiclet Slicer', 'Visualização personalizada'], ['Custom visual · Sankey XYZ', 'Sankey / Visualização personalizada'], ['Python visual', 'Visualização personalizada'], ['R visual', 'Visualização personalizada'], ['Custom visual · Hierarchy Slicer', 'Filtro hierárquico'], ['Custom visual · Timeline Storyteller', 'Visualização personalizada']],
};
const REASON: Partial<Record<string, string>> = {
  'ArcGIS Map': 'O Map Workspace nativo oferece camadas, rotas e análise geoespacial mais ricas.', 'Filled map': 'Mapa coroplético reconstruído como camada de regiões no Map Workspace.', 'Shape map': 'Formas importadas viram camada de polígonos no Map Workspace.', 'Azure Map': 'Camadas de tile personalizadas precisam de revisão; o resto vira Map Workspace.',
  'Pie chart · 12+ categorias': 'Rosca com 14 categorias é ilegível; o Treemap preserva a leitura de participação.',
  'Python visual': 'Script não é portável. Sugestão: reconstruir como visualização personalizada.', 'R visual': 'Script não é portável. Sugestão: reconstruir como visualização personalizada.',
  'Custom visual · Sankey XYZ': 'Não existe equivalente exato. O Sankey nativo cobre o fluxo, sem o modo de marcação do original.',
  'Custom visual · Chiclet Slicer': 'Sem equivalente exato; o filtro em botões cobre 90% do uso.', 'Custom visual · Hierarchy Slicer': 'Sem equivalente exato; o filtro hierárquico cobre o comportamento.', 'Custom visual · Timeline Storyteller': 'Sem equivalente exato no catálogo.',
  'Waterfall chart': 'Cascata nativa, com mesma lógica de aumento e redução.', 'Funnel': 'Funil nativo com conversão entre etapas.', 'Decomposition tree': 'Hierarquia com drill-down; a divisão automática por IA vira sugestão do Copilot.',
};
const FIXED: Record<string, [string, string, Compat, string][]> = {
  'exec:overview': [['Net Revenue', 'Card', 'native', 'Net Revenue'], ['Gross Margin', 'Card', 'native', 'Gross Margin'], ['Orders', 'Card', 'native', 'Orders'], ['Average Ticket', 'Card', 'native', 'Average Ticket'], ['Revenue Trend', 'Line chart', 'native', 'Net Revenue'], ['Revenue Table', 'Matrix', 'native', 'Net Revenue'], ['Region Filter', 'Slicer', 'native', 'Net Revenue']],
  'exec:regional': [['Revenue by State', 'ArcGIS Map', 'redesign', 'Net Revenue'], ['Revenue by Region', 'Clustered bar chart', 'native', 'Net Revenue']],
  'exec:products': [['Product Mix', 'Pie chart · 12+ categorias', 'redesign', 'Net Revenue']],
  'exec:channels': [['Channel Flow', 'Custom visual · Sankey XYZ', 'review', 'Net Revenue']],
  'netmap:map': [['Site Map', 'Azure Map', 'redesign', 'Network Availability %']],
  'field:routes': [['Crew Routes', 'Shape map', 'redesign', 'Field Visits']],
};
const TARGET_MIX: Record<'native' | 'equivalent' | 'redesign' | 'review', number> = { native: 207, equivalent: 51, redesign: 20, review: 6 };
const DIMS = ['Region', 'State', 'Product', 'Channel', 'Month', 'Segment', 'Team', 'Site', 'Category'];
const nameFor = (type: string, metric: string, dim: string, i: number): string => {
  if (type === 'Card') return metric;
  if (type === 'Slicer') return `${dim} filter`;
  if (type === 'Table') return `${dim} detail`;
  if (type === 'Matrix') return `${metric} by ${dim} × ${DIMS[(i + 3) % DIMS.length]}`;
  if (/Line|Area|Ribbon/.test(type)) return `${metric} trend`;
  if (/Gauge/.test(type)) return `${metric} vs target`;
  if (/Waterfall/.test(type)) return `${metric} bridge`;
  if (/Funnel/.test(type)) return `${dim} funnel`;
  if (/narrative/.test(type)) return `${metric} narrative`;
  if (/influencers/.test(type)) return `${metric} drivers`;
  if (/Decomposition/.test(type)) return `${metric} breakdown`;
  return `${metric} by ${dim}`;
};

export interface VisualSeed { id: string; page: string; name: string; type: string; compat: Compat; target: string; metric: string; reason?: string }
function buildVisuals(): VisualSeed[] {
  const r = rng(2026);
  const fixedCount = { native: 0, equivalent: 0, redesign: 0, review: 0 };
  for (const list of Object.values(FIXED)) for (const f of list) if (f[2] in fixedCount) fixedCount[f[2] as keyof typeof fixedCount]++;
  const pool: Compat[] = [];
  (Object.keys(TARGET_MIX) as (keyof typeof TARGET_MIX)[]).forEach((k) => { for (let i = 0; i < TARGET_MIX[k] - fixedCount[k]; i++) pool.push(k); });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
  const out: VisualSeed[] = []; let pi = 0;
  for (const rep of REPORTS) for (const [pname, n] of rep.pages) {
    const pg = pageId(rep.id, pname), fixed = FIXED[`${rep.id}:${slug(pname)}`] ?? [];
    for (let i = 0; i < n; i++) {
      const id = `vz:${rep.id}:${slug(pname)}:${i + 1}`, f = fixed[i];
      if (f) { const t = [...POOL.native, ...POOL.equivalent, ...POOL.redesign, ...POOL.review].find((x) => x[0] === f[1]); out.push({ id, page: pg, name: f[0], type: f[1], compat: f[2], target: t?.[1] ?? 'KPI', metric: measureByName(f[3]), reason: REASON[f[1]] }); continue; }
      const compat = pool[pi++] ?? 'native', list = POOL[compat as keyof typeof POOL], t = list[Math.floor(r() * list.length)]!;
      const metric = rep.topic[Math.floor(r() * rep.topic.length)]!, dim = DIMS[Math.floor(r() * DIMS.length)]!;
      out.push({ id, page: pg, name: nameFor(t[0], metric, dim, i), type: t[0], compat, target: t[1], metric: measureByName(metric), reason: REASON[t[0]] });
    }
  }
  return out;
}
export const VISUALS = buildVisuals();

/* ───────────── Mapas, processos e demais objetos ───────────── */
export const MAPS = [
  { id: 'map:regional', name: 'Revenue by State', report: 'exec', visual: 'vz:exec:regional:1', ref: 'coverage', compat: 'redesign' as Compat, layers: [['Estados', 'polígonos', 27], ['Receita por município', 'pontos', 412]], note: 'Choropleth de receita por UF.' },
  { id: 'map:network', name: 'Network Map', report: 'netmap', visual: 'vz:netmap:map:1', ref: 'network', compat: 'review' as Compat, layers: [['Sites', 'pontos', 1204], ['Backbone', 'linhas', 38], ['Regiões de cobertura', 'polígonos', 27], ['Tiles de terreno (custom)', 'raster', 1]], note: 'Camada de tiles personalizada exige decisão humana.' },
  { id: 'map:field', name: 'Crew Routes', report: 'field', visual: 'vz:field:routes:1', ref: 'field', compat: 'redesign' as Compat, layers: [['Equipes', 'pontos', 64], ['Rotas do dia', 'linhas', 211], ['Ordens de serviço', 'pontos', 940]], note: 'Rotas e pontos viram operação em campo no Map Workspace.' },
];
export const PROCESSES = [
  { id: 'proc:refresh', name: 'Daily Refresh + KPI alert', report: 'exec', desc: 'Refresh agendado às 06:00, alerta de KPI e e-mail', parts: ['Refresh diário 06:00', 'Alerta: Net Revenue < meta', 'E-mail para Comercial'], ref: 'ingestao' },
  { id: 'proc:subs', name: 'Weekly Executive subscription', report: 'weekly', desc: 'Assinatura semanal com exportação em PDF', parts: ['Assinatura segunda 07:00', 'Exportar PDF', 'Enviar para Diretoria'], ref: 'relatorio' },
];

/* ───────────── Itens, árvore e grafo de dependências ───────────── */
export const ITEMS = new Map<string, Item>();
export const EDGES: [string, string][] = [];
const add = (it: Item) => { ITEMS.set(it.id, it); return it; };
const edge = (a: string, b: string) => { EDGES.push([a, b]); };
export const WS_ID = 'ws:corporate';
const WS = 'Corporate Workspace';

(function build() {
  add({ id: WS_ID, kind: 'workspace', name: WS, path: [], compat: 'native', target: 'Workspace BIWEB', meta: { Tenant: 'Corporate Tenant', Capacity: 'Premium P1' } });
  for (const f of FOLDERS) add({ id: `fld:${f}`, kind: 'folder', name: f, parent: WS_ID, path: [WS], compat: 'native', target: 'Pasta de relatórios', meta: {} });
  for (const s of SOURCES) { add({ id: s.id, kind: 'dataset', name: s.name, path: [WS], compat: 'native', target: 'Conexão BIWEB', builder: 'data', meta: { Tecnologia: s.tech, Tabelas: s.tables }, type: 'Fonte de dados' }); }
  for (const d of DATASETS) {
    const id = `ds:${d.id}`;
    add({ id, kind: 'dataset', name: d.name, path: [WS], compat: d.compat, target: 'Modelo semântico + Data Workspace', builder: 'data', reason: d.note, meta: { Tabelas: d.tables.length, Fonte: SOURCES.find((s) => s.id === d.source)?.name ?? '' }, type: 'Modelo semântico' });
    edge(d.source, id);
    d.tables.forEach((t, i) => {
      const tid = `tb:${d.id}:${slug(t)}`, old = /_OLD$/.test(t);
      add({ id: tid, kind: 'table', name: t, parent: id, path: [WS, d.name], compat: old ? 'equivalent' : 'native', target: old ? 'customer' : t.toLowerCase(), builder: 'data', reason: old ? 'Nome legado e colunas em português: o LDE propõe normalização.' : undefined, meta: { Colunas: 6 + ((i * 5 + t.length) % 17), Linhas: `${(12 + ((i + 1) * 37 + t.length * 11) % 480) * 1000}` }, type: 'Tabela' });
      edge(id, tid);
    });
  }
  for (const m of MEASURES) {
    const tbl = [...ITEMS.values()].find((x) => x.kind === 'table' && x.name === m.table);
    add({ id: `ms:${m.id}`, kind: 'measure', name: m.name, path: [WS, 'Semantic models'], compat: m.compat, target: m.bi ? `Metric · ${m.bi}` : 'Sem alvo definido', builder: 'data', confidence: m.conf, expr: m.dax, reason: m.concept, meta: { Tabela: m.table, Agregação: m.agg, Confiança: `${m.conf}%` }, type: 'Medida DAX' });
    if (tbl) edge(tbl.id, `ms:${m.id}`);
    for (const d of m.deps ?? []) edge(`ms:${d}`, `ms:${m.id}`);
  }
  for (const rep of REPORTS) {
    const id = reportId(rep.id), vis = VISUALS.filter((v) => v.page.startsWith(`pg:${rep.id}:`));
    const worst = vis.some((v) => v.compat === 'review') ? 'review' : vis.some((v) => v.compat === 'redesign') ? 'redesign' : vis.some((v) => v.compat === 'equivalent') ? 'equivalent' : 'native';
    add({ id, kind: 'report', name: rep.name, parent: `fld:${rep.folder}`, path: [WS, rep.folder], compat: worst, target: 'Relatório no Report Builder', builder: 'report', targetRef: rep.ref, type: 'Relatório', meta: { Páginas: rep.pages.length, Visuais: vis.length, Responsável: rep.owner, 'Views (90 dias)': rep.views90 } });
    for (const [pname, n] of rep.pages) {
      const pid = pageId(rep.id, pname), pv = vis.filter((v) => v.page === pid);
      const pw = pv.some((v) => v.compat === 'review') ? 'review' : pv.some((v) => v.compat === 'redesign') ? 'redesign' : pv.some((v) => v.compat === 'equivalent') ? 'equivalent' : 'native';
      add({ id: pid, kind: 'page', name: pname, parent: id, path: [WS, rep.folder, rep.name], compat: pw, target: 'Página do relatório', builder: 'report', targetRef: rep.ref, type: 'Página', meta: { Visuais: n } });
      edge(pid, id);
    }
  }
  for (const v of VISUALS) {
    const rep = REPORTS.find((r) => v.page.startsWith(`pg:${r.id}:`))!, pg = ITEMS.get(v.page)!, mid = `ms:${v.metric}`;
    const isMap = /Map|map/.test(v.type) && v.compat !== 'native';
    const mapItem = MAPS.find((m) => m.visual === v.id);
    add({ id: v.id, kind: 'visual', name: v.name, parent: v.page, path: [WS, rep.folder, rep.name, pg.name], compat: v.compat, target: v.target, type: v.type, reason: v.reason, builder: isMap ? 'map' : 'report', targetRef: mapItem ? mapItem.ref : rep.ref, confidence: v.compat === 'native' ? 98 : v.compat === 'equivalent' ? 90 : v.compat === 'redesign' ? 82 : 55, meta: { Tipo: v.type, Métrica: ITEMS.get(mid)?.name ?? '', Página: pg.name } });
    edge(mid, v.id); edge(v.id, v.page);
  }
  for (const m of MAPS) add({ id: m.id, kind: 'map', name: m.name, parent: reportId(m.report), path: [WS, REPORTS.find((r) => r.id === m.report)!.folder, REPORTS.find((r) => r.id === m.report)!.name], compat: m.compat, target: 'Map Workspace', builder: 'map', targetRef: m.ref, type: 'Mapa', reason: m.note, meta: { Camadas: m.layers.length, 'Visual de origem': ITEMS.get(m.visual)?.name ?? '' } });
  for (const p of PROCESSES) { add({ id: p.id, kind: 'process', name: p.name, parent: reportId(p.report), path: [WS], compat: 'equivalent', target: 'Workflow BIWEB', builder: 'workflow', targetRef: p.ref, type: 'Processo agendado', reason: p.desc, meta: { Partes: p.parts.length } }); edge(reportId(p.report), p.id); }
})();

/* Amostras de objetos que existem no inventário completo (contagens em INVENTORY_COUNTS). */
export const SAMPLES: Record<string, { id: string; name: string; parent: string; meta: string; compat: Compat }[]> = {
  calc: [['Segment (Customers)', 'Calculated column', 'native'], ['Age Bucket', 'Calculated column', 'native'], ['Fiscal Quarter', 'Calculated column', 'equivalent'], ['Tier', 'Calculated column', 'native'], ['Path Level 2', 'PATH() column', 'redesign'], ['Is Weekend', 'Calculated column', 'native']].map(([n, m, c], i) => ({ id: `calc:${i}`, name: n!, parent: 'Sales Model', meta: m!, compat: c as Compat })),
  filter: [['Region = Sudeste', 'Página · Regional'], ['Date relative · últimos 12 meses', 'Relatório · Executive Sales'], ['Channel ≠ Interno', 'Visual · Revenue Trend'], ['Top 10 · Product', 'Visual · Product Mix'], ['Status = Open', 'Página · Live'], ['Margin > 0', 'Visual · Margin Bucket'], ['Customer Segment', 'Slicer sincronizado'], ['Year = 2026', 'Relatório · Sales Targets']].map(([n, m], i) => ({ id: `flt:${i}`, name: n!, parent: m!, meta: 'Filtro', compat: (i === 3 ? 'equivalent' : 'native') as Compat })),
  parameter: [['What-if · Desconto', 'Parâmetro numérico', 'equivalent'], ['Measure selector', 'Field parameter', 'equivalent'], ['Top N', 'Parâmetro numérico', 'native'], ['Moeda', 'Lista', 'native']].map(([n, m, c], i) => ({ id: `par:${i}`, name: n!, parent: 'Modelo', meta: m!, compat: c as Compat })),
  bookmark: [['Visão do diretor', 'Executive Sales'], ['Somente Sudeste', 'Regional Sales'], ['Alternar Tabela/Gráfico', 'Product Mix'], ['Foco em incidentes críticos', 'Incidents'], ['Mapa expandido', 'Network Map']].map(([n, m], i) => ({ id: `bkm:${i}`, name: n!, parent: m!, meta: 'Bookmark', compat: (i === 2 ? 'review' : 'equivalent') as Compat })),
  navigation: [['Botão: Ir para Regional', 'Executive Sales'], ['Page navigator', 'Regional Sales'], ['Drill-through → Cliente', 'Customer Analytics'], ['Botão: Voltar', 'Operations SLA']].map(([n, m], i) => ({ id: `nav:${i}`, name: n!, parent: m!, meta: 'Navegação', compat: 'native' as Compat })),
  theme: [['Corporate Blue', 'Tema JSON · 14 cores'], ['Operations Dark', 'Tema JSON · 12 cores']].map(([n, m], i) => ({ id: `thm:${i}`, name: n!, parent: 'Workspace', meta: m!, compat: 'equivalent' as Compat })),
  action: [['Cross-filter · Region → todos', 'Executive Sales'], ['Tooltip de página', 'Product Mix'], ['Drill-through · Cliente', 'Customer Analytics'], ['Destaque cruzado', 'Operations SLA']].map(([n, m], i) => ({ id: `act:${i}`, name: n!, parent: m!, meta: 'Ação / interação', compat: (i === 1 ? 'equivalent' : 'native') as Compat })),
  security: [['RLS · Region', 'Role: Gerente Regional'], ['RLS · Team', 'Role: Supervisor'], ['OLS · Margem', 'Role: Analista']].map(([n, m], i) => ({ id: `sec:${i}`, name: n!, parent: m!, meta: 'Segurança', compat: (i === 0 ? 'review' : 'equivalent') as Compat })),
  refresh: [['Refresh diário 06:00', 'Sales Model'], ['Refresh incremental (RangeStart/End)', 'Incidents'], ['Refresh por hora', 'Network Inventory'], ['Refresh semanal', 'Targets 2026']].map(([n, m], i) => ({ id: `rfs:${i}`, name: n!, parent: m!, meta: 'Regra de refresh', compat: (i === 1 ? 'review' : 'equivalent') as Compat })),
  column: [['ORDERS.VL_TOTAL', 'Decimal'], ['ORDERS.COD_CLIENTE', 'Texto'], ['CUSTOMERS_OLD.NOME', 'Texto'], ['PRODUCTS.CUSTO_UNIT', 'Decimal'], ['DIM_DATE.DATA', 'Data'], ['REGIONS.UF', 'Texto'], ['RETURNS.VL_DEVOL', 'Decimal'], ['CHANNELS.CANAL', 'Texto']].map(([n, m], i) => ({ id: `col:${i}`, name: n!, parent: 'Sales Model', meta: m!, compat: 'native' as Compat })),
};
export const INVENTORY_COUNTS: { kind: Kind; label: string; n: number }[] = [
  { kind: 'workspace', label: 'Workspaces', n: 1 }, { kind: 'report', label: 'Relatórios', n: REPORTS.length }, { kind: 'page', label: 'Páginas', n: REPORTS.reduce((a, r) => a + r.pages.length, 0) }, { kind: 'dataset', label: 'Datasets', n: DATASETS.length },
  { kind: 'table', label: 'Tabelas', n: 41 }, { kind: 'column', label: 'Colunas', n: 612 }, { kind: 'measure', label: 'Medidas', n: MEASURES.length }, { kind: 'calc', label: 'Campos calculados', n: 14 }, { kind: 'filter', label: 'Filtros', n: 96 },
  { kind: 'parameter', label: 'Parâmetros', n: 7 }, { kind: 'visual', label: 'Visualizações', n: VISUALS.length }, { kind: 'bookmark', label: 'Bookmarks', n: 23 }, { kind: 'navigation', label: 'Navegação', n: 18 },
  { kind: 'theme', label: 'Temas', n: 2 }, { kind: 'map', label: 'Mapas', n: MAPS.length }, { kind: 'action', label: 'Ações', n: 118 }, { kind: 'security', label: 'Segurança', n: 5 }, { kind: 'refresh', label: 'Regras de refresh', n: 4 },
];

export function buildTree(): TreeEntry[] {
  const pagesOf = (rep: ReportDef): TreeEntry[] => rep.pages.map(([n, c]) => {
    const pid = pageId(rep.id, n), vis = VISUALS.filter((v) => v.page === pid);
    return { id: pid, label: n, kind: 'page', count: c, compat: ITEMS.get(pid)?.compat, children: vis.map((v) => ({ id: v.id, label: v.name, kind: 'visual' as Kind, compat: v.compat })) };
  });
  const reps = (f: string): TreeEntry[] => REPORTS.filter((r) => r.folder === f).map((r) => ({ id: reportId(r.id), label: r.name, kind: 'report', compat: ITEMS.get(reportId(r.id))?.compat, count: r.pages.length, children: [...pagesOf(r), ...MAPS.filter((m) => m.report === r.id).map((m) => ({ id: m.id, label: `${m.name} · mapa`, kind: 'map' as Kind, compat: m.compat })), ...PROCESSES.filter((p) => p.report === r.id).map((p) => ({ id: p.id, label: `${p.name}`, kind: 'process' as Kind, compat: 'equivalent' as Compat }))] }));
  return [{
    id: WS_ID, label: WS, kind: 'workspace', children: [
      ...FOLDERS.map((f) => ({ id: `fld:${f}`, label: f, kind: 'folder' as Kind, count: REPORTS.filter((r) => r.folder === f).length, children: reps(f) })),
      { id: 'grp:models', label: 'Modelos semânticos', kind: 'dataset', count: DATASETS.length, children: DATASETS.map((d) => ({ id: `ds:${d.id}`, label: d.name, kind: 'dataset' as Kind, compat: d.compat, children: d.tables.map((t) => ({ id: `tb:${d.id}:${slug(t)}`, label: t, kind: 'table' as Kind, compat: ITEMS.get(`tb:${d.id}:${slug(t)}`)?.compat })) })) },
      { id: 'grp:measures', label: 'Medidas', kind: 'measure', count: MEASURES.length, children: MEASURES.map((m) => ({ id: `ms:${m.id}`, label: m.name, kind: 'measure' as Kind, compat: m.compat })) },
      { id: 'grp:sources', label: 'Fontes de dados', kind: 'dataset', count: SOURCES.length, children: SOURCES.map((s) => ({ id: s.id, label: s.name, kind: 'dataset' as Kind })) },
    ],
  }];
}
export const TREE = buildTree();

export function relatives(id: string, dir: 'up' | 'down'): string[] {
  const seen = new Set<string>(), stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const [a, b] of EDGES) { const nxt = dir === 'up' ? (b === cur ? a : undefined) : (a === cur ? b : undefined); if (nxt && !seen.has(nxt) && nxt !== id) { seen.add(nxt); stack.push(nxt); } }
  }
  return [...seen];
}
/** Impacto de um item em formato de árvore: medida → visuais agrupados por página/relatório. */
export function impactOf(id: string) {
  const down = relatives(id, 'down').map((x) => ITEMS.get(x)).filter((x): x is Item => !!x);
  const reports = down.filter((x) => x.kind === 'report'), visuals = down.filter((x) => x.kind === 'visual'), procs = down.filter((x) => x.kind === 'process');
  return { reports, visuals, procs, measures: down.filter((x) => x.kind === 'measure') };
}

export const itemOf = (id: string) => ITEMS.get(id);
export const visualsOfPage = (pid: string) => VISUALS.filter((v) => v.page === pid);
export const reportOfItem = (it: Item): string | undefined => { for (const s of it.id.split(':')) { if (REPORTS.some((r) => r.id === s)) return s; } return undefined; };

export function tally(list: Compat[]) { const t = { native: 0, equivalent: 0, redesign: 0, review: 0, unsupported: 0 }; for (const c of list) t[c]++; return t; }
export const countsOf = (kind: Kind) => tally([...ITEMS.values()].filter((x) => x.kind === kind).map((x) => x.compat));

/** Categorias de compatibilidade: valores dos itens reais onde existem; demais são contagens do inventário. */
export interface Cat { id: string; label: string; total: number; native: number; equivalent: number; redesign: number; review: number; note: string }
export function compatCategories(): Cat[] {
  const c = (id: string, label: string, t: { native: number; equivalent: number; redesign: number; review: number }, note: string): Cat => ({ id, label, total: t.native + t.equivalent + t.redesign + t.review, ...t, note });
  const ms = countsOf('measure'), vz = countsOf('visual');
  const tables = { native: 33, equivalent: 5, redesign: 2, review: 1 };
  return [
    c('model', 'Modelo de dados', tables, `${DATASETS.length} modelos · 41 tabelas · 87 relacionamentos`),
    c('metrics', 'Métricas', { native: ms.native, equivalent: ms.equivalent, redesign: ms.redesign, review: ms.review }, 'Medidas DAX e campos calculados'),
    c('visuals', 'Visualizações', { native: vz.native, equivalent: vz.equivalent, redesign: vz.redesign, review: vz.review }, '284 visuais em 48 páginas'),
    c('filters', 'Filtros', { native: 85, equivalent: 11, redesign: 0, review: 0 }, 'Filtros de relatório, página e visual'),
    c('interactions', 'Interações', { native: 78, equivalent: 22, redesign: 17, review: 1 }, 'Cross-filter, drill-through, tooltips de página, bookmarks'),
    c('navigation', 'Navegação', { native: 15, equivalent: 3, redesign: 0, review: 0 }, 'Botões, navegadores de página'),
    c('maps', 'Mapas', { native: 0, equivalent: 0, redesign: 2, review: 1 }, 'Reconstrução / upgrade para Map Workspace'),
    c('security', 'Segurança', { native: 3, equivalent: 1, redesign: 0, review: 1 }, 'Regras de acesso por linha e coluna'),
    c('refresh', 'Refresh', { native: 1, equivalent: 2, redesign: 0, review: 1 }, 'Agendas e alertas → Workflow Builder'),
    c('custom', 'Visuais personalizados', { native: 0, equivalent: 1, redesign: 0, review: 5 }, 'AppSource, R e Python'),
  ];
}
export const overallMix = () => {
  const cats = compatCategories().filter((c) => c.id !== 'custom'), sum = (k: 'native' | 'equivalent' | 'redesign' | 'review') => cats.reduce((a, c) => a + c[k], 0);
  const t = { native: sum('native'), equivalent: sum('equivalent'), redesign: sum('redesign'), review: sum('review') }, total = t.native + t.equivalent + t.redesign + t.review;
  const pct = (n: number) => Math.round((n / total) * 100);
  return { total, native: pct(t.native), equivalent: pct(t.equivalent), redesign: pct(t.redesign), review: Math.max(1, pct(t.review)), raw: t };
};
