# 25 — Repository Architecture

> Seção do pedido: **§39 Repository architecture** (§46 do pedido).

---

## 39.1 Monorepo vs multirepo

| Critério | Monorepo | Multirepo |
|---|---|---|
| Contratos compartilhados (schemas, proto, QDL, VizHost) | Mudança atômica em produtor + consumidores | Versionamento/publicação a cada mudança; drift |
| Código isomórfico (dashboard-core browser/Node) e Rust→WASM | Natural | Doloroso |
| Refactors transversais | Um PR | Vários PRs coordenados |
| CI | Exige detecção de afetados e cache | Simples por repo |
| Permissões/ownership | CODEOWNERS por diretório | Por repo |
| Conectores/plugins de terceiros | — | Repos próprios (consomem SDKs publicados) |

**Decisão: monorepo** para a plataforma (todos os apps, crates, pacotes, schemas, infra e docs). **Repositórios separados** apenas para: SDKs públicos espelhados (publicados a partir do monorepo), exemplos, conectores/plugins da comunidade, e o Helm chart público (espelho).

Ferramentas: **pnpm workspaces + Turborepo** (TS), **Cargo workspace** (Rust), **`just`** como task runner unificado, **mise** para versões de toolchains. Bazel/Buck2: rejeitados agora (custo de adoção alto); reavaliar com > ~100 engenheiros ou CI > 30 min mesmo com cache.

## 39.2 Estrutura proposta (melhorada)

Mudanças em relação ao exemplo do pedido: separa **TS (`packages/`)** de **Rust (`crates/`)**; cria `schemas/` e `proto/` como **fonte de contratos** de primeiro nível; separa `dashboard-core` (headless) de runtime/builder; separa `viz-sdk` (contrato) dos plugins; adiciona `ee/`, `tools/` e `testing/`.

