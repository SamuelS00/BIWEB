/* Migration Studio — tipos e catálogos. Protótipo de front-end: nada aqui fala com um backend. */

export type PlatformId = 'powerbi' | 'tableau' | 'qlik' | 'looker' | 'thoughtspot' | 'domo';
export type Strategy = 'fidelity' | 'native' | 'modernize';
export type Compat = 'native' | 'equivalent' | 'redesign' | 'review' | 'unsupported';
export type Phase = 'source' | 'understand' | 'blueprint' | 'reconstruct' | 'validate' | 'publish';
export type ProjectStatus = 'analyzing' | 'review' | 'reconstructing' | 'validation' | 'completed';
export type Kind = 'workspace' | 'folder' | 'report' | 'page' | 'visual' | 'dataset' | 'table' | 'column' | 'measure' | 'calc' | 'filter' | 'parameter' | 'bookmark' | 'navigation' | 'theme' | 'map' | 'action' | 'security' | 'refresh' | 'process';
export type Builder = 'report' | 'map' | 'workflow' | 'data';

export interface Platform {
  id: PlatformId; name: string; mono: string; blurb: string;
  signIn: string; orgLabel: string; org: string; wsLabel: string; workspaces: string[];
  nouns: { report: string; reports: string; page: string; visual: string; measure: string; dataset: string };
  dialect: string; items: string[];
}

export const PLATFORMS: Platform[] = [
  { id: 'powerbi', name: 'Power BI', mono: 'PB', blurb: 'Workspaces, relatórios, modelos semânticos e DAX.', signIn: 'Entrar com Power BI', orgLabel: 'Organização', org: 'Corporate Tenant', wsLabel: 'Workspace', workspaces: ['Corporate Workspace', 'Finance (Premium)', 'Marketing Sandbox'],
    nouns: { report: 'relatório', reports: 'relatórios', page: 'página', visual: 'visual', measure: 'medida', dataset: 'modelo semântico' }, dialect: 'DAX',
    items: ['Executive Sales', 'Regional Sales', 'Product Mix', 'Customer Analytics', 'Margin & Pricing', 'Sales Targets', 'Operations SLA', 'Incidents', 'Field Service', 'Network Overview', 'Network Map', 'Executive Weekly'] },
  { id: 'tableau', name: 'Tableau', mono: 'Tb', blurb: 'Sites, projetos, workbooks e campos calculados.', signIn: 'Conectar ao Tableau Server / Cloud', orgLabel: 'Site', org: 'acme-analytics', wsLabel: 'Projeto', workspaces: ['Sales', 'Finance', 'Operations'],
    nouns: { report: 'workbook', reports: 'workbooks', page: 'dashboard', visual: 'worksheet', measure: 'campo calculado', dataset: 'fonte de dados' }, dialect: 'Campos calculados',
    items: ['Sales Overview', 'Pipeline Health', 'Regional Heatmap', 'Rep Performance', 'Forecast vs Actual', 'Discount Analysis', 'Customer Segments', 'Quarterly Review'] },
  { id: 'qlik', name: 'Qlik Sense', mono: 'Qs', blurb: 'Espaços, apps, tabelas associativas e expressões.', signIn: 'Conectar ao Qlik Cloud', orgLabel: 'Tenant', org: 'acme.qlikcloud.com', wsLabel: 'Espaço', workspaces: ['Operations (shared)', 'Legacy Archive', 'Personal'],
    nouns: { report: 'app', reports: 'apps', page: 'sheet', visual: 'objeto', measure: 'expressão', dataset: 'modelo de dados' }, dialect: 'Expressões Qlik',
    items: ['Ops Control Tower', 'Maintenance KPIs', 'Warehouse Flow', 'Supplier Scorecard', 'Plant Efficiency', 'Safety Log', 'Logistics Map', 'Inventory Aging'] },
  { id: 'looker', name: 'Looker', mono: 'Lk', blurb: 'Projetos LookML, explores, dashboards e Looks.', signIn: 'Conectar ao Looker', orgLabel: 'Instância', org: 'acme.looker.com', wsLabel: 'Projeto LookML', workspaces: ['customer_analytics', 'finance_core', 'marketing_mart'],
    nouns: { report: 'dashboard', reports: 'dashboards', page: 'aba', visual: 'tile', measure: 'medida LookML', dataset: 'explore' }, dialect: 'LookML',
    items: ['Customer 360', 'Churn Watch', 'Acquisition Funnel', 'LTV Cohorts', 'Support Load', 'NPS Trend'] },
  { id: 'thoughtspot', name: 'ThoughtSpot', mono: 'Ts', blurb: 'Liveboards, worksheets e fórmulas de busca.', signIn: 'Conectar ao ThoughtSpot', orgLabel: 'Cluster', org: 'acme.thoughtspot.cloud', wsLabel: 'Org', workspaces: ['Retail', 'Supply Chain'],
    nouns: { report: 'liveboard', reports: 'liveboards', page: 'aba', visual: 'visualização', measure: 'fórmula', dataset: 'worksheet' }, dialect: 'Fórmulas ThoughtSpot',
    items: ['Store Performance', 'Basket Analysis', 'Stock Availability', 'Promo Effectiveness'] },
  { id: 'domo', name: 'Domo', mono: 'Dm', blurb: 'Páginas, cards, DataSets e Beast Modes.', signIn: 'Conectar ao Domo', orgLabel: 'Instância', org: 'acme.domo.com', wsLabel: 'Página raiz', workspaces: ['Finance Cockpit', 'Executive Pages'],
    nouns: { report: 'página', reports: 'páginas', page: 'subpágina', visual: 'card', measure: 'Beast Mode', dataset: 'DataSet' }, dialect: 'Beast Modes',
    items: ['Finance Cockpit', 'Cash Flow', 'Budget vs Actual', 'AP Aging', 'Expense Drivers'] },
];
export const platformOf = (id: PlatformId): Platform => PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0]!;

