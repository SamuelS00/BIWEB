# 27 — Technology Evaluation e Technology Decision Matrix

> Seções do pedido: **§43 Technology evaluation**, **§44 Technology decision matrix**, **§52 Matriz de decisão tecnológica**.

Escala usada nas matrizes: **Maturidade**, **Performance**: 1 (fraca) – 5 (excelente). **Dificuldade operacional**, **Custo**, **Lock-in**: 1 (baixo) – 5 (alto). As notas são julgamentos comparativos para *este* produto, não absolutos.

---

## 43. Visão geral da avaliação

| Área | Escolhido | Alternativas fortes | Rejeitados |
|---|---|---|---|
| Frontend framework | React + TS | Solid, Svelte 5 | Angular (peso p/ embed) |
| Estado | DocumentStore próprio + Zustand + TanStack Query | Redux Toolkit, Jotai, MobX | Zustand como modelo do documento |
| Charts | ECharts (primário) + deck.gl + tabela própria + Vega-Lite opcional | Vega-Lite como primário | Highcharts (licença), Plotly (núcleo) |
| Mapas | MapLibre + deck.gl + PMTiles | OpenLayers | Mapbox GL v2+ (licença) |
| Control plane | Node/TS + Fastify | Go | .NET, Elixir |
| Data plane | Rust + Axum/Tonic | Go, JVM (Calcite) | — |
| IR/engine embarcado | DataFusion | Calcite (JVM), DuckDB | Polars como núcleo |
| Serving analítico | ClickHouse | StarRocks | Druid, Pinot |
| Lake | Parquet (+ Iceberg depois) | Delta Lake | Formatos proprietários |
| Metadados | PostgreSQL | — | — |
| Cache | Valkey | Redis 8, Dragonfly | Memcached (sem estruturas) |
| Orquestração | Temporal | Restate, Hatchet | Airflow, Dagster, Prefect, BullMQ, Celery |
| Streaming bus | Kafka API (Redpanda/gerenciado) + NATS | Kafka puro | Pulsar |
| Transporte realtime | WebSocket (+ SSE fallback) | — | Long polling |
| Wire de dados | Arrow IPC (+ JSON) | — | CSV/JSON-only |
| Browser compute | JS typed arrays + DuckDB-WASM + Rust WASM (compilador/geo) | DataFusion-WASM | WASM generalizado |
| AuthZ | Cedar | OPA, OpenFGA/SpiceDB (adiado) | Ad hoc |
| Identity | Broker (Zitadel/Keycloak/WorkOS) | Ory | Construir SAML/OIDC próprio |
| Infra | Containers gerenciados → K8s no gatilho | — | Nomad, serverless p/ core |
| Observabilidade | OpenTelemetry | — | Agentes proprietários no código |
| Flags | OpenFeature + Unleash/flagd | LaunchDarkly | Flags ad hoc |
| Monorepo | pnpm + Turborepo + Cargo + just | Nx, moon | Bazel (agora) |
| Integração de IA | Agente com ferramentas sobre contratos da plataforma | — | Text-to-SQL, geração de documento inteiro, chatbot RAG isolado |
| Orquestração de IA | Loop próprio enxuto + interface `ModelGateway` | Bibliotecas leves multi-provedor (atrás dos adapters) | Frameworks pesados de agentes no núcleo |
| Provedores de modelo | 1 provedor via bake-off de evals + adapters previstos | Multi-provedor desde o início | Fine-tuning próprio (adiado) |
| Busca de metadados para IA | FTS do catálogo + navegação por ferramentas | pgvector (gatilho) | Banco vetorial dedicado |

---

## 52. Matrizes de decisão

### ClickHouse vs alternativas (serving analítico gerenciado)

