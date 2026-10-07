# 26 — Failure Scenarios, Architecture Risks e Erros Arquiteturais a Evitar

> Seções do pedido: **§42 Failure scenarios**, **§45 Architecture risks**, §48 do pedido (evitar erros arquiteturais).

---

## 42. Failure scenarios

| # | Cenário | Detecção | Comportamento esperado | Mitigação estrutural |
|---|---|---|---|---|
| F1 | Fonte live do cliente fora do ar/lenta | Circuit breaker por data source, health checks | Widgets afetados mostram último resultado em cache com selo "dados de HH:MM" (stale-if-error) ou erro localizado; demais widgets funcionam | Cache L3 com stale-if-error; preaggs; timeouts curtos para interativo |
| F2 | ClickHouse sobrecarregado | Fila de admissão, p95, erros de memória | Admission control enfileira/rejeita classes baixas (warmup, export) primeiro; interativo prioritário; 429 com retry-after | Quotas/settings profiles por tenant; preaggs; réplicas; separação de cargas de ingestão |
| F3 | Query descontrolada (cardinalidade explosiva) | Cost guard, `max_execution_time`, `max_result_rows` | Rejeição antes de executar ou corte com `truncated: true`; mensagem orientando agregação/filtro | Estimativa; limites duros; cancelamento propagado (abort → KILL QUERY) |
| F4 | Valkey indisponível | Erros de conexão | Bypass de cache (degradação de performance, não de corretude); rate limit local por processo protege o banco | Cache nunca é fonte da verdade; single-flight local como fallback |
| F5 | Temporal indisponível | Erros do client/worker | Jobs atrasam; dashboards e queries interativas não são afetados; schedules são retomados | Planos separados; interativo não depende de Temporal |
| F6 | Postgres primário falha | Health/failover gerenciado | Failover em segundos–minutos; leituras de documentos servidas de cache por curto período; Query Service segue com snapshots de modelos em memória | Multi-AZ; snapshots de modelos cacheados no data plane |
| F7 | Nó do Realtime Gateway cai | Heartbeat | Clientes reconectam em outro nó com `resumeToken` → buffer ou snapshot + deltas | Gateways stateless; seq/resume |
| F8 | Sync falha no meio | Temporal retries, checkpoints | Retoma do último checkpoint; snapshot anterior continua publicado; após esgotar retries → dead letter + notificação ao owner | Publicação atômica; idempotência |
| F9 | Schema drift destrutivo na fonte | `discover` pré-sync | Sync bloqueado com impact analysis; dashboards seguem no snapshot anterior | Política de drift + lineage |
| F10 | Migration de Postgres defeituosa | Canário, testes de migração | Rollback do código (expand/contract garante compatibilidade); correção forward | Expand/contract; testes em snapshot anonimizado |
| F11 | Migration de documento com bug | Corpus de testes; erros de validação pós-migração | Revisões são imutáveis → nenhum dado perdido; corrigir migration e servir de novo | Migrations em leitura (lazy), sem reescrever histórico |
| F12 | Plugin de terceiro malicioso/defeituoso | Watchdog, taxa de erros, relatos | Error boundary isola widget; kill switch global; versão fixada por tenant | Sandbox iframe/WASM; assinatura; permissões |
| F13 | Credencial expirada/revogada | Erros de auth do conector | Data source marcado `failing`; notificação ao owner; widgets com erro claro | Health; OAuth refresh automático |
| F14 | Vazamento entre tenants (bug) | Testes de isolamento contínuos, auditoria, canários de dados (registros-armadilha por tenant) | — (prevenção) | Defesa em profundidade: tenant no token → RLS Postgres → database por tenant no ClickHouse → chave de cache com tenant → prefixo S3 |
| F15 | Bug de RLS (policy não aplicada) | Testes de propriedade, testes de segurança | — (prevenção) | Injeção no plano lógico; fail-closed; cache por SQL seguro |
| F16 | Falha de uma cell inteira | Monitoramento por cell | Apenas tenants da cell afetados; DR por região conforme edição | Cells; backups cross-region; serving reconstruível |
| F17 | Falha regional da nuvem | — | DR: restaurar cell em outra região (RTO por edição); enterprise pode contratar standby | IaC por cell; replicação de Postgres e curated |
| F18 | Browser sem memória (dataset local grande) | Monitoramento de memória do runtime | Worker terminado, mensagem e oferta de upload para processamento no servidor | Orçamentos de memória; limites por dispositivo |
| F19 | Picos de exports (fim de mês) | Backlog da fila | Exports enfileirados com estimativa; interativo protegido | Task queue separada; render service autoescalável |
| F20 | Stampede após publicação de snapshot (cache invalidado) | Picos de QPS | Single-flight + warmup pós-publicação dos dashboards top | Cache warmup via dashboard-core no servidor |
| F21 | Provedor de modelo indisponível/lento | Erros/latência no gateway | Painel informa indisponibilidade; fallback para adapter alternativo se configurado; **nenhuma outra funcionalidade afetada** | IA opcional por desenho; timeouts; kill switch |
| F22 | IA propõe mudança inválida | Validação do Proposal Service | Proposta nunca chega ao usuário inválida; a IA corrige (tentativas limitadas) ou explica | Simulação com `dashboard-core` e compiladores |
| F23 | Proposta sobre estado desatualizado | `base` ≠ draft atual | Rebase por entidade ou pedido de regeneração | ChangeSet com base e entidades tocadas |
| F24 | Injeção de prompt em conteúdo/dados | Red-team, anomalias em propostas | Mutação exige confirmação; sem ferramentas de exfiltração | Conteúdo não confiável rotulado; markdown seguro |
| F25 | Quota/créditos de IA esgotados | Gateway | Mensagem clara; core intacto | Quotas por tenant/usuário |
| F26 | Regressão de qualidade após troca de modelo | Evals/métricas online | Rollback da rota por flag | Versões fixadas, canário |

