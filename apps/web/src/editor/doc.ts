/** Documento do relatório (JSON). Canvas, propriedades, Copilot, undo/redo e salvar leem e escrevem este mesmo objeto. */
import type { Agg, Filter, Rule } from '../data/types';
import type { Grain } from '../data/query';
import { chartPreset, vendasDefaults } from '../viz/engine/defaults';
import { CATEGORIES, KINDS } from '../viz/engine/kinds';

export type CompType = 'kpi' | 'chart' | 'table' | 'matrix' | 'text' | 'image' | 'filter' | 'slicer' | 'map' | 'scene3d' | 'card' | 'container' | 'timeline' | 'status';
export type ChartKind = 'bar' | 'hbar' | 'line' | 'area' | 'pie' | 'scatter'
  | 'step' | 'combo' | 'stacked' | 'stacked100' | 'grouped' | 'waterfall' | 'bullet' | 'histogram' | 'box' | 'bubble' | 'treemap' | 'funnel' | 'heat' | 'calendar' | 'gauge' | 'sankey' | 'sparkbars';
export type PeriodKey = 'all' | 'ytd' | 'last12m' | 'last90d' | 'last30d' | 'last7d';
export type RefKind = 'avg' | 'median' | 'target' | 'sla' | 'threshold' | 'forecast' | 'max' | 'min';
export interface RefLine { id: string; kind: RefKind; value?: number; label?: string }
export interface Annotation { id: string; at: number; label: string; tone?: 'info' | 'warning' | 'danger' }
export type DemoState = 'live' | 'loading' | 'error' | 'noaccess' | 'stale';
export type MapVariant = 'assets' | 'heat' | 'routes' | 'topology';

export interface Binding { dataset: string; table: string }
export interface CompStyle { title: string; subtitle: string; showTitle: boolean; background: 'surface' | 'none' | 'subtle'; border: boolean; padding: number; accent: number /* viz-cat-n */; fontSize: 'sm' | 'md' | 'lg' }
export interface CompInteractions {
  /** Clicar numa marca filtra os outros componentes da página. */ emitCross: boolean;
  /** Este componente reage a filtros e seleções dos outros. */ receive: boolean;
  /** Clicar navega para outra página. */ navigateTo?: string;
  /** Hierarquia de drill-down (ex.: regiao → nome). */ drill?: string[];
  /** Filtrar os outros componentes ou só destacar a seleção (cross-highlight). */ crossMode?: 'filter' | 'highlight';
  /** Quais componentes reagem à seleção deste. */ affects?: 'all' | string[];
  /** Drill-through: leva a seleção atual para a página de destino. */ carryContext?: boolean;
}
export interface Comp {
  id: string; type: CompType; name: string;
  x: number; y: number; w: number; h: number; z: number;
  hidden?: boolean; locked?: boolean;
  style: CompStyle; interactions: CompInteractions;
  data?: Binding; localFilters: Filter[];
  props: Record<string, unknown>;
}
export interface Page { id: string; name: string; w: number; h: number; comps: Comp[]; /** Filtros que valem para todos os componentes desta página. */ filters?: Filter[] }
export interface ReportDoc {
  id: string; name: string; description: string; category: 'Operações' | 'Executivo' | 'Engenharia' | 'Campo' | 'Capacidade' | 'Comercial' | 'Financeiro' | 'Clientes';
  kind: 'Dashboard' | 'Mapa operacional' | 'Gêmeo digital' | 'Relatório paginado';
  datasets: string[]; pages: Page[]; rules: Rule[]; /** Filtros que valem para todas as páginas do relatório. */ filters?: Filter[];
  status: 'Rascunho' | 'Publicado'; version: number; publishedAt?: number; updatedAt: number; owner: string; certified?: boolean; views: number;
  cover: 'map' | 'topology' | 'routes' | 'chart' | 'heat' | '3d' | 'kpi';
  origin?: 'copilot';
}

