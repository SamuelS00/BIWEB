import { INCIDENT_MIN } from '../data/live';
import { NOW } from '../net/generate';
import type { Filter } from '../data/types';
import { MARGIN_RULES } from '../viz/cf';
import { DS, makeComp, type ChartProps, type Comp, type CompType, type Page, type ReportDoc } from './doc';

/**
 * Demonstration dashboards for the commercial, financial, customer and live-operations questions.
 * Each answers ONE question and picks chart types for what they do, not to fill space.
 */
const VD = 'ds_vendas';
type Over = { title?: string; subtitle?: string; props?: Record<string, unknown>; table?: string; ds?: string; filters?: Filter[]; style?: Partial<Comp['style']>; interactions?: Partial<Comp['interactions']>; name?: string };
function factory(prefix: string, ds: string, table: string) {
  let n = 0;
  return (type: CompType, x: number, y: number, w: number, h: number, o: Over = {}): Comp => {
    const c = makeComp(type, { x, y, w, h }, {}, ++n);
    c.id = `${prefix}_${n}`;
    if (c.data) c.data = { dataset: o.ds ?? ds, table: o.table ?? table };
    if (o.title !== undefined) c.style.title = o.title;
    if (o.subtitle !== undefined) c.style.subtitle = o.subtitle;
    c.name = o.name ?? (o.title || c.name);
    if (o.props) c.props = { ...c.props, ...o.props };
    if (o.filters) c.localFilters = o.filters;
    if (o.style) Object.assign(c.style, o.style);
    if (o.interactions) Object.assign(c.interactions, o.interactions);
    return c;
  };
}
const chart = (kind: ChartProps['kind'], x: string, y: string, extra: Partial<ChartProps> = {}): Record<string, unknown> => ({ kind, x, y, agg: 'sum', sort: 'value', limit: 12, legend: true, labels: false, tooltip: true, grain: 'day', responsive: 'fit', ...extra });
const kpi = (measure: string, label: string, extra: Record<string, unknown> = {}) => ({ measure, agg: 'sum', label, targetDir: 'above', spark: true, compare: 'prev', period: 'last30d', ...extra });
const page = (id: string, name: string, comps: Comp[], h = 940): Page => ({ id, name, w: 1280, h, comps });
const base = (id: string, o: Partial<ReportDoc> & Pick<ReportDoc, 'name' | 'description' | 'category' | 'pages' | 'cover'>): ReportDoc => ({ id, kind: 'Dashboard', datasets: [VD], rules: [], status: 'Publicado', version: 4, publishedAt: NOW - 86_400_000, updatedAt: NOW - 3_600_000 * 5, owner: 'Marina Costa', views: 640, certified: true, ...o });
const COL = [24, 336, 648, 960];
const text = (C: ReturnType<typeof factory>, x: number, y: number, w: number, t: string, sub?: string) => [C('text', x, y, w, 36, { props: { text: t, size: 'xl', weight: 'strong' } }), ...(sub ? [C('text', x, y + 34, w, 24, { props: { text: sub, size: 'sm', weight: 'regular', tone: 'subtitle' } })] : [])];