---

## 45. Architecture risks

| # | Risco | Prob. | Impacto | Mitigação | Sinal de alerta |
|---|---|---|---|---|---|
| R1 | **Corretude da semantic layer** (fan-out, semi-aditivas, totais, LOD, time intelligence) é o problema mais difícil e mais visível | Alta | Alto | Testes diferenciais com oráculo, corpus de casos patológicos, revisão por analytics engineers, escopo incremental de features (LOD/PoP na Fase 3) | Divergências reportadas por usuários vs planilhas |
| R2 | **DataFusion como IR/unparser** não cobre bem um dialeto crítico | Média | Médio | Spike na Fase 1; camada `sql-dialects` encapsula; emissores próprios para lacunas | Muitas exceções por dialeto |
| R3 | **Escassez de engenheiros Rust** no time misto | Média | Alto | Rust restrito ao data plane com time dedicado; control plane em TS; guias, pairing, revisão | Lead time alto em PRs de Rust |
| R4 | **Complexidade de dois runtimes backend** (Node + Rust) | Média | Médio | Contratos gRPC/schemas gerados; fronteira clara (dados vs metadados); observabilidade unificada | Lógica duplicada aparecendo nos dois lados |
| R5 | **ClickHouse com muitos tenants/tabelas pequenas** (overhead, custo) | Média | Médio | Database por tenant + monitoramento de parts; tier DuckDB; evicção de inativos; mais clusters/cells | Parts por tabela/cluster crescentes; custo por tenant pequeno alto |
| R6 | **Escopo de produto enorme** dilui foco | Alta | Alto | Roadmap por fases com critérios de saída; primeira versão utilizável na Fase 2 | Fases sem critérios de saída atingidos |
| R7 | **Performance do builder** com documentos grandes | Média | Médio | Stores externos, derivação incremental, virtualização, benchmarks no CI | INP alto, drags com jank |
| R8 | **Segurança de embeds e plugins** | Média | Alto | Tokens curtos, allowlist de origens, sandbox, pentests | Achados em pentest |
| R9 | **Custo de warehouses do cliente** em live query gera atrito | Média | Médio | Cache, preaggs, cost guard, relatórios de custo | Reclamações de custo/limites atingidos |
| R10 | **Lock-in em serviços gerenciados** (ClickHouse Cloud, Temporal Cloud) | Baixa | Médio | Protocolos padrão; self-hosted equivalente testado no CI (Compose) | Diferenças de comportamento cloud vs self-hosted |
| R11 | **Evolução de schema de documentos** acumula migrations complexas | Média | Médio | Disciplina de mudanças aditivas; corpus de testes; consolidação periódica (squash para versões muito antigas via job de reescrita controlado) | Muitas versões ativas |
| R12 | **WebGPU/WASM** amadurecendo de forma desigual entre browsers | Média | Baixo | Fallbacks obrigatórios; não depender de SAB/threads | Bugs específicos de Safari |
| R13 | **Licenças** de dependências (BSL/ELv2/AGPL) incompatíveis com a estratégia de distribuição | Média | Alto | Política de licenças no CI; decisão de licença do core cedo | Alertas de licença |
| R14 | **Temporal** mal modelado (workflows não determinísticos, históricos gigantes) | Média | Médio | Guia interno, continue-as-new, atividades pesadas fora (gRPC) | Históricos > limites, replays falhando |
| R15 | **Respostas analíticas erradas com aparência confiável** | Média | Alto | Insights determinísticos, citações obrigatórias, verificador de grounding, "ver consulta" | Divergências reportadas; 👎 em análises |
| R16 | **Vazamento de dados para provedores de IA** | Baixa | Alto | Egress guard + classificação + `AIPolicy` + BYO + retenção zero contratual | Bloqueios inesperados/ausentes nos logs de egress |
| R17 | **Custo de IA descontrolado** | Média | Médio | Quotas, budgets, roteamento, cache, FinOps | Custo por tenant acima da margem |
| R18 | **IA virando caminho paralelo ao core** (atalhos de dados/mutação) | Média | Alto | ADR-0033, lint de fronteiras, revisão de toda nova ferramenta | Ferramentas com lógica própria |
| R19 | **Classificação de campos incompleta** compromete o mascaramento | Média | Médio | Sugestão automática na descoberta, padrão conservador em tenants regulados, detecção de padrões | Campos sem classificação em modelos usados pela IA |

