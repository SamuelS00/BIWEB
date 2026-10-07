# ADR-0038 — Insights Engine e Viz Recommender determinísticos ("a IA narra, a plataforma calcula")

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0033, ADR-0011, [31 §9](../31-ai-assistant.md#9-análise-de-dados), [31 §12](../31-ai-assistant.md#12-visualizações-e-mapas)

## Context
Perguntas analíticas ("por que caiu?", "outliers?", "qual região mais cresceu?") e recomendações de visualização feitas apenas pelo modelo tendem a alucinar e não são reprodutíveis nem testáveis.

## Decision
- **Insights Engine** no `query-service` (Rust): comparação de períodos, decomposição de contribuição (explicar variação, efeito mix vs taxa para métricas de razão), anomalias em séries (decomposição sazonal robusta + limiares), outliers (IQR/MAD). Executa **somente QDL** pelo planner (RLS/CLS, cache, preaggs, cost guard), com orçamento por investigação, e retorna resultados estruturados com evidências e limitações. Exposto via API `insights/v1` e por **UI sem IA** ("Explicar variação", selos de anomalia).
- **Viz Recommender** (`packages/viz-recommender`, TS isomórfico): ranqueia visualizações pela forma dos dados × `dataRequirements`/`aiHints` dos manifests; usado pelo botão "Sugerir visualização" e pela IA.
- A IA **escolhe métodos, parâmetros e narra**; não produz números próprios.

## Alternatives
Modelo calcula a partir de dados brutos no contexto; analytics ad hoc via queries geradas pelo modelo sem algoritmo; motor estatístico externo.

## Advantages
Respostas reprodutíveis e testáveis; valor sem IA; menos tokens (resultados compactos).

## Disadvantages
Esforço de engenharia em algoritmos e UX.

## Risks
Algoritmos ingênuos geram explicações enganosas → limitações explícitas no resultado, confiança e testes com datasets sintéticos com efeitos conhecidos.

## Consequences
O Insights Engine entra na Fase 4 (depende de time intelligence e preaggs da Fase 3); o Viz Recommender entra na Fase 2/3.
