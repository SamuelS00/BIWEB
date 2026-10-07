import type { BelExpression, Id, SemanticRef } from "./common";
import type { FilterExpression } from "./filter";

/**
 * QueryDefinition (QDL) — contrato Frontend ↔ Query API.
 * Semântico, declarativo, sem SQL. O backend resolve, aplica políticas, planeja e compila.
 */
export interface QueryRequest {
  /** Versão do contrato QDL. */
  qdl: 1;
  model: Id<"sem">;
  /** Snapshot do modelo (hash da revisão publicada) — garante reprodutibilidade e chave de cache. */
  modelRevision?: Id<"rev">;
  dimensions: QueryDimension[];
  metrics: QueryMetric[];
  filters?: FilterExpression;
  /** Filtros aplicados após agregação (HAVING). */
  metricFilters?: FilterExpression;
  parameters?: Record<Id<"prm">, unknown>;
  order?: Array<{ ref: string; direction: "asc" | "desc"; nulls?: "first" | "last" }>;
  limit?: number;
  offset?: number;
  totals?: Array<"grand" | "subtotals">;
  pivot?: { rows: string[]; columns: string[]; maxColumns: number };
  /** Cálculos ad hoc do widget — BEL tipado, validado contra o modelo. */
  calculations?: Array<{ alias: string; expression: BelExpression }>;
  options?: QueryOptions;
  /** Contexto para observabilidade, auditoria e priorização — nunca para autorização. */
  context: {
    dashboardId?: Id<"dsh">;
    widgetId?: Id<"wdg">;
    loadId?: string;
    purpose: "interactive" | "export" | "alert" | "warmup" | "api" | "assistant" | "insight";
    /** Presentes quando purpose = "assistant"/"insight" (auditoria e metering). */
    conversationId?: Id<"cnv">;
    toolCallId?: string;
  };
}

export interface QueryDimension {
  alias?: string;
  ref: SemanticRef;
  timeGrain?: "second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";
  /** Para mapas: binning espacial no servidor. */
  spatialBin?: { kind: "h3"; resolution: number } | { kind: "geohash"; precision: number };
  /** Completar séries temporais com zeros/nulos. */
  densify?: boolean;
}

export interface QueryMetric {
  alias?: string;
  ref: SemanticRef;
  /** Modificadores de time intelligence aplicados à metric. */
  modifier?: { kind: "ytd" | "qtd" | "mtd" } | { kind: "period-over-period"; offset: string; mode: "value" | "delta" | "percent" } | { kind: "running-total" } | { kind: "percent-of-total"; over?: string[] };
}

export interface QueryOptions {
  /** Cache: "default" respeita TTL/versão; "refresh" força execução (com permissão). */
  cache?: "default" | "refresh" | "only-if-cached";
  timeoutMs?: number;
  maxRows?: number; // limite duro; resposta indica truncamento
  format?: "arrow" | "json";
  /** Permite servir de pre-aggregation com frescor inferior (lambda off). */
  allowStale?: boolean;
  priority?: "high" | "normal" | "low";
  /**
   * Limite de dados que podem voltar a um consumidor de IA (aplicado pelo Query Service
   * conforme AIPolicy; o resultado completo ainda pode ser renderizado ao usuário).
   */
  egress?: { maxRows: number; maxColumns: number; maskClassifications: string[] };
}

/** Metadados retornados junto ao payload Arrow (header JSON ou schema metadata do Arrow). */
export interface QueryResponseMeta {
  queryId: string;
  traceId: string;
  fields: Array<{ alias: string; ref?: SemanticRef; role: "dimension" | "metric" | "calculation"; type: string; format?: unknown; label: string }>;
  rowCount: number;
  truncated: boolean;
  cache: { status: "hit" | "miss" | "stale" | "bypass"; layer?: "L2" | "L3" | "preagg" };
  servedBy: { engine: string; preAggregationId?: Id<"pag"> };
  /** Watermark de frescor dos dados — exibido na UI. */
  dataAsOf?: string;
  timings: { planMs: number; queueMs: number; executeMs: number; serializeMs: number };
  warnings?: string[];
}
