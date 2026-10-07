# ADR-0002 — Dashboard como documento declarativo normalizado

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [05-dashboard-engine](../05-dashboard-engine.md), [schemas/dashboard.ts](../schemas/dashboard.ts), ADR-0003, ADR-0004, ADR-0024

## Context
Dashboards precisam ser versionáveis, diffáveis, migráveis, editáveis com undo/redo, interpretáveis em vários ambientes (browser, servidor, render service, embed) e, no futuro, editáveis colaborativamente. Estruturas aninhadas com arrays e configuração específica de biblioteca tornam tudo isso difícil.

## Decision
- Documento JSON com envelope (`kind`, `schemaVersion`, `id`, `tenantId`, `meta`, `body`, `extensions`).
- Corpo **normalizado**: `pages`, `nodes`, `widgets`, `filters`, `parameters`, `interactions` como **mapas por ID estável** (ULID com prefixo); ordem por **fractional indexing**; árvore via `parentId`.
- Widgets separam `data` (bindings semânticos por papel), `viz` (plugin + versão + config própria) e `style`.
- Permissões, runtime state, dados e SQL **não** fazem parte do documento.

## Alternatives
Árvore aninhada com arrays; documento por widget em tabelas relacionais; formato proprietário binário; config específica de biblioteca (opções ECharts) no documento.

## Advantages
Diff/merge por entidade; operações endereçáveis e invertíveis; mapeamento direto para CRDT; portabilidade entre bibliotecas; templates e copy/paste com remapeamento simples.

## Disadvantages
Leitura humana um pouco menos direta que árvore aninhada; necessidade de helpers para montar a árvore.

## Risks
Crescimento descontrolado do schema → disciplina de mudanças aditivas e revisão de schema por ADR.

## Consequences
`dashboard-core` implementa DocumentStore, comandos e validação referencial; editor e runtime operam sobre o mesmo modelo.

## Emenda 2026-10-06 — IA nativa
- O documento normalizado com IDs estáveis é o que permite à IA propor **ops granulares** (ChangeSets) em vez de regenerar o documento. `meta.lastChangeOrigin` registra a origem. Ver [ADR-0035](ADR-0035-ai-change-proposals.md).
