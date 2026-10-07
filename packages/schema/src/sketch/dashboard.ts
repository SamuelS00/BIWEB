import type { BelExpression, DocumentEnvelope, Id, OrderKey, SemanticRef } from "./common";
import type { FilterDefinition, ParameterDefinition } from "./filter";
import type { WidgetDefinition } from "./widget";

/**
 * DashboardDefinition — documento declarativo, normalizado e versionável interpretado pelo Dashboard Engine.
 *
 * Regras estruturais:
 *  - Toda entidade é indexada por ID estável (mapas, não arrays) → diff, merge, ops e CRDT futuros.
 *  - Ordem por fractional indexing (`order`), nunca por posição no array.
 *  - Árvore de nós (containers e widgets) via `parentId`.
 *  - Nada específico de biblioteca de gráficos no documento (só config do plugin, versionada).
 */
export type DashboardDefinition = DocumentEnvelope<"dashboard", DashboardBody>;

export interface DashboardBody {
  /** Modelos semânticos usados (com revisão fixada opcional para reprodutibilidade). */
  models: Array<{ id: Id<"sem">; pinnedRevision?: Id<"rev"> }>;
  pages: Record<Id<"pag">, PageDefinition>;
  nodes: Record<Id<"nod">, LayoutNode>;
  widgets: Record<Id<"wdg">, WidgetDefinition>;
  filters: Record<Id<"flt">, FilterDefinition>;
  parameters: Record<Id<"prm">, ParameterDefinition>;
  /** Variáveis de runtime derivadas (ex.: seleção corrente, usuário), somente leitura no documento. */
  variables: Record<string, VariableDefinition>;
  interactions: Record<Id<"int">, InteractionDefinition>;
  theme: { themeId?: Id<"thm">; overrides?: Record<string, string> }; // overrides de design tokens de runtime
  settings: DashboardSettings;
}

export interface PageDefinition {
  title: string;
  order: OrderKey;
  rootNodeId: Id<"nod">;
  hidden?: boolean; // páginas de drill-through
  drillThrough?: { acceptsFields: SemanticRef[] };
}

/** Nó de layout: container (com estratégia de layout) ou folha que referencia um widget. */
export type LayoutNode = ContainerNode | WidgetNode;

interface BaseNode {
  parentId: Id<"nod"> | null;
  order: OrderKey;
  /** Placement no container pai, por breakpoint. Breakpoints ausentes herdam/derivam automaticamente. */
  placement: Partial<Record<Breakpoint, Placement>>;
  locked?: boolean;
  hidden?: Partial<Record<Breakpoint, boolean>>;
  visibleWhen?: BelExpression; // visibilidade condicional (ex.: parâmetro)
  name?: string; // nome na árvore de camadas
}

export interface ContainerNode extends BaseNode {
  type: "container";
  layout:
    | { kind: "grid"; columns: number; rowHeight: number; gap: number; compact: "vertical" | "none" }
    | { kind: "free"; width: number; height: number; snap?: number } // canvas absoluto (página pixel-perfect)
    | { kind: "stack"; direction: "row" | "column"; gap: number; align?: string; justify?: string; wrap?: boolean }
    | { kind: "tabs"; activeDefault?: Id<"nod"> };
  style?: Record<string, unknown>;
}

export interface WidgetNode extends BaseNode {
  type: "widget";
  widgetId: Id<"wdg">;
}

export type Breakpoint = "xl" | "lg" | "md" | "sm" | "xs";

export type Placement =
  | { kind: "grid"; x: number; y: number; w: number; h: number }
  | { kind: "free"; x: number; y: number; w: number; h: number; rotation?: number; z: number }
  | { kind: "stack"; grow?: number; shrink?: number; basis?: string; minW?: number; minH?: number }
  | { kind: "tab"; label: string };

export interface VariableDefinition {
  source: "selection" | "user" | "url" | "embed" | "time";
  type: string;
}

/** Interação declarativa entre widgets: trigger (evento normalizado) → ação. */
export interface InteractionDefinition {
  sourceWidgetId: Id<"wdg"> | "*";
  trigger: "select" | "hover" | "brush" | "click" | "drill";
  action:
    | { kind: "cross-filter"; targets: Id<"wdg">[] | "all"; mode: "filter" | "highlight" }
    | { kind: "drill-down"; hierarchy: Id<"hie"> }
    | { kind: "drill-through"; targetPageId: Id<"pag">; passFields: SemanticRef[] }
    | { kind: "navigate"; dashboardId: Id<"dsh">; mapFields?: Record<string, Id<"prm">> }
    | { kind: "set-parameter"; parameterId: Id<"prm">; fromField: SemanticRef }
    | { kind: "open-url"; template: string }
    | { kind: "plugin-action"; actionId: string; config: Record<string, unknown> };
}

export interface DashboardSettings {
  refresh?: { mode: "manual" | "interval" | "realtime"; intervalSeconds?: number };
  defaultBreakpointSource: Breakpoint;
  crossFilterDefault: "filter" | "highlight" | "off";
  presentation?: { autoplaySeconds?: number };
  exportable?: boolean;
}
