# BIWEB Studio — Documentação do projeto

> Documento vivo. É o ponto de entrada para quem vai evoluir o código. O **porquê** de longo prazo está no blueprint ([`architecture/`](architecture/), ADRs); aqui está o **como o projeto é hoje** e **como mexer nele**.
> Histórico do que já foi resolvido: [PROBLEMAS-RESOLVIDOS.md](PROBLEMAS-RESOLVIDOS.md). Regras para humanos e agentes manterem esta doc em dia: [`AGENTS.md`](../AGENTS.md).
> Última revisão: 2026-10-10 (Data Workspace, CI/deploy automático, apresentação para clientes). Apresentação para clientes: `/apresentacao/` no app (seção 13).

## 1. O que é

Plataforma web de Business Intelligence: relatórios e dashboards editáveis, mapas operacionais (GIS), gêmeo digital 3D, workflows de dados, migração de plataformas de BI externas e um Copilot de IA. Hoje existe **apenas o front-end** (`apps/web`), rodando 100% no browser com dados demonstrativos determinísticos. O blueprint prevê control plane TS + data plane Rust, mas esses módulos são esqueletos.

## 2. Mapa do repositório

| Caminho | O que é | Maturidade |
|---|---|---|
| `apps/web` | Shell SPA (Vite + React 19 + TanStack Router). **Todo o produto vive aqui** | Funcional (demo) |
| `packages/tokens` | Tokens DTCG → CSS vars, TS, Tailwind, ECharts; teste de contraste WCAG | Funcional |
| `packages/ui` | Design system (React Aria Components + Tailwind v4) | Funcional |
| `packages/assistant-ui` | UI e tipos do Copilot (painel, mensagens, evidências, ações) | Funcional |
| `packages/*` (demais) | `dashboard-core`, `runtime`, `builder`, `viz-*`, `data-runtime`, `layout-engine`, `schema`… | Esqueleto (README + épico) |
| `apps/control-plane`, `jdbc-bridge`, `render-service` | Backends | Esqueleto |
| `crates/` | Data plane Rust (Cargo workspace) | Esqueleto |
| `testing/` | `e2e` (Playwright + axe), `load`, `query-correctness`, `corpus`, `ai-evals` | Só `e2e` |
| `docs/` | Blueprint, ADRs, design system, runbooks, esta doc | — |
| `apps/web/public/apresentacao/` | Apresentação para clientes servida em `/apresentacao/` (HTML + capturas) | Funcional |
| `.github/workflows/` | `ci.yml` (TS + Rust), `deploy.yml` (Cloudflare Pages a cada push em `main`) | Funcional |
| `tools/` | `brand/` (capas e logos), `artifact/inline.mjs`, `deploy.sh`, `check-docs.mjs` (confere rotas × doc) | Funcional |
| `design-handoff/`, `REFERENCE_PACK_*.md`, `SCREEN_CATALOG_BI.md`, `SKILLS_STACK.md` | Material de entrada de design | Referência |

> Trabalhe em `apps/web` e use os pacotes `tokens`, `ui` e `assistant-ui`. Não preencha os esqueletos sem um épico em [`architecture/32-epics-and-implementation-prompts.md`](architecture/32-epics-and-implementation-prompts.md).

## 3. Como rodar

