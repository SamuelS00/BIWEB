# 01 — High-Level Architecture

> Seções do pedido: **§4 High-level architecture**, revisão da cadeia de camadas (§3 do pedido), **§57 Princípio de processamento**.

---

## 4.1 Revisão crítica da cadeia proposta

A cadeia sugerida (`Fontes → Connectors → Ingestion → Normalization → Storage → Semantic → Query → Cache → API → Streaming → Browser Runtime → Dashboard Engine → Visualization → Builder → End User`) mistura **três eixos diferentes** numa linha única:

1. **Caminho de escrita de dados** (assíncrono, em lote/stream): conectar → extrair → transformar → materializar.
2. **Caminho de leitura/consulta** (síncrono, interativo): pergunta semântica → plano → execução → resultado.
3. **Caminho de apresentação** (browser): estado → queries → dados → pixels.

Problemas da cadeia linear:

- **Live query não passa por ingestão.** Em modo live, o Query Engine fala diretamente com o conector (pushdown). Uma cadeia linear sugere que todo dado é ingerido.
- **Cache e pre-aggregation não são camadas abaixo da API**: são **decisões do planner** (aggregate awareness, cache lookup por fingerprint). Tratar como camada leva a cache "burro" na frente da API, que vaza dados entre usuários com RLS diferente.
- **Streaming não fica entre API e browser**: é um caminho paralelo de escrita (bus → processor → storage) com um *gateway de leitura incremental* irmão da Query API.
- **Builder não fica "acima" da visualização**: Builder é um *editor do documento*; o Runtime interpreta o documento; a visualização é plugada no runtime. Builder e End User usam o **mesmo runtime**.
- **Semantic Layer não fica "acima do storage"** apenas: ela também descreve fontes live e é usada no browser (WASM) para validar e compilar.

### Cadeia revisada (três caminhos + metadados)

```mermaid
flowchart LR
  subgraph W["Caminho de escrita (async)"]
    direction LR
    SRC[(Fontes)] --> CON[Connector Runtime]
    CON --> ING[Ingestion<br/>extract + checkpoint]
    ING --> TRF[Transformation Engine<br/>DAG]
    TRF --> LAKE[(Parquet snapshots<br/>object storage)]
    LAKE --> SERV[(ClickHouse<br/>serving)]
    STR[Streaming bus] --> SP[Stream processor] --> SERV
  end

  subgraph R["Caminho de leitura (sync)"]
    direction LR
    QAPI[Query API] --> QE[Query Engine<br/>resolve → policy → plan<br/>→ preagg match → compile]
    QE --> CACHE{{Cache L2/L3}}
    QE --> SERV
    QE -->|live pushdown| CON
    RTG[Realtime Gateway] --> SP
  end

  subgraph M["Metadados (control plane)"]
    SEM[Semantic Models] -.-> QE
    CNT[Dashboards / Content] -.-> UI
    GOV[Lineage / Catálogo] -.-> SEM
  end

  subgraph P["Caminho de apresentação (browser)"]
    direction LR
    UI[Shell / Builder] --> DE[Dashboard Engine<br/>headless]
    DE --> DR[Data Runtime<br/>workers + Arrow]
    DR --> QAPI
    DR --> RTG
    DE --> VR[Visualization Runtime<br/>plugins]
  end
```

### Responsabilidade de cada camada