/* ---------- props por tipo (o Inspector e os renderers usam estes formatos) ---------- */
export interface KpiProps { measure: string; agg: Agg; format?: string; label: string; target?: number; targetDir: 'above' | 'below'; spark: boolean; sparkMeasure?: string; compare: 'none' | 'target' | 'prev' | 'both';
  /** Janela de tempo (ancorada na data mais recente dos dados) e campo de data. */ period?: PeriodKey; dateField?: string;
  /** Campo (medida) cuja soma é a meta do período. */ targetField?: string; sparkGrain?: Grain; /** Menor é melhor (ex.: latência, churn). */ lowerIsBetter?: boolean; unit?: string; live?: boolean; state?: DemoState; secondary?: { label: string; measure: string; agg: Agg }[] }
export interface ChartProps { kind: ChartKind; x: string; y: string; agg: Agg; series?: string; sort: 'value' | 'asc' | 'label' | 'none'; limit: number; legend: boolean; labels: boolean; tooltip: boolean; grain: Grain; y2?: string /* scatter: medida do eixo Y; combo: medida da linha; bubble: tamanho */; responsive: 'fit' | 'scroll';
  /** Campo (medida) usado como meta, ex.: `meta`. */ target?: string; compare?: 'none' | 'prev' | 'target' | 'both';
  period?: PeriodKey; dateField?: string; refs?: RefLine[]; notes?: Annotation[]; zoom?: boolean; tooltipFields?: string[]; bins?: number;
  /** Rótulos das barras que fecham total na cascata. */ totals?: string[]; movingAvg?: number; live?: boolean; state?: DemoState; colorBy?: string; thresholds?: [number, number]; cf?: CondFormat[] }
export type Tone3 = 'critical' | 'warning' | 'healthy';
export interface CfRule { op: '<' | '<=' | '>' | '>=' | 'between'; v: number; v2?: number; tone: Tone3 }
/** Conditional formatting for one column: a color scale, data bars, tone rules or status icons. */
export interface CondFormat { id: string; field: string; kind: 'scale' | 'bars' | 'rules' | 'icons'; rules?: CfRule[]; reverse?: boolean }
export interface TableProps { columns: string[]; sortBy?: string; sortDir: 'asc' | 'desc'; statusColors: boolean; density: 'compact' | 'default'; rowLimit: number;
  search?: boolean; columnPicker?: boolean; totals?: boolean; groupBy?: string; cf?: CondFormat[]; trend?: { measure: string; label?: string }; exportable?: boolean; live?: boolean; state?: DemoState }
export interface MatrixProps { rows: string; cols: string; measure: string; agg: Agg; heat: boolean; totals: boolean; rowHier?: string[]; cf?: CondFormat[]; period?: PeriodKey }
export interface TextProps { text: string; size: 'sm' | 'md' | 'lg' | 'xl'; align: 'left' | 'center' | 'right'; weight: 'regular' | 'strong'; tone: 'title' | 'subtitle' }
export interface ImageProps { src: string; fit: 'contain' | 'cover'; alt: string }
export interface FilterProps { field: string; multi: boolean; targets: 'all' | string[]; defaultValues: unknown[]; style: 'dropdown' | 'list' | 'search' | 'range' | 'daterange' | 'relative' | 'toggle' | 'hierarchy'; scope?: 'page' | 'report'; hierarchy?: string[]; rangeMin?: number; rangeMax?: number }
export interface SlicerProps { field: string; multi: boolean; targets: 'all' | string[]; showCounts: boolean; orientation: 'horizontal' | 'vertical' }
export interface MapLayers { regioes: boolean; enlaces: boolean; nos: boolean; eventos: boolean; rotas: boolean; heat: boolean; cobertura: boolean; clusters: boolean; clientes: boolean }
export interface MapProps { variant: MapVariant; layers: MapLayers; colorBy: 'status' | 'utilizacao' | 'atenuacao_dB' | 'camada'; heatField: 'eventos' | 'atenuacao_dB' | 'utilizacao'; legend: boolean; detailPanel: boolean; layerPanel: boolean; labels: boolean; routeId?: string; focus?: string }
export interface Scene3DProps { focus: string; layers: { terreno: boolean; edificios: boolean; torres: boolean; fibras: boolean; cobertura: boolean; visada: boolean; fluxo: boolean }; perspective: 'orbital' | 'topo' | 'rua'; exaggeration: number }
export interface CardProps { body: string; measure?: string; agg: Agg; icon: 'info' | 'warning' | 'check' | 'clock' }
export interface TimelineProps { dateField: string; groupBy: string; days: number; showList: boolean }
export interface StatusProps { field: string; mode: 'counts' | 'element'; element?: string }
export interface ContainerProps { label: string }

