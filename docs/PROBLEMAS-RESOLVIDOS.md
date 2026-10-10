# BIWEB Studio — Problemas resolvidos até o momento

> Documento objetivo: **problema → solução → onde está**. Cobre o que foi entregue no `apps/web` (de 2026-10-06 a 2026-10-10), as decisões tomadas e o que ainda está em aberto.
> O blueprint de arquitetura (ADRs 0001–0041) continua em [`architecture/`](architecture/); aqui está só o que foi **implementado e decidido na prática**.

## 1. Estado atual

| Item | Situação |
|---|---|
| Stack do front | React 19 + Vite + TanStack Router + zustand/immer + React Aria (`@biweb/ui`) + tokens DTCG (`@biweb/tokens`) |
| Dados | 100% demonstrativos e determinísticos no browser: `ds_rede_sp` (Rede Metropolitana SP) e `ds_vendas` (Lume Varejo). Não há backend ligado; `control-plane`, `crates/` e demais `packages/*` são esqueletos |
| Rota inicial | `/login` (Product Pulse + SSO progressivo), depois Home, Relatórios, Mapas, Workflows, Dados, Conexões, Modelo, Copilot |
| Testes | Vitest em tokens, ui, viz, dados, editor/copilot, mapas e workflows; E2E Playwright + axe em `testing/e2e` |
| Deploy | Cloudflare Pages, projeto `biweb`, em `app.biwebstudio.com.br` (domínio no Registro.br; e-mail no Fastmail); automático por GitHub Actions a cada push em `main` |

## 2. Problemas resolvidos por área

### 2.1 Fundação e design system
| Problema | Solução | Onde |
|---|---|---|
| Sem estrutura de projeto nem regras de fronteira | Monorepo pnpm + Turborepo + Cargo + just/mise; `dependency-cruiser` impõe fronteiras (core sem React, plugins só via SDK, IA fora do core) | `.dependency-cruiser.cjs`, ADR-0026 |
| Cores soltas e acessibilidade não garantida | Tokens DTCG → CSS vars/TS/Tailwind/ECharts; teste de contraste WCAG 2.2 AA nos dois temas; tokens `viz-status-*` e `viz-map-*` | `packages/tokens` |
| Componentes inconsistentes | Design system em React Aria + Tailwind v4, com guia por componente | `packages/ui`, `docs/design/components` |
| Marca inexistente | Logos claro/escuro/mono, símbolo e favicon gerados do handoff; accent derivado do azul-marinho da marca; capas geradas com a paleta | `tools/brand`, `design-handoff` |
| UI estática e "seca" | `motion.css`: entrada de página, listas escalonadas, gráficos que crescem, skeletons; respeita `prefers-reduced-motion` | `apps/web/src/app.css` |

### 2.2 Referências e design (processo)
| Problema | Decisão |
|---|---|
| Design sem base em produtos maduros | `REFERENCE_PACK_BI.md` (Power BI, Figma, Superset, Grafana…) com o que extrair e **o que não copiar** |
| Gargalos de complexidade (GIS, workflow, IA, modelagem) | `REFERENCE_PACK_COMPLEX_WORKFLOWS.md` (fichas REF-A/X, 3D urbano, replay, realtime) |
| Dependência de ferramentas de design | `SKILLS_STACK.md` + `SCREEN_CATALOG_BI.md` (catálogo de telas) para guiar o Claude Design |
| `design-output/` desatualizado | **Decisão do usuário:** ignorar o design antigo; preservar só o Complex Workflows pack e referenciá-lo na aplicação. A pasta e o `design-handoff.zip` (cópia antiga dos `.md`) foram removidos em 2026-10-10 |
| Home/Login com cara de "produto gerado por IA" | Prompts proibiram o padrão (sidebar + boas-vindas + KPIs + cards; card central sobre gradiente/glass/glow). Resultado: Home **Workspace Pulse** e login **Product Pulse** |

### 2.3 Arquitetura (blueprint)
Problema: fundação capaz de evoluir de MVP a escala comercial sem reescrita. Decisões principais (detalhe nos ADRs):
- Dois planos: control plane TS + data plane Rust, organizados em cells multi-tenant (ADR-0001/0016).
- Dashboard = documento JSON versionado e declarativo (ADR-0002/0003).
- Semantic layer obrigatória + QDL, **sem SQL no frontend** (ADR-0005/0006).
- Segurança compilada no plano lógico, cache por SQL pós-política (ADR-0017/0020).
- Parquet como verdade, ClickHouse como serving, Arrow ponta a ponta (ADR-0009/0010).
- IA nativa e **opcional**: principal delegado, ChangeSets com preview, Model Gateway (ADR-0033–0041). Postura padrão de privacidade aceita pelo usuário.
- Complexidade só com gatilho: Kafka, K8s, Iceberg, CRDT, Trino adiados.
- Custos revisados e confirmado que o desenvolvimento inicial roda **local, sem gasto**.

