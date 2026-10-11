# BDE / Discovery Studio — Auditoria e plano (Fase 0)

> Data: 2026-10-11. Nenhum código foi alterado: este arquivo é o único artefato da Fase 0. A Fase 2 vai incorporar o conteúdo definitivo em `docs/PROJETO.md` e em uma página própria do BDE; este documento é o plano de trabalho.

## 1. O que existe hoje (auditoria)

**Stack.** `apps/web`: React 19 + Vite 7 + TanStack Router + zustand (+ immer) + React Aria Components + `react-intl`. Design system em `packages/ui` (Button, Badge, Icon, Menu, PopoverButton, SegmentedControl, Switch, Avatar, IconButton, Overlays…) com tokens de `packages/tokens`. Copilot em `packages/assistant-ui` (`Copilot`, contrato `CopilotEngine`, blocos `text | evidence | links | steps | citation | actions | badge`).

**Rotas** (`router.tsx`, 59 linhas, uma `createRoute` por rota; módulos pesados com `lazyRouteComponent`). O Data Workspace usa `/data`, `/data/$section`, `/data/$section/$itemId` apontando para o mesmo componente. `tools/check-docs.mjs` falha o CI se uma rota não estiver na tabela da seção 4 de `PROJETO.md`.

**Shell** (`shell/AppShell.tsx`): rail lateral com `NAV` (id, `labelId` do catálogo, ícone, rota), função `area(path)`, topbar com ⌘K e botão Copilot. O dock do Copilot é do shell, exceto em `data`, `migration` e no editor, que têm Copilot próprio e recebem o clique do botão por evento (`biweb:data-copilot`). `CommandPalette.tsx` monta itens por grupo (`reports | actions | editor | copilot`).

**Módulos de referência.**
- *Data Workspace* (`dataworkspace/`, ~4,4 mil linhas): layout `dw` = navegação + árvore contextual · centro · painel direito (Inspetor / Copilot / Revisão); seções `lazy`; zustand com seleção do inspetor; mock determinístico em `registry.ts`/`ops.ts`/`sample.ts`; `Canvas.tsx` (pan/zoom/minimapa), `DataGrid.tsx` (virtual, ordenar, filtrar), `ConnectWizard.tsx` (8 etapas), `Lineage.tsx`/`ModelView.tsx`, `Enrichment.tsx`, `Changes.tsx` (ChangeSets), `Provenance.tsx` (diálogo de origem), `ui.tsx` (Badge de saúde/confiança `ConfBadge`, `Hist`, `Spark`, `Meter`, `Tabs2`, `Kv`, `Section`, `ViewHead`, `Empty`, `useTicker`), `CopilotPanel.tsx`/`copilot.ts` (propõe, não aplica).
- *Migration Studio*: wizard de 5 etapas, workspace com abas e painel de item, projeto demo com contagens verificadas por teste.
- *Maps* (`routes/maps/`: `GeoCanvas`, `overlays`, `import.ts`), *Workflows* (`model.ts`, `engine.ts`, `seeds.ts`, `Canvas`), *Report Builder* (`editor/`, `templates*.ts`, `copilot.ts`).
- Estilos por módulo em CSS próprio com prefixo (`dw-*`), só tokens.

**Documentação.** `docs/PROJETO.md` (271 linhas, seções 1–13, data de revisão no topo), `docs/PROBLEMAS-RESOLVIDOS.md`, `docs/README.md`, `docs/architecture/*` (blueprint, 32 arquivos + ADRs), `docs/runbooks/README.md`, `apps/web/README.md`.

**Apresentação.** **Não é um deck de slides**: é uma página HTML única (`apps/web/public/apresentacao/index.html`, 256 linhas) com **26 seções** (`#ecossistema`, `#motores`, `#lde`, … `#diferenciais`, `#telas`, `#visao`), tokens claro/escuro, carrossel inicial e lightbox. Imagens reais em `img/*.jpg` (claro `-l`, escuro `-d`) geradas por `tools/capture-presentation.mjs` + `tools/presentation-shots.mjs` (Playwright com o Chrome instalado). Selos de honestidade **Na demonstração / Arquitetura aprovada / Roadmap**.