Requisitos: Node ≥ 22.12, pnpm 10 (`mise install` instala o conjunto).

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm typecheck && pnpm test && pnpm lint   # lint inclui fronteiras (dependency-cruiser)
just check               # tudo, incluindo Rust
```

Sem `pnpm` no PATH, a partir de `apps/web`:
```bash
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
npx tsc -p tsconfig.json --noEmit
npx vitest run
```
Se 5173 estiver ocupada o Vite sobe em outra porta: leia o log. Após editar uma store, faça reload completo (HMR deixa timers/zustand desatualizados).

**Login de demonstração:** qualquer e-mail válido + senha de 6+ caracteres (exceto `123456`, `password`, `senha123`…). SSO é simulado. A sessão fica em `sessionStorage`.

## 4. Rotas (`apps/web/src/router.tsx`)

| Rota | Tela | Arquivo principal |
|---|---|---|
| `/login` | Login (rota inicial, guarda de auth no `beforeLoad` da raiz) | `routes/login/` |
| `/` | Home — Workspace Pulse; "Continue de onde parou" é um carrossel (mapa → relatório → fluxo, 7 s, pausa com mouse/foco/botão, setas do teclado, sem autoplay com movimento reduzido) | `routes/home.tsx` (`Continue`), `home-model.ts`, `home.css` |
| `/reports` | Catálogo de relatórios | `routes/reports.tsx` |
| `/reports/$id` | Relatório aberto | `routes/report-route.tsx`, `editor/ReportView.tsx` |
| `/reports/$id/edit` | Editor (lazy) | `editor/EditorPage.tsx` |
| `/maps`, `/maps/$mapId` | Galeria e workspace de mapas | `routes/maps-gallery.tsx`, `map-workspace.tsx`, `routes/maps/` |
| `/workflows`, `/workflows/$id` | Galeria e Workflow Builder (lazy) | `routes/workflows/` |
| `/migration`, `/migration/$projectId` | Migration Studio: projetos e workspace de migração (lazy) | `routes/migration/` |
| `/data`, `/connections` | **Data Workspace** (Living Data Engine): visão geral | `dataworkspace/` |
| `/data/$section`, `/data/$section/$itemId` | Seções `sources`, `catalog`, `model`, `quality`, `published`, `transformations`, `lineage`, `enrichment`, `changes`, `runs`; `$itemId` = fonte, ativo, modelo, dataset, ChangeSet ou run | `dataworkspace/` |
| `/models/$id` | Modelo semântico | `routes/model.tsx` |
| `/copilot` | Copilot em tela cheia | `routes/copilot.tsx` |
| `/apresentacao/` | Apresentação para clientes (estática, sem login, fora do roteador) | `public/apresentacao/` |

Rotas legadas de mapas e `/dashboards/$id` redirecionam. Com `VITE_HASH_HISTORY=1` o roteamento usa hash (builds estático e artifact).

## 5. Arquitetura do `apps/web`

```
src/
  shell/        AppShell, CommandPalette (⌘K)
  state/        auth.ts (sessão demo), ui-store.ts (tema, densidade, painéis, favoritos, Copilot)
  data/         datasets, tipos, consulta e tempo real
  editor/       documento do relatório, store, canvas, painéis, Copilot de BI
  viz/          motor de gráficos, tabelas, filtros, toolbar, estados, mapa e 3D
  routes/       telas (home, reports, maps, workflows, migration, login, demo…)
  copilot/      motor de exemplo do Copilot (simulado)
  datasources/  Tela antiga de Dados (DataPage, importação, linhagem); hoje aba "Datasets de relatório" em Publicados
  dataworkspace/ Data Workspace (LDE): ver 5.8.1
  net/          grafo da Rede SP (geração, layout, line-of-sight)
  fixtures/     Lume Varejo
  i18n/         pt-BR.ts