```text
biweb/
├── apps/
│   ├── web/                      # Application Shell (SPA): rotas, admin, catálogo, modelagem; entries app e embed
│   ├── control-plane/            # Node/TS: Fastify API + módulos de domínio + Temporal workers
│   │   └── src/modules/{identity,tenancy,access,connectivity,pipelines,semantic,
│   │                    content,sharing,delivery,governance,extensibility,metering,platform,
│   │                    assistant,model-gateway}   # assistant/model-gateway: Fase 3, opcionais
│   ├── render-service/           # Node + Playwright: PNG/PDF/PPTX (usa o runtime real)
│   └── jdbc-bridge/              # Kotlin: Arrow Flight SQL sobre JDBC (cauda longa)
├── crates/                       # Rust (Cargo workspace)
│   ├── semantic/                 # tipos do modelo, BEL (parser/typechecker), compilação do modelo
│   ├── query-planner/            # resolver, policy injector, semantic planner, aggregate matcher
│   ├── sql-dialects/             # unparser/emissores por dialeto (encapsula DataFusion unparser)
│   ├── query-service/            # bin: Query API (Axum) + gRPC interno + cache + admission control
│   ├── connector-sdk/            # traits, Connector Protocol (gRPC), conformance kit
│   ├── connectors/{postgres,mysql,mssql,clickhouse,snowflake,bigquery,databricks,
│   │               s3-files,http-declarative,...}
│   ├── transform-engine/         # DAG IR → DataFusion; operadores; lineage por coluna
│   ├── ingest-executor/          # bin: execução de syncs/transformações/preaggs (TaskService gRPC)
│   ├── preagg/                   # definição, matching (compartilhado com planner), builder
│   ├── insights/                 # Insights Engine determinístico (Fase 4), usado pelo query-service
│   ├── realtime-gateway/         # bin (fase 4)
│   ├── stream-processor/         # bin (fase 4)
│   ├── policy/                   # Cedar + avaliação de DataPolicy
│   ├── arrow-utils/              # IPC, conversões, metadados de campos
│   ├── telemetry/                # tracing/OTel/log redaction
│   └── wasm-bindings/            # build WASM: semantic (+ geo kernels) para browser/Node
├── packages/                     # TypeScript (pnpm workspace)
│   ├── schema/                   # TypeBox: dashboard, widget, semantic, query (QDL), plugin manifest → JSON Schema
│   ├── dashboard-core/           # headless e isomórfico: DocumentStore, comandos/ops, migrations,
│   │                             #   runtime state, interaction engine, widget→QDL
│   ├── layout-engine/            # solvers puros (grid/free/stack/tabs, breakpoints, mobile)
│   ├── dashboard-runtime/        # renderização (React) do documento; widget host
│   ├── dashboard-builder/        # editor: interaction layer, inspector, layers, clipboard
│   ├── data-runtime/             # query manager, cache L1, worker pool, Arrow decode, DuckDB-WASM loader
│   ├── viz-sdk/                  # contrato VisualizationPlugin + VizHost (sem dependências de UI)
│   ├── viz-core/                 # plugins first-party: adapters ECharts, table, pivot, kpi, text...
│   ├── viz-geo/                  # core.map (MapLibre + deck.gl), core.scatter-xl
│   ├── viz-recommender/          # recomendação determinística de visualizações (isomórfico)
│   ├── assistant-ui/             # painel de IA, chips de contexto, preview de propostas (Fase 3, opcional)
│   ├── plugin-host/              # carregamento in-page / iframe sandbox, verificação de manifest
│   ├── ui/                       # design system (React Aria + Tailwind + tokens)
│   ├── tokens/                   # DTCG tokens → CSS vars / TS / temas de viz
│   ├── expression-editor/        # CodeMirror 6 + BEL (via WASM)
│   ├── api-client/               # gerado do OpenAPI
│   ├── embed-sdk/                # JS SDK / Web Component
│   ├── embed-react/              # wrapper React
│   └── test-utils/               # fixtures, builders de documentos, mocks de VizHost
├── schemas/                      # JSON Schemas gerados e versionados (artefato publicado)
│   ├── dashboard/v1.json  semantic-model/v1.json  qdl/v1.json  plugin-manifest/v1.json ...
├── proto/                        # gRPC/Protobuf (control↔data, connector protocol), buf.yaml
├── ee/                           # código enterprise (TS) com licença distinta
├── testing/
│   ├── e2e/                      # Playwright (fluxos A–F)
│   ├── load/                     # k6
│   ├── query-correctness/        # datasets sintéticos + casos patológicos + oráculo
│   ├── corpus/                   # documentos por versão para testes de migração
│   └── ai-evals/                 # tenants fixture, tarefas golden, red-team, prompts versionados
├── infra/
│   ├── terraform/                # módulos: global, cell, observabilidade
│   ├── docker/                   # Dockerfiles, compose (dev e self-hosted avaliação)
│   └── helm/                     # (gatilho K8s) chart da cell
├── tools/                        # codegen (schema→Rust/TS), lint de fronteiras, scripts
├── docs/
│   ├── architecture/             # este blueprint
│   │   └── adr/                  # ADRs
│   └── runbooks/
├── justfile  turbo.json  pnpm-workspace.yaml  Cargo.toml  mise.toml  CODEOWNERS
```

## 39.3 Regras do repositório
- **Fronteiras verificadas**: `dependency-cruiser`/ESLint boundaries (TS) e `cargo-deny`/regras de workspace (Rust) bloqueiam dependências proibidas (ex.: `viz-sdk` → React; `dashboard-core` → DOM; plugin → `dashboard-core`; core → `ee/`).
- **Codegen determinístico**: `packages/schema` → `schemas/*.json` → tipos Rust (`typify`) e validadores; `proto/` → TS/Rust; OpenAPI → `api-client`. Artefatos gerados verificados no CI (diff = falha).
- **Fronteira da IA**: nenhum pacote/módulo core importa `assistant-ui`, `assistant` ou `model-gateway`; SDKs de provedores de modelo só podem ser importados dentro de `model-gateway/adapters`.
- **CODEOWNERS** por contexto/time.
- **Changesets** para versionar pacotes públicos (`embed-sdk`, `viz-sdk`, `api-client`, `schema`).
