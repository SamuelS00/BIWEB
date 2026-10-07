/**
 * @biweb/schema — contratos da plataforma.
 * Hoje: tipos de esboço em ./sketch (cópia de docs/architecture/schemas). Épico E0.2 troca por TypeBox → JSON Schema 2020-12 em /schemas.
 */
export type * from './sketch/common';
export type * from './sketch/dashboard';
export type * from './sketch/widget';
export type * from './sketch/filter';
export type * from './sketch/query';
export type * from './sketch/semantic-model';
export type * from './sketch/visualization';
export type * from './sketch/plugin-manifest';
export type * from './sketch/dataset';
export type * from './sketch/datasource';
export type * from './sketch/assistant';
export const PACKAGE = '@biweb/schema' as const;