```

### 5.1 Estado
- **Documento do relatório** (`editor/store.ts`, zustand + immer): fonte única de verdade. Canvas, painéis, Copilot, undo/redo e salvar leem/escrevem o mesmo objeto. Mudanças passam por `commit` com rótulo de undo; `tx` agrupa várias em um passo.
- **Estado efêmero de UI** (`state/ui-store.ts`): nunca guarda o documento. Persistência em `localStorage` só para preferências (favoritos, visão da lista, workspace) — sempre em `try/catch`.
- **Interação em runtime** (filtro cruzado, drill, valores de filtro, `view` overrides) vive na store do editor, separada do documento salvo.

### 5.2 Documento (`editor/doc.ts`)
`ReportDoc → Page[] → Comp[]`. Cada `Comp` tem tipo (`kpi`, `chart`, `table`, `matrix`, `map`, `scene3d`, `slicer`…), geometria, `style`, `interactions`, `data: {dataset, table}`, `localFilters` e `props` por tipo (`KpiProps`, `ChartProps`…). Filtros existem em três níveis: **relatório → página → visual**. `rules` guarda as regras SE/ENTÃO que alteram status visual.
Regra: novas capacidades entram como **campos opcionais no documento**; documentos antigos precisam continuar abrindo.

### 5.3 Dados (`data/`)
- `types.ts`: `Dataset → Table → Field` (`kind`: dimension | measure | geo; `format`; campos calculados).
- `registry.ts`: datasets disponíveis — `ds_rede_sp` (gerado por `net/generate`, determinístico) e `ds_vendas` (Lume Varejo, `vendas.ts`). Datasets importados entram aqui.
- `query.ts`: agregação, grãos de data (dia/semana/mês/trimestre/ano), janelas de período ancoradas no dado mais recente, comparação com ano anterior.
- `live.ts`: simulação de tempo real e telemetria.
Hoje a consulta roda no cliente. O alvo do blueprint é QDL → semantic layer → Query Service; mantenha a interface de `query.ts` estreita para facilitar a troca.

### 5.4 Visualização (`viz/`)
- `engine/kinds.ts`: catálogo de tipos de gráfico e categorias do Picker. `engine/model.ts` (`buildModel`) transforma dados + props em pontos (valor, série, meta, anterior, participação, média móvel). `Cartesian.tsx` e `Other.tsx` renderizam.
- Interações: tooltip rico, hover com dim, seleção persistente, cross-filter/highlight (`useEmit`), drill-down/through, zoom por arrasto, linhas de referência, anotações.
- `cf.ts`: formatação condicional. `states.tsx`: estados do widget. `WidgetToolbar.tsx`: ações do visual. `FilterBar.tsx`/`filters.tsx`: filtros.
- `map/` e `scene3d/` (three.js, **carregado sob demanda**).

### 5.5 Editor (`editor/`)
`EditorPage` + `Canvas` (arrastar, redimensionar, guias, multisseleção, camadas, minimapa). Painéis em `panels/`: Build (Picker), Dados (wells por papel), Visual, Estilo, Avançado, Interações, Regras, IA. `templates*.ts` e `library.ts` definem o que se pode inserir. `covers.ts` gera capas a partir do conteúdo. `copilot.ts` converte pedidos em operações sobre o documento (Pedido → Prévia → Aplicar).

### 5.6 Mapas (`routes/maps/`)
`GeoCanvas` (Web Mercator próprio, zoom fracionário) + `renderers`/`overlays`. `model.ts`/`base.ts` definem os mapas; `roads.ts` gera trajetos que seguem vias; `field-sim.ts` simula operação em campo (seeded); `LightsLayer.tsx` desenha iluminação em canvas; `import.ts` lê KMZ/KML/GeoJSON/CSV. Cada mapa deve ter **identidade e análise próprias**. Veja `routes/maps/README.md`.

### 5.7 Workflows (`routes/workflows/`)
`model.ts` (nós/arestas), `engine.ts` (simulação de execução, testada), `store.ts`, `Canvas`, `Inspector`, `Library`, `RunPanel`, `copilot.ts`, `seeds.ts`.

### 5.8 Migration Studio (`routes/migration/`)
Módulo que conecta uma plataforma de BI externa (Power BI, Tableau, Qlik, Looker, ThoughtSpot, Domo), inventaria, interpreta, avalia compatibilidade, reconstrói nos Builders existentes, valida e publica. **Só protótipo de front-end**: nada fala com backend. Regra de ouro: ele *coordena*, nunca recria editor — reconstruir/editar abre Report Builder, Map Builder, Workflow Builder ou Data Workspace (`OpenIn` em `ui.tsx`, caminhos em `analysis.ts › BUILDER_PATH`).
- `model.ts` tipos, plataformas, estratégias (Fidelity/Native/Modernize), compatibilidade e o estado do projeto (`ProjState`, `Msg`, `Op`).
- `data.ts` inventário determinístico do projeto demo *Commercial & Operations Migration* (12 relatórios, 48 páginas, 284 visuais, 37 medidas, 9 datasets, 41 tabelas, 3 mapas, 2 processos), árvore, grafo de dependências (`EDGES`, `relatives`, `impactOf`) e categorias de compatibilidade. `analysis.ts` guarda o resto da análise: projetos, descobertas, fila de revisão, validação, mapeamentos, blueprint, modelo ER, tradução semântica, reconstrução e Bridge.
- `store.ts` (zustand) estado por projeto (`ps[projectId]`): estratégias com herança visual → página → relatório → projeto, decisões de revisão, reconstrução, escopo parcial (`excluded`), publicação e chat. `derive.ts` tem os cálculos puros (`effectiveStrategy`, `readiness`, `pendingReview`). `copilot.ts` responde com proposta → prévia → aplicar (`respond`); só `applyProposal` altera estado.
- Telas: `MigrationList` (lista rica + filtros) → `NewMigration` (5 etapas) → `Workspace` (cabeçalho, trilha de fluxo, abas e painel de item redimensionável com Inspetor, Dependências e Copilot) → `tabs/*` (Visão geral, Inventário, Blueprint, Modelo de dados, Semântica, Compatibilidade, Mapeamentos, Reconstrução, Validação, Publicação, Bridge). `Processing` é a análise em andamento.
- Projetos `detail: 'summary'` (Tableau, Qlik, Looker, Domo, ThoughtSpot) têm Visão geral, Inventário e Compatibilidade resumidos; as demais abas apontam para o projeto demo. Um projeto novo de Power BI reaproveita o inventário completo do demo.
- Animações em SVG só com `opacity` (animar `transform` em elemento SVG sobrescreve o atributo `transform` de posição e empilha tudo na origem). Reaproveita estilos do Copilot dos Fluxos (`workflows.css`).
- Testes: `data.test.ts` (totais do escopo, mistura 73/18/7/2, referências cruzadas) e `store.test.ts` (publicação parcial, herança de estratégia, Copilot).

### 5.8.1 Data Workspace (`dataworkspace/`)
Protótipo navegável do Living Data Engine (LDE): conectar → descobrir → entender → relacionar → modelar → mapear → normalizar → enriquecer → validar → aprovar → publicar → rastrear → monitorar → evoluir. **Só front-end**: todos os dados são mock determinístico e centralizado; o carregamento é sob demanda (seções `lazy`).
- Dados mock: `registry.ts` (fontes, ativos, colunas via mini-DSL `col('NOME:gen:PK')`, relacionamentos), `ops.ts` (modelos/ERD, mapeamentos, qualidade, ChangeSets, runs, datasets publicados, linhagem, enriquecimento, revisão), `connectors.ts` (118 conectores com disponibilidade AVAILABLE/PREPARED/PLANNED, formulários por tipo e descoberta simulada), `sample.ts` (linhas e perfis calculados de uma amostra semeada, por isso perfil e grade batem).
- Estado: `store.ts` (zustand): seleção do inspetor, decisões (aceitar/rejeitar), fontes criadas pelo wizard, status de ChangeSet/enriquecimento, execução ativa, chat do Copilot, privacidade de IA, "Detalhes técnicos". A URL guarda só seção + item; abas e filtros ficam no estado.
- Layout (`DataWorkspace.tsx`): navegação + árvore contextual · centro · painel direito (Inspetor, Copilot, Revisão), recolhível. Em telas de canvas, abrir o inspetor recolhe a navegação.
- Reuso: `Canvas.tsx` (pan, zoom, minimapa, arrasto) serve ao Modelo e à Linhagem; `DataGrid.tsx` (rolagem virtual, ordenar, filtrar, redimensionar, fixar, ocultar) serve ao Catálogo e aos Publicados; `ConnectWizard.tsx` tem 8 etapas; `CopilotPanel.tsx`/`copilot.ts` respondem por contexto (propõem; não aplicam).
- Convenções: classes `dw-*` em `dataworkspace.css`, só tokens; a IA pode estar desligada e tudo continua funcionando; zonas (RAW → STAGING → QUARANTINE → CURATED → SERVING) e ids técnicos só aparecem em Linhagem, Execuções e "Detalhes técnicos".
- A tela anterior de Dados (`datasources/DataPage.tsx`) foi preservada como aba "Datasets de relatório" em Publicados.
- Não commite arquivos com nomes que diferem só por caixa (`catalog.ts` × `Catalog.tsx` quebra o `tsc` no macOS): os dados ficam em `registry.ts`.

### 5.9 Copilot
UI em `packages/assistant-ui`; motor simulado em `copilot/engine.ts`. Respeita `aiEnabled`: a plataforma tem que funcionar com a IA desligada (ADR-0033, imposto pelo dependency-cruiser).

## 6. Convenções

**Design**
- Cores, raios e espaçamentos só via tokens (`--accent`, `--viz-cat-n`, `--viz-status-*`, `--dash-*`…). Nenhuma cor literal fora de `packages/tokens`.
- Preservar o design system aprovado; evoluir sem redesenhar o produto.
- Evitar padrões genéricos de IA: card central sobre gradiente, glow, glassmorphism, partículas, slogans gigantes.
- Gráfico responde a uma pergunta; mais informação por interação, não mais ruído.
- Movimento respeita `prefers-reduced-motion`. Acessibilidade: axe sem violações graves, gráficos operáveis por teclado.

**Código**
- TypeScript estrito com `noUncheckedIndexedAccess` (indexar array/Record exige guarda).
- Textos de UI em pt-BR (`i18n/pt-BR.ts`).
- Dados demo **determinísticos** (semeados); sem `Math.random` solto em dados que testes usam.
- Armazenamento do browser sempre protegido por `try/catch`.
- Fronteiras entre pacotes: `.dependency-cruiser.cjs` (core sem React, plugins só via SDK, IA fora do core, sem ciclos). Imports só de tipos (`import type`) não contam como ciclo (`tsPreCompilationDeps: false`); ciclos em runtime quebram o CI. Utilitários compartilhados vão para arquivos próprios (ex.: `editor/time.ts`), não para componentes.
- Build: **não** usar `manualChunks` no Vite (gerou dependência circular e quebrou produção).
- Mapa em tela cheia: não deixar `transform` em ancestral de `position: fixed` (a animação de entrada prendia o elemento).

**Git**
- Commits em pt-BR no formato `tipo(escopo): resumo` (`feat`, `fix`, `build`, `chore`…), corpo com bullets do que mudou.
- `.pnpm-store/` e `.wrangler/` não entram no git.
- Nada de arquivos que diferem só por caixa (`catalog.ts` × `Catalog.tsx` quebra o `tsc` no macOS).
- **Documentação é parte da entrega**: mudou rota, pasta, comando, convenção ou deploy? Atualize `docs/` no mesmo commit (regras em [`AGENTS.md`](../AGENTS.md)).

## 7. Receitas para evoluir

**Novo tipo de gráfico:** adicionar em `ChartKind` (`editor/doc.ts`) → registrar em `viz/engine/kinds.ts` (categoria e pergunta que responde) → defaults em `engine/defaults.ts` → renderer em `Cartesian.tsx` ou `Other.tsx` → tooltip/legenda → cobrir `buildModel` em `engine/model.test.ts` → conferir troca de tipo no editor.

**Novo componente do relatório:** `CompType` + `props` tipadas em `doc.ts` → renderer em `viz/Widgets.tsx`/`Render.tsx` → entrada em `editor/library.ts` → painel de propriedades em `editor/panels/` → estados e interações.

**Novo dataset:** criar o gerador determinístico → registrar em `data/registry.ts` com campos tipados (kind/format) → adicionar teste como `vendas.test.ts`.

**Novo mapa:** definir em `routes/maps/model.ts` (+ dados em `data-*.ts`) → trajetos via `roads.ts` → capa em `MapCover.tsx` → análise própria → teste em `model.test.ts`.

**Novo relatório demo:** dados em `routes/demo/data.ts` + teste → tela em `routes/demo-reports.tsx` → entrada em `routes/gallery.ts`.

**Nova plataforma ou projeto de migração:** `PLATFORMS` em `routes/migration/model.ts` → projeto em `analysis.ts › PROJECTS` (+ `SUMMARY_TREES`/`SUMMARY_DIALECT` se for resumido).

**Nova rota:** `createRoute` em `router.tsx` (lazy se pesada) → item no `AppShell` e na paleta ⌘K → atualizar a tabela da seção 4.

**Novo workflow seed:** `routes/workflows/seeds.ts`; nova regra de execução em `engine.ts` + teste.

## 8. Testes

| Camada | Comando | Cobre |
|---|---|---|
| Unit (Vitest) | `pnpm test` | tokens (contraste), ui, motor de gráficos, `cf`, dados de vendas, Copilot do editor, mapas, workflows, relatórios demo, Migration Studio |
| E2E (Playwright + axe) | `pnpm e2e` | shell inicial (`testing/e2e/tests/shell.spec.ts`, 8 testes) |
| Documentação | `node tools/check-docs.mjs` | toda rota de `router.tsx` aparece na tabela da seção 4 |
| Fronteiras | `pnpm check:boundaries` | regras de dependência |
| CI | `.github/workflows/ci.yml` | lint, typecheck, testes, build, fronteiras, docs (job `ts`) e clippy/testes Rust (job `rust`) |

Hoje: 78 testes unitários em `apps/web` (10 arquivos), mais tokens e ui. Lacunas: testes do Data Workspace (`sample.ts`, `store.ts`, `copilot.ts`), E2E do editor, mapas, workflows, migração e login; teste visual; carga e correção de queries (aguardam backend).

## 9. Build e deploy

| Alvo | Comando | Saída |
|---|---|---|
| Produção padrão | `pnpm --filter @biweb/web build` | `apps/web/dist` |
| Estático (rotas por hash) | `pnpm --filter @biweb/web build:static` | `dist-static` |
| Página única (artifact) | `tools/deploy.sh` ou `build:artifact` | `dist-artifact/page.html` |

`tools/deploy.sh` roda tipos + testes antes do build; `--skip-checks` pula, `static` gera também o estático.

**Produção:** Cloudflare Pages, projeto **`biweb`** (`biweb.pages.dev` e `app.biwebstudio.com.br`; domínio no Registro.br, e-mail no Fastmail).

**Deploy automático:** `.github/workflows/deploy.yml` roda a cada push em `main` (ou manualmente em Actions → deploy → Run workflow): gera os tokens (`@biweb/tokens build`, porque `packages/tokens/dist` não vai para o git), roda `tsc` e `vitest`, faz `vite build` com `VITE_HASH_HISTORY=1` (rotas por hash) e publica `apps/web/dist` com `npx wrangler@4 pages deploy`. Exige os **Actions secrets** `CLOUDFLARE_API_TOKEN` (token de API com *Account → Cloudflare Pages → Edit*; o token do `wrangler login` é OAuth de ~1 h e **não** serve) e `CLOUDFLARE_ACCOUNT_ID`. A action oficial `wrangler-action` falha no workspace pnpm; por isso o workflow chama o `wrangler` direto.

**Deploy manual:** `wrangler login`, depois `npx wrangler pages deploy apps/web/dist-static --project-name biweb --branch main`. Passo a passo e verificação em [`runbooks/`](runbooks/README.md).

## 10. Glossário

| Termo | Significado |
|---|---|
| Workspace | Contexto de dados: `rede` (Rede Metropolitana SP) ou `comercial` (Lume Varejo) |
| Dataset / Table / Field | Fonte, tabela e coluna; `kind` = dimensão, medida ou geo |
| Comp | Componente posicionado numa página do relatório |
| Wells | Zonas de campos de um gráfico (eixo, valores, série, meta, tooltip) |
| Cross-filter / cross-highlight | Seleção que filtra / só destaca os outros visuais |
| Drill-down / drill-through | Descer na hierarquia / abrir outra página levando o contexto |
| Picker | Seletor de visualização agrupado por pergunta |
| Product Pulse / Workspace Pulse | Composição viva do login / Home |
| Copilot | Assistente de IA (hoje simulado) |
| QDL, Semantic layer, Cell | Conceitos do blueprint ainda não implementados |

## 11. Roadmap técnico (próximos passos naturais)

1. Persistência real: salvar/abrir `ReportDoc` num backend (hoje só memória/estado local), com versões imutáveis (ADR-0024).
2. Auth real e multi-tenant; substituir `state/auth.ts`.
3. Camada de consulta: `data/query.ts` → QDL + semantic layer (ADR-0005/0006), mantendo a API do front.
4. Extrair do `apps/web` para os pacotes: `dashboard-core` (documento + migrations), `viz-sdk` (contrato de plugin), `layout-engine`.
5. Copilot real via Model Gateway com principal delegado e ChangeSets (ADR-0033–0041).
6. Ampliar E2E (Data Workspace incluso) e adicionar testes visuais; documentar deploy em `docs/runbooks/`.
   Data Workspace: testes unitários de `sample.ts`/`store.ts`/`copilot.ts`, ligação real ao LDE e persistência de decisões.
8. Material de apresentação para os demais módulos (relatórios, mapas, fluxos, migração), com capturas reais, segurança e governança.
7. Grãos de data por minuto/hora para relatórios em tempo real.

## 12. Como manter esta documentação

- Mudou rota, estrutura de pastas, convenção ou comando? Atualize as seções 2–9 **no mesmo commit**.
- Terminou algo relevante ou resolveu um problema? Acrescente em [PROBLEMAS-RESOLVIDOS.md](PROBLEMAS-RESOLVIDOS.md) (problema → solução → onde).
- Decisão arquitetural nova ou que contraria o blueprint? Escreva um ADR em `architecture/adr/` e cite aqui.
- Atualize a data de revisão no topo.

## 13. Apresentação para clientes (`apps/web/public/apresentacao/`)

- **Endpoint:** `/apresentacao/` (arquivo estático de `public/`, **sem login**; fora do roteador e do shell). Em produção: `https://app.biwebstudio.com.br/apresentacao/`. No app, ⌘K → "Abrir apresentação do produto".
- `index.html`: página única, PT-BR com títulos em inglês, no design do app (tokens claro/escuro, botão **Tema**). Conta a história **Why → Plataforma → Fundação de dados → Builders → Migração → Inteligência → Caso → Diferenciais → Visão** em 26 blocos. Movimento (respeita `prefers-reduced-motion`): **carrossel no início** (mapa → relatório → fluxo → dados, 7 s, pausa com mouse/foco/botão, setas do teclado, marcadores por slide), entrada em cascata, marcadores que surgem em sequência, barra de progresso, navegação ativa e ampliação das capturas (clique). O JS está no fim do arquivo e é opcional: sem ele a página aparece completa.
- `img/*.jpg`: **capturas reais** do protótipo, em claro (`-l`) e escuro (`-d`). Gerar de novo: suba o dev server e rode `BIWEB_URL=http://127.0.0.1:5173 node tools/capture-presentation.mjs [nome…]` (roteiro em `tools/presentation-shots.mjs`; usa o Google Chrome instalado via playwright). Regenere quando a UI mudar de forma visível. Os marcadores numerados (`.pin`) usam coordenadas em % da imagem 1440×880; confira-os após refazer uma captura.
- Selos de honestidade em cada trecho: **Na demonstração** (existe no protótipo), **Arquitetura aprovada** (decidida em ADR, ainda não implementada: Composition Engine/BCE, contratos canônicos, LDE e BCE como serviços independentes, Intelligence Core) e **Roadmap** (ex.: visuais customizados, temas por organização). Não afirmar integração com provedores de IA nem benchmarks.
- O contexto global do Copilot chama-se **BIWEB Intelligence Core** (antes "Super Brain"; nome só de narrativa, em um único termo fácil de trocar).
- Números do material (18 fontes, 104 ativos, 118 conectores: 38 disponíveis, 55 preparados, 25 planejados; 23 tipos de gráfico; 6 plataformas de BI) vêm do app: confira antes de editar.
- O deploy publica `dist/` (inclui `public/`), então a apresentação sai junto com o app (~7 MB de imagens).
