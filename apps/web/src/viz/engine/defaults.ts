import type { ChartKind, ChartProps, CompType } from '../../editor/doc';

export interface Preset { table: string; title: string; subtitle: string; props: Record<string, unknown> }
const base = { agg: 'sum', sort: 'value', limit: 10, legend: false, labels: false, tooltip: true, grain: 'day', responsive: 'fit' } as const;
const P = (kind: ChartKind, x: string, y: string, extra: Partial<ChartProps> = {}): Record<string, unknown> => ({ ...base, kind, x, y, ...extra });

/** Sensible first chart of each kind for a dataset, so inserting from the picker already shows something that answers a question. */
const VENDAS: Partial<Record<ChartKind, Preset>> = {
  bar: { table: 'vendas', title: 'Receita por região', subtitle: 'últimos 12 meses', props: P('bar', 'regiao', 'receita', { period: 'last12m', labels: true, limit: 8 }) },
  hbar: { table: 'vendas', title: 'Receita por categoria', subtitle: 'ranking · 12 meses', props: P('hbar', 'categoria', 'receita', { period: 'last12m', labels: true }) },
  line: { table: 'vendas', title: 'Receita por mês', subtitle: '12 meses', props: P('line', 'data', 'receita', { period: 'last12m', grain: 'month', sort: 'none', limit: 0, zoom: true }) },
  area: { table: 'vendas', title: 'Receita acumulada por mês', subtitle: '12 meses', props: P('area', 'data', 'receita', { period: 'last12m', grain: 'month', sort: 'none', limit: 0 }) },
  step: { table: 'vendas', title: 'Pedidos por semana', subtitle: '12 meses', props: P('step', 'data', 'pedidos', { period: 'last12m', grain: 'week', sort: 'none', limit: 0 }) },
  sparkbars: { table: 'vendas', title: 'Pulso de receita', subtitle: 'últimos 30 dias', props: P('sparkbars', 'data', 'receita', { period: 'last30d', sort: 'none', limit: 0 }) },
  grouped: { table: 'vendas', title: 'Receita por região e canal', subtitle: '12 meses', props: P('grouped', 'regiao', 'receita', { series: 'canal', period: 'last12m', legend: true }) },
  stacked: { table: 'vendas', title: 'Receita por mês e categoria', subtitle: 'empilhado', props: P('stacked', 'data', 'receita', { series: 'categoria', period: 'last12m', grain: 'month', sort: 'none', limit: 0, legend: true }) },
  stacked100: { table: 'vendas', title: 'Mix de canais ao longo do tempo', subtitle: '100% empilhado', props: P('stacked100', 'data', 'receita', { series: 'canal', period: 'last12m', grain: 'month', sort: 'none', limit: 0, legend: true }) },
  combo: { table: 'vendas', title: 'Receita, meta e margem', subtitle: 'colunas + linha', props: P('combo', 'data', 'receita', { y2: 'margem_pct', target: 'meta', compare: 'both', period: 'last12m', grain: 'month', sort: 'none', limit: 0, legend: true }) },
  bullet: { table: 'vendas', title: 'Atingimento por região', subtitle: 'receita vs meta', props: P('bullet', 'regiao', 'receita', { target: 'meta', period: 'last12m', labels: true }) },
  waterfall: { table: 'vendas', title: 'O que explica a variação', subtitle: 'ano anterior → atual', props: P('waterfall', 'categoria', 'receita', { compare: 'prev', period: 'last12m', sort: 'none', labels: true, limit: 0 }) },
  funnel: { table: 'clientes', title: 'Clientes por segmento', subtitle: 'do maior ao menor', props: P('funnel', 'segmento', 'id', { agg: 'count' }) },
  sankey: { table: 'clientes', title: 'Segmentos por canal', subtitle: 'fluxo de clientes', props: P('sankey', 'canal', 'id', { series: 'segmento', agg: 'count' }) },
  histogram: { table: 'clientes', title: 'Distribuição do valor por cliente', subtitle: 'histograma', props: P('histogram', 'valor_total', 'valor_total', { bins: 14, refs: [{ id: 'm', kind: 'avg' }] }) },
  box: { table: 'clientes', title: 'Valor por segmento', subtitle: 'box plot', props: P('box', 'segmento', 'valor_total', { limit: 8 }) },
  scatter: { table: 'clientes', title: 'Recência × frequência', subtitle: 'por cliente', props: P('scatter', 'recencia_dias', 'frequencia', { series: 'segmento', limit: 500, legend: true }) },
  bubble: { table: 'clientes', title: 'Recência × frequência × valor', subtitle: 'tamanho = valor', props: P('bubble', 'recencia_dias', 'frequencia', { y2: 'valor_total', series: 'segmento', limit: 320, legend: true }) },
  pie: { table: 'vendas', title: 'Receita por canal', subtitle: '12 meses', props: P('pie', 'canal', 'receita', { period: 'last12m', labels: true, legend: true, limit: 6 }) },
  treemap: { table: 'vendas', title: 'Mix de receita', subtitle: 'canal › categoria', props: P('treemap', 'canal', 'receita', { series: 'categoria', period: 'last12m' }) },
  gauge: { table: 'vendas', title: 'Atingimento da meta', subtitle: '30 dias', props: P('gauge', 'regiao', 'receita', { target: 'meta', period: 'last30d', thresholds: [0.6, 0.9] }) },
  heat: { table: 'vendas', title: 'Receita por região e canal', subtitle: 'tabela de calor', props: P('heat', 'regiao', 'receita', { series: 'canal', period: 'last12m' }) },
  calendar: { table: 'vendas', title: 'Receita por dia', subtitle: 'calendário de calor', props: P('calendar', 'data', 'receita', { period: 'last12m', sort: 'none', limit: 0 }) },
};
const REDE: Partial<Record<ChartKind, Preset>> = {
  hbar: { table: 'enlaces', title: 'Enlaces por região', subtitle: 'ranking', props: P('hbar', 'regiao', 'id', { agg: 'count', labels: true }) },
  step: { table: 'historico', title: 'Disponibilidade por semana', subtitle: '30 dias', props: P('step', 'dia', 'disponibilidade', { agg: 'avg', grain: 'week', sort: 'none', limit: 0 }) },
  sparkbars: { table: 'historico', title: 'Pulso de utilização', subtitle: '30 dias', props: P('sparkbars', 'dia', 'utilizacao', { agg: 'avg', sort: 'none', limit: 0 }) },
  grouped: { table: 'enlaces', title: 'Enlaces por região e status', subtitle: 'lado a lado', props: P('grouped', 'regiao', 'id', { agg: 'count', series: 'status', legend: true }) },
  stacked: { table: 'enlaces', title: 'Enlaces por região e status', subtitle: 'empilhado', props: P('stacked', 'regiao', 'id', { agg: 'count', series: 'status', legend: true }) },
  stacked100: { table: 'enlaces', title: 'Composição de status por região', subtitle: '100% empilhado', props: P('stacked100', 'regiao', 'id', { agg: 'count', series: 'status', legend: true }) },
  combo: { table: 'historico', title: 'Utilização e disponibilidade', subtitle: 'colunas + linha', props: P('combo', 'dia', 'utilizacao', { agg: 'avg', y2: 'disponibilidade', grain: 'week', sort: 'none', limit: 0, legend: true }) },
  bullet: { table: 'enlaces', title: 'Utilização por região', subtitle: 'vs limite de 70%', props: P('bullet', 'regiao', 'utilizacao', { agg: 'avg', labels: true, refs: [{ id: 't', kind: 'target', value: 70, label: 'Limite' }] }) },
  waterfall: { table: 'eventos', title: 'Minutos de indisponibilidade por tipo', subtitle: 'acumulado', props: P('waterfall', 'tipo', 'duracao_min', { sort: 'value', labels: true, limit: 8 }) },
  funnel: { table: 'eventos', title: 'Eventos por tipo', subtitle: 'do maior ao menor', props: P('funnel', 'tipo', 'id', { agg: 'count', limit: 6 }) },
  sankey: { table: 'enlaces', title: 'Camada × status', subtitle: 'fluxo de enlaces', props: P('sankey', 'camada', 'id', { series: 'status', agg: 'count' }) },
  histogram: { table: 'enlaces', title: 'Distribuição da utilização', subtitle: 'histograma', props: P('histogram', 'utilizacao', 'utilizacao', { bins: 14, refs: [{ id: 'm', kind: 'avg' }] }) },
  box: { table: 'enlaces', title: 'Utilização por camada', subtitle: 'box plot', props: P('box', 'camada', 'utilizacao') },
  bubble: { table: 'enlaces', title: 'Atenuação × extensão × capacidade', subtitle: 'tamanho = capacidade', props: P('bubble', 'extensao_km', 'atenuacao_dB', { y2: 'capacidade', series: 'camada', limit: 300, legend: true }) },
  treemap: { table: 'enlaces', title: 'Enlaces por camada e região', subtitle: 'treemap', props: P('treemap', 'camada', 'id', { agg: 'count', series: 'regiao' }) },
  gauge: { table: 'enlaces', title: 'Disponibilidade', subtitle: 'média dos enlaces · meta 99,9%', props: P('gauge', 'regiao', 'disponibilidade', { agg: 'avg', refs: [{ id: 't', kind: 'target', value: 99.9 }], thresholds: [0.99, 0.999] }) },
  heat: { table: 'enlaces', title: 'Enlaces por região e status', subtitle: 'tabela de calor', props: P('heat', 'regiao', 'id', { agg: 'count', series: 'status' }) },
  calendar: { table: 'eventos', title: 'Eventos por dia', subtitle: 'calendário de calor', props: P('calendar', 'data', 'id', { agg: 'count', sort: 'none', limit: 0 }) },
};
export const chartPreset = (kind: ChartKind, ds: string): Preset | undefined => (ds === 'ds_vendas' ? VENDAS[kind] : REDE[kind]);

