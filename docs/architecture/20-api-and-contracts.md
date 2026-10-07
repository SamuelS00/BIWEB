# 20 — API Architecture e Contratos entre Camadas

> Seções do pedido: **§29 API architecture** (§26 do pedido), **§58 Contratos entre camadas**.

---

## 29.1 Uma tecnologia por necessidade

| API | Público | Tecnologia | Motivo |
|---|---|---|---|
| **Management API** | Público (clientes, SDKs, Terraform provider futuro) + web app | **REST + OpenAPI 3.1**, JSON, `/api/v1` | Universal, cacheável, fácil de autorizar por recurso, gera SDKs |
| **Query API** | Público + runtime | **HTTP POST** `/query/v1` com QDL → **Arrow IPC stream** (default) ou JSON | Binário colunar eficiente; QDL estável; streaming |
| **Realtime API** | Runtime + público (fase 5) | **WebSocket** (protocolo próprio versionado) + SSE fallback | Multiplexação, binário, bidirecional |
| **Internal APIs** | Control ↔ data plane | **gRPC + Protobuf** (`proto/`) | Contratos tipados, streaming (progresso de tarefas), evolução compatível |
| **Plugin APIs** | Plugins | Host APIs TS (browser), **WIT** (WASM components), Connector Protocol (gRPC + Arrow) | Isolamento e versionamento independentes |
| **SDK API** | Desenvolvedores | SDKs gerados do OpenAPI (TS, Python), Embed SDK (JS/React) | Consistência |
| **SQL API** (futuro) | Ferramentas externas | **Arrow Flight SQL** e/ou **Postgres wire** sobre a semantic layer | Excel/Tableau/notebooks consumindo metrics |
| **Webhooks** | Integrações | HTTP POST assinado (HMAC, timestamp, retries) | Eventos para sistemas externos |
| **Assistant API** (Fase 3) | Web app / embeds | **HTTP POST + SSE** (`/assistant/v1/turns`), REST para conversas, propostas e política | Streaming simples, cancelável, compatível com proxies |
| **Insights API** (Fase 4) | Web app, IA, público | HTTP POST `/insights/v1` (InsightRequest → InsightResult + evidências) | Análise determinística reutilizável sem IA |
| **Tools API / MCP** (Fase 5–6) | Agentes externos autenticados como o usuário | Mesmo Tool Registry exposto via MCP/HTTP (OAuth) | Um único catálogo de ferramentas para o assistente interno e externos |

**GraphQL — rejeitado para a API pública inicial**: autorização por campo e custo de query complexos; caching HTTP perdido; o builder já é servido bem por REST + documentos. Reavaliar se integradores exigirem.

## 29.2 Convenções da Management API
- Recursos: `/workspaces`, `/folders`, `/dashboards`, `/dashboards/{id}/revisions`, `/dashboards/{id}:publish`, `/semantic-models`, `/datasets`, `/data-sources`, `/pipelines`, `/schedules`, `/alerts`, `/embed-configs`, `/plugins/installations`, `/users`, `/groups`, `/grants`, `/audit-events`.
- Ações não-CRUD como sub-recursos com `:verb` (`:publish`, `:duplicate`, `:rollback`, `:test-connection`).
- Concorrência otimista: `ETag`/`If-Match` (hash da revisão) em updates de documentos.
- Paginação por cursor; filtros padronizados; `fields` para projeção.
- Idempotência: header `Idempotency-Key` em POSTs.
- Erros: RFC 9457 (Problem Details) com códigos estáveis.
- Versionamento: major no path; mudanças aditivas sem versão; depreciação com header `Sunset`.
- Rate limits com headers padrão (`RateLimit-*`).

---

<a id="58-contratos"></a>
## 58. Contratos entre camadas

Cada contrato tem: **schema publicado**, **versão**, **regra de evolução** e **teste de contrato** no CI.

### Frontend ↔ Query API
| Aspecto | Contrato |
|---|---|
| Request | `QueryRequest` (QDL v1) — [`schemas/query.ts`](schemas/query.ts) |
| Response | Arrow IPC stream; schema metadata com `QueryResponseMeta` (campos, papéis, formatos, cache, servedBy, dataAsOf, timings, truncated) |
| Proibido | SQL, nomes físicos de colunas, IDs de data source |
| Evolução | Campos novos opcionais; `qdl: 2` só para quebra; servidor aceita N e N-1 |
| Teste | Contract tests (fixtures QDL → schema da resposta) + golden tests |

### Dashboard Engine ↔ Visualization Engine
| Aspecto | Contrato |
|---|---|
| Entrada | `VizProps` (`DataFrameView[]`, encodings → `FieldMeta`, config validada, theme tokens, locale, size, interactionState, mode) |
| Saída | `VizEvent` em coordenadas de dados |
| Descoberta | `VisualizationManifest` (dataRequirements, capabilities) |
| Proibido | Plugin buscar dados, importar `dashboard-core`, depender de React do host |
| Evolução | `hostApi` semver |

