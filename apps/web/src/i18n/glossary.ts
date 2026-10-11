import type { Locale } from './locales';

/**
 * Glossário central de termos do produto. Uma tradução por termo, usada em todas as telas.
 * `approved`: decisão já aplicada na interface. `needs-review`: proposta que precisa de aval de produto.
 * `decision`: `keep` mantém o original nos três idiomas; `translate` traduz.
 * Mudou um termo? Atualize aqui e revise as mensagens que o usam (`grep` pelo termo em `messages/`).
 */
export type GlossaryStatus = 'approved' | 'needs-review';
export type GlossaryDecision = 'keep' | 'translate';
export interface GlossaryTerm {
  id: string;
  status: GlossaryStatus;
  decision: GlossaryDecision;
  /** Por que a decisão existe ou o que falta decidir. */
  note: string;
  translations: Record<Locale, string>;
}

export const GLOSSARY: GlossaryTerm[] = [
  { id: 'biweb', status: 'approved', decision: 'keep', note: 'Nome de produto.', translations: { 'pt-BR': 'BIWEB Studio', en: 'BIWEB Studio', es: 'BIWEB Studio' } },
  { id: 'livingDataEngine', status: 'approved', decision: 'keep', note: 'Nome de produto (LDE). Não vira "Motor de Dados Vivos".', translations: { 'pt-BR': 'Living Data Engine', en: 'Living Data Engine', es: 'Living Data Engine' } },
  { id: 'compositionEngine', status: 'approved', decision: 'keep', note: 'Nome de produto.', translations: { 'pt-BR': 'Composition Engine', en: 'Composition Engine', es: 'Composition Engine' } },
  { id: 'migrationStudio', status: 'approved', decision: 'keep', note: 'Nome de produto. A área na navegação diz só "Migração"/"Migration"/"Migración".', translations: { 'pt-BR': 'Migration Studio', en: 'Migration Studio', es: 'Migration Studio' } },
  { id: 'analyticsMigrationEngine', status: 'approved', decision: 'keep', note: 'Nome de produto.', translations: { 'pt-BR': 'Analytics Migration Engine', en: 'Analytics Migration Engine', es: 'Analytics Migration Engine' } },
  { id: 'copilot', status: 'approved', decision: 'keep', note: 'Nome de produto.', translations: { 'pt-BR': 'Copilot', en: 'Copilot', es: 'Copilot' } },
  { id: 'workspacePulse', status: 'approved', decision: 'keep', note: 'Nome de produto.', translations: { 'pt-BR': 'Workspace Pulse', en: 'Workspace Pulse', es: 'Workspace Pulse' } },
  { id: 'workspace', status: 'approved', decision: 'keep', note: 'Termo de produto e de mercado; a interface já mantém "Workspace" nos três idiomas.', translations: { 'pt-BR': 'Workspace', en: 'Workspace', es: 'Workspace' } },
  { id: 'dataset', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Dataset', en: 'Dataset', es: 'Dataset' } },
  { id: 'dataSource', status: 'approved', decision: 'translate', note: 'Já usado em Pulse e Navegação.', translations: { 'pt-BR': 'Fonte de dados', en: 'Data source', es: 'Fuente de datos' } },
  { id: 'source', status: 'approved', decision: 'translate', note: 'Forma curta de "fonte de dados".', translations: { 'pt-BR': 'Fonte', en: 'Source', es: 'Fuente' } },
  { id: 'connector', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Connector', en: 'Connector', es: 'Connector' } },
  { id: 'report', status: 'approved', decision: 'translate', note: 'A navegação já usa "Relatórios". Em es, "Informe" segue o vocabulário de Power BI; "Reporte" é a alternativa regional.', translations: { 'pt-BR': 'Relatório', en: 'Report', es: 'Informe' } },
  { id: 'dashboard', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Dashboard', en: 'Dashboard', es: 'Dashboard' } },
  { id: 'map', status: 'approved', decision: 'translate', note: 'Área de mapas.', translations: { 'pt-BR': 'Mapa', en: 'Map', es: 'Mapa' } },
  { id: 'workflow', status: 'approved', decision: 'translate', note: 'A navegação já usa "Fluxos". Pendente de aval: manter "Workflow" em pt-BR/es (ex.: "Executar workflow").', translations: { 'pt-BR': 'Fluxo', en: 'Workflow', es: 'Flujo' } },
  { id: 'model', status: 'approved', decision: 'translate', note: 'Modelo semântico.', translations: { 'pt-BR': 'Modelo', en: 'Model', es: 'Modelo' } },
  { id: 'semanticModel', status: 'approved', decision: 'translate', note: 'Nome completo de "Modelo".', translations: { 'pt-BR': 'Modelo semântico', en: 'Semantic model', es: 'Modelo semántico' } },
  { id: 'field', status: 'approved', decision: 'translate', note: 'Coluna ou campo de um modelo.', translations: { 'pt-BR': 'Campo', en: 'Field', es: 'Campo' } },
  { id: 'metric', status: 'approved', decision: 'translate', note: 'Medida de negócio.', translations: { 'pt-BR': 'Métrica', en: 'Metric', es: 'Métrica' } },
  { id: 'dimension', status: 'approved', decision: 'translate', note: 'Eixo de análise.', translations: { 'pt-BR': 'Dimensão', en: 'Dimension', es: 'Dimensión' } },
  { id: 'filter', status: 'approved', decision: 'translate', note: 'Filtro de relatório.', translations: { 'pt-BR': 'Filtro', en: 'Filter', es: 'Filtro' } },
  { id: 'relationship', status: 'approved', decision: 'translate', note: 'Ligação entre tabelas do modelo.', translations: { 'pt-BR': 'Relacionamento', en: 'Relationship', es: 'Relación' } },
  { id: 'mapping', status: 'approved', decision: 'translate', note: 'Usado no Data Workspace e no Migration Studio.', translations: { 'pt-BR': 'Mapeamento', en: 'Mapping', es: 'Mapeo' } },
  { id: 'lineage', status: 'approved', decision: 'translate', note: 'Rótulo curto de seção. Em texto de ajuda, usar "linhagem de dados" / "linaje de datos".', translations: { 'pt-BR': 'Linhagem', en: 'Lineage', es: 'Linaje' } },
  { id: 'quality', status: 'approved', decision: 'translate', note: 'Qualidade dos dados.', translations: { 'pt-BR': 'Qualidade', en: 'Quality', es: 'Calidad' } },
  { id: 'enrichment', status: 'approved', decision: 'translate', note: 'Enriquecimento de dados.', translations: { 'pt-BR': 'Enriquecimento', en: 'Enrichment', es: 'Enriquecimiento' } },
  { id: 'changeset', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'ChangeSet', en: 'ChangeSet', es: 'ChangeSet' } },
  { id: 'run', status: 'approved', decision: 'translate', note: 'Execução de um workflow ou pipeline.', translations: { 'pt-BR': 'Execução', en: 'Run', es: 'Ejecución' } },
  { id: 'asset', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Asset', en: 'Asset', es: 'Asset' } },
  { id: 'schema', status: 'approved', decision: 'keep', note: 'Termo técnico mantido em todos os idiomas.', translations: { 'pt-BR': 'Schema', en: 'Schema', es: 'Schema' } },
  { id: 'drillDown', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Drill-down', en: 'Drill-down', es: 'Drill-down' } },
  { id: 'drillThrough', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Drill-through', en: 'Drill-through', es: 'Drill-through' } },
  { id: 'tooltip', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Tooltip', en: 'Tooltip', es: 'Tooltip' } },
  { id: 'fieldWell', status: 'approved', decision: 'keep', note: 'Original mantido nos três idiomas (decisão de produto).', translations: { 'pt-BR': 'Field well', en: 'Field well', es: 'Field well' } },
  { id: 'realtime', status: 'approved', decision: 'translate', note: 'Atualização contínua, sem recarregar.', translations: { 'pt-BR': 'Tempo real', en: 'Realtime', es: 'Tiempo real' } },
  { id: 'live', status: 'approved', decision: 'translate', note: 'Selo de dados em tempo real.', translations: { 'pt-BR': 'Ao vivo', en: 'Live', es: 'En vivo' } },
  { id: 'stale', status: 'approved', decision: 'translate', note: 'Dado desatualizado.', translations: { 'pt-BR': 'Desatualizado', en: 'Stale', es: 'Desactualizado' } },
  { id: 'fresh', status: 'approved', decision: 'translate', note: 'Dado atualizado.', translations: { 'pt-BR': 'Atualizado', en: 'Fresh', es: 'Actualizado' } },
  { id: 'draft', status: 'approved', decision: 'translate', note: 'Estado de rascunho.', translations: { 'pt-BR': 'Rascunho', en: 'Draft', es: 'Borrador' } },
  { id: 'published', status: 'approved', decision: 'translate', note: 'Estado publicado.', translations: { 'pt-BR': 'Publicado', en: 'Published', es: 'Publicado' } },
  { id: 'webhook', status: 'approved', decision: 'keep', note: 'Termo técnico mantido em todos os idiomas.', translations: { 'pt-BR': 'Webhook', en: 'Webhook', es: 'Webhook' } },
  { id: 'endpoint', status: 'approved', decision: 'keep', note: 'Termo técnico mantido em todos os idiomas.', translations: { 'pt-BR': 'Endpoint', en: 'Endpoint', es: 'Endpoint' } },
  { id: 'raw', status: 'approved', decision: 'keep', note: 'Zona do pipeline. Identificador técnico: não traduzir.', translations: { 'pt-BR': 'RAW', en: 'RAW', es: 'RAW' } },
  { id: 'staging', status: 'approved', decision: 'keep', note: 'Zona do pipeline. Identificador técnico: não traduzir.', translations: { 'pt-BR': 'STAGING', en: 'STAGING', es: 'STAGING' } },
  { id: 'curated', status: 'approved', decision: 'keep', note: 'Zona do pipeline. Identificador técnico: não traduzir.', translations: { 'pt-BR': 'CURATED', en: 'CURATED', es: 'CURATED' } },
  { id: 'serving', status: 'approved', decision: 'keep', note: 'Zona do pipeline. Identificador técnico: não traduzir.', translations: { 'pt-BR': 'SERVING', en: 'SERVING', es: 'SERVING' } },
];

/** Traduz um termo do glossário pelo id. Ids desconhecidos voltam o próprio id, nunca um texto vazio. */
export function glossaryTerm(id: string, locale: Locale): string {
  return GLOSSARY.find((t) => t.id === id)?.translations[locale] ?? id;
}
