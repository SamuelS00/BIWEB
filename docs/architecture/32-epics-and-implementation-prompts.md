# 32 — Épicos por Fase e Prompts de Implementação

> Criado junto com a incorporação da IA nativa (2026-10-06). O blueprint anterior tinha fases ([30 §47](30-roadmap.md#47-development-phases-arquitetura-evolutiva)), mas não tinha épicos nem prompts de implementação. Este documento os consolida **com a IA já incorporada**. Épicos marcados com **[IA]** foram criados ou alterados por causa dela.

---

## 1. Épicos por fase

### Fase 0 — Foundation
| ID | Épico | Time | Entregas | Depende de |
|---|---|---|---|---|
| E0.1 | Monorepo e CI | Platform | pnpm/Turborepo/Cargo/just, CI com afetados, segurança, SBOM, **lint de fronteiras (inclui "core não importa IA")** **[IA]** | — |
| E0.2 | Contratos (`packages/schema`, `proto/`) | Platform | TypeBox → JSON Schema; envelope, IDs, ops; **`ChangeOrigin`, `DataClassification`, regra de `description` obrigatória** **[IA]** | E0.1 |
| E0.3 | Tenancy, RLS, cells | Platform | Tenant Router, `cell_id`, Postgres RLS, migrations expand/contract | E0.1 |
| E0.4 | Identity + Access Control | Platform | Broker OIDC, sessões, API keys, Cedar com hierarquia e **`context.via`** **[IA]** | E0.3 |
| E0.5 | Observabilidade base | Platform | OTel browser→Node→Rust, logs com tenant, **atributos reservados para GenAI** **[IA]** | E0.1 |
| E0.6 | Outbox, auditoria, metering | Platform | Outbox transacional, audit log com **`origin`**, metering com **`unit` genérico** **[IA]** | E0.3 |
| E0.7 | Entitlements e flags | Platform | Capabilities (incl. **`ai.*`** reservadas) **[IA]**, OpenFeature | E0.3 |
| E0.8 | Design tokens e `ui` base | Builder & UX | DTCG, React Aria, temas app/runtime | E0.1 |

### Fase 1 — Core Data Platform
| ID | Épico | Time | Entregas | Depende de |
|---|---|---|---|---|
| E1.1 | Spike planner (DataFusion IR) | Semantic & Query | 50 queries de referência × 4 dialetos, oráculo DuckDB, ADR-0007 confirmado | E0.2 |
| E1.2 | Semantic crate v1 | Semantic & Query | Entidades, dims, measures, metrics simples/ratio, relações, RLS; **`synonyms`, `classification`, bloco `ai` no schema** **[IA]** | E0.2 |
| E1.3 | Query Service v1 | Semantic & Query | Resolve → policy → plan → SQL → cache L2/L3 → Arrow; **QDL `purpose`/`egress`, tokens delegados com escopo, classe de admission `assistant`** **[IA]** | E1.1, E1.2, E0.4 |
| E1.4 | Connector SDK + conectores live | Data Pipelines | Postgres, ClickHouse, Snowflake/BigQuery; **sugestão de classificação na descoberta** **[IA]** | E0.2 |
| E1.5 | Upload → Parquet → ClickHouse | Data Pipelines | Flow B, Temporal, publicação atômica; **classificação no perfil de colunas** **[IA]** | E1.4 |
| E1.6 | Publicação de modelos | Platform + S&Q | CompileModel gRPC, revisões, eventos | E1.2 |

### Fase 2 — Dashboard Engine (primeira versão utilizável)
| ID | Épico | Time | Entregas | Depende de |
|---|---|---|---|---|
| E2.1 | `dashboard-core` | Dashboard Engine | DocumentStore, comandos/ops, undo, migrations, runtime state, interações, widget→QDL, **ChangeSet + camada de proposta + rebase, funções de resumo do documento** **[IA]** | E0.2 |
| E2.2 | `layout-engine` | Dashboard Engine | Grid/stack/tabs, breakpoints, mobile derivado | E0.2 |
| E2.3 | `data-runtime` | Dashboard Engine | Worker pool, L1, Arrow decode | E1.3 |
| E2.4 | `viz-sdk` + plugins core | Dashboard Engine | Contrato, ECharts adapters, tabela, KPI, pivot; **manifests com `description`/`aiHints`** **[IA]** | E2.3 |
| E2.5 | `viz-recommender` **[IA]** | Dashboard Engine | Ranking determinístico + botão "Sugerir visualização" | E2.4 |
| E2.6 | Builder v1 | Builder & UX | Canvas, inspector por schema, layers, copy/paste (**via ChangeSet**), atalhos | E2.1, E2.2 |
| E2.7 | Revisões e sharing | Platform | Draft/publish/rollback/diff (**origem exibida no histórico**), grants | E2.1 |
| E2.8 | Lineage (extração) | Platform | Grafo no Postgres | E2.1, E1.6 |

### Fase 3 — Advanced Analytics + **AI v1 (trilha paralela)**
| ID | Épico | Time | Entregas | Depende de |
|---|---|---|---|---|
| E3.1–E3.10 | (core) BEL/LOD, drill, preaggs, Transform DAG, mapas, exports/schedules, DuckDB-WASM, layout free, embed iframe, catálogo FTS | vários | Ver [30 §47](30-roadmap.md#47-development-phases-arquitetura-evolutiva); **catálogo FTS indexa `synonyms`/descrições** **[IA]**; **catálogo de ops do Transform DAG com JSON Schema + descrições** **[IA]** | Fase 2 |
| E3.A1 | Model Gateway **[IA]** | Assistant | Interface, 1 adapter (bake-off), `fast`/`standard`, egress guard, quotas, metering, telemetria GenAI, kill switch | E0.5–E0.7 |
| E3.A2 | `AIPolicy` **[IA]** | Assistant | Modelo, API e UI admin; níveis `disabled`/`metadata-only`/`aggregates`; aplicação no gateway, Query Service e Tool Registry | E3.A1, E1.3 |
| E3.A3 | Context Engine **[IA]** | Assistant | Resolução do snapshot com authz, compactação, chips | E2.1, E1.2 |
| E3.A4 | Tool Registry v1 **[IA]** | Assistant | Ferramentas de metadados, `run_query`, `lookup_dimension_values`, `recommend_visualization`, `validate_expression`, `propose_*` | E3.A3, E2.5, E3 catálogo |
| E3.A5 | Proposal Service **[IA]** | Assistant | Simulação/validação de ChangeSets no servidor, risco, expiração | E2.1 |
| E3.A6 | Orchestrator + Assistant API **[IA]** | Assistant | Loop, budgets, SSE, cancelamento, conversas, retenção | E3.A1–A5 |
| E3.A7 | `assistant-ui` **[IA]** | Assistant + Builder & UX | Painel, ações inline, ⌘K, preview no canvas, markdown seguro, citações | E3.A6, E2.6 |
| E3.A8 | Evals + red-team **[IA]** | Assistant | Tenants fixture, tarefas golden, gate no CI, suíte adversarial, bake-off | E3.A4 (começa antes do A6) |

### Fase 4 — Realtime & Insights + **AI v2**
| ID | Épico | Time | Entregas | Depende de |
|---|---|---|---|---|
| E4.1–E4.4 | (core) Bus, processor, gateway realtime, CDC | Data Pipelines | Ver roadmap | Fase 3 |
| E4.5 | Insights Engine **[IA]** | Semantic & Query | Comparação, explicar variação, anomalias, outliers; API `insights/v1`; UI sem IA | E3 preaggs/BEL |
| E4.A1 | Ferramentas analíticas + grounding **[IA]** | Assistant | Ferramentas de insights, citações, verificador de grounding | E4.5 |
| E4.A2 | Propostas de modelagem **[IA]** | Assistant + S&Q | `propose_metric`/`propose_calculated_field`, impact analysis | E1.6, E2.8 |
| E4.A3 | Propostas de transformação **[IA]** | Assistant + Data Pipelines | `propose_transformation`/`preview_transformation` | E3 Transform DAG |
| E4.A4 | Conhecimento curado **[IA]** | Assistant + Governance | UI para `ai.instructions`/`verifiedQuestions`, sugestões de descrições/sinônimos | E1.2 |

### Fases 5–7 — resumo
| ID | Épico | Fase |
|---|---|---|
| E5.A1 | Assistente em embeds (claim `assistant`) **[IA]** | 5 |
| E5.A2 | Tool Registry via MCP/API externa **[IA]** | 5 |
| E5.A3 | Ferramentas de IA de plugins (`assistantTools`) **[IA]** | 5 |
| E5.A4 | Narrativas em relatórios e alertas explicados **[IA]** | 5 |
| E6.A1 | BYO model, allowlist de provedores e regiões, `row-level` **[IA]** | 6 |
| E6.A2 | Auditoria de IA exportável, políticas por papel **[IA]** | 6 |
| E7.A1 | IA no multiplayer, insights proativos, classe `deep` **[IA]** | 7 |

---

## 2. Prompts de implementação

**Formato:** cada prompt é autocontido, para um agente ou engenheiro executar. Todo prompt herda o **preâmbulo comum** abaixo.

### Preâmbulo comum (incluir em todos)
```text
Você está implementando parte da plataforma BIWEB. Leia antes: docs/README.md, os documentos citados no prompt e os ADRs citados.
Regras inegociáveis:
- tenant_id em toda tabela/chave/objeto; Postgres RLS ativo; nada assume cell única (ADR-0016).
- Dados só via QDL e semantic layer; nenhum SQL vindo do frontend ou da IA (ADR-0005/0006).
- Segurança compilada no plano lógico; cache por SQL pós-política (ADR-0017/0020).
- Toda mudança programática em documentos via comandos/ChangeSets do dashboard-core, com ChangeOrigin (ADR-0004/0035).
- Toda propriedade de schema público tem description (ADR-0003, emenda).
- Nenhum módulo core importa assistant, assistant-ui ou model-gateway (ADR-0033). A plataforma deve funcionar com a IA desligada.
- OpenTelemetry com traceparent e tenant_id em todo caminho (ADR-0028).
Entregue: código, testes (unit + integração com dependências reais), atualização de schemas gerados e docs, e uma nota no PR com as decisões tomadas.
```

### P-E0.2 — Contratos base (alterado pela IA)
```text
Objetivo: criar packages/schema (TypeBox → JSON Schema 2020-12 em schemas/) e codegen para Rust.
Leia: docs/architecture/05, 29, schemas/*.ts, ADR-0002, ADR-0003 (+ emenda), ADR-0035.
Inclua desde já: envelope de documento, IDs com prefixo, OrderKey, DocumentOp (set/delete com prev), Transaction {ops, origin: ChangeOrigin, label}, ChangeOrigin (user|assistant|template|import|api|system), DataClassification, QDL v1 (context.purpose inclui assistant/insight; conversationId/toolCallId; options.egress).
Regra de lint: falhar o build se uma propriedade de schema público não tiver description.
Aceite: schemas gerados e versionados; tipos Rust gerados compilam; testes de round-trip preservam extensions e origin.
```

### P-E0.4 — Access Control com canal `via` (alterado pela IA)
```text
Objetivo: autorização com Cedar (RBAC + hierarquia + ABAC) no control plane (WASM/JS) e data plane (Rust).
Leia: docs/architecture/17, ADR-0017 (+ emenda), ADR-0034.
Inclua: atributo de contexto via ∈ {ui, api, assistant, embed}; ações assistant:use, assistant:analyze, assistant:propose-model-change, assistant:propose-transformation; teste de que políticas com via=assistant só podem restringir.
Data plane: aceitar tokens delegados de vida curta (claims do usuário + via + escopo + conversationId) e rejeitar escopos fora do permitido.
Aceite: suíte de autorização por papel/canal; testes de propriedade "via=assistant nunca amplia acesso".
```

### P-E0.6 — Outbox, auditoria e metering (alterado pela IA)
```text
Objetivo: outbox transacional, audit log imutável e eventos de metering.
Leia: docs/architecture/02 §5.4, 17 §24.3, 22, 23 §56, 31 §19.
Inclua: campo origin em todos os eventos de auditoria; tipos reservados assistant.turn.completed, assistant.query.executed, assistant.proposal.*, assistant.policy.blocked (sem produtores ainda); metering com {unit, quantity, attributes} genérico (compute_seconds, bytes_scanned, tokens_input, tokens_output...).
Aceite: eventos gravados na mesma transação da mudança; export para ClickHouse; testes de idempotência do dispatcher.
```

### P-E1.2 — Semantic crate v1 (alterado pela IA)
```text
Objetivo: crate semantic com tipos do modelo, BEL v1 (parser/typechecker) e compilação do modelo.
Leia: docs/architecture/11, schemas/semantic-model.ts, ADR-0005 (+ emenda), ADR-0008, ADR-0039.
Inclua no schema e no snapshot compilado: synonyms, classification (herdada do dataset), bloco ai {instructions, verifiedQuestions, exclude} — sem lógica de IA, apenas transportados e validados (verifiedQuestions devem compilar como QDL válida).
Produza também uma "visão compacta" do snapshot (campos, tipos, descrições, relacionamentos, hierarquias) com hash por revisão — usada por catálogo, documentação e IA.
Aceite: testes de compilação, de ciclos/ambiguidade de joins, e de herança de classificação.
```

### P-E1.3 — Query Service v1 (alterado pela IA)
```text
Objetivo: Query API (Axum) QDL → Arrow com resolve → policy → plan → SQL → cache L2/L3.
Leia: docs/architecture/12 (incl. §15.4), ADR-0006 (+ emenda), ADR-0007, ADR-0017, ADR-0020, ADR-0034.
Inclua: classe de admission assistant (abaixo de interactive); aplicação de options.egress no payload destinado a consumidores de IA (limites de linhas/colunas e mascaramento por classificação), registrando o que foi limitado em QueryResponseMeta.warnings; purpose e conversationId em spans e metering.
Aceite: testes diferenciais; teste de propriedade de RLS; teste de que egress nunca devolve colunas classificadas mascaradas sem máscara.
```

### P-E2.1 — dashboard-core com ChangeSets (alterado pela IA)
```text
Objetivo: pacote headless e isomórfico (browser + Node) com DocumentStore, comandos/ops, undo/redo, migrations, runtime state, interaction engine e widget→QDL.
Leia: docs/architecture/05 (incl. §8.9), 06, schemas/dashboard.ts, widget.ts, assistant.ts (ChangeSet), ADR-0002, ADR-0004 (+ emenda), ADR-0035.
Inclua: ChangeSet como cidadão de primeira classe — applyChangeSet (1 transação de undo, label, origin), previewLayer(doc, changeSet) sem mutar, rebase(changeSet, currentDraft) por entidade/propriedade com relatório de conflitos, validate(changeSet) (schema, referências, configSchema do plugin). Use ChangeSet em paste entre dashboards e aplicação de templates.
Inclua funções puras de resumo: summarizeDashboard(doc), describeWidget(doc, id), effectiveQuery(doc, state, id).
Aceite: testes de propriedade (apply ∘ undo = identidade; rebase sem conflito = aplicar sobre o novo base); roda no Node sem DOM.
```

### P-E2.4/E2.5 — Viz SDK, manifests e Viz Recommender (alterado pela IA)
```text
Objetivo: contrato VisualizationPlugin, plugins core e recomendador determinístico.
Leia: docs/architecture/07 (incl. §10.7), schemas/visualization.ts, ADR-0011 (+ emenda), ADR-0038.
Inclua: description obrigatória e aiHints nos manifests core; configSchema com description em toda propriedade; packages/viz-recommender: recommend(shape, manifests) → ranking explicável + encodings iniciais; botão "Sugerir visualização" no builder.
Aceite: testes de tabela (formas de dados → plugin esperado); nenhum plugin core sem descrições.
```

### P-E3.A1/A2 — Model Gateway e AIPolicy [IA]
```text
Objetivo: módulo model-gateway (control plane) e AIPolicy.
Leia: docs/architecture/31 (§14–16), schemas/assistant.ts (ModelRequest, LabeledPart, AIPolicy), ADR-0036, ADR-0037, ADR-0019 (+ emenda).
Implemente: interface independente de provedor; 1 adapter (provedor escolhido pelo bake-off do E3.A8); classes fast/standard com roteamento por configuração e versões fixadas; egress guard (remove classes proibidas pela política, mascara classificações, detecção de padrões como defesa em profundidade, registra classes enviadas); quotas/créditos com pré-estimativa; metering de tokens/custo; spans GenAI; kill switch por flag; resolução de AIPolicy tenant → workspace (mais restritiva).
Proibido: importar SDKs de provedores fora de model-gateway/adapters.
Aceite: matriz de testes por nível de política; teste de que nenhuma parte rotulada secret/pii sem permissão atravessa o guard; gateway desligado → core inalterado.
```

### P-E3.A3/A4/A5 — Context Engine, Tool Registry e Proposal Service [IA]
```text
Objetivo: montar contexto a partir do UIContextSnapshot, expor ferramentas sobre APIs existentes e validar propostas.
Leia: docs/architecture/31 (§6–8), 20 §58, schemas/assistant.ts, ADR-0033, ADR-0034, ADR-0035, ADR-0039.
Context Engine: reconsulta todo ID com o principal do usuário (via=assistant); usa dashboard-core.summarizeDashboard/describeWidget/effectiveQuery e a visão compacta do snapshot semântico; rotula cada parte com DataClass/trusted; emite chips.
Tool Registry: ToolDefinition versionada (JSON Schema in/out, sideEffect read|propose, requiredAction, outputDataClass, costClass, wraps). Implementações chamam somente interfaces públicas de módulos e RPCs (Query API com token delegado). Não crie ferramentas de publicar, apagar publicados, compartilhar, permissões, credenciais, SQL bruto, HTTP arbitrário.
Proposal Service: gera ChangeSets, simula com dashboard-core no Node, calcula risco (remoções/objetos governados ≥ medium), expira propostas.
Aceite: teste de que cada ferramenta nega acesso quando o usuário não tem permissão; propostas inválidas nunca chegam ao cliente; lint garante que ferramentas não acessam repositórios de outros módulos.
```

### P-E3.A6/A7 — Orchestrator, Assistant API e assistant-ui [IA]
```text
Objetivo: loop do agente, API de turnos (POST + SSE) e UI integrada.
Leia: docs/architecture/31 (§5, §17, §18), 04, 06 §9.6, schemas/assistant.ts, ADR-0040, ADR-0032 (+ emenda).
Orchestrator: budgets (passos, tokens, tempo, queries/bytes), cancelamento ponta a ponta, clarificações, eventos AssistantStreamEvent, persistência de conversas (RLS, retenção, modo efêmero), resumos de histórico com classe fast, auditoria por turno.
assistant-ui: painel persistente com chips de contexto removíveis; ações inline (widget, multi-seleção, ponto de dados, métrica, dataset); ⌘K em linguagem natural; preview de ChangeSet no canvas (adições fantasmas, remoções destacadas), aceitar/rejeitar por item, undo com rótulo "IA: …"; markdown seguro (sem HTML, sem imagens/links remotos auto-carregados); citações com "ver consulta"/"abrir como widget"; mini-visualizações pelos plugins existentes. Chunk lazy; ausente quando a IA está desabilitada.
Aceite: Flow G de ponta a ponta em E2E; E2E completo do core passa com a IA desligada; axe sem violações no painel.
```

### P-E3.A8 — Evals e red-team [IA]
```text
Objetivo: harness de qualidade em testing/ai-evals e bake-off de provedores.
Leia: docs/architecture/31 §20, 24 §38, ADR-0041.
Implemente: tenants fixture (modelos semânticos + dados sintéticos com efeitos conhecidos); tarefas golden por modo (criar, editar, descobrir; depois analisar/modelar/transformar) com verificações determinísticas (ferramenta correta, QDL/ChangeSet válido, fatos numéricos); suíte red-team (injeção via títulos/descrições/valores, cross-tenant, RLS/CLS, ações proibidas, exfiltração por links, políticas metadata-only/aggregates); gate no CI; relatório comparativo de provedores (qualidade, latência, custo).
Aceite: suíte rápida < 10 min no PR; nightly completa; bake-off documentado em ADR.
```

### P-E4.5 — Insights Engine [IA, valor sem IA]
```text
Objetivo: módulo insights no query-service (Rust) e API insights/v1.
Leia: docs/architecture/12 §15.5, 31 §9, schemas/assistant.ts (InsightRequest/Result), ADR-0038.
Implemente: compare-periods, explain-change (decomposição de contribuição por dimensões candidatas via hierarquias/cardinalidade, efeito mix vs taxa para ratios), anomalies (decomposição sazonal robusta + MAD), outliers (IQR/MAD). Somente QDL pelo planner (RLS, cache, preaggs, cost guard), orçamento por investigação, evidências e limitações no resultado. UI sem IA: "Explicar variação" e selos de anomalia.
Aceite: datasets sintéticos com efeitos plantados recuperados; resultados reprodutíveis; testes de RLS (usuários diferentes → explicações sobre seus próprios dados).
```

### P-E4.A1–A4 — AI v2 [IA]
```text
Objetivo: analista e modelador.
Leia: docs/architecture/31 (§9–§13), 10 §13.6, 11 §14.7, 28 (Flows H–J), ADR-0038, ADR-0039.
Implemente: ferramentas de insights com citações obrigatórias e verificador de grounding; propose_metric/propose_calculated_field (draft do modelo + CompileModel + impact analysis; publicação humana); propose_transformation/preview_transformation (somente catálogo de ops, BEL tipado, sem RAW_SQL/UDF); UI de curadoria de ai.instructions/verifiedQuestions e sugestões de descrições/sinônimos aceitas por humanos; pgvector somente se os evals mostrarem recall insuficiente (registrar em ADR).
Aceite: Flows H, I, J em E2E; metas de correção dos evals; nenhuma resposta analítica com número sem evidência.
```

---

## 3. Prompts do core **não** afetados pela IA
Os prompts de épicos sem a marca **[IA]** (ex.: E1.4 conectores além da sugestão de classificação, E2.2 layout-engine, E4.1–4.4 realtime) seguem apenas o preâmbulo comum e os documentos da área. A incorporação da IA não muda o escopo deles.
