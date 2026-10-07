# ADR-0005 — Semantic layer própria e obrigatória

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [11-semantic-layer](../11-semantic-layer.md), ADR-0006, ADR-0008

## Context
Sem uma camada semântica, cada dashboard reimplementa regras de negócio (receita, churn), gerando números divergentes, impossibilitando lineage, governança, segurança consistente e NLQ.

## Decision
- Toda consulta a dados passa por um **modelo semântico** (entidades, dimensões, measures com aditividade, metrics, relações, hierarquias, parâmetros, políticas, pre-aggs).
- Widgets, exports, alertas, embeds e APIs referenciam **apenas** objetos semânticos por ID.
- Implementação própria inspirada em MetricFlow (entidades/joins), LookML (symmetric aggregates), Cube (pre-aggs), Tableau (LOD), Power BI (RLS, calculation groups).
- Para datasets ad hoc (upload rápido), um **modelo auto-gerado** é criado — o caminho continua semântico.

## Alternatives
SQL livre por widget (Metabase/Superset nativo); integrar dbt Semantic Layer/Cube como dependência; DAX-like.

## Advantages
Consistência de números, governança, segurança compilada, lineage completo, base para NLQ e SQL API.

## Disadvantages
Fricção inicial para usuários que só querem "um gráfico rápido" (mitigada por modelos auto-gerados); esforço de engenharia significativo.

## Risks
Corretude de agregação (risco R1) → testes diferenciais e corpus patológico.

## Consequences
Query API aceita apenas QDL; modelagem é uma persona de primeira classe no produto.

## Emenda 2026-10-06 — IA nativa
- A semantic layer é o **principal ativo de grounding** da IA. Ganha `synonyms` em dimensões/metrics, `classification` e o bloco `ai` (`instructions`, `verifiedQuestions`, `exclude`). Ver [ADR-0039](ADR-0039-ai-grounding.md).