export const STRATEGIES: { id: Strategy; label: string; short: string; desc: string; detail: string }[] = [
  { id: 'fidelity', label: 'Fidelity', short: 'Fidelidade', desc: 'Preservar o máximo possível da experiência original.', detail: 'Mantém layout, ordem das páginas, cores e comportamento. Aceita componentes menos idiomáticos no BIWEB quando é o que reproduz o original.' },
  { id: 'native', label: 'Native', short: 'Nativo', desc: 'Reconstruir com os componentes nativos do BIWEB.', detail: 'Cada elemento vira o componente equivalente do BIWEB, com o tema, os filtros e as interações do produto. O layout é adaptado, a intenção analítica é mantida.' },
  { id: 'modernize', label: 'Modernize', short: 'Modernizar', desc: 'Permitir que BIWEB e IA proponham melhorias.', detail: 'Além de reconstruir, o Copilot propõe consolidar visuais redundantes, trocar mapas por Map Workspace e unificar rotinas em Workflows. Toda proposta passa por revisão.' },
];

export const COMPAT: { id: Compat; label: string; tone: 'success' | 'accent' | 'warning' | 'danger' | 'neutral' }[] = [
  { id: 'native', label: 'Nativo', tone: 'success' },
  { id: 'equivalent', label: 'Equivalente', tone: 'accent' },
  { id: 'redesign', label: 'Redesenhar', tone: 'warning' },
  { id: 'review', label: 'Revisão manual', tone: 'danger' },
  { id: 'unsupported', label: 'Sem suporte', tone: 'neutral' },
];
export const compatLabel = (c: Compat) => COMPAT.find((x) => x.id === c)?.label ?? c;
export const compatTone = (c: Compat) => COMPAT.find((x) => x.id === c)?.tone ?? 'neutral';

export const PHASES: { id: Phase; label: string; sub: string }[] = [
  { id: 'source', label: 'Origem', sub: 'Conectar e descobrir' },
  { id: 'understand', label: 'Entender', sub: 'Inventário e semântica' },
  { id: 'blueprint', label: 'Blueprint', sub: 'Mapa estrutural' },
  { id: 'reconstruct', label: 'Reconstruir', sub: 'Builders do BIWEB' },
  { id: 'validate', label: 'Validar', sub: 'Original × BIWEB' },
  { id: 'publish', label: 'Publicar', sub: 'Release e Bridge' },
];
export const phaseIndex = (p: Phase) => PHASES.findIndex((x) => x.id === p);

export const STATUS_LABEL: Record<ProjectStatus, string> = { analyzing: 'Analisando', review: 'Revisão', reconstructing: 'Reconstruindo', validation: 'Em validação', completed: 'Concluído' };

export interface Project {
  id: string; name: string; platform: PlatformId; workspace: string; status: ProjectStatus; statusNote: string; phase: Phase;
  objects: number; objectsLabel: string; progress: number; owner: string; activity: string; lastAnalyzed: string; strategy: Strategy;
  /** "full" navega por todas as telas; "summary" mostra visão geral, inventário e compatibilidade resumidos. */
  detail: 'full' | 'summary';
  scope: { reports: number; pages: number; visuals: number; measures: number; datasets: number; maps: number; processes: number };
  mix: { native: number; equivalent: number; redesign: number; review: number };
  bridge?: boolean;
}

export interface Item {
  id: string; kind: Kind; name: string; parent?: string; path: string[];
  compat: Compat; target: string; builder?: Builder; targetRef?: string;
  type?: string; reason?: string; confidence?: number;
  meta: Record<string, string | number>;
  expr?: string;
}

export interface TreeEntry { id: string; label: string; kind: Kind; children?: TreeEntry[]; count?: number; compat?: Compat }

export interface Relationship { id: string; from: string; fromCol: string; to: string; toCol: string; card: '1:*' | '*:*' | '1:1'; confidence?: number; evidence?: string[]; state: 'known' | 'proposed'; note?: string }
export interface ModelCol { name: string; type: string; pk?: boolean; fk?: boolean; calc?: boolean; renamed?: string }
export interface ModelTable { id: string; name: string; x: number; y: number; cols: ModelCol[]; note?: string; newName?: string; tag?: 'new' | 'merged' | 'renamed' | 'dropped' }

