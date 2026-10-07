# ADR-0023 — Realtime: Kafka API + NATS + WebSocket (a partir da Fase 4)

- **Status:** Proposto (implementação na Fase 4) · **Data:** 2026-10-06 · **Relacionados:** [14-realtime](../14-realtime.md)

## Context
Dashboards em tempo real exigem ingestão durável com replay, agregação em janelas, fan-out para milhares de subscriptions dinâmicas com isolamento por tenant e entrega eficiente ao browser.

## Decision
- **Kafka API** (gerenciado no SaaS; Redpanda self-hosted) como log durável; **ClickHouse MVs** + processor Rust para janelas; **NATS** para fan-out interno; **WebSocket** multiplexado com snapshot+delta, `seq`, resume token, coalescing; SSE como fallback.
- Antes da Fase 4: near-real-time por polling + notificações de mudança.

## Alternatives
Só Kafka; só NATS JetStream; Pulsar; Flink; SSE apenas; long polling.

## Advantages
Cada componente no papel em que é mais forte; adoção somente quando necessário.

## Disadvantages
Dois sistemas de mensageria na Fase 4.

## Risks
Operação de streaming → serviços gerenciados no SaaS; testes de caos.

## Consequences
Plugins com `realtimeAppend` implementam `applyDelta`.
