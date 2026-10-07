# 28 — Fluxos Completos (A–F)

> Seção do pedido: **§53 Fluxos completos**.

---

## FLOW A — Conectar PostgreSQL → schema discovery → dataset → semantic model → metric → gráfico → query → render

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário (modelador)
  participant WEB as Web App
  participant CP as Control plane
  participant KMS as KMS
  participant DP as Data plane (Connector Runtime / Semantic)
  participant PG as PostgreSQL do cliente
  participant QS as Query Service

  U->>WEB: Nova conexão PostgreSQL (host, db, user, senha, SSL)
  WEB->>CP: POST /data-sources (config + segredo)
  CP->>KMS: cifra segredo com DEK do tenant
  CP->>CP: grava data source + secret ciphertext (Postgres, RLS por tenant)
  CP->>DP: gRPC Test(dataSourceId)
  DP->>KMS: decifra DEK → credencial em memória
  DP->>PG: conecta (TLS), SELECT version(), checa permissões
  DP-->>CP: health OK
  CP->>DP: gRPC Discover
  DP->>PG: information_schema / pg_catalog (tabelas, colunas, tipos, PKs, FKs, estatísticas)
  DP-->>CP: Catalog (tipos canônicos, PKs, FKs candidatas)
  CP-->>WEB: lista de tabelas
  U->>WEB: escolhe orders, customers → modo Live
  WEB->>CP: POST /datasets (source=table, access=live)
  CP->>CP: cria datasets, lineage: pg.orders.* → dts_orders.*
  U->>WEB: Cria modelo "Vendas": entidades Order/Customer, relação N:1 (sugerida pelas FKs)
  U->>WEB: Measure gross_amount = SUM([amount]-[discount]) WHERE status='paid'
  WEB->>WEB: semantic.wasm valida BEL (tipos, campos) em tempo real
  U->>WEB: Metric "Receita" (BRL, formato moeda, descrição) → Publicar
  WEB->>CP: PUT /semantic-models/{id} + :publish
  CP->>DP: gRPC CompileModel(revisão)
  DP-->>CP: snapshot compilado OK (grafo de joins, tipos, políticas)
  CP->>CP: revisão imutável + ponteiro published, evento semantic_model.published
  U->>WEB: Novo dashboard → arrasta "Bar chart" → arrasta País para X e Receita para Y
  WEB->>WEB: dashboard-core: comando SetWidgetBinding → QueryRequest (QDL)
  WEB->>QS: POST /query/v1 (QDL, Arrow)
  QS->>QS: resolve → policy (RLS) → plano → SQL dialeto Postgres → cache miss
  QS->>PG: SELECT upper(c.country_code), SUM(o.amount-o.discount) ... GROUP BY 1 /* traceparent */
  PG-->>QS: linhas → Arrow
  QS-->>WEB: Arrow IPC + meta (formatos, cache=miss, timings)
  WEB->>WEB: worker decodifica → DataFrameView → plugin core.bar (ECharts) renderiza
```

**Notas:** o modelador nunca escreve SQL; o PostgreSQL de produção deve ser réplica (o produto recomenda e limita concorrência por data source). Se a tabela for grande e o banco OLTP, o produto sugere **Import incremental** em vez de Live.

---

## FLOW B — CSV com milhões de linhas → upload → object storage → parsing → normalização → Parquet → engine analítico → dashboard

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant WEB as Web App
  participant CP as Control plane
  participant S3 as Object storage
  participant T as Temporal
  participant IX as Ingest executor (Rust)
  participant CH as ClickHouse

  U->>WEB: arrasta vendas_2025.csv (3 GB)
  WEB->>CP: POST /uploads (nome, tamanho, hash)
  CP-->>WEB: URLs pré-assinadas multipart (prefixo tenants/{id}/uploads/{upl})
  WEB->>S3: upload multipart direto (paralelo, retomável)
  WEB->>CP: POST /uploads/{id}:complete
  CP->>T: start DatasetSyncWorkflow(upload)
  T->>IX: atividade Profile (gRPC)
  IX->>S3: lê amostra (range requests)
  IX->>IX: DuckDB sniffer: encoding, delimitador, header, tipos, perfil de colunas
  IX-->>CP: schema inferido + perfil + avisos
  CP-->>WEB: tela de confirmação (tipos, nomes, PK opcional, transformações sugeridas)
  U->>WEB: ajusta tipos, renomeia, define data/hora e moeda → Confirmar
  WEB->>CP: pipeline (DAG: cast, rename, trim, dedupe, validate)
  CP->>T: signal confirm
  T->>IX: atividade Transform (stream)
  IX->>S3: lê CSV em streaming
  IX->>IX: DataFusion: parse → cast → normaliza → valida (quarentena de linhas inválidas)
  IX->>S3: escreve curated/{dataset}/snapshots/{snap}/part-*.parquet (ZSTD, ordenado, row groups)
  IX-->>T: progresso/heartbeats (linhas, bytes)
  T->>IX: atividade Load
  IX->>CH: CREATE TABLE t_{tenant}.ds_{id}_v1 ... , INSERT FROM s3(parquet)
  T->>CP: Publish snapshot (ponteiro current → v1, dataVersion)
  CP-->>WEB: evento: dataset pronto (WebSocket de notificações)
  U->>WEB: "Criar modelo/dashboard a partir do dataset" (modelo auto-gerado: dimensões e measures sugeridas)
  WEB->>WEB: dashboard → QDL → Query Service → ClickHouse (como Flow D)
```

