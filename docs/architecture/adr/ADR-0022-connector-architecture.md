# ADR-0022 — Connector SDK com múltiplos runtimes (Rust/ADBC, declarativo, WASM, container, JDBC bridge)

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [09](../09-ingestion-and-connectors.md)

## Context
Dezenas de fontes (bancos, warehouses, SaaS, arquivos, sistemas proprietários), com modos live e import, conectores de terceiros e requisitos de segurança (credenciais, egress).

## Decision
- Contrato único **Connector Protocol v1** (`spec/check/discover/read/query/estimate/cancel/subscribe`), dados em Arrow, checkpoints opacos.
- Runtimes: in-process Rust (drivers nativos/ADBC) para first-party; **YAML declarativo** para REST; **WASM components** para lógica leve de terceiros; **containers** para conectores complexos de terceiros; **JDBC bridge** (Kotlin, Flight SQL) para a cauda longa.
- Host cuida de retries, throttling, circuit breakers, credenciais, checkpoints e métricas.

## Alternatives
Apenas JDBC (JVM); adotar Airbyte como plataforma de ingestão; Singer; conectores só first-party.

## Advantages
Performance onde importa; amplitude via declarativo/JDBC; extensibilidade segura.

## Disadvantages
Vários runtimes a manter.

## Risks
Qualidade de conectores de terceiros → conformance kit obrigatório e certificação.

## Consequences
Conectores core usam o mesmo SDK; adaptador Airbyte avaliado na Fase 5 (licenças).
