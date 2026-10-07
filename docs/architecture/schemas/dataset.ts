import type { BelExpression, Id, ScalarType, TenantId } from "./common";

/**
 * DatasetDefinition — uma tabela lógica disponível para modelagem semântica.
 * Pode ser física (tabela na fonte), virtual (SQL/DAG sobre a fonte) ou gerenciada (importada).
 */
export interface DatasetDefinition {
  id: Id<"dts">;
  tenantId: TenantId;
  name: string;
  source:
    | { kind: "table"; dataSourceId: Id<"dsr">; namespace: string[]; table: string }
    | { kind: "sql"; dataSourceId: Id<"dsr">; sql: string } // SQL autorizado de modelador; nunca do viewer
    | { kind: "pipeline"; pipelineId: Id<"ppl"> } // saída de um DAG de transformação
    | { kind: "upload"; uploadId: Id<"upl"> };
  access: DatasetAccess;
  schema: DatasetField[];
  /** Versão de dados atual (snapshot publicado) — participa da chave de cache. */
  dataVersion?: string;
  freshness?: { refreshKey?: string; maxStalenessSeconds?: number };
}

export type DatasetAccess =
  | { mode: "live" } // query vai à fonte
  | { mode: "import"; storage: ManagedStorage; schedule?: string; incremental?: IncrementalPolicy }
  | {
      mode: "hybrid"; // histórico importado + janela recente live
      storage: ManagedStorage;
      liveWindow: { timeField: string; duration: string }; // ex.: "P2D"
    }
  | { mode: "streaming"; topic: string; retention: string; storage: ManagedStorage };

export interface ManagedStorage {
  /** Fonte da verdade: snapshots Parquet no object storage (manifesto no Postgres). */
  lake: { format: "parquet"; partitionBy?: string[]; snapshotId?: string };
  /** Engine de serving. */
  serving: { engine: "clickhouse"; table: string; orderBy: string[]; ttl?: string } | { engine: "duckdb-tier" };
}

export interface IncrementalPolicy {
  strategy: "cursor" | "cdc" | "append-only";
  cursorField?: string;
  primaryKey?: string[];
  dedupe?: "latest-by-cursor" | "none";
  lookback?: string; // reprocessar janela para dados atrasados
}

export interface DatasetField {
  name: string; // nome físico
  type: ScalarType | "array" | "struct" | "geometry";
  nullable: boolean;
  /** Campo calculado no nível de linha (BEL), materializado ou virtual. */
  expression?: BelExpression;
  semanticType?: "id" | "email" | "country" | "city" | "lat" | "lon" | "h3" | "currency-code" | "url";
  pii?: boolean;
  /** Classificação (governança + CLS + egress guard da IA). Capturada desde a Fase 1. */
  classification?: import("./common").DataClassification;
  description?: string;
  deprecated?: { since: string; replacement?: string };
}
