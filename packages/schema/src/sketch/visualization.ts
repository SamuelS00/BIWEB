import type { FormatSpec, SemVer } from "./common";

/**
 * VisualizationDefinition / VisualizationPlugin — contrato framework-agnóstico entre
 * Dashboard Engine e implementações de gráficos (ECharts, deck.gl, tabela própria, Vega-Lite, D3...).
 * Nada aqui depende de React; o host React apenas monta o plugin num elemento.
 */
export interface VisualizationManifest {
  id: string; // "core.bar", "core.map", "acme.gantt"
  version: SemVer;
  displayName: string;
  category: "chart" | "table" | "kpi" | "map" | "text" | "control" | "custom";
  /** Compatibilidade com a Host API do runtime. */
  engines: { host: string }; // ex.: "^1.4.0"
  /** Descrição legível por humanos e pela IA (obrigatória). */
  description: string;
  /**
   * JSON Schema da config própria (gera o inspector automaticamente + validação no servidor).
   * Toda propriedade DEVE ter `description` (usada pelo inspector, documentação e IA).
   */
  configSchema: object;
  /** Conhecimento declarativo para o Viz Recommender e a IA (ADR-0038). */
  aiHints?: {
    goodFor: string[]; // ["comparar categorias", "ranking"]
    avoidWhen: string[]; // ["mais de 20 categorias", "séries temporais longas"]
    dataShapes: Array<{ dimensions: string; metrics: string; notes?: string }>; // "1 categórica (≤20)", "1–3"
  };
  configVersion: number;
  dataRequirements: DataRequirements;
  capabilities: VizCapabilities;
  /** Para plugins de terceiros: executado em iframe sandboxed. */
  trust: "first-party" | "certified" | "untrusted";
  entrypoint: string; // módulo ESM
}

/** Papéis/encodings que o plugin aceita — o Dashboard Engine gera a query a partir disso. */
export interface DataRequirements {
  roles: Array<{
    name: string; // "x", "y", "color", "size", "geo", "rows", "columns", "values"
    kind: "dimension" | "metric" | "any";
    min: number;
    max: number | null;
    acceptsTypes?: Array<"categorical" | "time" | "geo" | "numeric">;
  }>;
  /** Dicas para o compilador de queries do widget. */
  queryHints?: { densifyTime?: boolean; topNWithOthers?: boolean; pivot?: boolean; spatialBinning?: "h3" | "geohash"; viewportDriven?: boolean };
  maxRecommendedRows: number;
}

export interface VizCapabilities {
  renderers: Array<"svg" | "canvas" | "webgl" | "webgpu" | "dom">;
  interactions: Array<"select" | "multi-select" | "hover" | "brush" | "zoom" | "drill" | "context-menu" | "viewport">;
  crossFilterTarget: boolean; // pode receber highlight/filter
  ssr: boolean; // renderiza no render service (export)
  exports: Array<"png" | "svg" | "csv">;
  responsive: boolean;
  realtimeAppend: boolean; // aceita deltas incrementais sem re-render completo
}

/** Ciclo de vida implementado pelo plugin. */
export interface VisualizationPlugin<Config = unknown> {
  manifest: VisualizationManifest;
  migrateConfig?(config: unknown, fromVersion: number): Config;
  mount(el: HTMLElement, host: VizHost): VizInstance<Config>;
}

export interface VizInstance<Config> {
  update(props: VizProps<Config>): void;
  resize(size: { width: number; height: number }): void;
  /** Delta realtime (append/upsert) quando `realtimeAppend` = true. */
  applyDelta?(delta: DataFrameView): void;
  snapshot?(format: "png" | "svg"): Promise<Blob>;
  destroy(): void;
}

export interface VizProps<Config> {
  data: DataFrameView[]; // um por query do widget
  encodings: Record<string, FieldMeta[]>;
  config: Config;
  theme: Record<string, string>; // design tokens de runtime resolvidos
  locale: string;
  size: { width: number; height: number };
  interactionState: { selection?: DataSelection; highlight?: DataSelection; hover?: DataSelection };
  mode: "view" | "edit" | "export";
}

/** Visão colunar somente leitura (backed by Arrow). Plugins não sabem de onde os dados vieram. */
export interface DataFrameView {
  numRows: number;
  columns: Record<string, { type: string; values: ArrayLike<unknown> | Float64Array | Int32Array; nulls?: Uint8Array }>;
  meta: { truncated: boolean; dataAsOf?: string };
}

export interface FieldMeta {
  alias: string;
  label: string;
  role: "dimension" | "metric";
  type: string;
  format?: FormatSpec;
}

/** Seleção expressa em coordenadas de DADOS (nunca pixels, nunca tipos de biblioteca). */
export type DataSelection =
  | { kind: "points"; tuples: Array<Record<string, unknown>> } // [{country: "BR", month: "2026-01"}]
  | { kind: "interval"; field: string; from: unknown; to: unknown }
  | { kind: "spatial"; geometry: unknown };

/** Host API exposta ao plugin (versionada; superfície mínima). */
export interface VizHost {
  emit(event: VizEvent): void;
  requestViewport?(bbox: [number, number, number, number], zoom: number): void; // mapas: novas queries por viewport
  requestPage?(offset: number, limit: number): void; // tabelas paginadas
  format(value: unknown, format?: FormatSpec): string;
  logger: { warn(msg: string): void; error(msg: string): void };
}

export type VizEvent =
  | { type: "select" | "hover" | "brush"; selection: DataSelection | null; additive?: boolean }
  | { type: "drill"; tuple: Record<string, unknown>; direction: "down" | "up" }
  | { type: "context-menu"; tuple: Record<string, unknown>; position: { x: number; y: number } }
  | { type: "rendered"; durationMs: number }
  | { type: "error"; message: string };
