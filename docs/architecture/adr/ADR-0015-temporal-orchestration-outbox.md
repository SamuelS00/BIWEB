# ADR-0015 — Temporal para workflows duráveis; outbox e fila leve no Postgres

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [15 §32](../15-backend.md)

## Context
Syncs, transformações, refresh, pre-aggs, exports, relatórios e alertas são multi-etapa, longos, precisam de retries, checkpoints, cancelamento, agendamento e fairness entre milhares de tenants. Eventos de domínio precisam ser publicados de forma consistente com as transações.

## Decision
- **Temporal** (Temporal Cloud no SaaS; self-hosted com Postgres) com workflows em TypeScript no control plane.
- Atividades pesadas delegadas ao `ingest-executor` (Rust) via gRPC streaming com heartbeats — o Rust não depende do SDK Temporal.
- Task queues por classe; semáforos de concorrência por tenant.
- **Outbox transacional** + fila de jobs leves no Postgres (`SKIP LOCKED`) para eventos de domínio, emails, webhooks, audit.

## Alternatives
Airflow, Dagster, Prefect, BullMQ, Celery, workers próprios, coreografia via Kafka, Restate/Hatchet.

## Advantages
Durabilidade e visibilidade de primeira classe; menos código de infraestrutura próprio; consistência transacional dos eventos.

## Disadvantages
Conceitos de determinismo; mais um componente no self-hosted; custo do Temporal Cloud.

## Risks
Workflows mal modelados (históricos grandes) → guia interno, `continueAsNew`, revisões.

## Consequences
Toda execução em background é idempotente e rastreável por workflow ID.

## Emenda 2026-10-06 — IA nativa
- Turnos interativos de IA **não** usam Temporal (in-process, com budgets e cancelamento). Temporal é usado para: expiração de conversas (retenção), narrativas em relatórios agendados e alertas explicados (Fase 5–6), e evals agendados.