| Camada | Responsabilidade | NÃO é responsável por |
|---|---|---|
| **Connector Runtime** | Autenticação na fonte, descoberta de schema, leitura paginada/incremental, execução de SQL pushdown, rate limit, retries | Regras de negócio, transformação, cache |
| **Ingestion** | Planejar extrações, checkpoints, staging, idempotência, schema drift, publicação atômica de snapshots | Interpretar significado dos dados |
| **Transformation Engine** | Executar DAG declarativo (pushdown SQL ou DataFusion), validação, lineage por coluna | Definir métricas de negócio |
| **Managed Storage** | Snapshots Parquet (verdade) + tabelas de serving no ClickHouse + pre-aggs | Autorização de usuário final |
| **Semantic Layer** | Entidades, relações, dimensões, measures, metrics, políticas, formatos; compilação de expressões | Execução de queries |
| **Query Engine** | Resolver QDL, injetar políticas, planejar joins, escolher pre-agg/cache, compilar dialeto, executar, pós-processar | Renderização, estado de UI |
| **Query API / Realtime Gateway** | AuthN, rate limit, serialização Arrow/JSON, subscriptions, backpressure | Lógica de planejamento |
| **Data Runtime (browser)** | Cache L1, deduplicação, priorização e cancelamento de queries, decodificação Arrow, computação local (workers/WASM) | Construir SQL |
| **Dashboard Engine** | Interpretar documento: estado de filtros/parâmetros/seleções, gerar QueryRequests por widget, propagar interações | Desenhar pixels |
| **Visualization Runtime** | Montar plugins, entregar `DataFrameView`, traduzir eventos normalizados | Buscar dados |
| **Builder** | Editar o documento via comandos; inspector, árvore, layout | Executar dashboards de forma diferente do runtime |
| **Application Shell** | Navegação, auth de sessão, catálogo, administração | Lógica de dashboard |
| **Assistant (IA, opcional)** | Orquestrar ferramentas que encapsulam as capacidades acima; montar contexto a partir da UI; propor ChangeSets; narrar resultados com evidências | Acessar dados ou mutar documentos por caminho próprio; calcular números; ser dependência de qualquer camada |
| **Model Gateway** | Ponto único de chamadas a modelos: roteamento, egress guard, quotas, metering, telemetria | Lógica de produto |
| **Insights Engine** | Algoritmos determinísticos (comparação, decomposição de variação, anomalias, outliers) via QDL | Narrativa; acesso fora do planner |

---

## 4.2 Arquitetura geral (sistema completo)

```mermaid
flowchart TB
  subgraph Clients["Clientes"]
    WEB[Web App<br/>React SPA]
    EMB[Embeds<br/>iframe / JS SDK]
    API_C[Integrações<br/>REST / SDKs]
    BI_T[Ferramentas externas<br/>Flight SQL / PG wire — futuro]
  end

  subgraph Edge["Edge"]
    CDN[CDN<br/>assets, PMTiles, plugins]
    GW[API Gateway / LB<br/>TLS, WAF, roteamento por cell]
  end

  subgraph Global["Global (fora das cells)"]
    ROUTER[Tenant Router<br/>tenant → cell]
    IDP[Identity Broker<br/>Zitadel/Keycloak/WorkOS]
    REG[Plugin Registry]
  end

  subgraph Cell["Cell (unidade de deploy/isolamento)"]
    subgraph CP["Control plane — TypeScript (monolito modular)"]
      MGMT[Management API]
      TW[Temporal workers<br/>orquestração]
      OUTBOX[Outbox / jobs leves]
    end
    subgraph DP["Data plane — Rust"]
      QS[Query Service<br/>planner + compiler + cache]
      CR[Connector Runtime]
      IX[Ingest / Transform Executor]
      PA[Pre-agg Builder]
      RT[Realtime Gateway]
      SPR[Stream Processor]
    end
    AST[Assistant + Model Gateway<br/>IA opcional, no control plane]
    INS[Insights Engine<br/>no query-service]
    RENDER[Render Service<br/>Node + Playwright]
    JDBC[JDBC Bridge<br/>Kotlin, Flight SQL]

    PG[(PostgreSQL<br/>metadados)]
    VK[(Valkey<br/>cache / rate limit)]
    CH[(ClickHouse<br/>serving + preaggs + telemetria)]
    S3[(Object storage<br/>Parquet, uploads, exports)]
    TMP[(Temporal)]
    BUS[(Kafka-API bus + NATS<br/>fase Realtime)]
  end

  EXT[(Fontes do cliente<br/>Postgres, Snowflake, BigQuery,<br/>APIs SaaS, arquivos)]
  KMS[(KMS / Vault)]
  LLM[(Provedores de modelo<br/>ou modelo privado do tenant)]

  WEB & EMB --> CDN
  WEB & EMB & API_C --> GW
  BI_T -.-> GW
  GW --> ROUTER
  GW --> MGMT & QS & RT
  MGMT --> IDP
  MGMT --> PG
  MGMT --> TMP
  TW --> TMP
  TW -->|gRPC| IX & PA
  MGMT -->|gRPC: validar modelos| QS
  QS --> VK & CH & CR
  CR --> EXT
  CR --> JDBC --> EXT
  IX --> CR
  IX --> S3 --> CH
  PA --> CH
  SPR --> BUS --> RT
  SPR --> CH
  RENDER --> GW
  CR & IX --> KMS
  REG --> CDN
  GW --> AST
  AST -->|"ferramentas: QDL com principal delegado"| QS
  AST -->|"simula ChangeSets"| MGMT
  AST --> INS
  AST -->|"egress guard"| LLM
```