## 2. Mapa de reutilização

| Necessidade do Discovery | Reutilizar | Observação |
|---|---|---|
| Layout nav + centro + painel direito | Padrão de `DataWorkspace.tsx` (grid `dw`) | Nova casca `DiscoveryStudio.tsx` com classes `ds-*`; copia o padrão, não importa o CSS do DW |
| Tabelas densas | `DataGrid.tsx` (virtual, ordenar, filtrar) | Importado como está; se faltar tipo de coluna, estender de forma opcional |
| Canvas de grafo (Entities, Mission Map, Research Graph) | `dataworkspace/Canvas.tsx` + estilo de `Lineage.tsx` | Mesma linguagem do Model View/Lineage |
| Inspetor, Review | `Inspector.tsx`/`ReviewPanel.tsx` (padrão) | Inspetor próprio do Discovery com os mesmos blocos `Kv`/`Section` |
| Badges, confiança, meter, tabs, empty | `dataworkspace/ui.tsx` | Importar. Confiança decomposta é componente novo (`ConfidenceBreakdown`) |
| Wizard (Research Mission, 8 passos) | Estrutura de `ConnectWizard.tsx` | Mesmo cromo de etapas |
| Mapa de resultados e unidades | `GeoCanvas` + `overlays` | Pontos/clusters; **Open in Map Builder** navega para `/maps` |
| Provenance / evidência | `Provenance.tsx` (diálogo) | Ampliar em `EvidenceViewer` (trecho destacado, página+região, registro/campo) |
| Enriquecimento → LDE | `dataworkspace/Enrichment.tsx`, `ops.ts › ENRICHMENTS`, `store.ts › setEnrich` | O DW recebe propostas externas por uma ação nova e **aditiva** no store |
| Mudanças/ChangeSet | `Changes.tsx` (Antes/Depois) | Padrão visual do diff semântico |
| Copilot | `@biweb/assistant-ui` `Copilot` + novo `copilot/discovery.ts` (`CopilotEngine`) | Sem novo chatbot. Blocos `evidence`/`links`/`actions` já cobrem as respostas |
| ⌘K | `CommandPalette.tsx` | Grupo novo `discovery` com as 8 ações |
| Menus de contexto | `Menu` de `@biweb/ui` | Entity, Observation, Source |
| Motion | CSS com `opacity`/`stroke-dashoffset` (regra: não animar `transform` em SVG com posição), `useTicker` | `prefers-reduced-motion` desliga tudo; animação por clusters, nunca por nó |
| Report / Workflow | `editor/templates-bi.ts`, `routes/workflows/seeds.ts` | **Create Report/Workflow** abre o builder com o dataset/evento como contexto (rota existente + parâmetro de estado), sem duplicar editor |

## 3. O que precisa ser criado

1. Pasta `apps/web/src/discovery/` (abaixo).
2. Um ícone `discovery` na biblioteca (`packages/ui/src/components/Icon.tsx`): bússola/rede de nós, traço 1,5 px, grade 16.
3. Componentes novos (só onde não há equivalente): `ConfidenceBreakdown`, `EvidenceViewer`, `ResearchProgress` (checklist com contagens), `SemanticChange` (antes → depois), `SourceConvergence` (animação de fontes → entidades), `StageFlow` (pipeline compacto com contagem), `EnrichmentPreview` (CURRENT × PROPOSED).
4. Camada de dados demo tipada e centralizada + testes de consistência.
5. Domínio i18n `discovery` (ver decisão D1).
6. Motor do Copilot do Discovery.

## 4. Rotas e pastas propostas

**Rotas** (mesmo padrão do `/data`, componente `lazy`):

| Rota | Tela |
|---|---|
| `/discovery` | Overview (External Intelligence Pulse) |
| `/discovery/$section` | `explore`, `missions`, `watchlists`, `entities`, `sources`, `observations`, `changes`, `evidence`, `datasets`; contextuais: `conflicts`, `policies`, `runs`, `settings` |
| `/discovery/$section/$itemId` | missão, watchlist, entidade, fonte, observação, mudança, evidence pack, dataset, run |

