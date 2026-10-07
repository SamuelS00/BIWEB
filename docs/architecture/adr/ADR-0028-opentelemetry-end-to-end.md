# ADR-0028 — OpenTelemetry ponta a ponta, do browser ao SQL

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [22 §33](../22-observability-lineage-governance.md)

## Context
Diagnosticar lentidão em BI exige correlacionar dashboard → widget → query → plano → cache → engine, por tenant.

## Decision
- OTel SDKs no browser, Node e Rust; `traceparent` propagado até o SQL (comentário/`log_comment`/query tags); `tenant_id`, `dashboard_id`, `widget_id`, `load_id` como atributos.
- Backend OTLP agnóstico de fornecedor; query logs e uso em ClickHouse; dashboards internos no próprio produto.

## Alternatives
Agentes proprietários (Datadog APM) acoplados ao código; logs apenas.

## Advantages
Fornecedor trocável; correlação completa; dogfooding.

## Disadvantages
Volume de telemetria → amostragem tail-based.

## Risks
Dados sensíveis em atributos → política de atributos permitidos e redaction.

## Consequences
SLOs definidos a partir de medições na Fase 0/1.

## Emenda 2026-10-06 — IA nativa
- Spans de IA seguem as **convenções semânticas GenAI** do OpenTelemetry. O trace vai do turno ao modelo, às ferramentas e até o SQL executado. Métricas de IA (latência, tokens, custo, erros de ferramenta, aceitação de propostas) entram no mesmo pipeline.