### 2.4 Editor de relatórios (documento + canvas)
| Problema | Solução | Onde |
|---|---|---|
| Relatório só visual, sem modelo editável | Documento `ReportDoc → Page → Comp` numa store única, com undo/redo, autosave e publicação com checklist | `editor/doc.ts`, `editor/store.ts` |
| Edição de layout rudimentar | Arrastar/redimensionar, encaixe e guias, multisseleção, camadas, alinhar/distribuir, zoom e minimapa | `editor/Canvas.tsx` |
| Adicionar gráfico exigia saber o tipo | Visualization Picker: dataset + 23 tipos agrupados por **pergunta** (Comparação, Série temporal, Distribuição, Relação, Composição, Fluxo, KPI, Tabela, Geo…) | `editor/library.ts` |
| Montar campos era confuso | Wells por papel conforme o tipo (eixo, valores, linha, meta, série, tooltip), período, grão e comparação | `editor/panels/DataTab.tsx`, `BuildTab.tsx` |
| Trocar o tipo perdia o trabalho | Troca preserva campos e orienta quando falta algo | `editor/panels/` |
| Pouco controle fino | Abas Estilo e Avançado: formatação condicional, estados, tempo real, regras, referências e anotações | `StyleTab`, `AdvancedTab`, `RulesTab` |
| Interações implícitas | Aba Interações: cross-filter/highlight, "afeta quais visuais", hierarquias de drill, drill-through com contexto | `InteractionsTab.tsx` |
| Filtros sem escopo claro | Filter Builder (lista, busca, intervalo, datas, janela relativa, hierarquia) com níveis **Relatório → Página → Visual** | `viz/filters.tsx`, `FilterWidgets.tsx` |
| Canvas vazio sem orientação | Estado vazio com escolha de dados; estados de salvamento (Editando/Salvo/Não salvo) e Preview/Salvar/Publicar | `editor/chrome.tsx` |
| Telemetria/IA ausentes no editor | Copilot de BI que altera o documento em etapas (Pedido → Prévia → Aplicar), com um único passo de undo; telemetria ao vivo; painel de foco | `editor/copilot.ts` (+ teste), `AiTab.tsx` |
| Galeria sem identidade | Capas 16:9 geradas do conteúdo; grade/lista, filtros, busca, ordenação e favoritos | `editor/covers.ts`, `routes/reports.tsx` |

### 2.5 Motor de visualização (v2)
Problema original: "gráficos parecem protótipo — poucos dados, pouca interação". Princípio adotado: **cada gráfico responde a uma pergunta**.

| Problema | Solução |
|---|---|
| Poucos tipos de gráfico | Combo, empilhado/100%, agrupado, cascata, bullet, histograma, box plot, bolhas, treemap, funil, sankey, tabela/calendário de calor, medidor, step, sparkbars |
| Dados rasos | Dataset Lume Varejo (vendas diárias, lojas, clientes, DRE), campos calculados (`calc` num/den/diff) e grãos de data; período ancorado no dado mais recente; YoY via `shiftYear` |
| Tooltip pobre | Tooltip rico: meta, Δ meta, ano anterior, YoY, participação, campos extras |
| Sem retorno ao usuário | Hover com dim dos demais e seleção persistente |
| Filtro entre visuais ausente | Cross-filter **e** cross-highlight, com barra "Filtrado por … ×" e limpar seleção |
| Navegação analítica ausente | Drill-down com breadcrumb e drill-through com contexto; zoom por arrasto com mini-mapa; linhas de referência e anotações |
| Ações do visual escondidas | Toolbar discreta (Filtrar, Ordenar, Drill, Foco, Inspecionar, Exportar) |
| Estados não tratados | Estados do widget: carregando, vazio, erro, sem permissão, defasado, ao vivo, filtrado, selecionado |
| KPIs e tabelas básicos | KPI com período, ano anterior, meta e secundárias; tabelas com multi-ordenação, colunas, totais, grupos e formatação condicional (`cf.ts`) |
| Dashboards repetitivos | Quatro dashboards, cada um com uma pergunta: Desempenho Comercial, Resultado e Orçamento, Valor e Risco de Clientes, Operações ao Vivo |

Onde: `apps/web/src/viz/engine` (`model.ts`, `Cartesian.tsx`, `Other.tsx`), `viz/Chart.tsx`, `DataTable.tsx`, `WidgetToolbar.tsx`, `states.tsx`, `data/vendas.ts`. Testes: `engine/model.test.ts`, `cf.test.ts`, `data/vendas.test.ts`.