| Critério | **ClickHouse** | StarRocks | Druid | Pinot | DuckDB (servidor) | Trino |
|---|---|---|---|---|---|---|
| Problema resolvido | OLAP interativo + ingestão contínua | OLAP MPP com joins | OLAP realtime | OLAP user-facing alta QPS | OLAP embarcado | Federação SQL |
| Vantagens | Velocidade de agregação, MVs, H3/geo, quotas, single binary, cloud gerenciado | Joins, MV rewrite, lakehouse | Rollup na ingestão | Latência/QPS | Zero ops, arquivos | Muitas fontes |
| Limitações | Joins grandes, muitas tabelas, updates caros | Ops FE/BE, ecossistema | Ops complexa, joins | Ops complexa, joins | Não concorrente/multi-tenant | Sem storage, latência |
| Maturidade | 5 | 4 | 4 | 4 | 4 | 5 |
| Dificuldade operacional | 2 (cloud) / 3 (self) | 4 | 5 | 5 | 1 | 4 |
| Performance (BI interativo) | 5 | 5 | 4 | 5 | 4 (single-node) | 3 |
| Custo | 3 | 3 | 4 | 4 | 1 | 3 |
| Lock-in | 1 (OSS) | 1 | 1 | 1 | 1 | 1 |
| **Decisão** | **Escolhido** | Alternativa registrada | Rejeitado | Rejeitado | Browser/workers/tier futuro | Adiado (conector) |

### Rust vs Go (vs Node/TS e JVM) — por plano

| Critério | **Rust** | Go | **Node/TS** | Kotlin/JVM |
|---|---|---|---|---|
| Problema | Data plane (query, conectores, ingestão, realtime) | Serviços de rede | Control plane (metadados, orquestração) | Integrações enterprise |
| Vantagens | Arrow/DataFusion nativos, sem GC, WASM, segurança de memória | Simplicidade, concorrência, ops | **Isomorfismo com o browser** (dashboard-core, schemas), Temporal SDK, produtividade | JDBC, Calcite, SAML |
| Limitações | Curva, produtividade em CRUD | Sem compartilhar código com browser, Arrow inferior, GC | CPU-bound, runtime typing | Footprint, sem WASM |
| Maturidade (para o papel) | 5 | 5 | 5 | 5 |
| Performance | 5 | 4 | 3 | 4 |
| Custo (time) | 4 | 2 | 2 | 3 |
| Lock-in | 1 | 1 | 1 | 1 |
| **Decisão** | **Data plane** | Não usado (TS ganha no control plane pelo isomorfismo) | **Control plane** | **JDBC bridge** apenas |

### Axum vs alternativas (HTTP em Rust)

| Critério | **Axum** | Actix Web | Poem/Salvo/Rocket |
|---|---|---|---|
| Vantagens | Tower (middlewares compartilhados com Tonic), ecossistema Tokio, ergonomia | Performance de topo, maduro | Ergonomia |
| Limitações | Erros de tipos às vezes verbosos | Ecossistema próprio, menos Tower | Menor adoção |
| Maturidade | 5 | 5 | 3 |
| Performance | 5 | 5 | 4 |
| **Decisão** | **Escolhido** | Alternativa válida | Rejeitados |

### React vs alternativas

| Critério | **React** | Solid | Svelte 5 | Vue 3 | Angular |
|---|---|---|---|---|---|
| Ecossistema p/ editores complexos (a11y, dnd, editores, grids) | 5 | 2 | 3 | 4 | 4 |
| Performance bruta | 4 (com stores externos) | 5 | 5 | 4 | 3 |
| Contratação | 5 | 2 | 3 | 4 | 4 |
| Tamanho p/ embed | 3 | 5 | 5 | 4 | 2 |
| Lock-in | 2 | 2 | 2 | 2 | 3 |
| **Decisão** | **Escolhido** | Rejeitado (ecossistema) | Rejeitado | Rejeitado | Rejeitado |
Mitigação do tamanho no embed: plugins lazy; runtime enxuto; Web Component encapsula.

### ECharts vs Vega(-Lite) vs D3 (vs Plotly/Highcharts)

