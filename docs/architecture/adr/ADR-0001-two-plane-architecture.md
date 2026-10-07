# ADR-0001 — Dois planos (control TS + data Rust), cada um um monolito modular

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [15-backend](../15-backend.md), ADR-0007, ADR-0014, ADR-0015

## Context
A plataforma combina (a) gestão de metadados, identidade, conteúdo e orquestração — CRUD-intensivo, integrações; e (b) processamento de dados — query planning, conectores, ingestão, streaming — CPU/memória-intensivo e sensível a latência. O documento de dashboard precisa ser interpretado no browser **e** no servidor (alertas, relatórios, cache warmup, lineage). O compilador semântico precisa existir no servidor e no browser (validação de fórmulas, queries locais). O time é médio/grande e misto.

## Decision
- **Control plane em TypeScript** (Node LTS + Fastify, Kysely, Temporal TS SDK), como monolito modular por bounded context.
- **Data plane em Rust** (Tokio, Axum, Tonic, arrow-rs, DataFusion), como workspace único com binários por perfil de carga (`query-service`, `ingest-executor`, `realtime-gateway`).
- Comunicação entre planos por **gRPC/Protobuf**; contratos de documentos por **JSON Schema**.
- Exceções: render service (Node + Playwright), JDBC bridge (Kotlin).

## Alternatives
1. Tudo em Rust. 2. Tudo em Go. 3. Control plane em Go + data plane em Rust. 4. Tudo em TS/Node. 5. JVM (Kotlin + Calcite). 6. Microservices por contexto desde o início.

## Advantages
- `dashboard-core`, schemas e migrations compartilhados entre browser e servidor (TS).
- Compilador semântico único (Rust) em servidor e browser (WASM).
- Isolamento de recursos e falhas entre metadados e processamento de dados.
- Produtividade do time misto no control plane; desempenho máximo no data plane.

## Disadvantages
- Duas linguagens de backend, dois toolchains, dois conjuntos de bibliotecas.
- Necessidade de contratos gerados e testes de contrato entre planos.

## Risks
- Escassez de engenheiros Rust (mitigação: time dedicado, escopo restrito ao data plane).
- Lógica duplicada surgindo nos dois lados (mitigação: regra "dados → Rust, metadados → TS", revisões de arquitetura).
- Margem estreita contra Go no control plane (ver matriz em [27](../27-technology-evaluation.md)).

## Consequences
- Times organizados por plano/contexto.
- Pipeline de CI com Turborepo + Cargo.
- **Critério de reversão (control plane):** se o isomorfismo de `dashboard-core` deixar de ser usado no servidor (alertas/relatórios/lineage) ou Node virar gargalo comprovado, reavaliar Go.

## Emenda 2026-10-06 — IA nativa
- O control plane (TS) passa a hospedar os módulos `assistant` (orquestração, contexto, ferramentas, propostas, conversas) e `model-gateway`. O argumento do isomorfismo fica mais forte: o Proposal Service simula ChangeSets com o mesmo `dashboard-core` do browser. O **Insights Engine** fica no data plane (Rust, `query-service`). Ver [ADR-0033](ADR-0033-ai-optional-orchestration-layer.md).