### 2.6 Mapas e GIS
Pedido original: *zoom e fullscreen com estilo quebrado; linhas retas entre pontos; mapa de iluminação "péssimo"; equipe de campo deveria simular tempo real; falta uma tela de listagem.*

| Problema | Solução |
|---|---|
| Fullscreen quebrado | Causa: `transform` da animação de entrada prendia o `position: fixed`. Corrigido removendo o transform após a entrada |
| Zoom/controles quebrados | `GeoCanvas` com zoom fracionário (roda, pinça, teclado) e controles próprios |
| Sem tela de listagem | `/maps` com galeria e capas vivas; `/maps/:mapId` abre o workspace compartilhado |
| Linhas retas | `roadPath`: trajetos que seguem as vias em rede, patrulha, obras, equipes e análises |
| Iluminação pública ruim | Camada em canvas com fotocélula, dimerização, circuitos e transformadores, com casos e informações próprias |
| Equipe de campo estática | Simulação em tempo real (seeded): estados, SLA, feed de atividade, central de despacho |
| Mapas parecidos entre si | 8 mapas operacionais + cobertura de sinal, expansão de fibra, clima e risco; cada um com análise própria |
| Salvar camadas internas | Salvamento compacto de camadas |
| Importar dados geo | KMZ/KML/GeoJSON/CSV com tela Dados e portabilidade do dataset |
| Gêmeo digital | Cena 3D em three.js carregada **sob demanda** (`viz/scene3d`) |

Onde: `routes/maps/*` (testes `engine.test.ts`, `model.test.ts`), `viz/map`, `viz/scene3d`, `net/` (grafo da rede: `generate`, `layout`, `los`).

### 2.7 Relatórios de demonstração
Problema: relatórios genéricos e parecidos. Solução: cada um com identidade e análise própria, interativa, exportável (CSV), atualizável e acessível por teclado.
- **Anomaly Explorer** — baseline robusto (mediana/MAD), z-score ajustável, leitura ao vivo, mapa de calor regional.
- **SLA & Risk Monitor** — burndown do orçamento de erro com projeção, alertas multi-janela, matriz de risco, simulação de incidente.
- **Customer Behavior** — funil em fluxo, comparação de segmentos, coortes com retenção, caminhos.

Onde: `routes/demo-reports.tsx`, `routes/demo/` (teste `data.test.ts`).

### 2.8 Workflow Builder
Problema: fluxos complexos de dados sem ferramenta visual. Solução: galeria, canvas de nós, inspetor, biblioteca, **simulação** de execução (`RunPanel`), diálogos e Copilot de fluxos. Engine com teste próprio (`engine.test.ts`), seeds e store.
Onde: `routes/workflows/`.

### 2.9 Home e Login
| Problema | Solução |
|---|---|
| Home genérica | **Workspace Pulse**: onde eu estava, o que mudou, o que exige atenção, pulso do negócio, recentes, favoritos, saúde dos dados; ⌘K para relatórios, ações e perguntas |
| Entrada do produto sem identidade | Login com **Product Pulse** (dados → modelo → relatório/mapa/fluxo, mesmos componentes do produto), SSO progressivo (descobre o provedor pela organização), fases Autenticando → Conectando workspace → Conectado, erros acessíveis, caps-lock, lembrar e-mail, reduced motion |
| App abria na Home | `/login` é a **rota inicial** (`state/auth.ts`) |

### 2.10 Copilot (IA)
Pacote `packages/assistant-ui` + motor de exemplo no app (`copilot/engine.ts`): painel lateral e tela própria, contexto, evidências, citações, links e ações. O motor é **simulado** (determinístico, sem LLM); a arquitetura real está em ADR-0033–0041.

### 2.11 Build, deploy e infra
| Problema | Solução |
|---|---|
| Hospedar o shell sem servidor | `VITE_HASH_HISTORY=1`: histórico por hash e caminhos relativos (`build:static`) |
| Artifact bloqueava scripts/CSS externos | `build:artifact` gera **uma única página** com JS/CSS/imagens embutidos (`tools/artifact/inline.mjs`) |
| Passos manuais e `pnpm` fora do PATH | `tools/deploy.sh` roda `tsc` + testes + builds via `node vite.js` (ainda **não commitado**) |
| Publicar com domínio próprio | Domínio no Registro.br, e-mail no Fastmail, app em Cloudflare Pages em `app.biwebstudio.com.br` (conta pessoal do usuário) |

