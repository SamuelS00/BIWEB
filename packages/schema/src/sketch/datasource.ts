import type { Id, SemVer, TenantId } from "./common";

/**
 * ConnectorDefinition — descreve um TIPO de conector (ex.: "postgres", "salesforce").
 * Publicado por manifest de plugin (first-party ou terceiro).
 */
export interface ConnectorDefinition {
  id: string; // "core.postgres", "acme.erp"
  version: SemVer;
  displayName: string;
  /** Como o conector é executado. */
  runtime:
    | { kind: "in-process-rust" } // first-party (drivers nativos/ADBC)
    | { kind: "jdbc-bridge"; driverClass: string } // cauda longa via Flight SQL bridge
    | { kind: "container"; image: string; digest: string } // terceiros, Connector Protocol (gRPC + Arrow)
    | { kind: "declarative-http"; specRef: string } // YAML low-code para REST APIs
    | { kind: "wasm-component"; module: string; digest: string };
  /** JSON Schema da configuração de conexão (campos marcados `x-secret: true` vão para o cofre). */
  configSchema: object;
  auth: Array<"password" | "key-pair" | "oauth2" | "iam-role" | "service-account" | "token" | "none">;
  capabilities: ConnectorCapabilities;
}

export interface ConnectorCapabilities {
  /** Suporta consulta sob demanda (Live/Direct Query). */
  liveQuery: boolean;
  /** Dialeto SQL para pushdown, se aplicável. */
  sqlDialect?: "postgres" | "mysql" | "tsql" | "oracle" | "clickhouse" | "snowflake" | "bigquery" | "databricks" | "duckdb" | "trino";
  pushdown?: { filter: boolean; projection: boolean; aggregate: boolean; join: boolean; limit: boolean; window: boolean };
  /** Suporta extração para Import. */
  extract: boolean;
  incremental?: Array<"cursor" | "cdc" | "append-only" | "snapshot-diff">;
  streaming?: boolean;
  schemaDiscovery: "full" | "sampled" | "declared";
  /** Limites que o runtime deve respeitar (throttling/retries ficam no host, não no conector). */
  rateLimits?: { requestsPerSecond?: number; concurrentRequests?: number; dailyQuota?: number };
  pagination?: "cursor" | "offset" | "page" | "link-header" | "none";
}

/**
 * DataSourceDefinition — uma CONEXÃO configurada por um tenant.
 * Credenciais nunca aparecem aqui: apenas a referência ao segredo (envelope encryption, DEK por tenant).
 */
export interface DataSourceDefinition {
  id: Id<"dsr">;
  tenantId: TenantId;
  connector: { id: string; version: SemVer };
  name: string;
  config: Record<string, unknown>; // validado contra ConnectorDefinition.configSchema (sem segredos)
  secretRef: Id<"sec">;
  /** Modo default; cada dataset pode sobrescrever. */
  defaultAccessMode: "live" | "import" | "hybrid";
  network?: { kind: "public" } | { kind: "ssh-tunnel"; host: string } | { kind: "private-link"; endpointId: string };
  limits?: { maxConcurrentQueries: number; queryTimeoutMs: number };
  health?: { status: "healthy" | "degraded" | "failing" | "unknown"; checkedAt: string; message?: string };
}