### Visualization ↔ Data Runtime
| Aspecto | Contrato |
|---|---|
| Dados | Somente via `DataFrameView` (read-only, Arrow-backed), entregue pelo runtime |
| Pedidos | `host.requestViewport(bbox, zoom)`, `host.requestPage(offset, limit)` → Dashboard Engine gera nova QDL |
| Realtime | `applyDelta(DataFrameView)` se `realtimeAppend` |

### Query Engine ↔ Semantic Layer
| Aspecto | Contrato |
|---|---|
| Artefato | **Compiled Model Snapshot** imutável `(tenant, model, revision, hash)` — entidades, grafo de joins validado, expressões BEL já tipadas (AST), políticas, pre-aggs |
| API (Rust, in-process) | `resolve_metric`, `resolve_dimension`, `join_path(entities)`, `policies_for(principal, entities)`, `preaggs()` |
| Evolução | Versão do formato do snapshot; Query Service carrega snapshots de versões suportadas ou recompila |

### Query Engine ↔ Databases
| Aspecto | Contrato |
|---|---|
| Trait `EngineAdapter` | `dialect()`, `capabilities()`, `execute(sql, params, opts) → ArrowStream`, `cancel(id)`, `estimate(sql)`, `health()`, `type_mapping()` |
| Dialeto | `Dialect` (unparser customizado): quoting, funções de data, LIMIT/OFFSET, janelas, H3/geo, aproximações |
| Opções | timeout, max rows/bytes, tags (`log_comment`/query tag com traceparent, tenant, widget) |

### Connectors ↔ Ingestion
| Aspecto | Contrato |
|---|---|
| Protocolo | Connector Protocol v1: `spec / check / discover / read / query / estimate / cancel / subscribe` ([09](09-ingestion-and-connectors.md)) |
| Dados | Arrow RecordBatches com schema canônico |
| Estado | `StateCheckpoint` opaco ao host, persistido após durabilidade do batch |
| Evolução | `connector-v1`, host suporta N e N-1 |

### Streaming ↔ Realtime Gateway
| Aspecto | Contrato |
|---|---|
| Mensagem no bus | Envelope `{tenant_id, stream_id, event_time, ingest_time, key, schema_id, payload}`; payload Avro/Protobuf/JSON registrado no schema registry |
| Mensagem no NATS | `{subject: rt.<tenant>.<stream>.<p>, seq, window?, arrow_batch}` |
| Cliente | Protocolo WebSocket v1: `subscribe/unsubscribe/snapshot/delta/resync/ack/ping` com `seq` e `resumeToken` |

### Plugins ↔ Platform
| Aspecto | Contrato |
|---|---|
| Manifest | `PluginManifest` ([`schemas/plugin-manifest.ts`](schemas/plugin-manifest.ts)) |
| Permissões | Negadas por padrão; aprovadas por instalação |
| Host APIs | `VizHost`, `ActionHost`, WIT `transform-v1`, `connector-v1`, `exporter-v1` — semver |

### Cliente ↔ Assistant (IA)
| Aspecto | Contrato |
|---|---|
| Request | `AssistantTurnRequest` com `UIContextSnapshot` ([`schemas/assistant.ts`](schemas/assistant.ts)) — dica, nunca autoridade |
| Stream | `AssistantStreamEvent` (texto, progresso de ferramentas, `proposal` com ChangeSet, citações, clarificações, avisos de política, uso) |
| Aplicação de propostas | No cliente, via `dashboard-core` (transação de undo); para objetos governados, `POST /assistant/v1/proposals/{id}:apply` → draft do objeto |

### Assistant ↔ Platform (Tool Registry)
| Aspecto | Contrato |
|---|---|
| Definição | `ToolDefinition` (JSON Schema in/out, `sideEffect` read/propose, ação Cedar, classe de dado da saída, classe de custo, `wraps`) |
| Implementação | Chama **interfaces públicas** dos módulos e RPCs existentes — sem acesso a tabelas, sem lógica de negócio própria |
| Evolução | Versão por ferramenta; descrições revisadas e cobertas por evals |

### Assistant ↔ Model Gateway
| Aspecto | Contrato |
|---|---|
| Request | `ModelRequest` (classe de tarefa, partes rotuladas por `DataClass` e confiança, ferramentas, schema de saída, budget, atribuição) |
| Garantias | Egress guard, quotas, metering e telemetria aplicados **sempre**; adapters isolam provedores |

### Control plane ↔ Data plane (interno)
| RPC | Uso |
|---|---|
| `SemanticService.CompileModel` | Validar/compilar modelo na publicação |
| `QueryService.Run` | Alertas, relatórios, cache warmup (com principal explícito) |
| `ConnectivityService.Test/Discover` | Testar conexão, descobrir schema |
| `TaskService.ExecuteTask` (stream) | Atividades Temporal delegadas (sync, transform, preagg, export de dados) |
| `CacheService.Invalidate` | Invalidações administrativas |
| `InsightsService.Run` (Fase 4) | Insights para a IA e para a UI (via Query API) com token delegado |