### 2.x Data Workspace (Living Data Engine) — 2026-10-10
| Problema | Solução | Onde |
|---|---|---|
| A tela de Dados era uma lista de fontes e datasets, sem mostrar o ciclo do dado | Workspace com 11 seções (visão geral, fontes, catálogo, modelo, qualidade, publicados, transformações, linhagem, enriquecimento, mudanças, execuções), inspetor contextual e Copilot | `apps/web/src/dataworkspace/` |
| Conectar dados era um formulário único | Wizard de 8 etapas com 118 conectores (disponível/preparado/planejado) e formulário por tipo (banco, CSV, REST, MQTT, SFTP, PDF…) | `ConnectWizard.tsx`, `connectors.ts` |
| Perfil e grade de dados poderiam divergir | Linhas semeadas geram o perfil (nulos, distintos, padrões, histograma); mesmo motor para grade e perfil | `sample.ts` |
| Mudança estrutural sem controle | PROPOR → APROVAR → APLICAR com diff classificado (aditivo/compatível/breaking), impacto clicável e histórico | `Changes.tsx`, `ops.ts` |
| Diagrama pequeno demais ao abrir | `fit` só roda depois de medir o container; inspetor aberto recolhe a navegação | `Canvas.tsx`, `DataWorkspace.tsx` |
| `tsc` falhava por `catalog.ts` × `Catalog.tsx` (caixa) | Dados renomeados para `registry.ts` | `dataworkspace/` |
| IA como requisito | Operação determinística completa com IA desligada; privacidade por metadados/amostras mascaradas | `DataWorkspace.tsx › PrivacyBlock`, `store.ts` |


### 2.y CI, deploy e documentação — 2026-10-10
| Problema | Solução | Onde |
|---|---|---|
| Deploy manual e sem registro | GitHub Actions publica no Cloudflare Pages (projeto `biweb`) a cada push em `main`; gera os tokens antes do build | `.github/workflows/deploy.yml`, `docs/runbooks/README.md` |
| `wrangler-action` falhava no workspace pnpm | Workflow chama `npx wrangler@4 pages deploy` direto | `deploy.yml` |
| Token do `wrangler login` não servia no CI | Token de API (Pages: Edit) + `CLOUDFLARE_ACCOUNT_ID` como Actions secrets; o OAuth do login expira em ~1 h | `docs/PROJETO.md` §9 |
| CI vermelho por ciclos de dependência | `ago()` movida para `editor/time.ts`; imports só de tipos deixam de contar como ciclo | `editor/time.ts`, `.dependency-cruiser.cjs` |
| Documentação desatualizada em relação às rotas | `tools/check-docs.mjs` roda no CI e falha se uma rota não estiver na doc; regras para agentes em `AGENTS.md` | `tools/check-docs.mjs`, `AGENTS.md`, `CLAUDE.md` |
| Arquivos obsoletos na raiz | Removidos `design-output/` e `design-handoff.zip` | commit `6fe824a` |


## 3. Decisões que valem daqui para frente
1. **Não apagar o que existe**: cada nova rodada incorpora ao estado atual e preserva o design system aprovado.
2. **Tokens, nunca cores literais**; contraste testado.
3. **Visualização responde a uma pergunta**; nada de gráfico decorativo.
4. **IA propõe, humano aplica**: Pedido → Prévia → Aplicar, com undo e resultado editável à mão.
5. **Sem padrões genéricos de IA** na UI (card sobre gradiente, glow, partículas, slogans gigantes).
6. **Dados determinísticos e semeados** nas demos, para testes estáveis.
7. Commit/push **somente quando o usuário pedir**; `.pnpm-store/` e `.wrangler/` ficam fora do git.
8. **Documentação no mesmo commit** da mudança; o CI confere as rotas (`AGENTS.md`).

## 4. Pontos em aberto
- Nenhum backend real: dados, auth, Copilot e SSO são simulados no cliente; `apps/control-plane`, `crates/*` e `packages/*` (dashboard-core, runtime, data-runtime…) são esqueletos. O editor ainda não usa o QDL/semantic layer do blueprint.
- Grãos de data de minuto/hora estavam planejados; hoje: dia, semana, mês, trimestre e ano.
- O runbook cobre o deploy, mas ainda não DNS/e-mail do domínio.
- Cobertura de testes concentrada em motores de dados; E2E cobre o shell inicial (8 testes) e precisa ser ampliado para editor, mapas, workflows e login.
- Domínio/e-mail: configuração feita via navegador; vale registrar DNS (MX/SPF/DKIM) no runbook.

## 5. Como rodar e validar
```bash
cd apps/web
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173   # dev (pnpm pode não estar no PATH)
npx tsc -p tsconfig.json --noEmit                                  # tipos
npx vitest run                                                     # testes
../../tools/deploy.sh                                              # checks + página única do artifact
```