export interface Translation {
  measureId: string; original: string; concept: string; inputs: string[]; aggregation: string; filters?: string[]; metric: string; status: 'ready' | 'review' | 'redesign'; confidence: number;
  evidence: string[]; notes?: string; biweb: string;
}

export interface Insight { id: string; title: string; count: number; tone: 'warning' | 'danger' | 'accent'; evidence: string[]; affected: { id: string; label: string }[]; action: string; actionLabel: string }

export interface ReviewItem {
  id: string; title: string; kind: 'visual' | 'metric' | 'security' | 'source' | 'relationship' | 'interaction' | 'map' | 'refresh';
  issue: string; evidence: string[]; recommendation: string; confidence: number; itemId?: string;
  blocks: { kind: 'report' | 'map' | 'workflow' | 'model'; id: string }[];
}

export interface Suggestion { id: string; title: string; reason: string; impact: string; preview: 'consolidate' | 'map' | 'workflow' | 'metric'; itemIds: string[]; to: string }

export interface Check { id: string; group: string; label: string; original: string; biweb: string; status: 'match' | 'equivalent' | 'review' | 'failed'; note?: string; itemId?: string }

export interface Mapping { id: string; type: 'Visual' | 'Métrica' | 'Tabela' | 'Campo' | 'Mapa' | 'Refresh' | 'Filtro' | 'Interação'; group: 'data' | 'metrics' | 'visuals' | 'maps' | 'interactions' | 'automation'; from: string; to: string; target: string; state: 'auto' | 'confirmed' | 'pending'; confidence: number; itemId?: string }

export interface BpNode { id: string; layer: number; label: string; sub?: string; col: number; ref?: string }
export const BP_LAYERS = ['Fontes de dados', 'Modelo de dados', 'Modelo semântico', 'Métricas', 'Páginas', 'Visualizações', 'Interações', 'Operações'] as const;

export interface BridgeChange { id: string; sign: '+' | '~' | '−'; title: string; detail: string; affected: string[]; when: string }
export interface HistoryEntry { id: string; v: string; title: string; detail: string; when: string; kind: 'analysis' | 'mapping' | 'reconstruction' | 'validation' | 'publish' | 'source' }

export const KIND_LABEL: Record<Kind, string> = {
  workspace: 'Workspace', folder: 'Pasta', report: 'Relatório', page: 'Página', visual: 'Visual', dataset: 'Modelo semântico', table: 'Tabela', column: 'Coluna', measure: 'Medida', calc: 'Campo calculado', filter: 'Filtro', parameter: 'Parâmetro',
  bookmark: 'Bookmark', navigation: 'Navegação', theme: 'Tema', map: 'Mapa', action: 'Ação', security: 'Segurança', refresh: 'Refresh', process: 'Processo',
};
export const TARGET_BUILDER: Record<Builder, { label: string; open: string }> = {
  report: { label: 'Report Builder', open: 'Abrir no Report Builder' }, map: { label: 'Map Builder', open: 'Abrir no Map Builder' },
  workflow: { label: 'Workflow Builder', open: 'Abrir no Workflow Builder' }, data: { label: 'Data Workspace · LDE', open: 'Abrir no Data Workspace' },
};

/* Estado do projeto (usado pela store, pelo Copilot e pelas telas). */
export type TabId = 'overview' | 'inventory' | 'blueprint' | 'data' | 'semantics' | 'compat' | 'mappings' | 'reconstruct' | 'validation' | 'publish' | 'bridge';
export type Op =
  | { t: 'strategy'; id: string; value: Strategy } | { t: 'recon'; id: string } | { t: 'review'; id: string; value: 'accepted' | 'rejected' }
  | { t: 'suggestion'; id: string } | { t: 'mapping'; id: string } | { t: 'tab'; tab: TabId; select?: string } | { t: 'insight'; id: string };
export interface Proposal { title: string; summary: string; changes: string[]; ops: Op[]; status: 'pending' | 'applied' | 'discarded' }
export interface Msg { id: string; role: 'user' | 'ai'; text: string; kicker?: string; list?: string[]; focus?: string[]; proposal?: Proposal; ctx?: string }
export interface ProjState {
  strategies: Record<string, Strategy>;
  review: Record<string, 'accepted' | 'rejected'>;
  insights: Record<string, 'applied' | 'ignored'>;
  mappings: Record<string, 'confirmed' | 'rejected'>;
  proposals: Record<string, 'accepted' | 'rejected' | 'review'>;
  suggestions: Record<string, 'accepted' | 'ignored'>;
  recon: Record<string, number>;
  excluded: string[];
  bridge: Record<string, 'reviewed' | 'applied'>;
  /** Quantas verificações já "entraram" na tela; igual ao total quando a validação terminou. */
  checks: number;
  checksResolved: Record<string, 'accepted'>;
  published: boolean; version: number;
  analysisV: number; analyzed: string;
  history: HistoryEntry[];
  chat: Msg[];
}
