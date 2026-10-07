import type { ChangeOrigin, Id, SemVer, TenantId, UserId } from "./common";
import type { QueryRequest } from "./query";

/**
 * Contratos da IA nativa (copiloto). Ver docs/architecture/31-ai-assistant.md.
 * A IA não possui contratos de dados próprios: ela consome os contratos existentes
 * (QDL, documento de dashboard, ops, semantic model, op catalog de transformações).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. UI Context Snapshot — cliente → orquestrador (DICA, nunca autoridade)
// ─────────────────────────────────────────────────────────────────────────────
export interface UIContextSnapshot {
  route: string; // ex.: "/d/dsh_x/edit"
  surface: "panel" | "inline" | "command-palette" | "bel-editor" | "dag-editor" | "model-editor" | "empty-state" | "embed";
  focus?: {
    object: { kind: "dashboard" | "semantic-model" | "dataset" | "pipeline" | "data-source"; id: Id };
    /** Revisão publicada vista OU versão do draft (após flush do autosave). */
    revisionId?: Id<"rev">;
    draftVersion?: number;
    pageId?: Id<"pag">;
    breakpoint?: string;
  };
  selection?: Array<
    | { kind: "widget"; id: Id<"wdg"> }
    | { kind: "node"; id: Id<"nod"> }
    | { kind: "field"; model: Id<"sem">; field: string }
    | { kind: "data-point"; widgetId: Id<"wdg">; tuple: Record<string, unknown> }
    | { kind: "pipeline-step"; pipelineId: Id<"ppl">; nodeId: string }
    | { kind: "dataset"; id: Id<"dts"> }
  >;
  runtimeState?: {
    filters: Record<string, unknown>; // valores ativos por FilterDefinition.id
    parameters: Record<string, unknown>;
    crossFilters?: unknown[];
    drillPath?: unknown[];
  };
  /** Itens de contexto que o usuário removeu explicitamente (chips). */
  excluded?: string[];
  locale: string;
  timezone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Turnos e streaming (HTTP POST → SSE)
// ─────────────────────────────────────────────────────────────────────────────
export interface AssistantTurnRequest {
  conversationId?: Id<"cnv">; // ausente = nova conversa
  message: string;
  context: UIContextSnapshot;
  /** Preferência do usuário para propostas de baixo risco no draft pessoal. */
  autoApplyLowRisk?: boolean;
}

export type AssistantStreamEvent =
  | { type: "turn.started"; turnId: Id<"trn">; conversationId: Id<"cnv"> }
  | { type: "context.resolved"; chips: ContextChip[] } // o que a IA está considerando
  | { type: "text.delta"; text: string }
  | { type: "tool.started"; toolCallId: string; tool: string; summary: string }
  | { type: "tool.completed"; toolCallId: string; summary: string; evidence?: Evidence }
  | { type: "proposal"; changeSet: ChangeSet }
  | { type: "clarification"; question: string; options?: string[] }
  | { type: "citation"; evidence: Evidence }
  | { type: "policy.notice"; message: string } // ex.: "valores ocultos pela política metadata-only"
  | { type: "error"; code: string; message: string; retryable: boolean }
  | { type: "turn.completed"; usage: AssistantUsage };

export interface ContextChip {
  key: string;
  label: string; // "Dashboard: Vendas", "Selecionado: Receita por país", "Filtro: últimos 12 meses"
  kind: "object" | "selection" | "filter" | "model" | "instruction";
}

/** Evidência verificável que sustenta uma afirmação. */
export interface Evidence {
  kind: "query" | "insight" | "metadata" | "lineage";
  queryId?: string;
  qdl?: QueryRequest; // permite "ver consulta" / "abrir como widget"
  insightId?: string;
  objectRef?: { kind: string; id: Id };
  values?: Record<string, unknown>; // valores citados (omitidos em metadata-only)
}

export interface AssistantUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  model: string;
  provider: string;
  estimatedCost: number; // moeda de referência interna
  queriesExecuted: number;
  bytesScanned: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ChangeSet — proposta de mudança usando as OPS do próprio Dashboard Engine
// ─────────────────────────────────────────────────────────────────────────────
export interface ChangeSet {
  id: Id<"chs">;
  target: { kind: "dashboard" | "semantic-model" | "pipeline"; id: Id; isNew?: boolean };
  /** Base sobre a qual as ops foram calculadas — usada para detectar estado obsoleto e rebase. */
  base: { revisionId?: Id<"rev">; draftVersion?: number; touchedEntities: string[] };
  items: ChangeItem[];
  risk: "low" | "medium" | "high"; // remoções/objetos governados ⇒ medium/high; nunca autoaplicado se ≠ low
  validation: { ok: boolean; errors: Array<{ itemId: string; message: string }> };
  /** Para objetos governados: impacto calculado via lineage. */
  impact?: { affectedObjects: Array<{ kind: string; id: Id; name: string }> };
  origin: ChangeOrigin; // kind: "assistant"
  expiresAt: string;
}

export interface ChangeItem {
  id: string;
  title: string; // "Trocar visualização para barras horizontais"
  rationale?: string;
  /** Ops no formato do DocumentStore (mesmo formato usado por comandos/undo/autosave). */
  ops: DocumentOp[];
  destructive: boolean;
}

