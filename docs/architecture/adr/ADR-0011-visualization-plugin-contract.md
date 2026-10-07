# ADR-0011 — Contrato VisualizationPlugin; ECharts como adapter primário

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [07-visualization-engine](../07-visualization-engine.md), [schemas/visualization.ts](../schemas/visualization.ts)

## Context
Nenhuma biblioteca cobre todas as necessidades (gráficos de negócio, tabelas/pivot, mapas, milhões de pontos, visuais custom). Acoplar documentos e interações a uma biblioteca gera lock-in.

## Decision
- Contrato framework-agnóstico: `manifest`, `configSchema`/`configVersion`, `dataRequirements` (papéis + hints), `capabilities`, ciclo de vida `mount/update/resize/applyDelta/snapshot/destroy`, eventos normalizados em coordenadas de dados, `VizHost` mínimo.
- Implementações: **ECharts** (gráficos padrão), tabela/pivot próprios (TanStack), deck.gl (alta escala), MapLibre+deck.gl (mapas), Vega-Lite (opcional), terceiros via SDK.
- Gráficos core **são plugins** usando o mesmo SDK.

## Alternatives
Usar ECharts diretamente; Vega-Lite como linguagem de spec universal; Highcharts; construir tudo em D3/WebGL próprio.

## Advantages
Troca de biblioteca sem migrar documentos; inspector gerado; interações portáveis; SSR; extensibilidade.

## Disadvantages
Camada de adapter a manter; recursos muito específicos de uma biblioteca exigem expor conceitos no `configSchema`.

## Risks
Adapter ECharts virar "proxy de opções" → revisão de `configSchema`; `rawOptions` só first-party e não portátil.

## Consequences
Dashboard Engine gera queries a partir de `dataRequirements`; plugins nunca buscam dados.

## Emenda 2026-10-06 — IA nativa
- Manifests ganham `description` obrigatória e `aiHints` opcionais (goodFor, avoidWhen, dataShapes). Toda propriedade de `configSchema` exige `description`. Base do **Viz Recommender** determinístico e do conhecimento da IA sobre visualizações instaladas ([ADR-0038](ADR-0038-deterministic-insights-and-recommenders.md)).