| Critério | **ECharts** | Vega-Lite | D3 | Plotly | Highcharts |
|---|---|---|---|---|---|
| Problema | Gráficos de negócio prontos e interativos | Gramática declarativa | Primitivas | Científico | Gráficos polidos |
| Cobertura dos tipos pedidos | 5 | 3 | 5 (com esforço) | 4 | 5 |
| Performance (dados grandes) | 4 | 2 | depende | 3 | 3 |
| Customização/tema por tokens | 4 | 3 | 5 | 2 | 4 |
| SSR | Sim (Node) | Sim | Sim | Limitado | Sim |
| Licença | Apache 2.0 | BSD | ISC | MIT | **Comercial** |
| Custo de desenvolvimento | 2 | 2 | 5 | 2 | 2 |
| Lock-in (mitigado pelo contrato) | 2 | 2 | 1 | 2 | 4 |
| **Decisão** | **Primário** | Plugin opcional | Utilitário em plugins custom | Rejeitado | Rejeitado |

### MapLibre vs alternativas

| Critério | **MapLibre GL** | Mapbox GL v2+ | Leaflet | OpenLayers | CesiumJS |
|---|---|---|---|---|---|
| Vector tiles/WebGL | 5 | 5 | 2 | 4 | 4 |
| Licença | BSD | Proprietária/por uso | BSD | BSD | Apache |
| Integração deck.gl | 5 | 5 | 3 | 3 | 2 |
| Custo | 1 | 4 | 1 | 1 | 2 |
| **Decisão** | **Escolhido** | Rejeitado | Rejeitado | Rejeitado | Futuro (3D globe) |

### deck.gl vs alternativas

| Critério | **deck.gl** | Custom WebGL/WebGPU | ECharts GL | Kepler.gl |
|---|---|---|---|---|
| Milhões de pontos, camadas geo | 5 | 5 | 3 | 5 (é um app) |
| Custo de desenvolvimento | 2 | 5 | 2 | 2 (pouco customizável) |
| WebGPU | Em evolução (luma.gl v9) | Total | Não | Via deck.gl |
| **Decisão** | **Escolhido** | Adiado (gatilho) | Opcional | Inspiração |

### Kafka vs Redpanda vs NATS (vs Pulsar)

| Critério | Kafka | Redpanda | NATS JetStream | Pulsar |
|---|---|---|---|---|
| Problema | Log durável, replay, ecossistema | Kafka API simplificado | Mensageria leve + fan-out + streams | Mensageria multi-tenant |
| Vantagens | Ecossistema (Connect, Debezium) | Binário único, latência, schema registry | Subjects/wildcards, accounts, leve | Multi-tenancy, tiered storage |
| Limitações | Ops (KRaft simplificou) | BSL em partes, ecossistema menor | Replay/retenção menos fortes para grandes volumes | Ops complexa |
| Maturidade | 5 | 4 | 4 | 4 |
| Dificuldade operacional | 4 (self) / 2 (gerenciado) | 2 | 2 | 5 |
| **Decisão** | **Kafka API** como contrato; gerenciado no SaaS | Implementação preferida self-hosted | **Fan-out interno** do realtime | Rejeitado |

### Redis vs alternativas

| Critério | **Valkey** | Redis 8 | Dragonfly | Memcached | KeyDB |
|---|---|---|---|---|---|
| Licença | BSD | AGPLv3/RSAL/SSPL (tri-licença) | BSL | BSD | BSD (manutenção incerta) |
| Compatibilidade de protocolo | Redis | — | Redis | Própria | Redis |
| Gerenciado | ElastiCache/Memorystore | Redis Cloud | Dragonfly Cloud | Sim | Não |
| Estruturas (streams, scripts, sorted sets p/ rate limit) | 5 | 5 | 4 | 1 | 4 |
| **Decisão** | **Escolhido** | Alternativa (licença a avaliar para self-hosted) | Avaliar por custo em escala | Rejeitado | Rejeitado |

### Arrow vs JSON (wire de dados)

| Critério | **Arrow IPC** | JSON |
|---|---|---|
| Tamanho | Menor (colunar + compressão HTTP) | Maior (chaves repetidas, números como texto) |
| Parse no browser | Sem parse por valor; buffers diretos | `JSON.parse` domina o tempo acima de ~50k linhas |
| Tipos | int64, decimal, timestamp tz, nulos preservados | Perdas (int64, datas como string) |
| Streaming | Sim (stream format) | Difícil (NDJSON) |
| Debug/interoperabilidade | Requer ferramentas | Universal |
| **Decisão** | **Default** para dados | Fallback, respostas pequenas, terceiros |