/** Defaults for the non-chart components when the report is bound to the sales dataset. */
export function vendasDefaults(type: CompType): { table: string; title: string; subtitle: string; props: Record<string, unknown> } | undefined {
  switch (type) {
    case 'kpi': return { table: 'vendas', title: 'Receita · 30 dias', subtitle: 'vs ano anterior', props: { measure: 'receita', agg: 'sum', label: 'Receita', targetDir: 'above', spark: true, compare: 'both', period: 'last30d', targetField: 'meta' } };
    case 'table': return { table: 'lojas', title: 'Lojas', subtitle: 'resultado mensal', props: { columns: ['loja', 'cidade', 'estado', 'receita', 'atingimento', 'margem_pct'], sortBy: 'receita', sortDir: 'desc', statusColors: false, density: 'compact', rowLimit: 200, search: true, exportable: true, totals: true } };
    case 'matrix': return { table: 'vendas', title: 'Receita', subtitle: 'região × canal', props: { rows: 'regiao', cols: 'canal', measure: 'receita', agg: 'sum', heat: true, totals: true, period: 'last12m' } };
    case 'filter': return { table: 'vendas', title: 'Região', subtitle: '', props: { field: 'regiao', multi: true, targets: 'all', defaultValues: [], style: 'dropdown' } };
    case 'slicer': return { table: 'vendas', title: 'Canal', subtitle: '', props: { field: 'canal', multi: true, targets: 'all', showCounts: false, orientation: 'horizontal' } };
    default: return undefined;
  }
}