**Leitura do diagrama**
- O **gateway** roteia por cell usando o Tenant Router (mapeamento cacheado). Dentro da cell, rotas `/api/v1/*` vão ao control plane, `/query/*` ao Query Service, `/realtime` ao Realtime Gateway.
- O control plane **nunca** acessa dados de clientes; ele orquestra. Credenciais são decifradas **somente** no data plane.
- O **Assistant** (IA) é um consumidor das mesmas APIs: consulta via QDL com o principal do usuário, propõe mudanças que o `dashboard-core` valida, e só fala com provedores de modelo pelo Model Gateway. Removê-lo não afeta nenhuma outra caixa do diagrama ([31](31-ai-assistant.md)).
- O Render Service é um *cliente* da própria plataforma (abre o runtime real em Chromium headless com token de serviço), garantindo que export = tela.

---

## 4.3 Fluxo de dados (visão consolidada)

```mermaid
flowchart LR
  subgraph Sources
    OLTP[(OLTP do cliente)]
    WH[(Warehouse do cliente)]
    SAAS[APIs SaaS]
    FILES[Arquivos]
    EVT[Eventos / streams]
  end

  WH -->|live pushdown| QE
  OLTP -->|live c/ cautela| QE
  OLTP -->|import / incremental / CDC| PIPE
  SAAS -->|sync| PIPE
  FILES -->|upload| PIPE
  EVT -->|ingest| BUS

  PIPE[Pipelines<br/>extract → stage → transform → validate] --> PQ[(Parquet snapshots)]
  PQ --> CHS[(ClickHouse serving)]
  BUS --> SP[Stream processor] --> CHS
  SP --> RTG[Realtime Gateway]

  QE[Query Engine] --> CHS
  QE --> PRE[(Pre-aggregations<br/>ClickHouse)]
  WH -.->|materializa rollups| PRE
  CHS -.-> PRE

  QE --> ARROW[Arrow IPC] --> BR[Browser Data Runtime]
  RTG --> WS[WebSocket deltas] --> BR
  BR --> VIZ[Visualizações]
```

---

<a id="57-principio-de-processamento"></a>
## 57. Princípio de processamento — onde cada workload executa

### Critérios de decisão (em ordem)

1. **Segurança:** o browser só recebe linhas que o usuário pode ver. Nada que dependa de política é decidido no cliente.
2. **Volume vs resultado:** se o *input* é grande e o *output* é pequeno (agregação), execute perto dos dados.
3. **Reuso entre usuários:** se o mesmo resultado serve muitos usuários, compute no servidor e cacheie.
4. **Frequência de interação:** interações sub-100 ms repetidas sobre o **mesmo** conjunto pequeno → local.
5. **Custo de transferência:** bytes trafegados × frequência × egress.
6. **Capacidade do cliente:** dispositivos móveis/embeds de terceiros têm orçamento menor.
7. **Ganho medido:** WASM/GPU só com benchmark comprovando ganho sobre JS/servidor.