**Notas:** o upload nunca passa pelo control plane (URLs pré-assinadas). Linhas inválidas vão para uma tabela de quarentena consultável. O Parquet é a verdade; a tabela ClickHouse pode ser recriada.

---

## FLOW C — Fonte envia dados em tempo real → streaming bus → processor → realtime gateway → browser → atualização

```mermaid
sequenceDiagram
  autonumber
  participant SRC as Sistema do cliente
  participant IG as Ingest gateway
  participant BUS as Kafka-API
  participant CH as ClickHouse (MV)
  participant SP as Stream processor
  participant N as NATS
  participant RG as Realtime Gateway
  participant QS as Query Service
  participant BR as Browser

  BR->>QS: snapshot inicial (QDL do widget realtime) 
  QS->>CH: SELECT agregado (MV) → watermark = offset/tempo
  QS-->>BR: Arrow + watermark
  BR->>RG: WebSocket subscribe {subId, qdl, mode: window 1s, maxRate 2Hz, from: watermark}
  RG->>RG: autentica sessão, compila QDL + RLS → predicado/agg incremental
  RG->>N: assina rt.{tenant}.{stream}.*
  SRC->>IG: POST /ingest/{stream} (lote de eventos, API key)
  IG->>IG: valida schema (registry), carimba tenant_id
  IG->>BUS: produce t.{tenant}.{stream}
  BUS->>CH: Kafka engine → MV incremental (janelas)
  BUS->>SP: consome
  SP->>SP: janela 1s, agrega, calcula delta
  SP->>N: publish rt.{tenant}.{stream}.{p} {seq, window, arrow_batch}
  N->>RG: entrega
  RG->>RG: aplica RLS da subscription, coalescing (2 Hz)
  RG-->>BR: delta {subId, seq, arrow}
  BR->>BR: Data Runtime aplica delta → plugin.applyDelta() (sem re-render completo)
  Note over BR,RG: queda de conexão → reconnect com resumeToken {subId, lastSeq} → buffer ou resync (snapshot)
```

---

## FLOW D — Usuário muda filtro → dashboard engine → query engine → cache → database → Arrow → runtime → visualização

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant CTRL as Controle de filtro
  participant CORE as dashboard-core
  participant DR as Data Runtime
  participant QS as Query Service
  participant VK as Valkey (L3)
  participant DB as ClickHouse / warehouse
  participant VZ as Plugins

  U->>CTRL: Período = "últimos 6 meses"
  CTRL->>CORE: setFilter(flt_period, valor)
  CORE->>CORE: recalcula filtros efetivos, identifica widgets afetados (escopo + ignoreFilters)
  CORE->>DR: novas QueryRequests (prioridade: visíveis), cancela as anteriores em voo
  DR->>DR: L1 por fingerprint? coarsening local possível?
  alt hit L1 / reagregação local
    DR-->>CORE: frames (≤ 100 ms)
  else
    DR->>QS: POST /query/v1 (Arrow, AbortSignal)
    QS->>QS: resolve → policy → plano → preagg match → SQL seguro → fingerprint
    QS->>VK: GET qc:{tenant}:{fingerprint}
    alt hit L3
      VK-->>QS: Arrow bytes
    else miss
      QS->>DB: executa (slot do tenant, timeout)
      DB-->>QS: batches
      QS->>VK: SET (TTL / dataVersion)
    end
    QS-->>DR: Arrow IPC stream + meta
    DR->>DR: worker decode → transfer → DataFrameView
  end
  CORE->>VZ: update(props) — apenas widgets afetados
  VZ-->>CORE: rendered (telemetria por widget)