export const uid = (p = 'c') => `${p}_${Math.random().toString(36).slice(2, 8)}`;
export const DEFAULT_STYLE: CompStyle = { title: '', subtitle: '', showTitle: true, background: 'surface', border: true, padding: 12, accent: 1, fontSize: 'md' };
export const DEFAULT_INTERACTIONS: CompInteractions = { emitCross: true, receive: true };
export const DS = 'ds_rede_sp';

export const COMP_META: Record<CompType, { label: string; icon: string; w: number; h: number; data: boolean; desc: string }> = {
  kpi: { label: 'KPI', icon: 'kpi', w: 240, h: 128, data: true, desc: 'Valor agregado com meta e tendência' },
  chart: { label: 'Gráfico', icon: 'chart', w: 480, h: 300, data: true, desc: 'Barra, linha, área, pizza ou dispersão' },
  table: { label: 'Tabela', icon: 'table', w: 560, h: 320, data: true, desc: 'Linhas virtualizadas com ordenação' },
  matrix: { label: 'Matriz', icon: 'matrix', w: 480, h: 300, data: true, desc: 'Linhas × colunas com mapa de calor' },
  text: { label: 'Texto', icon: 'text', w: 360, h: 64, data: false, desc: 'Título, nota ou explicação' },
  image: { label: 'Imagem', icon: 'image', w: 200, h: 120, data: false, desc: 'Logo ou imagem de referência' },
  filter: { label: 'Filtro', icon: 'filter', w: 240, h: 76, data: true, desc: 'Lista suspensa que filtra a página' },
  slicer: { label: 'Segmentação', icon: 'slicer', w: 420, h: 72, data: true, desc: 'Botões de valor para filtrar' },
  map: { label: 'Mapa', icon: 'pin', w: 640, h: 420, data: true, desc: 'Ativos, enlaces, regiões e eventos' },
  scene3d: { label: 'Visualização 3D', icon: 'cube', w: 640, h: 420, data: true, desc: 'Gêmeo digital: torres, fibras e relevo' },
  card: { label: 'Card', icon: 'card', w: 280, h: 140, data: false, desc: 'Destaque com texto e valor' },
  container: { label: 'Container', icon: 'container', w: 560, h: 320, data: false, desc: 'Agrupa componentes e move junto' },
  timeline: { label: 'Linha do tempo', icon: 'timeline', w: 640, h: 220, data: true, desc: 'Eventos ao longo do período' },
  status: { label: 'Indicador de status', icon: 'status', w: 320, h: 96, data: true, desc: 'Contagem por status ou estado de um elemento' },
};
/** Itens da paleta: alguns são variações pré-configuradas de um tipo (mapa de calor, mapa de rotas, tipos de gráfico). */
export type PaletteGroup = 'Dados' | typeof CATEGORIES[number] | 'Geo e 3D' | 'Layout';
export const PALETTE: { id: string; type: CompType; label: string; group: PaletteGroup; preset?: Record<string, unknown>; hint?: string }[] = [
  { id: 'kpi', type: 'kpi', label: 'KPI', group: 'Dados', hint: 'Um número com comparação, meta e tendência' }, { id: 'table', type: 'table', label: 'Tabela', group: 'Dados', hint: 'Linhas com ordenação, busca, totais e formatação condicional' }, { id: 'matrix', type: 'matrix', label: 'Matriz', group: 'Dados', hint: 'Linhas × colunas com hierarquia expansível' },
  { id: 'status', type: 'status', label: 'Status', group: 'Dados' }, { id: 'filter', type: 'filter', label: 'Filtro', group: 'Dados', hint: 'Lista, busca, intervalo, data ou janela relativa' }, { id: 'slicer', type: 'slicer', label: 'Segmentação', group: 'Dados' },
  ...KINDS.map((k) => ({ id: k.id, type: 'chart' as const, label: k.label, group: k.category as PaletteGroup, preset: { kind: k.id }, hint: k.question })),
  { id: 'timeline', type: 'timeline', label: 'Linha do tempo', group: 'Série temporal', hint: 'Eventos ao longo do período' },
  { id: 'map', type: 'map', label: 'Mapa', group: 'Geo e 3D' }, { id: 'heat', type: 'map', label: 'Mapa de calor', group: 'Geo e 3D', preset: { variant: 'heat' } },
  { id: 'routes', type: 'map', label: 'Mapa de rotas', group: 'Geo e 3D', preset: { variant: 'routes' } }, { id: 'topology', type: 'map', label: 'Topologia', group: 'Geo e 3D', preset: { variant: 'topology' } },
  { id: 'scene3d', type: 'scene3d', label: '3D', group: 'Geo e 3D' },
  { id: 'text', type: 'text', label: 'Texto', group: 'Layout' }, { id: 'card', type: 'card', label: 'Card', group: 'Layout' }, { id: 'image', type: 'image', label: 'Imagem', group: 'Layout' }, { id: 'container', type: 'container', label: 'Container', group: 'Layout' },
];