Estado de UI (aba, modo Table/Graph/Map, filtros, consulta do Explore) fica no store, não na URL, como no DW.

**Pastas**
```
apps/web/src/discovery/
  index.ts  DiscoveryStudio.tsx  discovery.css  store.ts  ui.tsx
  data/       types.ts (contratos §8.14)  seed.ts  derive.ts  stats.ts  seed.test.ts
  views/      Overview  Explore  Missions  MissionWizard  MissionDetail  Watchlists
              Entities  EntityDetail  Sources  SourceDetail  Observations  Changes
              Evidence  Conflicts  Datasets  Runs  Policies
  panels/     Inspector  CopilotPanel  EnrichmentPreview
  viz/        EntityGraph  ResultMap  Timeline  Compare  ConfidenceBreakdown  EvidenceViewer
  copilot.ts  (motor CopilotEngine)
```
Sem `manualChunks`; sem arquivos que diferem só por caixa (dados em `data/seed.ts`, componentes em `views/`).

## 5. Esquema da camada de dados demo

Contratos em `data/types.ts`: `ResearchMission`, `ResearchSpec`, `SourceDescriptor`, `SourcePolicy`, `DiscoveryResult`, `FetchSnapshot`, `ExternalDocument`, `Observation`, `Evidence`, `EntityCandidate`, `ChangeEvent`, `Conflict`, `EvidencePack`, `EnrichmentProposal`, `ResearchDataset`. Toda observação carrega `subject, claim, observedAt, sourceId, evidenceIds[], confidence: {authority, freshness, corroboration, extraction, entityMatch, contradictions}, status`; o número agregado **deriva** dos componentes (nunca é digitado). Histórico é lista de versões (nunca sobrescreve). Fontes espelho apontam para `originalOf` (1 original + N espelhos contam como 1 evidência independente).

`seed.ts` é a única fonte; `derive.ts` calcula tudo o que a UI mostra; **Overview, Mission Detail, Watchlist e Datasets leem de `stats.ts`**, e `seed.test.ts` verifica que os números batem com o que se navega (12 missões ativas, 184 fontes, 3 conflitos abertos, 8 propostas, 27 organizações = 18+7+2, Competitive Intelligence v4 etc.). Linhas muito numerosas (184 fontes, 348 observações do run) são geradas por PRNG semeado, com um subconjunto "nomeado" escrito à mão. Tudo exibe o selo **Demo data**. Preferência de dados reais de marca: nomes de concorrentes (Power BI, Tableau…) já aparecem no Migration Studio; preços e mudanças são explicitamente mock.

## 6. Integrações (pontos de contato com código existente)

- **LDE:** ação nova no `dataworkspace/store.ts` (`addExternalProposal`) + bloco "Externo (BDE)" em `Enrichment.tsx`. O BDE **nunca** altera o modelo: a proposta entra como `proposed` e só vira `applied` pelo fluxo de revisão do LDE (DISCOVER → PROPOSE → REVIEW → LDE VALIDATION → APPLY).
- **Map/Report/Workflow Builder:** navegação para rotas existentes com contexto de handoff no store do Discovery; sem alterar os builders além de, se necessário, ler esse contexto de forma opcional.
- **Copilot:** engine passado ao `Copilot` do shell quando a área é `discovery`; contexto = entidade/fonte/missão selecionada.

## 7. Alterações previstas em código compartilhado (todas mínimas e retrocompatíveis)

| Arquivo | Mudança |
|---|---|
| `router.tsx` | +3 rotas `/discovery…` (lazy) |
| `shell/AppShell.tsx` | +área `discovery` no `area()`, no `NAV` e no engine do Copilot |
| `shell/CommandPalette.tsx` | +grupo `discovery` (8 ações) |
| `packages/ui/.../Icon.tsx` | +ícone `discovery` |
| `i18n/catalog.ts`, `messages/navigation.ts`, `palette.ts` | chaves novas (+ domínio `discovery`, ver D1) |
| `dataworkspace/store.ts`, `Enrichment.tsx` | recebe propostas externas |
| `tools/presentation-shots.mjs` | +capturas `bde-*` |

## 8. Riscos