### Matriz de placement

| Workload | Local recomendado | Justificativa | Fallback |
|---|---|---|---|
| Agregações sobre milhões+ de linhas | **Analytical DB** (ClickHouse / warehouse) | Input enorme, output pequeno; vetorização no banco | Pre-aggregation |
| Joins entre fontes diferentes | **Backend (DataFusion)** sobre resultados já agregados; se pesado → importar | Federação leve evita Trino | Import/materialização |
| Totais, subtotais, pivots de resultados | **Backend** (pós-processamento DataFusion) | Consistência com semântica; reuso em export | — |
| Cross-filter sobre resultado já carregado (≤ ~100k linhas, mesma granularidade) | **Browser worker** (JS typed arrays) | Latência < 50 ms sem round-trip | Re-query |
| Reagregação local ("coarsening": mês→trimestre, remover dimensão aditiva) | **Browser worker** | Evita round-trip; só válido para measures aditivas | Re-query |
| Dataset local do usuário (arquivo no browser, offline) | **Browser: DuckDB-WASM em worker** | Dado nunca sai da máquina; SQL completo | Upload para servidor |
| Validação/autocomplete de fórmulas BEL | **Browser: Rust compiler em WASM** | Feedback instantâneo; mesma gramática do servidor | Validação server-side |
| Ordenação/formatação de tabelas pequenas | **Main thread / worker** | Trivial | — |
| Downsampling de séries (LTTB) e binning | **Analytical DB** quando possível; **worker** para dados locais | Reduz bytes trafegados | — |
| Agregação espacial (H3, geohash) | **Analytical DB** | Funções H3 nativas; output pequeno | Worker (h3 WASM) para datasets locais |
| Point-in-polygon para destaque de seleção | **Worker / WASM** (resultado já em memória) | Interativo | Servidor |
| Renderização de > ~50k pontos | **GPU** (deck.gl WebGL2/WebGPU) | Canvas/SVG não escalam | Agregação no servidor |
| Transformações de ingestão (arquivos/APIs) | **Workers backend (DataFusion)** | Volume e reprodutibilidade | — |
| Transformações sobre dados já no ClickHouse/warehouse | **Pushdown SQL** | Não movimentar dados | DataFusion |
| Janelas de agregação em streaming | **ClickHouse MVs incrementais / stream processor** | Estado contínuo, compartilhado | — |
| Exports PDF/PNG | **Render service** | Fidelidade com o runtime real | — |
| Raciocínio/linguagem da IA | **Provedor via Model Gateway** (ou modelo privado) | Apenas contexto permitido pela política de IA; dados minimizados | IA desligada |
| Cálculos usados em respostas da IA (comparações, variações, anomalias) | **Insights Engine → Analytical DB** | Determinístico, reprodutível, sob RLS | — |
| Validação de saídas da IA (QDL, BEL, ops, DAG) | **Compiladores existentes** (servidor; WASM no browser para feedback) | Mesma validação de qualquer edição humana | — |
| Preview de propostas da IA | **Browser (`dashboard-core`)** | Renderiza com o runtime real, sem gravar | — |
| Recomendação de visualização | **Viz Recommender (TS, browser ou servidor)** | Regras sobre manifests; sem modelo | — |
| Excel/CSV grandes | **Worker backend (Rust)** streaming | Memória constante | — |
| Detecção de anomalia / forecasting | **Backend/DB** (fase futura) | Modelo e dados no servidor | — |

### Anti-padrões explicitamente proibidos
- Enviar dados "crus" ao browser para agregar lá quando o banco pode agregar.
- Cachear resultados no browser de forma persistente (IndexedDB) com dados sensíveis sem criptografia/expiração — dados ficam só em memória por padrão.
- Aplicar RLS no cliente.
- Usar WASM para operações que JS faz em < 16 ms sobre o volume real.