/** Operação atômica do documento (definição canônica em packages/schema). */
export type DocumentOp =
  | { op: "set"; path: string[]; value: unknown; prev?: unknown }
  | { op: "delete"; path: string[]; prev: unknown };

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tool Registry — ferramentas encapsulam APIs existentes
// ─────────────────────────────────────────────────────────────────────────────
export interface ToolDefinition {
  name: string; // "run_query", "propose_dashboard_changes"
  version: SemVer;
  description: string; // texto para o modelo — revisado como código
  inputSchema: object; // JSON Schema
  outputSchema: object;
  sideEffect: "read" | "propose"; // "execute" não existe para a IA (ver ADR-0035)
  /** Ação Cedar exigida, avaliada com principal delegado (via: assistant). */
  requiredAction: string;
  /** Classe de dados que a saída pode conter — usada pelo egress guard. */
  outputDataClass: DataClass;
  costClass: "free" | "metadata" | "query" | "insight";
  requiresEntitlement?: string; // "ai.analysis"
  wraps: string; // capacidade existente encapsulada, ex.: "QueryService.Run"
  source: "core" | { plugin: string; version: SemVer };
}

export type DataClass = "metadata" | "document" | "aggregate-result" | "row-level" | "pii" | "secret";

// ─────────────────────────────────────────────────────────────────────────────
// 5. Política de IA (tenant → workspace, o mais restritivo prevalece)
// ─────────────────────────────────────────────────────────────────────────────
export interface AIPolicy {
  scope: { tenantId: TenantId; workspaceId?: Id<"wsp"> };
  enabled: boolean;
  dataAccess: "metadata-only" | "aggregates" | "row-level"; // padrão SaaS: "aggregates"
  limits: { maxRowsToModel: number; maxColumnsToModel: number; minGroupSize?: number };
  maskClassifications: Array<"pii" | "sensitive" | "restricted">;
  providers: {
    allow: string[]; // ids de provedor/modelo permitidos
    regions?: string[]; // residência
    byoEndpoint?: { adapter: string; endpoint: string; secretRef: Id<"sec"> };
  };
  retention: { mode: "persistent"; days: number } | { mode: "ephemeral" }; // padrão SaaS: persistent, 30 dias
  /**
   * "metadata": nunca registra conteúdo de prompts/respostas; apenas telemetria amostrada
   *             (modelo, tokens, latência, ferramentas, classes de dados enviadas). PADRÃO.
   * "sampled-content" / "full-content": opt-in explícito do tenant, cifrado, com a retenção da política.
   */
  promptLogging: "metadata" | "sampled-content" | "full-content";
  features: { create: boolean; edit: boolean; analyze: boolean; model: boolean; transform: boolean };
  roles?: { allow?: string[]; deny?: string[] };
  customInstructions?: string; // instruções do tenant/workspace (glossário, tom, regras)
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Model Gateway — interface interna (independente de provedor)
// ─────────────────────────────────────────────────────────────────────────────
export interface ModelRequest {
  task: "fast" | "standard" | "deep"; // roteado por configuração para modelo/versão fixada
  messages: Array<{ role: "system" | "user" | "assistant" | "tool"; parts: LabeledPart[] }>;
  tools?: Array<Pick<ToolDefinition, "name" | "description" | "inputSchema">>;
  responseSchema?: object; // structured output
  budget: { maxOutputTokens: number; timeoutMs: number };
  attribution: { tenantId: TenantId; userId: UserId; conversationId: Id<"cnv">; feature: string };
}

/** Todo fragmento enviado ao modelo é rotulado — base do egress guard. */
export interface LabeledPart {
  text: string;
  dataClass: DataClass;
  trusted: boolean; // false para conteúdo de usuários/dados (títulos, descrições, valores)
  cacheable?: boolean; // parte do prefixo estável (instruções, ferramentas, metadados por revisão)
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Insights Engine (data plane) — determinístico, também usado sem IA
// ─────────────────────────────────────────────────────────────────────────────
export type InsightRequest =
  | { kind: "compare-periods"; base: QueryRequest; offset: string }
  | { kind: "explain-change"; base: QueryRequest; from: string; to: string; candidateDimensions?: string[]; maxDepth?: number }
  | { kind: "anomalies"; base: QueryRequest; sensitivity?: "low" | "medium" | "high" }
  | { kind: "outliers"; base: QueryRequest; method?: "iqr" | "mad" };

export interface InsightResult {
  insightId: string;
  kind: InsightRequest["kind"];
  method: string; // descrição do método aplicado
  findings: Array<{ title: string; contribution?: number; delta?: number; members?: Record<string, unknown>; confidence: "low" | "medium" | "high" }>;
  evidence: Evidence[]; // queries executadas
  limitations: string[]; // "histórico de apenas 3 meses", "dimensão X com alta cardinalidade ignorada"
  budgetUsed: { queries: number; bytesScanned: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Persistência de conversa (resumo)
// ─────────────────────────────────────────────────────────────────────────────
export interface Conversation {
  id: Id<"cnv">;
  tenantId: TenantId;
  workspaceId: Id<"wsp">;
  ownerId: UserId;
  anchor?: { kind: string; id: Id };
  title?: string;
  createdAt: string;
  expiresAt?: string; // retenção
}
