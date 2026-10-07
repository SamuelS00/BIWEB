import type { BelExpression, Id, Scalar, ScalarType, SemanticRef } from "./common";

/**
 * FilterDefinition — predicado declarativo sobre campos semânticos.
 * Árvore booleana serializável; compilada para SQL/dialeto pelo query engine.
 */
export type FilterExpression =
  | { op: "and" | "or"; args: FilterExpression[] }
  | { op: "not"; arg: FilterExpression }
  | { op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte"; field: SemanticRef; value: FilterValue }
  | { op: "in" | "not_in"; field: SemanticRef; values: FilterValue[] }
  | { op: "between"; field: SemanticRef; from: FilterValue; to: FilterValue }
  | { op: "is_null" | "is_not_null"; field: SemanticRef }
  | { op: "contains" | "starts_with" | "ends_with" | "matches"; field: SemanticRef; value: string; caseSensitive?: boolean }
  | { op: "relative_time"; field: SemanticRef; period: "day" | "week" | "month" | "quarter" | "year"; offset: number; count: number; toDate?: boolean }
  | { op: "top_n"; field: SemanticRef; n: number; by: SemanticRef; direction: "top" | "bottom" }
  | { op: "spatial"; field: SemanticRef; relation: "within" | "intersects"; geometry: GeoJsonGeometry | { bbox: [number, number, number, number] } }
  | { op: "expression"; expression: BelExpression }; // escape hatch tipado

/** Valor literal ou referência a parâmetro/variável resolvida em runtime. */
export type FilterValue = Scalar | { param: Id<"prm"> } | { variable: string };

export interface GeoJsonGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

/** Filtro declarado no dashboard (global, de página ou de widget). */
export interface FilterDefinition {
  id: Id<"flt">;
  label?: string;
  scope: { kind: "dashboard" } | { kind: "page"; pageId: Id<"pag"> } | { kind: "widgets"; widgetIds: Id<"wdg">[] } | { kind: "container"; nodeId: Id<"nod"> };
  /** Filtro com controle de UI (dropdown, range, date picker) ou fixo. */
  control?: { type: "select" | "multi-select" | "range" | "date-range" | "relative-date" | "search" | "toggle"; field: SemanticRef; defaultValue?: unknown };
  expression?: FilterExpression;
  /** Quais datasets/modelos o filtro alcança quando campos diferem (mapeamento explícito). */
  fieldMappings?: Array<{ model: Id<"sem">; field: SemanticRef["field"] }>;
  locked?: boolean; // travado por embed token ou pelo autor
  required?: boolean;
}

/** ParameterDefinition — valor escolhido pelo usuário que altera cálculos (what-if, moeda, métrica dinâmica). */
export interface ParameterDefinition {
  id: Id<"prm">;
  name: string;
  type: ScalarType | "metric-ref" | "dimension-ref";
  multiple?: boolean;
  default: unknown;
  allowed?: { kind: "list"; values: Scalar[] } | { kind: "range"; min: number; max: number; step?: number } | { kind: "query"; field: SemanticRef };
  /** Parâmetro pode ser setado por URL / embed / API. */
  bindable?: boolean;
}
