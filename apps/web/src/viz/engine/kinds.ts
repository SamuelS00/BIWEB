import type { ChartKind } from '../../editor/doc';

/** What each visualization is for. The picker, the Copilot and the "change type" flow all read this table. */
export interface KindDef {
  id: ChartKind; label: string; question: string; category: string;
  /** Roles the field wells show for this kind. */ roles: ('x' | 'y' | 'y2' | 'series' | 'target' | 'tooltip')[];
  labels: { x: string; y: string; y2?: string; series?: string };
  /** Kinds that need a date on X (time axis). */ time?: boolean; needsSeries?: boolean; supportsRefs?: boolean; supportsCompare?: boolean; supportsZoom?: boolean;
}
export const CATEGORIES = ['Essenciais', 'Comparação', 'Série temporal', 'Distribuição', 'Relacionamento', 'Composição', 'Fluxo', 'Desempenho', 'Avançados'] as const;
const L = (x: string, y: string, extra: Partial<KindDef['labels']> = {}) => ({ x, y, ...extra });
export const KINDS: KindDef[] = [
  { id: 'bar', label: 'Colunas', question: 'Como categorias se comparam?', category: 'Essenciais', roles: ['x', 'y', 'series', 'target', 'tooltip'], labels: L('Eixo X (categoria ou data)', 'Valores'), supportsRefs: true, supportsCompare: true, supportsZoom: true },
  { id: 'hbar', label: 'Barras horizontais', question: 'Qual o ranking?', category: 'Essenciais', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Categoria', 'Valores'), supportsRefs: true },
  { id: 'line', label: 'Linha', question: 'Como evolui no tempo?', category: 'Série temporal', roles: ['x', 'y', 'series', 'target', 'tooltip'], labels: L('Eixo X (data)', 'Valores'), time: true, supportsRefs: true, supportsCompare: true, supportsZoom: true },
  { id: 'area', label: 'Área', question: 'Qual o volume ao longo do tempo?', category: 'Série temporal', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Eixo X (data)', 'Valores'), time: true, supportsRefs: true, supportsCompare: true, supportsZoom: true },
  { id: 'step', label: 'Degrau', question: 'Quando o estado mudou?', category: 'Série temporal', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Eixo X (data)', 'Valores'), time: true, supportsRefs: true, supportsZoom: true },
  { id: 'sparkbars', label: 'Mini-barras', question: 'Qual o pulso recente?', category: 'Série temporal', roles: ['x', 'y'], labels: L('Eixo X (data)', 'Valores'), time: true },
  { id: 'grouped', label: 'Barras agrupadas', question: 'Como subcategorias se comparam lado a lado?', category: 'Comparação', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Categoria', 'Valores', { series: 'Agrupar por' }), needsSeries: true, supportsRefs: true },
  { id: 'stacked', label: 'Barras empilhadas', question: 'De que é composto o total?', category: 'Comparação', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Categoria ou data', 'Valores', { series: 'Empilhar por' }), needsSeries: true, supportsRefs: true, supportsZoom: true },
  { id: 'stacked100', label: '100% empilhadas', question: 'Como muda a proporção?', category: 'Comparação', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Categoria ou data', 'Valores', { series: 'Empilhar por' }), needsSeries: true },
  { id: 'combo', label: 'Combinado (coluna + linha)', question: 'O volume acompanha a taxa ou a meta?', category: 'Comparação', roles: ['x', 'y', 'y2', 'target', 'tooltip'], labels: L('Eixo X (data ou categoria)', 'Colunas', { y2: 'Linha (eixo secundário)' }), supportsRefs: true, supportsCompare: true, supportsZoom: true },
  { id: 'bullet', label: 'Bullet', question: 'Cada item atingiu a meta?', category: 'Desempenho', roles: ['x', 'y', 'target', 'tooltip'], labels: L('Item', 'Realizado'), supportsRefs: false },
  { id: 'waterfall', label: 'Cascata', question: 'O que explica a variação?', category: 'Fluxo', roles: ['x', 'y', 'tooltip'], labels: L('Etapa ou categoria', 'Valores'), supportsRefs: false },
  { id: 'funnel', label: 'Funil', question: 'Onde se perde volume entre etapas?', category: 'Fluxo', roles: ['x', 'y'], labels: L('Etapa', 'Valores') },
  { id: 'sankey', label: 'Sankey', question: 'Para onde o volume flui?', category: 'Fluxo', roles: ['x', 'y', 'series'], labels: L('Origem', 'Valores', { series: 'Destino' }), needsSeries: true },
  { id: 'histogram', label: 'Histograma', question: 'Como os valores se distribuem?', category: 'Distribuição', roles: ['x', 'tooltip'], labels: L('Medida a distribuir', '—'), supportsRefs: true },
  { id: 'box', label: 'Box plot', question: 'Qual a dispersão e quais os outliers?', category: 'Distribuição', roles: ['x', 'y'], labels: L('Categoria', 'Medida'), supportsRefs: true },
  { id: 'scatter', label: 'Dispersão', question: 'Há relação entre duas medidas?', category: 'Relacionamento', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Eixo X (medida)', 'Eixo Y (medida)', { series: 'Cor por' }), supportsRefs: true },
  { id: 'bubble', label: 'Bolhas', question: 'Relação entre três medidas', category: 'Relacionamento', roles: ['x', 'y', 'y2', 'series', 'tooltip'], labels: L('Eixo X (medida)', 'Eixo Y (medida)', { y2: 'Tamanho da bolha', series: 'Cor por' }) },
  { id: 'pie', label: 'Rosca', question: 'Qual a participação de cada parte?', category: 'Composição', roles: ['x', 'y', 'tooltip'], labels: L('Categoria', 'Valores') },
  { id: 'treemap', label: 'Treemap', question: 'Qual a hierarquia do total?', category: 'Composição', roles: ['x', 'y', 'series', 'tooltip'], labels: L('Categoria', 'Tamanho', { series: 'Subcategoria' }) },
  { id: 'gauge', label: 'Medidor', question: 'Em que faixa estamos?', category: 'Desempenho', roles: ['y', 'target'], labels: L('—', 'Valor') },
  { id: 'heat', label: 'Tabela de calor', question: 'Onde se concentram os valores?', category: 'Avançados', roles: ['x', 'series', 'y'], labels: L('Linhas', 'Valores', { series: 'Colunas' }), needsSeries: true },
  { id: 'calendar', label: 'Calendário de calor', question: 'Quais dias concentram o volume?', category: 'Avançados', roles: ['x', 'y'], labels: L('Data', 'Valores'), time: true },
];
export const KIND_BY_ID = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<ChartKind, KindDef>;
export const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.id, k.label])) as Record<ChartKind, string>;

import type { IconName } from '@biweb/ui';
/** Icon for each kind in the picker (only icons the design system already has). */
export const KIND_ICON: Record<ChartKind, IconName> = {
  bar: 'chart', hbar: 'alignLeft', line: 'timeline', area: 'timeline', step: 'timeline', sparkbars: 'chart', grouped: 'chart', stacked: 'chart', stacked100: 'chart', combo: 'chart', bullet: 'alignLeft', waterfall: 'distV',
  funnel: 'filter', sankey: 'share', histogram: 'chart', box: 'alignVCenter', scatter: 'grid', bubble: 'grid', pie: 'status', treemap: 'matrix', gauge: 'kpi', heat: 'matrix', calendar: 'calendar',
};

import type { Field } from '../../data/types';
import type { ChartProps } from '../../editor/doc';
type F = Pick<Field, 'name' | 'label' | 'kind'>;
const MEASURE_KINDS: ChartKind[] = ['scatter', 'bubble', 'histogram'];
/** Switching type must not rebuild the chart: keep every compatible field and say what changed or what is missing. */
export function adaptKind(p: ChartProps, to: ChartKind, fields: F[]): { patch: Partial<ChartProps>; notes: string[] } {
  const patch: Partial<ChartProps> = { kind: to }, notes: string[] = [], def = KIND_BY_ID[to], by = (n?: string) => fields.find((f) => f.name === n);
  const measures = fields.filter((f) => f.kind === 'measure'), dims = fields.filter((f) => f.kind !== 'measure' && f.kind !== 'date'), dates = fields.filter((f) => f.kind === 'date');
  if (MEASURE_KINDS.includes(to)) {
    if (by(p.x)?.kind !== 'measure') { const m = measures.find((f) => f.name !== p.y) ?? measures[0]; if (m) { patch.x = m.name; notes.push(`Eixo X passou a ${m.label}: ${def.label.toLowerCase()} compara medidas.`); } }
    if (to !== 'histogram' && by(p.y)?.kind !== 'measure') { const m = measures.find((f) => f.name !== (patch.x ?? p.x)) ?? measures[0]; if (m) { patch.y = m.name; notes.push(`Eixo Y passou a ${m.label}.`); } }
    if (to === 'histogram') patch.y = patch.x ?? p.x;
    patch.agg = 'avg';
  } else if (MEASURE_KINDS.includes(p.kind) && by(p.x)?.kind === 'measure') {
    const d = dims[0] ?? dates[0]; if (d) { patch.x = d.name; notes.push(`Eixo X passou a ${d.label}: este gráfico agrupa por categoria ou data.`); }
    const y = by(p.y)?.kind === 'measure' ? p.y : measures[0]?.name; if (y) patch.y = y; patch.agg = 'sum';
  }
  if (def.time && by(patch.x ?? p.x)?.kind !== 'date' && dates[0]) notes.push(`${def.label} funciona melhor com uma data no eixo X (ex.: ${dates[0].label}).`);
  if (def.time) patch.sort = 'none';
  if (def.supportsZoom && p.zoom === undefined) patch.zoom = true;
  if (!def.needsSeries && p.series && ['gauge', 'bullet', 'waterfall', 'funnel', 'pie', 'histogram'].includes(to)) notes.push('O campo de série não é usado neste tipo; ele foi mantido caso você volte.');
  if (def.needsSeries && !p.series) { const d = dims.find((f) => f.name !== (patch.x ?? p.x)); notes.push(`${def.label} precisa de um campo em «${def.labels.series ?? 'Série'}»${d ? ` (sugestão: ${d.label})` : ''}.`); }
  return { patch, notes };
}
/** What is still missing for the chart to answer its question. Shown as guidance, never as a blocker. */
export function guidance(p: ChartProps, fields: F[]): string[] {
  const def = KIND_BY_ID[p.kind], out: string[] = [], by = (n?: string) => fields.find((f) => f.name === n);
  if (def.needsSeries && !p.series) out.push(`Falta um campo em «${def.labels.series ?? 'Série'}».`);
  if (p.kind === 'combo' && !p.y2) out.push('Escolha a medida da linha (eixo secundário).');
  if (p.kind === 'bullet' && !p.target && !p.refs?.some((r) => r.kind === 'target')) out.push('Informe a meta: um campo de meta ou uma linha de referência «Meta».');
  if (def.time && by(p.x)?.kind !== 'date') out.push('Este tipo mostra evolução: use uma data no eixo X.');
  if ((p.compare === 'prev' || p.compare === 'both') && !fields.some((f) => f.kind === 'date')) out.push('Comparar com o ano anterior exige um campo de data na tabela.');
  if (MEASURE_KINDS.includes(p.kind) && by(p.x)?.kind !== 'measure') out.push('O eixo X deste tipo precisa ser uma medida.');
  return out;
}