```

---

## FLOW E — Dataset local no browser → Web Worker → WASM → filter → aggregation → visualização

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant WEB as Web App
  participant DR as Data Runtime
  participant DW as DuckDB Worker (duckdb-wasm)
  participant SW as semantic.wasm (worker)
  participant VZ as Plugin

  U->>WEB: abre arquivo local vendas.parquet (modo "local / offline")
  WEB->>DR: registerLocalDataset(File)
  DR->>DW: lazy-load duckdb-wasm (primeira vez), registerFileHandle
  DW->>DW: DESCRIBE / perfil de colunas
  DW-->>DR: schema
  DR->>SW: gera modelo semântico local (dimensões/measures sugeridas)
  U->>WEB: monta gráfico (Região × Receita) e filtro (Ano = 2025)
  WEB->>DR: QueryRequest (QDL — o mesmo contrato do servidor)
  DR->>SW: compile(QDL, modelo local, dialect=duckdb)
  SW-->>DR: SQL DuckDB
  DR->>DW: query (Arrow out)
  DW-->>DR: Arrow (transferable)
  DR-->>VZ: DataFrameView → render
  Note over WEB,DW: dado nunca sai do dispositivo, mesmo dashboard pode depois ser "publicado" fazendo upload (Flow B) sem mudar o documento
```

**Notas:** o documento do dashboard é o mesmo; apenas a *fonte* do modelo é local. Limites de memória do dispositivo aplicados ([13](13-browser-data-runtime.md)).

---

## FLOW F — Dashboard compartilhado externamente → embed token → permissões → definição → segurança de query → render

```mermaid
sequenceDiagram
  autonumber
  actor EU as Usuário final (cliente do ISV)
  participant ISV as Backend do ISV
  participant HOST as Página do ISV
  participant RT as Runtime embutido (iframe/SDK)
  participant EAPI as Embed API (control plane)
  participant AC as Access Control (Cedar)
  participant QS as Query Service
  participant DB as Engine

  EU->>HOST: acessa "Relatórios"
  HOST->>ISV: pede token
  ISV->>ISV: assina JWT (kid do tenant): sub=cliente_42, resources=[dsh_x], attrs={customer_id: 42}, filters travados, exp=10min
  ISV-->>HOST: token
  HOST->>RT: monta {iframe}/{bi-dashboard} com token
  RT->>EAPI: POST /embed/sessions
  EAPI->>EAPI: verifica assinatura, exp, aud, jti (anti-replay), origem ∈ allowlist, resources ⊆ embed config
  EAPI->>AC: principal externo (tenant ISV, papel embed-viewer, attrs)
  AC-->>EAPI: allow view dsh_x
  EAPI-->>RT: sessão curta + documento publicado (sem metadados internos sensíveis)
  RT->>QS: QDL dos widgets (sessão de embed)
  QS->>QS: policy injector: RLS [customer_id] = @user.attributes.customer_id (42), filtros travados aplicados no servidor
  QS->>DB: SQL seguro
  DB-->>QS: dados apenas do cliente 42
  QS-->>RT: Arrow
  RT-->>EU: dashboard renderizado com tema do ISV
  RT-->>HOST: postMessage "loaded" / "dataPointClicked"
```

**Notas:** filtros "travados" são aplicados **no servidor** (claims do token), não confiados ao cliente; o usuário final não consegue removê-los via devtools.

---

## FLOW G — Usuário seleciona um widget → "melhore isso" → proposta → preview → aceitar → undo disponível

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário (builder)
  participant B as Builder + Context Collector
  participant A as Assistant Orchestrator
  participant CX as Context Engine
  participant MG as Model Gateway
  participant T as Tools (Viz Recommender, Proposal Service)
  participant CORE as dashboard-core

  U->>B: seleciona "Receita por estado" e digita "melhore isso"
  B->>B: flush do autosave → draftVersion 42
  B->>A: POST /assistant/v1/turns (mensagem + UIContextSnapshot: dashboard, página, seleção wdg_x, filtros)
  A->>CX: resolve snapshot com o principal do usuário (via=assistant)
  CX-->>A: widget completo + resumo do dashboard + campos semânticos + QDL efetiva + resumo do resultado (política aggregates)
  A-->>B: SSE context.resolved (chips: Dashboard Vendas · Selecionado: Receita por estado · Filtro: 12 meses)
  A->>MG: ModelRequest standard (partes rotuladas, egress guard aplica política)
  MG-->>A: chamada de ferramenta recommend_visualization(shape: 27 categorias, 1 métrica)
  A->>T: recommend_visualization
  T-->>A: core.bar horizontal ordenado (score 0.92), core.map choropleth (0.81)
  A->>MG: continua
  MG-->>A: propose_dashboard_changes(itens: barras horizontais ordenadas, top 10 + outros, rótulos de dados)
  A->>T: Proposal Service simula com dashboard-core (schema, plugin configSchema, permissões)
  T-->>A: ChangeSet válido, risco low, base draftVersion 42
  A-->>B: SSE proposal (ChangeSet) + texto curto com justificativa
  B->>CORE: camada de proposta (doc ⊕ changeSet), preview no canvas
  U->>B: Aceitar
  B->>CORE: aplica como 1 transação (origin assistant), autosave
  Note over U,CORE: Undo desfaz tudo em um passo. Auditoria assistant.proposal.applied