let cache: ReportDoc[] | null = null;
export function seedBiReports(): ReportDoc[] {
  if (cache) return cache;
  const out: ReportDoc[] = [];

  { // ── Comercial: estamos no ritmo para bater a meta e onde estão as lacunas?
    const C = factory('com', VD, 'vendas');
    const L = factory('reg', VD, 'lojas');
    out.push(base('bi_comercial', {
      name: 'Desempenho Comercial', description: 'Estamos no ritmo da meta? Receita, meta, ano anterior e margem por região, canal e categoria.', category: 'Comercial', cover: 'chart', views: 2140, version: 9,
      pages: [
        page('com_p1', 'Desempenho', [
          ...text(C, 24, 14, 700, 'Desempenho comercial', 'Estamos no ritmo para bater a meta do ano e onde estão as lacunas?'),
          C('filter', 776, 16, 232, 72, { title: 'Região', props: { field: 'regiao', multi: true, style: 'dropdown' } }),
          C('slicer', 1024, 16, 232, 72, { title: 'Canal', props: { field: 'canal', multi: true, showCounts: false, orientation: 'horizontal' } }),
          C('kpi', COL[0]!, 96, 296, 152, { title: 'Receita · 30 dias', subtitle: 'vs mesmo período do ano anterior', props: kpi('receita', 'Receita', { compare: 'both', targetField: 'meta', secondary: [{ label: 'Pedidos', measure: 'pedidos', agg: 'sum' }] }) }),
          C('kpi', COL[1]!, 96, 296, 152, { title: 'Atingimento da meta', subtitle: '30 dias', props: kpi('atingimento', 'Atingimento', { compare: 'both', target: 100, spark: true }) }),
          C('kpi', COL[2]!, 96, 296, 152, { title: 'Margem bruta', subtitle: 'sobre a receita', props: kpi('margem_pct', 'Margem', { compare: 'both', target: 30 }) }),
          C('kpi', COL[3]!, 96, 296, 152, { title: 'Ticket médio', subtitle: 'por pedido', props: kpi('ticket_medio', 'Ticket médio', { compare: 'prev' }) }),
          C('chart', 24, 264, 828, 328, { title: 'Receita, meta e margem', subtitle: 'por mês · colunas = receita, tracejado = meta, fantasma = ano anterior, linha = margem %', props: chart('combo', 'data', 'receita', { y2: 'margem_pct', target: 'meta', compare: 'both', period: 'last12m', grain: 'month', sort: 'none', limit: 0, tooltipFields: ['pedidos', 'ticket_medio'], labels: false, zoom: false, notes: [{ id: 'n1', at: Date.UTC(2025, 10, 1), label: 'Black Friday: receita +55% no mês', tone: 'info' }, { id: 'n2', at: Date.UTC(2026, 2, 1), label: 'Campanha de aniversário da rede', tone: 'info' }, { id: 'n3', at: Date.UTC(2026, 6, 1), label: 'Ruptura de estoque em Eletrônicos', tone: 'warning' }] }) }),
          C('chart', 868, 264, 388, 328, { title: 'Atingimento por região', subtitle: 'receita vs meta · clique para abrir o detalhe regional', props: chart('bullet', 'regiao', 'receita', { target: 'meta', period: 'last12m', labels: true, legend: false }), interactions: { navigateTo: 'com_p2', carryContext: true } }),
          C('chart', 24, 608, 400, 316, { title: 'O que explica a variação', subtitle: 'ano anterior → atual, por categoria', props: chart('waterfall', 'categoria', 'receita', { compare: 'prev', period: 'last12m', sort: 'none', labels: true, legend: false }) }),
          C('chart', 440, 608, 408, 316, { title: 'Mix de receita', subtitle: 'canal › categoria · 12 meses', props: chart('treemap', 'canal', 'receita', { series: 'categoria', period: 'last12m', legend: false }) }),
          C('matrix', 864, 608, 392, 316, { title: 'Margem % por região e canal', subtitle: 'expanda a região para ver categorias', props: { rows: 'regiao', cols: 'canal', measure: 'margem_pct', agg: 'sum', heat: false, totals: true, rowHier: ['regiao', 'categoria'], period: 'last12m', cf: [{ id: 'cf1', field: 'margem_pct', kind: 'rules', rules: MARGIN_RULES }] } }),
        ]),
        page('com_p2', 'Detalhe regional', [
          ...text(L, 24, 14, 760, 'Detalhe regional', 'Onde estão as lojas que puxam ou seguram o resultado?'),
          L('chart', 24, 96, 520, 388, { title: 'Receita por local', subtitle: 'clique para descer: região › estado › cidade › loja', props: chart('hbar', 'regiao', 'receita', { period: 'last12m', labels: true, legend: false, limit: 12, target: 'meta' }), interactions: { drill: ['regiao', 'estado', 'cidade', 'loja'], emitCross: true } }),
          L('chart', 560, 96, 696, 388, { title: 'Receita mensal por região', subtitle: 'empilhada · arraste para ampliar um período', props: chart('stacked', 'data', 'receita', { series: 'regiao', grain: 'month', sort: 'none', limit: 0, zoom: true, legend: true, movingAvg: 0 }) }),
          L('table', 24, 500, 1232, 424, { title: 'Lojas', subtitle: 'agrupe, ordene (Shift para várias colunas), busque e exporte', props: { columns: ['loja', 'cidade', 'estado', 'receita', 'meta', 'atingimento', 'margem_pct', 'pedidos'], sortBy: 'receita', sortDir: 'desc', statusColors: false, density: 'compact', rowLimit: 400, search: true, columnPicker: true, totals: true, exportable: true, groupBy: 'regiao', cf: [{ id: 'a', field: 'atingimento', kind: 'icons', rules: [{ op: '<', v: 90, tone: 'critical' }, { op: 'between', v: 90, v2: 100, tone: 'warning' }, { op: '>', v: 100, tone: 'healthy' }] }, { id: 'b', field: 'margem_pct', kind: 'rules', rules: MARGIN_RULES }, { id: 'c', field: 'receita', kind: 'bars' }] } }),
        ], 960),
      ],
    }));
  }

  { // ── Financeiro: o que explica a variação do resultado vs orçamento?
    const C = factory('fin', VD, 'dre');
    const flt = (linha: string): Filter[] => [{ field: 'linha', op: '=', value: linha }];
    out.push(base('bi_financeiro', {
      name: 'Resultado e Orçamento', description: 'O que explica a variação do resultado frente ao orçado? DRE gerencial, cascata e desvios por linha.', category: 'Financeiro', cover: 'heat', views: 980, version: 6,
      pages: [page('fin_p1', 'Resultado', [
        ...text(C, 24, 14, 760, 'Resultado e orçamento', 'O que explica a variação do resultado frente ao orçado neste mês?'),
        C('kpi', COL[0]!, 84, 296, 152, { title: 'Receita líquida', subtitle: 'mês corrente', filters: flt('Receita líquida'), props: kpi('valor', 'Receita líquida', { compare: 'both', targetField: 'orcado', spark: true, sparkGrain: 'month', period: 'last30d' }) }),
        C('kpi', COL[1]!, 84, 296, 152, { title: 'EBITDA', subtitle: 'mês corrente', filters: flt('EBITDA'), props: kpi('valor', 'EBITDA', { compare: 'both', targetField: 'orcado', period: 'last30d' }) }),
        C('kpi', COL[2]!, 84, 296, 152, { title: 'Variação do EBITDA vs orçado', subtitle: 'realizado − orçado', filters: flt('EBITDA'), props: kpi('variacao', 'Variação', { compare: 'none', spark: false, period: 'last30d' }) }),
        C('kpi', COL[3]!, 84, 296, 152, { title: 'CMV do mês', subtitle: 'menor é melhor', filters: flt('CMV'), props: kpi('valor', 'CMV', { compare: 'prev', lowerIsBetter: true, spark: true, period: 'last30d' }) }),
        C('chart', 24, 252, 760, 340, { title: 'Da receita bruta ao EBITDA', subtitle: 'cascata do mês · barras fechadas = subtotais', props: chart('waterfall', 'linha', 'valor', { period: 'last30d', sort: 'none', labels: true, legend: false, limit: 0, totals: ['Receita bruta', 'Receita líquida', 'EBITDA'] }) }),
        C('chart', 800, 252, 456, 340, { title: 'Desvio vs orçado por linha', subtitle: 'azul = melhor que o orçado · vermelho = pior', props: chart('hbar', 'linha', 'variacao', { period: 'last30d', sort: 'none', labels: true, legend: false, colorBy: 'sign', limit: 0 }), filters: [{ field: 'total', op: '=', value: 'Não' }] }),
        C('chart', 24, 608, 760, 320, { title: 'EBITDA realizado × orçado', subtitle: '24 meses · arraste para ampliar · média móvel de 3 meses', props: chart('line', 'data', 'valor', { target: 'orcado', compare: 'target', grain: 'month', sort: 'none', limit: 0, zoom: true, movingAvg: 3, legend: true, refs: [{ id: 'r1', kind: 'avg', label: 'Média' }], notes: [{ id: 'a1', at: Date.UTC(2025, 10, 1), label: 'Black Friday', tone: 'info' }, { id: 'a2', at: Date.UTC(2026, 0, 1), label: 'Reajuste de frete', tone: 'warning' }] }), filters: flt('EBITDA') }),
        C('table', 800, 608, 456, 320, { title: 'DRE do mês', subtitle: 'realizado, orçado e variação', props: { columns: ['linha', 'valor', 'orcado', 'variacao_pct'], sortBy: undefined, sortDir: 'desc', statusColors: false, density: 'compact', rowLimit: 20, exportable: true, cf: [{ id: 'v', field: 'variacao_pct', kind: 'icons', rules: [{ op: '<', v: -3, tone: 'critical' }, { op: 'between', v: -3, v2: 0, tone: 'warning' }, { op: '>', v: 0, tone: 'healthy' }] }] } }),
      ], 940)],
    }));
  }

  { // ── Clientes: quais segmentos geram valor e quais estão em risco?
    const C = factory('cli', VD, 'clientes');
    out.push(base('bi_clientes', {
      name: 'Valor e Risco de Clientes', description: 'Quais segmentos geram valor e quais estão em risco de sair? Distribuição, RFM e coortes.', category: 'Clientes', cover: 'heat', views: 760, version: 3,
      pages: [page('cli_p1', 'Segmentos', [
        ...text(C, 24, 14, 760, 'Valor e risco de clientes', 'Quais segmentos geram valor e quais estão em risco de sair?'),
        C('filter', 776, 16, 232, 72, { title: 'Região', props: { field: 'regiao', multi: true, style: 'dropdown' } }),
        C('slicer', 1024, 16, 232, 72, { title: 'Canal de aquisição', props: { field: 'canal', multi: true, showCounts: false, orientation: 'horizontal' } }),
        C('kpi', COL[0]!, 100, 296, 124, { title: 'Clientes', subtitle: 'na base filtrada', props: { measure: 'id', agg: 'count', label: 'Clientes', targetDir: 'above', spark: false, compare: 'none', secondary: [{ label: 'Valor total', measure: 'valor_total', agg: 'sum' }] } }),
        C('kpi', COL[1]!, 100, 296, 124, { title: 'Valor médio por cliente', props: { measure: 'valor_total', agg: 'avg', label: 'Valor médio', targetDir: 'above', spark: false, compare: 'none' } }),
        C('kpi', COL[2]!, 100, 296, 124, { title: 'NPS médio', subtitle: 'maior é melhor', props: { measure: 'nps', agg: 'avg', label: 'NPS', targetDir: 'above', spark: false, compare: 'target', target: 30 } }),
        C('kpi', COL[3]!, 100, 296, 124, { title: 'Probabilidade média de churn', subtitle: 'menor é melhor', props: { measure: 'prob_churn', agg: 'avg', label: 'Churn', targetDir: 'below', lowerIsBetter: true, spark: false, compare: 'target', target: 30 } }),
        C('chart', 24, 240, 620, 340, { title: 'Recência × frequência', subtitle: 'cada bolha é um cliente · tamanho = valor · cor = segmento · clique para filtrar', props: chart('bubble', 'recencia_dias', 'frequencia', { y2: 'valor_total', series: 'segmento', limit: 900, legend: true, refs: [{ id: 'f', kind: 'forecast' }] }) }),
        C('chart', 660, 240, 596, 340, { title: 'Distribuição do valor por cliente', subtitle: 'histograma · linhas = média e mediana', props: chart('histogram', 'valor_total', 'valor_total', { bins: 16, legend: false, refs: [{ id: 'm', kind: 'avg', label: 'Média' }, { id: 'd', kind: 'median', label: 'Mediana' }] }) }),
        C('chart', 24, 596, 420, 320, { title: 'Valor por segmento', subtitle: 'box plot · mediana, quartis e outliers', props: chart('box', 'segmento', 'valor_total', { legend: false, limit: 6 }) }),
        C('chart', 460, 596, 360, 320, { title: 'Segmentos por canal', subtitle: 'fluxo de clientes', props: chart('sankey', 'canal', 'id', { series: 'segmento', agg: 'count', legend: false }) }),
        C('chart', 836, 596, 420, 320, { title: 'Coortes de entrada × segmento', subtitle: 'clientes por mês de entrada', props: chart('heat', 'coorte', 'id', { series: 'segmento', agg: 'count', grain: 'quarter', sort: 'none', legend: false }) }),
      ], 940)],
    }));
  }

  { // ── Operações ao vivo (dataset da rede)
    const C = factory('noc', DS, 'enlaces');
    out.push(base('bi_noc_ao_vivo', {
      name: 'Operações ao Vivo', description: 'Há degradação na rede agora e onde? Indicadores, utilização e enlaces em tempo real.', category: 'Operações', cover: 'kpi', datasets: [DS], views: 1620, version: 5,
      pages: [page('noc_p1', 'Agora', [
        ...text(C, 24, 14, 760, 'Operações ao vivo', 'Há degradação na rede agora e onde?'),
        C('filter', 776, 16, 232, 72, { title: 'Região', props: { field: 'regiao', multi: true, style: 'dropdown' } }),
        C('slicer', 1024, 16, 232, 72, { title: 'Camada', props: { field: 'camada', multi: true, showCounts: false, orientation: 'horizontal' } }),
        C('kpi', COL[0]!, 100, 296, 124, { title: 'Disponibilidade', subtitle: 'média dos enlaces', props: { measure: 'disponibilidade', agg: 'avg', label: 'Disponibilidade', target: 99.9, targetDir: 'above', spark: false, compare: 'target', live: true } }),
        C('kpi', COL[1]!, 100, 296, 124, { title: 'Utilização média', subtitle: 'capacidade em uso', props: { measure: 'utilizacao', agg: 'avg', label: 'Utilização', target: 70, targetDir: 'below', lowerIsBetter: true, spark: false, compare: 'target', live: true } }),
        C('kpi', COL[2]!, 100, 296, 124, { title: 'Atenuação média', subtitle: 'sinal óptico', props: { measure: 'atenuacao_dB', agg: 'avg', label: 'Atenuação', target: 12, targetDir: 'below', lowerIsBetter: true, spark: false, compare: 'target', live: true } }),
        C('kpi', COL[3]!, 100, 296, 124, { title: 'Enlaces acima de 80% de uso', props: { measure: 'id', agg: 'count', label: 'Enlaces', targetDir: 'below', spark: false, compare: 'none', live: true }, filters: [{ field: 'utilizacao', op: '>', value: 80 }] }),
        C('chart', 24, 240, 620, 330, { title: 'Utilização por região', subtitle: 'atualiza a cada 2 s · pontilhado = limite de 70%', props: chart('hbar', 'regiao', 'utilizacao', { agg: 'avg', limit: 10, labels: true, legend: false, live: true, refs: [{ id: 'l', kind: 'threshold', value: 70, label: 'Limite' }] }) }),
        C('chart', 660, 240, 596, 330, { title: 'Distribuição de disponibilidade', subtitle: 'quantos enlaces em cada faixa · SLA em 99,9%', props: chart('histogram', 'disponibilidade', 'disponibilidade', { bins: 14, legend: false, live: true, refs: [{ id: 's', kind: 'sla', value: 99.9, label: 'SLA' }] }) }),
        C('chart', 24, 586, 420, 330, { title: 'Utilização × atenuação', subtitle: 'cada ponto é um enlace', props: chart('scatter', 'utilizacao', 'atenuacao_dB', { series: 'camada', limit: 400, legend: true, refs: [{ id: 'f', kind: 'forecast' }] }) }),
        C('table', 460, 586, 796, 330, { title: 'Enlaces mais carregados', subtitle: 'linhas piscam quando o valor muda · clique para destacar no mapa', props: { columns: ['id', 'nome', 'regiao', 'status', 'utilizacao', 'atenuacao_dB', 'disponibilidade'], sortBy: 'utilizacao', sortDir: 'desc', statusColors: true, density: 'compact', rowLimit: 60, search: true, exportable: true, live: true, trend: { measure: 'utilizacao', label: '30 dias' }, cf: [{ id: 'u', field: 'utilizacao', kind: 'bars' }, { id: 'd', field: 'disponibilidade', kind: 'rules', rules: [{ op: '<', v: 99.5, tone: 'critical' }, { op: 'between', v: 99.5, v2: 99.9, tone: 'warning' }, { op: '>', v: 99.9, tone: 'healthy' }] }] } }),
        C('chart', 24, 932, 1232, 300, { title: 'Tráfego por POP · últimos 40 minutos', subtitle: 'janela deslizante, atualiza a cada 2 s · a faixa marca o incidente no POP Lapa', table: 'telemetria', props: chart('line', 'ts', 'trafego_gbps', { agg: 'avg', series: 'pop', grain: 'minute', sort: 'none', limit: 0, legend: true, live: true, zoom: false, tooltipFields: ['latencia_ms', 'perda_pct'], notes: [{ id: 'i1', at: INCIDENT_MIN * 60_000, label: 'Pico de tráfego e perda no POP Lapa', tone: 'danger' }] }) }),
      ], 1260)],
    }));
  }
  cache = out;
  return out;
}
