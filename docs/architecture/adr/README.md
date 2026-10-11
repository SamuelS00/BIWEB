# Architecture Decision Records

Formato: **Context · Decision · Alternatives · Advantages · Disadvantages · Risks · Consequences**. Status inicial de todos: *Proposto* — devem ser revisados e aceitos na Fase 0. Mudança de decisão = novo ADR que *supersede* o anterior (ADRs não são editados após aceitos, exceto status).

| ADR | Decisão | Fase | Agora ou depois |
|---|---|---|---|
| [0001](ADR-0001-two-plane-architecture.md) | Dois planos: control plane TS + data plane Rust, monolitos modulares | 0 | **Agora** |
| [0002](ADR-0002-declarative-dashboard-document.md) | Dashboard como documento declarativo normalizado | 0 | **Agora** |
| [0003](ADR-0003-schema-authoring-and-migrations.md) | TypeBox → JSON Schema canônico; migrations no servidor | 0 | **Agora** |
| [0004](ADR-0004-command-ops-editing-crdt-deferred.md) | Edição por comandos/ops invertíveis; CRDT adiado | 2 | **Agora** (desenho) |
| [0005](ADR-0005-mandatory-semantic-layer.md) | Semantic layer própria e obrigatória | 1 | **Agora** |
| [0006](ADR-0006-qdl-no-sql-in-frontend.md) | QDL semântica; sem SQL no frontend | 1 | **Agora** |
| [0007](ADR-0007-datafusion-relational-ir.md) | DataFusion LogicalPlan como IR; dialetos encapsulados (spike) | 1 | Agora, condicionado ao spike |
| [0008](ADR-0008-bel-expression-language.md) | BEL: linguagem de expressões única em Rust + WASM | 1–3 | Agora (gramática base) |
| [0009](ADR-0009-clickhouse-serving-parquet-truth.md) | ClickHouse serving + Parquet como verdade | 1 | **Agora** |
| [0010](ADR-0010-arrow-wire-format.md) | Arrow ponta a ponta | 1 | **Agora** |
| [0011](ADR-0011-visualization-plugin-contract.md) | Contrato VisualizationPlugin; ECharts primário | 2 | **Agora** |
| [0012](ADR-0012-hybrid-layout-engine.md) | Layout híbrido por containers | 2 | Agora (modelo) |
| [0013](ADR-0013-geospatial-stack.md) | MapLibre + deck.gl + PMTiles + H3 | 3 | Depois |
| [0014](ADR-0014-browser-runtime-wasm-scope.md) | Worker pool; escopo restrito de WASM | 2 | Agora |
| [0015](ADR-0015-temporal-orchestration-outbox.md) | Temporal + outbox Postgres | 0 | **Agora** |
| [0016](ADR-0016-cells-and-multitenancy.md) | Cells + tenant_id + RLS | 0 | **Agora** |
| [0017](ADR-0017-cedar-authorization-compiled-data-policies.md) | Cedar + RLS/CLS compiladas | 0–1 | **Agora** |
| [0018](ADR-0018-external-identity-broker.md) | Identity broker externo (fornecedor a escolher) | 0 | **Agora** |
| [0019](ADR-0019-envelope-encryption-secrets.md) | Envelope encryption de credenciais | 1 | **Agora** |
| [0020](ADR-0020-secure-cache-fingerprint.md) | Cache com fingerprint pós-política | 1 | **Agora** |
| [0021](ADR-0021-preaggregations.md) | Pre-aggs declaradas + aggregate awareness | 3 | Depois (matching previsto no planner) |
| [0022](ADR-0022-connector-architecture.md) | Connector SDK multi-runtime | 1 | Agora (contrato) |
| [0023](ADR-0023-realtime-stack.md) | Kafka API + NATS + WebSocket | 4 | Depois |
| [0024](ADR-0024-immutable-revisions.md) | Revisões imutáveis + ponteiros | 2 | **Agora** |
| [0025](ADR-0025-signed-embeds-shared-runtime.md) | Embeds assinados, runtime único | 3 | Depois (runtime já separado) |
| [0026](ADR-0026-monorepo.md) | Monorepo pnpm/Turborepo/Cargo | 0 | **Agora** |
| [0027](ADR-0027-managed-containers-k8s-trigger.md) | Containers gerenciados; K8s por gatilho | 0 | **Agora** |
| [0028](ADR-0028-opentelemetry-end-to-end.md) | OpenTelemetry ponta a ponta | 0 | **Agora** |
| [0029](ADR-0029-flags-vs-entitlements.md) | Flags ≠ entitlements | 0 | **Agora** |
| [0030](ADR-0030-plugin-sandboxing.md) | Sandboxing de plugins | 5 | Depois |
| [0031](ADR-0031-lineage-graph.md) | Lineage em tempo de compilação no Postgres | 2 | Agora (extração) |
| [0032](ADR-0032-design-system.md) | React Aria + tokens DTCG + tokens de runtime | 0 | **Agora** |
| [0033](ADR-0033-ai-optional-orchestration-layer.md) | IA como camada opcional de orquestração sobre capacidades da plataforma | 0–3 | **Agora** (regra) |
| [0034](ADR-0034-ai-delegated-principal.md) | IA age com principal delegado do usuário (`via: assistant`) | 0–3 | **Agora** (Cedar `via`) |
| [0035](ADR-0035-ai-change-proposals.md) | Mudanças da IA como ChangeSets com preview/confirmação/rebase | 1–3 | **Agora** (ChangeSet no core) |
| [0036](ADR-0036-model-gateway.md) | Model Gateway como ponto único de acesso a modelos | 3 | Desenho agora, implementação na Fase 3 |
| [0037](ADR-0037-ai-data-access-policy.md) | Política de IA por tenant e níveis de acesso a dados | 1–3 | **Agora** (classificação de campos); política na Fase 3 |
| [0038](ADR-0038-deterministic-insights-and-recommenders.md) | Insights Engine e Viz Recommender determinísticos | 2–4 | Depois (Fases 2–4) |
| [0039](ADR-0039-ai-grounding.md) | Grounding: geração estruturada, metadados curados, evidências | 1–4 | Agora (campos de schema); curadoria depois |
| [0040](ADR-0040-ai-conversations.md) | Conversas do usuário, ancoradas, contexto por turno, SSE | 3 | Depois |
| [0041](ADR-0041-ai-quality-evals.md) | Qualidade da IA como código: prompts, evals, red-team | 3 | Depois (antes do AI v1) |
| [0042](ADR-0042-composition-engine-and-canonical-contracts.md) | Composition Engine (BCE) e contratos canônicos de construção — **Aceito** (2026-10-10) | 5–6 | Depois |
| [0043](ADR-0043-lde-and-bce-as-independent-services.md) | LDE e BCE como serviços independentes — **Aceito** (2026-10-10) | 3–6 | Depois |
| [0044](ADR-0044-copilot-intelligence-core.md) | Copilot com contexto global (Intelligence Core) — **Aceito** (2026-10-10) | 5–6 | Depois |

## Emendas de 2026-10-06 (IA nativa)
Os ADRs 0001, 0002, 0003, 0004, 0005, 0006, 0011, 0015, 0016, 0017, 0019, 0020, 0024, 0025, 0028, 0029, 0030 e 0032 receberam uma seção **"Emenda 2026-10-06 — IA nativa"** descrevendo extensões **aditivas** decorrentes da incorporação da IA ([31-ai-assistant](../31-ai-assistant.md)). Nenhuma decisão anterior foi revertida.

## ADRs futuros previstos
- Escolha do provedor de nuvem primário.
- Modelo de licença do core (open-core).
- Escolha do identity broker (Zitadel / Keycloak / WorkOS).
- Adoção de Apache Iceberg (Fase 3).
- Arrow JS vs Flechette (Fase 1, benchmark).
- Fornecedor de observabilidade.
- Tier DuckDB de serving (gatilho).
- Estratégia de multiplayer (Fase 7).
- Provedor de modelo inicial (bake-off de evals no início do AI v1).
- Adoção de busca vetorial (pgvector) para metadados (gatilho: recall em evals).
- Exposição do Tool Registry via MCP para agentes externos (Fase 5–6).