const LAYERS: MapLayers = { regioes: true, enlaces: true, nos: true, eventos: false, rotas: false, heat: false, cobertura: false, clusters: true, clientes: false };
export function defaultProps(type: CompType, preset: Record<string, unknown> = {}, ds: string = DS): { props: Record<string, unknown>; data?: Binding; title: string; subtitle: string } {
  const b = (table: string): Binding => ({ dataset: ds, table });
  const vd = ds === 'ds_vendas' ? vendasDefaults(type) : undefined;
  if (vd) return { data: b(vd.table), title: vd.title, subtitle: vd.subtitle, props: vd.props };
  if (type === 'chart') { const cp = chartPreset((preset.kind as ChartKind) ?? 'bar', ds); const legacy = ['bar', 'line', 'area', 'pie', 'scatter'].includes(String(preset.kind ?? 'bar')); if (cp && (ds !== DS || !legacy)) return { data: b(cp.table), title: cp.title, subtitle: cp.subtitle, props: cp.props }; }
  switch (type) {
    case 'kpi': return { data: b('enlaces'), title: 'Disponibilidade', subtitle: 'média dos enlaces', props: { measure: 'disponibilidade', agg: 'avg', label: 'Disponibilidade', target: 99.9, targetDir: 'above', spark: true, sparkMeasure: 'disponibilidade', compare: 'target' } satisfies KpiProps };
    case 'chart': {
      const kind = (preset.kind as ChartKind) ?? 'bar';
      if (kind === 'line' || kind === 'area') return { data: b('historico'), title: 'Atenuação média', subtitle: 'por dia · últimos 30 dias', props: { kind, x: 'dia', y: 'atenuacao_dB', agg: 'avg', sort: 'none', limit: 30, legend: false, labels: false, tooltip: true, grain: 'day', responsive: 'fit' } satisfies ChartProps };
      if (kind === 'pie') return { data: b('enlaces'), title: 'Enlaces', subtitle: 'por status', props: { kind, x: 'status', y: 'id', agg: 'count', sort: 'value', limit: 6, legend: true, labels: true, tooltip: true, grain: 'day', responsive: 'fit' } satisfies ChartProps };
      if (kind === 'scatter') return { data: b('enlaces'), title: 'Atenuação × extensão', subtitle: 'por enlace', props: { kind, x: 'extensao_km', y: 'atenuacao_dB', y2: 'atenuacao_dB', agg: 'avg', series: 'camada', sort: 'none', limit: 400, legend: true, labels: false, tooltip: true, grain: 'day', responsive: 'fit' } satisfies ChartProps };
      return { data: b('enlaces'), title: 'Enlaces', subtitle: 'por região · top 10', props: { kind, x: 'regiao', y: 'id', agg: 'count', sort: 'value', limit: 10, legend: false, labels: true, tooltip: true, grain: 'day', responsive: 'fit' } satisfies ChartProps };
    }
    case 'table': return { data: b('enlaces'), title: 'Enlaces', subtitle: 'inventário', props: { columns: ['id', 'nome', 'regiao', 'status', 'utilizacao', 'atenuacao_dB', 'extensao_km'], sortBy: 'atenuacao_dB', sortDir: 'desc', statusColors: true, density: 'compact', rowLimit: 0 } satisfies TableProps };
    case 'matrix': return { data: b('enlaces'), title: 'Enlaces', subtitle: 'região × status', props: { rows: 'regiao', cols: 'status', measure: 'id', agg: 'count', heat: true, totals: true } satisfies MatrixProps };
    case 'text': return { title: '', subtitle: '', props: { text: 'Título da seção', size: 'lg', align: 'left', weight: 'strong', tone: 'title' } satisfies TextProps };
    case 'image': return { title: '', subtitle: '', props: { src: 'brand/logo-light.webp', fit: 'contain', alt: 'BIWEB Studio' } satisfies ImageProps };
    case 'filter': return { data: b('enlaces'), title: 'Região', subtitle: '', props: { field: 'regiao', multi: true, targets: 'all', defaultValues: [], style: 'dropdown' } satisfies FilterProps };
    case 'slicer': return { data: b('enlaces'), title: 'Status', subtitle: '', props: { field: 'status', multi: true, targets: 'all', showCounts: true, orientation: 'horizontal' } satisfies SlicerProps };
    case 'map': {
      const variant = (preset.variant as MapVariant) ?? 'assets';
      const layers = { ...LAYERS, ...(variant === 'heat' ? { heat: true, nos: false, enlaces: false, clusters: false } : variant === 'routes' ? { rotas: true, nos: false, clusters: false } : variant === 'topology' ? { regioes: false, clusters: false } : {}) };
      const title = variant === 'heat' ? 'Concentração de eventos' : variant === 'routes' ? 'Rotas' : variant === 'topology' ? 'Topologia da rede' : 'Rede metropolitana';
      return { data: b('enlaces'), title, subtitle: variant === 'heat' ? 'últimos 30 dias' : 'Grande São Paulo', props: { variant, layers, colorBy: 'status', heatField: 'eventos', legend: true, detailPanel: true, layerPanel: variant !== 'heat', labels: true } satisfies MapProps };
    }
    case 'scene3d': return { data: b('nos'), title: 'Gêmeo digital', subtitle: 'Torre SP-023 e entorno', props: { focus: 'Torre SP-023', layers: { terreno: true, edificios: true, torres: true, fibras: true, cobertura: true, visada: true, fluxo: true }, perspective: 'orbital', exaggeration: 3 } satisfies Scene3DProps };
    case 'card': return { title: 'Destaque', subtitle: '', props: { body: 'Use cards para explicar o que mudou e o que fazer a seguir.', agg: 'count', icon: 'info' } satisfies CardProps };
    case 'container': return { title: 'Grupo', subtitle: '', props: { label: 'Grupo' } satisfies ContainerProps };
    case 'timeline': return { data: b('eventos'), title: 'Eventos', subtitle: 'por dia e tipo · 30 dias', props: { dateField: 'data', groupBy: 'tipo', days: 30, showList: true } satisfies TimelineProps };
    case 'status': return { data: b('enlaces'), title: 'Saúde dos enlaces', subtitle: '', props: { field: 'status', mode: 'counts' } satisfies StatusProps };
  }
}

export function makeComp(type: CompType, at: { x: number; y: number; w?: number; h?: number }, preset: Record<string, unknown> = {}, z = 1, ds: string = DS): Comp {
  const m = COMP_META[type], d = defaultProps(type, preset, ds);
  return {
    id: uid(type), type, name: d.title || m.label, x: at.x, y: at.y, w: at.w ?? m.w, h: at.h ?? m.h, z,
    style: { ...DEFAULT_STYLE, padding: type === 'text' || type === 'image' ? 4 : 12, title: d.title, subtitle: d.subtitle, showTitle: !['text', 'image', 'container'].includes(type), border: type !== 'text' && type !== 'image', background: type === 'text' || type === 'image' ? 'none' : type === 'container' ? 'subtle' : 'surface' },
    interactions: { ...DEFAULT_INTERACTIONS, emitCross: ['chart', 'map', 'matrix', 'table', 'timeline', 'status'].includes(type), receive: type !== 'text' && type !== 'image' },
    data: d.data, localFilters: [], props: { ...d.props, ...preset },
  };
}
export const newPage = (name: string, comps: Comp[] = []): Page => ({ id: uid('pg'), name, w: 1280, h: 800, comps });
