# ADR-0031 — Lineage extraído em tempo de compilação, armazenado no Postgres

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [22 §34](../22-observability-lineage-governance.md)

## Context
Precisamos saber quais datasets, metrics, widgets, dashboards, alertas e embeds são afetados por mudanças em fontes, transformações ou modelos.

## Decision
- Grafo `lineage_nodes`/`lineage_edges` no Postgres, por tenant e versionado por revisão publicada.
- Extração determinística na compilação/salvamento: Transformation Engine (plano lógico, nível coluna), compilador semântico, `dashboard-core`, Delivery.
- Impact analysis por CTE recursiva; enriquecimento com uso (query logs); OpenLineage na Fase 6.

## Alternatives
Graph database (Neo4j); parsing de query logs; catálogo externo (DataHub/OpenMetadata) como fonte primária.

## Advantages
Preciso, sem infraestrutura extra, consultável transacionalmente.

## Disadvantages
Consultas recursivas profundas podem pesar em grafos grandes (mitigado por índices e materialização).

## Risks
Extratores desatualizados quando schemas evoluem → testes de lineage por componente.

## Consequences
Lineage existe desde a Fase 2 (extração), com UI de catálogo depois.