### WASM vs JS puro (browser compute)

| Critério | Rust/WASM | **JS (typed arrays)** | **DuckDB-WASM** |
|---|---|---|---|
| Filtro/ordenação/agrupamento ≤ 100k linhas | Ganho anulado por cópia | **Suficiente** | Overhead de inicialização |
| Engine SQL local completo | Construir = caro | Inviável | **Pronto** |
| Compilador semântico compartilhado | **Único jeito sem duplicar código** | Duplicaria lógica | — |
| Kernels geo (H3, PIP em massa) | **Ganho real** | Possível, mais lento | Extensão spatial |
| Tamanho de download | Médio | Zero | Grande (lazy) |
| **Decisão** | Compilador + geo | **Caminho padrão** | Datasets locais |

### Polars vs DataFusion vs DuckDB (engine de transformação/IR)

| Critério | Polars | **DataFusion** | DuckDB |
|---|---|---|---|
| Problema | DataFrames rápidos | Engine de consulta extensível como biblioteca | OLAP embarcado |
| Extensibilidade (regras de otimizador, fontes, UDFs) | 3 | **5** | 3 |
| Estabilidade da API Rust | 2 | 4 | 4 (via bindings C) |
| Planos lógicos inspecionáveis (lineage) / unparser SQL | 2 | **5** | 2 |
| Performance | 5 | 4 | 5 |
| Leitura de arquivos "sujos" (CSV sniffing) | 4 | 3 | **5** |
| WASM | Limitado | Possível | **Maduro** |
| **Decisão** | Fora do núcleo | **Núcleo** (transformação + IR + pós-processamento) | Sniffing de arquivos + browser + tier futuro |

### Temporal vs alternativas

| Critério | **Temporal** | Airflow | Dagster | Prefect | BullMQ | Celery | Custom | Restate |
|---|---|---|---|---|---|---|---|---|
| Workflows duráveis multi-etapa | 5 | 3 | 3 | 3 | 2 | 2 | ? | 4 |
| Multi-tenant dinâmico (milhares de tenants, jobs criados por usuários) | 5 | 1 | 2 | 2 | 3 | 3 | ? | 4 |
| Retries/timeouts/heartbeats/cancel/signals | 5 | 3 | 3 | 3 | 3 | 2 | ? | 4 |
| Maturidade | 5 | 5 | 4 | 4 | 4 | 5 | — | 3 |
| Dificuldade operacional | 2 (Cloud) / 4 (self) | 3 | 3 | 3 | 2 | 3 | 5 | 2 |
| Linguagens | TS/Go/Java/Python/.NET (Rust em evolução) | Python | Python | Python | Node | Python | — | TS/Java/Rust/Go/Python |
| **Decisão** | **Escolhido** | Rejeitado | Rejeitado | Rejeitado | Rejeitado | Rejeitado | Rejeitado | Acompanhar |

---

## 44. Technology decision matrix (resumo ponderado)

Pesos para este produto: Adequação ao problema 30% · Maturidade 20% · Operação 15% · Performance 15% · Custo 10% · Lock-in 10%. Nota final 1–5 (maior = melhor; operação/custo/lock-in invertidos).

| Decisão | Escolha | Nota | Runner-up | Nota | Margem |
|---|---|---|---|---|---|
| Serving analítico | ClickHouse | 4,5 | StarRocks | 3,9 | Clara |
| Data plane | Rust | 4,5 | Go | 3,8 | Clara |
| Control plane | Node/TS | 4,3 | Go | 4,0 | **Estreita** (isomorfismo decide) |
| Charts | ECharts (+ híbrido) | 4,5 | Vega-Lite | 3,5 | Clara |
| Mapas | MapLibre + deck.gl | 4,8 | OpenLayers | 3,4 | Clara |
| IR/engine | DataFusion | 4,3 | Calcite | 3,7 | Média |
| Orquestração | Temporal | 4,5 | Restate | 3,6 | Clara |
| Bus | Kafka API | 4,2 | NATS JetStream | 3,8 | Média |
| AuthZ | Cedar | 4,2 | OPA | 3,7 | Média |
| Cache | Valkey | 4,4 | Redis 8 | 4,1 | Estreita (licença) |
| Wire | Arrow IPC | 4,6 | JSON | 3,0 | Clara |
| Front framework | React | 4,4 | Svelte 5 | 3,6 | Clara |

