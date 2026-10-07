/**
 * Tipos comuns a todos os documentos da plataforma.
 *
 * Sketch arquitetural: a fonte canônica final será TypeBox → JSON Schema 2020-12
 * (pacote `packages/schema`). Estes tipos documentam forma e relacionamentos.
 */

/** ULID com prefixo de tipo, ex.: "dsh_01J9Z...", "wdg_01J9Z...". Estável por toda a vida da entidade. */
export type Id<P extends string = string> = `${P}_${string}`;

export type TenantId = Id<"tnt">;
export type WorkspaceId = Id<"wsp">;
export type UserId = Id<"usr">;

/** Chave de ordenação por fractional indexing (ex.: "a0", "a0V", "a1"). Nunca usar índice de array como identidade. */
export type OrderKey = string;

/** SemVer "MAJOR.MINOR.PATCH". */
export type SemVer = `${number}.${number}.${number}`;

/** Expressão BEL (BI Expression Language), compilada pelo semantic compiler (Rust, também em WASM). */
export type BelExpression = string;

/** Referência a objeto semântico SEMPRE por ID estável — nunca por nome de coluna física ou SQL. */
export interface SemanticRef {
  model: Id<"sem">;
  /** ID de dimension, measure ou metric. */
  field: Id<"dim"> | Id<"msr"> | Id<"met">;
}

/** Envelope de todo documento versionável (dashboard, semantic model, dataset, theme, template). */
export interface DocumentEnvelope<K extends string, B> {
  kind: K;
  /** Versão do schema do envelope; migrations vN→vN+1 executadas no servidor. */
  schemaVersion: number;
  id: Id;
  tenantId: TenantId;
  meta: DocumentMeta;
  body: B;
  /**
   * Extensões namespaced ("vendor.feature") preservadas integralmente por migrations
   * e pelo editor, mesmo quando a plataforma não as entende.
   */
  extensions?: Record<string, unknown>;
}

export interface DocumentMeta {
  name: string;
  description?: string;
  tags?: string[];
  ownerId: UserId;
  folderId?: Id<"fld">;
  createdAt: string; // ISO-8601
  updatedAt: string;
  /** Revisão de onde este conteúdo veio (content-addressed). */
  revisionId?: Id<"rev">;
  certification?: "none" | "certified" | "deprecated";
  locale?: string;
  /** Origem da última mudança (auditoria; IA marcada explicitamente). */
  lastChangeOrigin?: ChangeOrigin;
}

/**
 * Origem de uma transação de ops / revisão / evento de auditoria.
 * Fundação para a IA (ADR-0035), mas útil sem ela (templates, importação, API, automação).
 */
export type ChangeOrigin =
  | { kind: "user"; userId: UserId }
  | { kind: "assistant"; userId: UserId; conversationId: Id<"cnv">; proposalId: Id<"chs">; model: string }
  | { kind: "template"; userId: UserId; templateId: Id<"tpl"> }
  | { kind: "import"; userId: UserId; source: string }
  | { kind: "api"; principalId: string }
  | { kind: "system"; reason: string }; // migrations, manutenção

/** Classificação de dados de um campo — usada por governança, CLS e pelo egress guard da IA. */
export type DataClassification = "public" | "internal" | "confidential" | "restricted" | "pii" | "sensitive";

/** Valor tipado usado por parâmetros, filtros e variáveis. */
export type ScalarType = "string" | "number" | "integer" | "boolean" | "date" | "datetime" | "geo";
export type Scalar = string | number | boolean | null;

/** Formatação semântica (herdada do modelo semântico; widget pode sobrescrever). */
export interface FormatSpec {
  kind: "number" | "currency" | "percent" | "date" | "duration" | "custom";
  pattern?: string; // ex.: "#,##0.00" ou ICU skeleton
  currency?: string; // ISO-4217 ou referência a dimensão de moeda
  unit?: string;
  decimals?: number;
  compact?: boolean;
}
