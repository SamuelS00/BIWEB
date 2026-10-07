# ADR-0007 — DataFusion LogicalPlan como IR relacional; dialetos encapsulados

- **Status:** Proposto (**condicionado ao spike da Fase 1**) · **Data:** 2026-10-06 · **Relacionados:** [12](../12-query-engine.md), [10](../10-transformation-engine.md)

## Context
O planner semântico precisa gerar SQL otimizado para múltiplos dialetos e também executar localmente (pós-processamento, federação leve, transformações).

## Decision
- Planner semântico próprio produz **DataFusion LogicalPlan**; otimizador DataFusion + regras próprias; **unparser** DataFusion com customizações por dialeto, encapsulado na crate `sql-dialects`, com emissores próprios onde houver lacunas.
- O mesmo IR é usado pelo Transformation Engine.
- **Spike** (semanas 2–6): 50 queries de referência → SQL ClickHouse/Postgres/Snowflake/BigQuery; resultados comparados a DuckDB (oráculo). Critério de aceite: ≥ 95% sem emissor custom e 100% corretas após ajustes.

## Alternatives
Emissores SQL totalmente próprios; Apache Calcite (JVM); sqlglot (Python); SQL templates.

## Advantages
Otimizador maduro; tipos Arrow; execução local e geração de SQL no mesmo modelo; ecossistema ativo.

## Disadvantages
API evolui rápido (upgrades frequentes); unparser com cobertura desigual.

## Risks
R2 — mitigado pelo encapsulamento: trocar para emissores próprios não afeta planner/semântica.

## Consequences
Testes golden por dialeto e testes diferenciais obrigatórios no CI; upgrades de DataFusion com suíte de regressão.
