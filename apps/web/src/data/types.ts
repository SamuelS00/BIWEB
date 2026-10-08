/** Modelo de dados do protótipo: Data Source → Dataset → Report → Page → Component. Os dados pertencem à empresa, não ao relatório. */
export type FieldKind = 'dimension' | 'date' | 'geo' | 'measure';
export type FieldFormat = 'int' | 'dec' | 'pct' | 'db' | 'km' | 'gbps' | 'ms' | 'date' | 'datetime' | 'text' | 'brl' | 'month';
/** Calculated field: sum(num) / sum(den) × scale, so ratios stay correct at any level of aggregation. */
export interface FieldCalc { num: string; den: string; scale?: number; offset?: number; /** 'diff' = sum(num) − sum(den) */ op?: 'ratio' | 'diff' }
export interface Field { name: string; label: string; kind: FieldKind; format?: FieldFormat; hidden?: boolean; description?: string; calc?: FieldCalc; /** Hierarchy this field belongs to, in drill order. */ hierarchy?: string }
export type Row = Record<string, unknown>;
export interface Table { id: string; name: string; description: string; key: string; geometry?: 'point' | 'line' | 'polygon'; fields: Field[]; rows: Row[] }
export interface Relationship { from: string; to: string; label: string } // "tabela.campo" → "tabela.campo" (N:1)
export type SourceKind = 'KMZ' | 'KML' | 'SHP' | 'GeoJSON' | 'CSV' | 'XLSX' | 'JSON' | 'API' | 'PostgreSQL';
export interface Dataset {
  id: string; name: string; description: string; owner: string; certified?: boolean;
  source: { kind: SourceKind; label: string; refreshedAt: number; schedule: string };
  tables: Table[]; relationships: Relationship[]; imported?: boolean;
}

export type Agg = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
export type FilterOp = '=' | '!=' | 'in' | '>' | '>=' | '<' | '<=' | 'contains';
export interface Filter { field: string; op: FilterOp; value: unknown }

/* ---------- regras (Fase 4) ---------- */
export type RuleStatus = 'normal' | 'warning' | 'critical' | 'offline';
export interface RuleCondition { id: string; field: string; op: FilterOp; value: string | number; join?: 'AND' | 'OR' }
export type RuleAction =
  | { kind: 'status'; value: RuleStatus }
  | { kind: 'label'; value: string }
  | { kind: 'alert' }
  | { kind: 'highlight' };
export interface Rule { id: string; name: string; enabled: boolean; dataset: string; table: string; conditions: RuleCondition[]; actions: RuleAction[]; createdBy?: 'copilot' | 'user' }
/** Campos derivados que as regras escrevem em cada linha afetada. */
export interface RuleEffects { _rules?: string[]; _alert?: boolean; _highlight?: boolean; _label?: string; _statusOriginal?: unknown }
