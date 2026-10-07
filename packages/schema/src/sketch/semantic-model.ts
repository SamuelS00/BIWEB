import type { BelExpression, DocumentEnvelope, FormatSpec, Id } from "./common";

/**
 * SemanticModel — fonte única de regras de negócio. Dashboards NUNCA definem lógica de negócio
 * fora daqui (exceto cálculos ad hoc locais do widget, que também são BEL tipado).
 */
export type SemanticModel = DocumentEnvelope<"semantic-model", SemanticModelBody>;

export interface SemanticModelBody {
  entities: Record<Id<"ent">, EntityDefinition>;
  dimensions: Record<Id<"dim">, DimensionDefinition>;
  measures: Record<Id<"msr">, MeasureDefinition>;
  metrics: Record<Id<"met">, MetricDefinition>;
  relationships: Record<Id<"rel">, RelationshipDefinition>;
  hierarchies: Record<Id<"hie">, HierarchyDefinition>;
  parameters: Record<Id<"prm">, import("./filter").ParameterDefinition>;
  policies: Record<Id<"pol">, DataPolicy>;
  preAggregations: Record<Id<"pag">, PreAggregationDefinition>;
  defaults: { timezone: string; currency?: string; weekStart?: "monday" | "sunday"; fiscalYearStartMonth?: number };
  /**
   * Conhecimento curado para a IA (ADR-0039) — versionado com a revisão do modelo.
   * Inócuo sem IA (também alimenta busca do catálogo e documentação).
   */
  ai?: {
    instructions?: string; // glossário e regras: "receita = líquida por padrão", "ano fiscal começa em abril"
    verifiedQuestions?: Array<{ question: string; query: import("./query").QueryRequest; approvedBy: string; approvedAt: string }>;
    exclude?: Array<Id<"dim"> | Id<"msr"> | Id<"met">>; // campos que a IA não deve usar
  };
}

/** Entidade de negócio ancorada em um dataset, com chave primária (base para joins seguros). */
export interface EntityDefinition {
  name: string; // "Order", "Customer"
  datasetId: Id<"dts">;
  primaryKey: string[];
  description?: string;
}

export interface DimensionDefinition {
  name: string;
  label: string;
  entityId: Id<"ent">;
  expression: BelExpression; // ex.: "[country]" ou "UPPER([country_code])"
  type: "categorical" | "time" | "geo" | "boolean" | "numeric-bucket";
  time?: { grains: Array<"second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year">; timezone?: string };
  geo?: { role: "country" | "region" | "city" | "postal" | "lat" | "lon" | "point" | "h3"; boundarySet?: string };
  format?: FormatSpec;
  sortBy?: Id<"dim">;
  description?: string;
  synonyms?: string[]; // busca, catálogo e IA: ["UF", "estado"]
  classification?: import("./common").DataClassification; // herdada do campo do dataset, pode endurecer
  accessPolicyIds?: Id<"pol">[]; // column-level security
}

/** Measure = agregação sobre colunas de UMA entidade, com semântica explícita. */
export interface MeasureDefinition {
  name: string;
  label: string;
  entityId: Id<"ent">;
  expression: BelExpression; // expressão de linha: "[amount] - [discount]"
  aggregation: "sum" | "count" | "count_distinct" | "approx_count_distinct" | "min" | "max" | "avg" | "median" | "percentile";
  /** Define como re-agregar (pre-aggs, totais, rollups). */
  additivity:
    | { kind: "additive" }
    | { kind: "semi-additive"; nonAdditiveDimension: Id<"dim">; window: "first" | "last" | "min" | "max" } // ex.: saldo
    | { kind: "non-additive" };
  filter?: BelExpression; // measure filtrada: "[status] = 'paid'"
  format?: FormatSpec;
  unit?: string;
  currency?: { code?: string; fromDimension?: Id<"dim"> };
}

/** Metric = conceito de negócio publicado; compõe measures. É o que usuários de negócio veem. */
export interface MetricDefinition {
  name: string; // "revenue"
  label: string; // "Receita"
  type:
    | { kind: "simple"; measure: Id<"msr"> }
    | { kind: "ratio"; numerator: Id<"met"> | Id<"msr">; denominator: Id<"met"> | Id<"msr"> }
    | { kind: "derived"; expression: BelExpression } // referencia outras metrics: "[revenue] - [cost]"
    | { kind: "cumulative"; base: Id<"met">; window?: string; grainToDate?: "month" | "quarter" | "year" }
    | { kind: "period-over-period"; base: Id<"met">; offset: string; mode: "value" | "delta" | "percent" }
    | { kind: "lod"; base: Id<"met">; lod: "fixed" | "include" | "exclude"; dimensions: Id<"dim">[] };
  timeDimension?: Id<"dim">; // dimensão de tempo default para time intelligence
  format?: FormatSpec;
  description: string; // definição de negócio obrigatória para metrics certificadas
  synonyms?: string[]; // ["faturamento", "vendas"]
  owners?: string[];
  certification?: "draft" | "certified" | "deprecated";
  accessPolicyIds?: Id<"pol">[];
}

export interface RelationshipDefinition {
  from: { entityId: Id<"ent">; keys: string[] };
  to: { entityId: Id<"ent">; keys: string[] };
  cardinality: "one-to-one" | "many-to-one" | "one-to-many" | "many-to-many";
  joinType: "inner" | "left" | "full";
  /** Relacionamentos inativos só são usados quando explicitamente solicitados (ex.: role-playing dates). */
  active: boolean;
  name?: string;
}

export interface HierarchyDefinition {
  name: string;
  levels: Id<"dim">[]; // ex.: país → estado → cidade; ano → trimestre → mês
}

/** Políticas de dados aplicadas pelo query compiler ANTES da otimização (não contornáveis). */
export type DataPolicy =
  | {
      kind: "row";
      entityId: Id<"ent">;
      /** Predicado BEL com atributos do principal: "[region] IN @user.attributes.regions". */
      predicate: BelExpression;
      appliesTo: PolicySubject;
    }
  | { kind: "column"; target: Id<"dim"> | Id<"msr"> | Id<"met">; effect: "deny" | "mask"; mask?: BelExpression; appliesTo: PolicySubject };

export interface PolicySubject {
  roles?: string[];
  groups?: string[];
  condition?: BelExpression; // ABAC: "@user.attributes.department = 'finance'"
  except?: { roles?: string[] };
}

export interface PreAggregationDefinition {
  measures: Id<"msr">[]; // apenas re-agregáveis (sum/count/min/max/HLL)
  dimensions: Id<"dim">[];
  timeDimension?: { dimension: Id<"dim">; grain: "hour" | "day" | "week" | "month" };
  partitionGrain?: "day" | "month";
  refresh: { every?: string; refreshKey?: BelExpression; incremental?: boolean; updateWindow?: string };
  storage: "clickhouse";
  origin: "declared" | "recommended" | "automatic";
}