Decisões com margem **estreita** têm ADR com critérios explícitos de reversão.

---

## Matrizes adicionais — IA nativa

### Estratégia de integração da IA

| Critério | **Agente com ferramentas sobre contratos** | Text-to-SQL | Geração do documento inteiro | Chatbot RAG |
|---|---|---|---|---|
| Grounding/precisão | 5 | 2 | 3 | 2 |
| Segurança herdada (RLS, authz) | 5 | 2 | 3 | 4 |
| Ações auditáveis e reversíveis | 5 | — | 2 | — |
| Duplicação de lógica | Nenhuma | Alta | Média | Baixa |
| Custo de construção | Médio | Baixo | Baixo | Baixo |
| **Decisão** | **Escolhido** | Rejeitado | Rejeitado | Insuficiente |

### Orquestração / framework

| Critério | **Loop próprio + `ModelGateway`** | Frameworks pesados de agentes/RAG | Biblioteca leve multi-provedor direto nos módulos |
|---|---|---|---|
| Controle de política, egress, budgets, auditoria | 5 | 2 | 3 |
| Estabilidade de API | 5 | 2 | 3 |
| Velocidade inicial | 3 | 4 | 4 |
| Lock-in | 1 | 4 | 3 |
| **Decisão** | **Escolhido** (biblioteca leve pode ser usada *dentro* dos adapters) | Rejeitado | Rejeitado como acoplamento direto |

### Busca de metadados para contexto

| Critério | **FTS + navegação por ferramentas** | pgvector (Postgres) | Banco vetorial dedicado |
|---|---|---|---|
| Recall em modelos pequenos/médios | 4 | 5 | 5 |
| Operação | 1 (já existe) | 2 | 4 |
| Isolamento multi-tenant | RLS | RLS | Próprio |
| Privacidade (embeddings exigem chamada a modelo) | Não exige | Exige (política) | Exige |
| **Decisão** | **v1** | **Gatilho** por evals | Rejeitado |

### Estratégia de provedores

| Critério | **1 provedor + interface preparada** | Multi-provedor completo no v1 | Modelo próprio/fine-tuned |
|---|---|---|---|
| Complexidade inicial | 2 | 4 | 5 |
| Independência de fornecedor | 4 (adapters previstos) | 5 | 5 |
| Atende enterprise (BYO/região) | Via adapter BYO na Fase 6 | Sim | Sim |
| Qualidade | Melhor do bake-off | Varia | Incerta |
| **Decisão** | **Escolhido** | Adiado | Adiado |

### Onde o agente executa

| Critério | Browser | Servidor cego à UI | **Híbrido (servidor + contexto/preview no cliente)** |
|---|---|---|---|
| Segurança/auditoria/quotas | 1 | 5 | 5 |
| Entende a seleção e o estado não salvo | 5 | 1 | 5 |
| Funciona em embeds | 2 | 4 | 5 |
| **Decisão** | Rejeitado | Insuficiente | **Escolhido** |

### Resumo ponderado (acréscimo ao §44)

| Decisão | Escolha | Nota | Runner-up | Nota | Margem |
|---|---|---|---|---|---|
| Integração de IA | Agente com ferramentas | 4,7 | Geração de documento | 2,8 | Clara |
| Orquestração | Loop próprio + gateway | 4,3 | Biblioteca leve direta | 3,6 | Média |
| Busca de metadados | FTS (v1) | 4,2 | pgvector | 4,0 | **Estreita** (gatilho definido) |
| Provedores | 1 + interface | 4,3 | Multi-provedor | 3,5 | Média |
