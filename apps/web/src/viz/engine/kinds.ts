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
