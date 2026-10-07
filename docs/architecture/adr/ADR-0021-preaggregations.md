# ADR-0021 — Pre-aggregations declaradas no modelo + aggregate awareness no planner

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [12 §21](../12-query-engine.md)

## Context
Dashboards populares repetem queries caras; warehouses do cliente cobram por query; latência interativa exige rollups.

## Decision
- Rollups declarados no modelo semântico (measures re-agregáveis, dimensões, grain, partições, refresh), materializados no ClickHouse — **inclusive para fontes live**.
- Planner faz matching (dimensões ⊆, measures deriváveis, grain compatível, políticas cobertas) e lambda (rollup + dados recentes).
- Refresh incremental por partição via Temporal; recomendações (Fase 6) e automação com orçamento (Fase 7).

## Alternatives
Materialized views manuais do cliente; cache apenas; cubos OLAP separados; MV rewrite do engine (StarRocks).

## Advantages
Latência e custo previsíveis; corretude garantida pela semântica de aditividade.

## Disadvantages
Armazenamento e jobs adicionais; complexidade do matcher.

## Risks
Rollups desatualizados → `dataAsOf` exibido, lambda e política de frescor.

## Consequences
Metering de custo/benefício por rollup; remoção de rollups sem uso.