```

---

## FLOW H — "Por que o faturamento caiu neste período?" → Insights Engine → resposta com evidências

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário (visualizando)
  participant R as Runtime + assistant-ui
  participant A as Assistant Orchestrator
  participant MG as Model Gateway
  participant QS as Query Service (token delegado)
  participant INS as Insights Engine

  U->>R: clica no ponto de março do gráfico de linha → "por que caiu?"
  R->>A: turn (seleção data-point {month: 2026-03}, widget, filtros ativos)
  A->>MG: standard: intenção = explicar variação
  MG-->>A: explain_change(base = QDL do widget, from 2026-02, to 2026-03)
  A->>INS: InsightRequest explain-change (budget: 12 queries)
  INS->>QS: QDLs por dimensão candidata (região, produto, canal), com RLS do usuário
  QS-->>INS: Arrow (cache/preaggs quando possível)
  INS-->>A: findings: Sudeste −62% da queda (produto X), efeito mix, evidências: q1..q5, limitações
  A->>MG: narrar findings (resultados agregados permitidos pela política)
  MG-->>A: texto com citações [q2][q4]
  A->>A: verificador de grounding confere os números contra as evidências
  A-->>R: SSE texto + citações + mini-gráfico de evidência + sugestão "adicionar widget de decomposição" (ChangeSet)
  Note over R: Com metadata-only, a IA monta a análise e o usuário vê os valores renderizados, mas o modelo não os recebe nem os narra
```

---

## FLOW I — "Crie uma métrica de ticket médio" → proposta no draft do modelo → impact analysis → publicação humana

```mermaid
sequenceDiagram
  autonumber
  actor U as Modelador
  participant A as Assistant
  participant T as Tools
  participant SEM as Semantic compiler (data plane)
  participant GOV as Governance (lineage)
  participant CP as Control plane (semantic)

  U->>A: "crie uma métrica de ticket médio"
  A->>T: search_fields("receita", "pedidos") → met_revenue (certificada), msr_orders
  A->>T: propose_metric({ratio: met_revenue / msr_orders, formato moeda, descrição})
  T->>SEM: compile draft do modelo (tipos, aditividade, grafo)
  SEM-->>T: ok (ratio não aditiva → totais recalculados corretamente)
  T->>GOV: impact analysis (nenhum objeto afetado: métrica nova)
  T-->>A: ChangeSet (target semantic-model, risco medium)
  A-->>U: proposta + explicação + "ver definição"
  U->>CP: aceitar → aplicado no DRAFT do modelo (origin assistant)
  U->>CP: Publicar (fluxo humano normal: compile + impact + revisão)
```

---

## FLOW J — "Separe nome e sobrenome e remova duplicados" → ops do catálogo → preview → pipeline draft

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant A as Assistant
  participant T as Tools
  participant IX as Transformation Engine (preview)

  U->>A: no editor de pipeline, com a coluna "nome_completo" selecionada
  A->>T: propose_transformation([split_column(nome_completo, " ", limite 1), deduplicate(keys [cpf], keep latest)])
  T->>T: valida ops contra o catálogo (JSON Schema) e BEL
  T->>IX: preview em amostra (principal do usuário)
  IX-->>T: amostra antes/depois + contagens (1.204 duplicados removidos)
  T-->>A: ChangeSet (target pipeline, risco medium) + preview
  A-->>U: proposta com preview tabular
  U->>A: aceitar → revisão draft do pipeline
  Note over U,IX: Execução real segue Temporal e os controles normais. Nenhum código é gerado ou executado
```