1. **Consistência de números** (spec tem 12 missões "ativas" mas lista 5 nomeadas; Mission Detail diz 14 mudanças/semana e a Watchlist 12). Mitigação: 5 nomeadas + 7 menores; mudanças da missão incluem uma 6ª entidade, a watchlist tem 5; tudo em `stats.ts` com teste.
2. **Escala visual** (centenas de nós): clusters + revelação progressiva; grafo limitado a ~40 nós visíveis.
3. **Animação:** HMR deixa timers/zustand velhos (reload completo ao testar); `transform` em SVG posicionado quebra layout (usar `opacity`/`stroke-dash`).
4. **Tamanho do bundle:** tudo `lazy`; `GeoCanvas` e `Canvas` já são reutilizados, não duplicados.
5. **Fronteiras (dependency-cruiser):** discovery → dataworkspace é uma direção só; nada em `packages/` depende de `apps/web`.
6. **i18n:** o repo exige catálogo, mas o DW inteiro ainda é pt-BR literal (dívida declarada no roadmap §11.8). Ver D1.
7. **Honestidade comercial:** o BDE é protótipo; na apresentação ganha o selo "Na demonstração" só no que existe na tela e "Arquitetura aprovada" no resto; sem afirmar crawling real.
8. **Escopo:** ~25 telas/visões. Entregar em fatias com commits pequenos (ordem em §10).

## 9. Método de atualização da apresentação (Fase 3)

Editar `index.html` **in loco**, aditivamente: novas seções inseridas com a mesma marcação (`section.pg`, `.eyebrow`, `.panel`, `.eng`, `.eco`, `.gal`, selos `.st`); numeração `<b>NN</b>` e a navegação superior reajustadas sem remover nenhuma seção. Capturas novas via `presentation-shots.mjs` (`bde-overview`, `bde-explore`, `bde-mission`, `bde-watchlist`, `bde-entity`, `bde-evidence`, `bde-change`, `bde-enrich`), claro e escuro, e conferir os `.pin` (coordenadas em % de 1440×880). Atualizar `#ecossistema`, `#motores` ("Quatro" → "Cinco motores"), `#copilot`, `#caso`, `#diferenciais`, `#telas`, definição e frase final; `PROJETO.md §13` no mesmo commit.

## 10. Ordem de execução da Fase 1

1. Contratos + seed + stats + testes de consistência. 2. Casca (rota, shell, ícone, ⌘K, i18n do chrome) + Overview. 3. Sources/Source Detail/Policies + snapshots. 4. Observations, Evidence Pack, Confidence. 5. Explore (progresso, resultado, Table/Graph/Map). 6. Entities (detalhe, grafo, resolução, Compare). 7. Missions (wizard, detalhe, mapa, ResearchSpec). 8. Watchlists/Changes/Conflicts. 9. Datasets + handoffs (LDE, Map, Report, Workflow). 10. Copilot. 11. Motion, claro/escuro, a11y, `tsc`/`vitest`/dependency-cruiser, verificação A–I no navegador.

## 11. Decisões e suposições (para o checkpoint)

- **D1 — Idioma da UI.** Suposição adotada: *chrome* (rail, ⌘K, títulos de seção) pelo catálogo em pt-BR/en/es; **corpo do módulo** em um domínio `discovery` do catálogo só em pt-BR com en/es preenchidos nos textos estáveis, e queries demo em português. Alternativa: corpo em pt-BR literal como o DW (mais rápido, mas viola a regra do AGENTS.md). 
- **D2 — "Super Brain".** O material atual renomeou para **BIWEB Intelligence Core** (§13 de `PROJETO.md`, nome trocável em um só termo). Suposição: usar **Intelligence Core** no produto e na apresentação e manter "Super Brain" fora, salvo se você preferir reverter.
- **D3 — "Slides".** A apresentação é uma página rolável; "novos slides" viram novas seções, na mesma ordem narrativa.
- **D4 — Contagens de entidades da missão** (6): Power BI, Tableau, Qlik, Looker, Domo + ThoughtSpot (mesmas plataformas do Migration Studio).
- **D5 — Alteração no DW** (propostas externas) é inevitável para o fluxo F; fica aditiva.
