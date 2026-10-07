import type { BelExpression, FormatSpec, Id, SemVer, SemanticRef } from "./common";
import type { FilterExpression } from "./filter";

/**
 * WidgetDefinition — configuração independente de um widget.
 *
 * Separação deliberada:
 *  - `data`: O QUE consultar (bindings semânticos por papel/encoding) → Dashboard Engine gera QueryRequest.
 *  - `viz`:  COMO renderizar (plugin + versão + config própria do plugin, validada pelo configSchema dele).
 *  - `style`: aparência comum (container, título, padding) independente do plugin.
 * Trocar a biblioteca de gráficos altera apenas o plugin, nunca `data`.
 */
export interface WidgetDefinition {
  title?: string;
  description?: string;
  data?: WidgetDataBinding; // ausente para widgets estáticos (texto, imagem)
  viz: { plugin: string; version: SemVer; config: Record<string, unknown> };
  style?: WidgetStyle;
  /** Override de formatação por campo (sobre o formato do modelo semântico). */
  fieldFormats?: Record<string, FormatSpec>;
  conditionalFormatting?: ConditionalRule[];
  /** Refresh específico (ex.: KPI realtime em dashboard manual). */
  refresh?: { mode: "inherit" | "interval" | "realtime"; intervalSeconds?: number };
  extensions?: Record<string, unknown>;
}

export interface WidgetDataBinding {
  model: Id<"sem">;
  /**
   * Bindings por papel declarado no `dataRequirements` do plugin.
   * Ex.: bar chart → { x: [country], y: [revenue, cost], color: [segment] }
   */
  encodings: Record<string, Array<EncodingBinding>>;
  filters?: FilterExpression; // filtros locais do widget
  calculations?: Array<{ alias: string; expression: BelExpression; label?: string }>;
  sort?: Array<{ ref: string; direction: "asc" | "desc" }>;
  limit?: number;
  topN?: { n: number; by: string; others?: boolean };
  /** Ignorar filtros específicos (ex.: KPI "total geral" que não reage a cross-filter). */
  ignoreFilters?: Array<Id<"flt"> | "cross-filter">;
}

export interface EncodingBinding {
  ref: SemanticRef | { calculation: string };
  timeGrain?: string;
  label?: string;
  modifier?: Record<string, unknown>; // espelha QueryMetric.modifier
}

export interface WidgetStyle {
  showTitle?: boolean;
  background?: string; // token ou valor
  border?: string;
  padding?: number;
  shadow?: string;
}

export interface ConditionalRule {
  target: string; // alias do campo
  when: BelExpression; // "[value] < 0"
  apply: { color?: string; background?: string; icon?: string; bar?: boolean; scale?: { min: string; mid?: string; max: string } };
}