---

## 48 (pedido). Erros arquiteturais a evitar — e como a arquitetura os previne

| Erro | Prevenção nesta arquitetura |
|---|---|
| Microservices cedo demais | Dois monolitos modulares; extração por gatilho objetivo ([15](15-backend.md)) |
| Excesso de processamento no browser | Princípio de processamento ([01 §57](01-high-level-architecture.md#57-principio-de-processamento)); orçamento de linhas por widget; agregação no servidor por padrão |
| SQL gerado no frontend | QDL é o único contrato; Query API não aceita SQL de viewers |
| Dashboards difíceis de versionar | Documento normalizado, IDs estáveis, JSON Schema, revisões imutáveis, ops invertíveis |
| Coupling entre gráficos e dados | Plugins recebem `DataFrameView`; Dashboard Engine gera queries a partir de `dataRequirements` |
| Coupling entre visualização e query engine | Viz não conhece QDL; Data Runtime intermedeia |
| Dependência excessiva de uma biblioteca de gráficos | Contrato `VisualizationPlugin`; nenhum tipo de biblioteca no documento; eventos normalizados |
| Ausência de semantic layer | Obrigatória; widgets só referenciam objetos semânticos |
| Falta de lineage | Extração em tempo de compilação desde a Fase 2 |
| Falta de isolamento multi-tenant | Cells, tenant_id + RLS, database por tenant, chaves e prefixos — desde o primeiro commit |
| Cache incorreto | Fingerprint sobre SQL **pós-política** + dataVersion |
| Transferência excessiva de dados | Arrow + compressão + agregação + paginação + viewport queries |
| Renderizar milhões de registros desnecessariamente | Agregação/binning antes de GPU; `maxRecommendedRows` por plugin |
| WASM sem ganho real | Escopo restrito (compilador compartilhado, DuckDB-WASM, kernels geo) e "só após profiling" |
| IA com acesso privilegiado ou text-to-SQL | Principal delegado; QDL como único caminho de dados ([ADR-0034](adr/ADR-0034-ai-delegated-principal.md), [ADR-0006](adr/ADR-0006-qdl-no-sql-in-frontend.md)) |
| IA alterando estado sem preview/undo | ChangeSets via `dashboard-core` ([ADR-0035](adr/ADR-0035-ai-change-proposals.md)) |
| IA calculando números | Insights Engine determinístico + citações ([ADR-0038](adr/ADR-0038-deterministic-insights-and-recommenders.md)) |
| Core dependente de IA | Regra P16; suíte E2E com IA desligada |
| Tecnologias sofisticadas sem necessidade | Kafka, NATS, K8s, Iceberg, CRDT, Trino, Zanzibar adiados com gatilhos explícitos |
