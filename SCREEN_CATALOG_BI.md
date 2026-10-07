# SCREEN CATALOG + CRUZAMENTO — Arquitetura × Reference Pack

> **Para quê:** insumo para a rodada de design (Claude Design). Parte 1 cruza o que a arquitetura já decidiu com o que o [Reference Pack](REFERENCE_PACK_BI.md) recomenda. Parte 2 define as telas do sistema como **briefs estruturais** (zonas, componentes, estados, referências).
> **O que este arquivo NÃO é:** não define identidade visual (cor, tipografia, ícones, raios). Isso fica para o design.
> **Fontes lidas na íntegra:** `docs/architecture/04-frontend-architecture.md`, `06-dashboard-builder.md`, `adr/ADR-0032-design-system.md`.
> **Fontes lidas por trechos (mapa de capacidades, fases, fluxos, semântica, governança, IA):** `00-executive-summary` §2, `30-roadmap` §47, `31-ai-assistant` §18, `11-semantic-layer` §14.2, `22-observability-lineage-governance` §35, títulos de `28-flows`.
> **Convenção:** "REF-xx" = ficha do Reference Pack. "§" = seção dos docs de arquitetura. Nada em `docs/` foi alterado.

---

# PARTE 1 — CRUZAMENTO

## 1.1 O que já está decidido (e muda o Reference Pack)

O Reference Pack deixou 6 decisões em aberto (seção 15). Os docs já respondem a maioria:

| Decisão em aberto no pack | O que a arquitetura já define | Fonte | Efeito no design |
|---|---|---|---|
| Tema claro/escuro | **Ambos.** `data-theme="light\|dark"` no app; **dashboard tem tema próprio independente** (dashboard claro dentro de app escuro; embed herda tema do host) | 04 §31; ADR-0032 | Desenhar chrome do app em 2 temas e dashboard em temas separados. O canvas do builder mistura os dois: chrome (tokens app) + conteúdo (tokens runtime) |
| Grade 12 ou 24 | **12/24 colunas**, estratégia padrão `grid`; também `stack`, `free`, `tabs`. Breakpoints xl/lg/md/sm/xs | 06 §9.1–9.2 | Layout "Auto × Livre" do Grafana mapeia para `grid/stack` × `free` (ver 1.3) |
| DAX/expressões? | **BEL** (linguagem própria) com **ExpressionEditor em CodeMirror 6 + WASM**; sem SQL no frontend | 04 §31; ADR-0006/0008 | "Builder \| Código" do Grafana (REF-15) vira "Visual \| BEL" no editor de métricas |
| IA? | **Sim, nativa e opcional** (Fase 3+): dock lateral, ações inline, ⌘K, preview de propostas no canvas, estado vazio "criar a partir de um objetivo" | 06 §9.6; 31 §18 | O anti-pattern "sparkles/chatbot" precisa ser **refinado** (ver 1.4) |
| Tempo real | **Sim**, Fase 4 (Flow C) | 30 §47 | Barra de contexto do Grafana (REF-14) vira requisito, não "complementar" |
| Densidade padrão | Não decidido; **WCAG 2.2 AA** é meta | 04 §31 | Impõe piso de tamanho de alvo (ver 1.5) |

## 1.2 Alinhamentos diretos (arquitetura ↔ pack)

| Tema | Arquitetura | Pack | Veredicto |
|---|---|---|---|
| Padrão de editor | Builder = **Canvas + Inspector + Component tree + Paleta + Field picker + Command palette** (04 §7.2, 06 §9.3) | Navigation → Canvas → Inspector (REF-08), árvore de estrutura (REF-12/16), field wells (REF-05) | **Alinhado.** Não há conflito estrutural |
| Canvas | Renderiza **o runtime real** + overlays (seleção, handles, guides, medidas, drop zones) | Overlay discreto: 8 handles, header de 3 ações, medidas transitórias (REF-02/10) | **Alinhado.** Overlay é camada própria — bom lugar para o design da seleção |
| Inspector | **Gerado por JSON Schema** (core + `configSchema` do plugin) com hints `x-ui` (cor, slider, field picker, seção, condição) | Seções sem cards, busca, toggle por seção, "Redefinir", desabilitado visível, resumo inline (REF-03/09/15) | **Alinhado, com lacuna** (ver 1.3-A) |
| Layers | Painel de layers com dnd-kit | Item hierarchy (REF-12), Content outline (REF-16), Layers (REF-08) | **Alinhado** |
| Snap/guides | Guides de bordas/centros de irmãos + grid; threshold em px de tela | Guias/medidas transitórias, snap desligável (REF-10) | **Alinhado.** Falta decidir tecla de desligar snap |
| Teclado | ⌘K, setas movem 1 unidade / 10 com Shift, atalhos remapeáveis | Enter/Shift+Enter (descer/subir), Alt = medição (REF-10) | **Alinhado.** Pack acrescenta navegação hierárquica |
| Ver dados | "Ver como tabela" para qualquer widget (acessibilidade) | "Table view" no preview (REF-15) | **Alinhado**; mesma função serve a11y e depuração |
| Draft/publish | Revisões draft/publish/rollback/diff; modelo semântico com ciclo de vida | "Apply changes" explícito no Model view (REF-06) | **Alinhado, mas mais forte** (ver 1.3-D) |
| Tokens | App vs runtime separados (`dash.*`, `viz.*`) | Chrome neutra; só o dado recebe cor saturada | **Muito alinhado:** a única cor "forte" da UI deveria vir de `viz.*` e de estados |
| Primitivas | React Aria Components (sem estilo) + Tailwind v4 | Controles compactos de 24–32 px, filetes de 1 px | **Compatível.** React Aria não impõe visual; densidade é responsabilidade do design |

## 1.3 Lacunas e divergências (onde o pack precisa ser adaptado)

**A. Hints `x-ui` do Inspector não cobrem o que o pack pede.**
06 §9.4 lista: widget de cor, slider, field picker, seção, condição. Para reproduzir os princípios do pack, o schema precisa expressar também:
- toggle no cabeçalho da seção (`x-ui: sectionToggle`);
- "Redefinir padrão" por seção/propriedade (derivável do `default` do schema);
- **palavras-chave de busca** por propriedade (o pack exige busca no topo);
- **motivo de desabilitado** (`disabledReason`) para o tooltip;
- **resumo inline** quando recolhido e **contador** de itens (ex.: Thresholds 2);
- par em 2 colunas (W|H, mín|máx) e campo numérico com unidade e aceitação de expressão;
- aba de escopo (`Visual` vs `Geral`).
→ **Ação para o design:** definir esses hints como parte do contrato do Inspector, porque o design será implementado **uma vez** no renderizador de schema e vale para todos os plugins. É uma vantagem (consistência) e um risco (formulário genérico).

**B. Aggregation no chip (Power BI) × métricas semânticas (nossa arquitetura).**
No Power BI o usuário escolhe "Sum/Average/…" no chip (REF-05). Aqui, "Revenue não é `SUM(amount)`" (11 §14.2): **Metrics e Measures são conceitos publicados, com semântica de aditividade**. O usuário arrasta `revenue`, não escolhe uma agregação.
→ **Não copiar** "agregação no chip" para metrics. Copiar o **chip com menu** apenas para: modificadores de time intelligence (YTD, PoP, % do total), formato, renomear e "mostrar como". Agregação livre só para campos brutos, se existir.

**C. Árvore de dados: não é "tabela → colunas".**
O modelo é **Entity → Dimensions / Measures / Metrics / Hierarchies / Calculated fields**, com tipos de dimensão (categorical, time com grains, geo, boolean, bucket), **certificação** (`draft → certified → deprecated`), **owners**, **sinônimos** e **classificação** (PII etc.) (11 §14.2; 22 §35).
→ O DatasetTree do pack ganha: ícones por tipo semântico; **selo de certificado/depreciado**; aviso de campo depreciado com substituto; indicador de classificação (PII/restrito); "em uso" no dashboard atual; busca por **sinônimo**.

**D. "Apply changes" × Draft → Impact analysis → Publicação.**
O Model view do Power BI aplica alterações direto. Nosso modelo semântico tem **ciclo de vida e publicação humana** (Flow I: proposta no draft → impact analysis → publicação).
→ O editor de modelo precisa de **barra de estado do rascunho** (Draft/Publicado), **painel de impacto** (dependentes: dashboards, métricas) e **diff**. Isso não existe em REF-06 e deve ser desenhado.

**E. Canvas livre × grid por padrão.**
Power BI/Figma são canvas livres; nosso padrão é `grid` com `stack` e `free` **contido num container** (06 §9.1).
→ Do pack, adotar **comportamento de seleção/guias** (REF-02/10), mas o **modelo de posicionamento** é por colunas. Mapeamento de vocabulário:

| Nosso modelo | Equivalente nas refs | Observação para o design |
|---|---|---|
| `grid` | Grafana Auto; Power BI snap-to-grid | Reflow e colisão visíveis ao arrastar |
| `stack` | Tableau container H/V; Figma auto layout | Mostrar direção/gap no inspector (REF-09 seção Auto layout) |
| `free` | Power BI canvas livre; Tableau Floating | Contido; avisar impacto no responsivo (06 §9.2) |
| `tabs` | Abas de página / tabs do Grafana | Diferenciar tabs **dentro** da página de **páginas** do dashboard |

→ Seletor de modo de layout **por container** no Inspector (REF-16: Layout Auto | Custom).

**F. Responsivo.** Breakpoints e "editar layout para breakpoint X" (06 §9.2) **não aparecem** em nenhuma referência de forma clara. Precisa de **desenho original**: seletor de breakpoint no topo do canvas, indicador de "override explícito" por nó, "ocultar neste breakpoint", pré-visualização de dispositivo.

**G. Atributos exclusivos nossos sem referência no pack:** edição multi-tenant/workspace, permissões (RBAC+ABAC), embed com token, plugins, lineage, access requests, alertas, relatórios agendados, rastreio de revisões. Para esses, **não há referência visual no pack**; o brief das telas abaixo marca "referência parcial" ou "sem referência".

## 1.4 Anti-patterns do pack que precisam de nuance

| Anti-pattern (pack §13) | Realidade da arquitetura | Ajuste |
|---|---|---|
| #11 "Sparkles / ícones de IA em todo lugar" | IA tem **cinco superfícies** previstas: dock lateral, ações inline, ⌘K, editores especializados, estado vazio (31 §18) | Manter a regra **contra decoração**, mas **desenhar** as superfícies de IA como parte do sistema: ação é um verbo ("Explicar", "Organizar"), não um símbolo; identificar origem com rótulo "IA:" (undo "IA: …", 06 §9.6). Sem glow/gradiente |
| #10 "UI parecida com chatbot" | Dock lateral com conversa existe | O dock é **um painel entre outros** no switcher (como Format/Data). Nunca vira a tela principal. Chips de contexto ("Selecionado: 4 gráficos") ajudam a ancorar na seleção |
| #9 "Excesso de modais" | Propostas têm **preview no canvas** (widgets fantasmas, diff vermelho) com aceitar/rejeitar por item | Preview **sobre o canvas**, não modal. Já alinhado com o pack |
| #13 "Hover-only para ações" | WCAG 2.2 AA e teclado são requisito | Ações de hover (visibilidade, "…") **também devem aparecer com foco de teclado** e na seleção |
| #7 "Controles gigantes" | WCAG 2.2 | Ver 1.5 |

## 1.5 Densidade × acessibilidade (WCAG 2.2 AA)

O pack estima controles de **24–32 px**. WCAG 2.2 (critério 2.5.8, tamanho mínimo de alvo) exige alvo **≥ 24×24 CSS px** ou espaçamento equivalente. (Isso é conhecimento do padrão WCAG 2.2, não foi verificado em fonte nesta sessão.)
→ **Recomendação:** padrão **28 px** para linhas de input/lista; **24 px** só no modo compacto e **com espaçamento** que cumpra o critério; ícones-botão com área de 24×24 mínimo mesmo que o glifo seja 16. Foco visível sempre (`focus.ring` já existe nos tokens).
Também decorrem dos docs: **paleta categórica validada para daltonismo e contraste**; "ver como tabela" em todo widget; `ariaSummary` por plugin.

## 1.6 Mapeamento componente (pack) → pacote/arquitetura

| Componente do pack | Onde nasce na arquitetura |
|---|---|
| Inspector, PropertySection, PropertyRow | `packages/dashboard-builder` (Inspector por schema) sobre `packages/ui` |
| TreeView, OutlineTree | `packages/ui` (React Aria Tree) + dnd-kit no builder |
| FieldPicker, DatasetTree, FieldChip, FieldWell | Field picker do builder (06 §9.3) + `packages/ui` FieldPicker |
| WidgetFrame, KpiCard, MatrixTable | `dashboard-runtime` + plugins (KPI, tabela, pivot) — tokens `dash.*`/`viz.*` |
| Overlays (seleção, guides, medidas, drop zones) | Overlays do builder; geometria do `layout-engine` |
| ExpressionEditor (BEL) | `packages/ui` (CodeMirror 6 + WASM) |
| GlobalContextBar | `dashboard-runtime` (controles de filtro, estilizados por `dash.*`) |
| Assistant dock, chips de contexto, preview de proposta | `packages/assistant-ui` (carregado sob demanda) |
| ModelEntityCard, ModelRelationship, ModelDiagramTabs | **Não existem nos docs de frontend.** Precisam de entrada no inventário (editor de modelo, Fase 1–3) |
| DatasetTree com certificação/lineage | Catálogo (22 §35); sem componente de UI previsto |

## 1.7 Riscos de design identificados no cruzamento

1. **Formulário genérico:** Inspector gerado por schema tende a parecer "form de admin". Mitigação: investir no renderizador (hints do 1.3-A), não em telas isoladas.
2. **Duas famílias de token:** é fácil o chrome do app vazar para o canvas. Regra: **tudo dentro do widget = tokens runtime**; seleção/handles/guides = tokens app.
3. **Escopo de telas vs fases:** a primeira versão utilizável é **Fase 2**. Telas de Fase 3+ (BEL, DAG, IA, embed) devem ser desenhadas **depois**, mas já considerando os espaços reservados no shell.
4. **Falta de referência para responsivo, permissões e embed** (1.3-F/G): exigem desenho original, com testes de usabilidade.

---

# PARTE 2 — TELAS DO SISTEMA

> Briefs estruturais. Cada tela lista: objetivo, zonas, componentes (do inventário do pack), estados a desenhar, referências a consultar e docs de origem.
> **Prioridade por fase:** P0 = Fase 2 (primeira versão utilizável, 30 §47); P1 = Fase 3; P2 = Fase 4+.

## 2.0 Índice

| ID | Tela | Prioridade | Fluxo / doc |
|---|---|---|---|
| S00 | Application Shell | P0 | 04 §7.2 |
| S01 | Home / Workspace | P0 | 04, 22 §35 |
| S02 | Conexões e Datasets (Flow A/B) | P0 | 28 Flow A, B; 09 |
| S03 | Dashboard Builder — edição | P0 | 06 |
| S04 | Builder — Inspector: aba **Dados** (field wells + field picker) | P0 | 06 §9.4 |
| S05 | Builder — Inspector: aba **Formato** | P0 | 06 §9.4; 04 §31 |
| S06 | Dashboard Runtime — modo leitura | P0 | 04 §7.4; Flow D |
| S07 | Editor de Modelo Semântico | P0/P1 | 11; Flow I |
| S08 | Revisões: draft / publicar / diff / rollback | P0 | 30 §47 (Fase 2) |
| S09 | Editor de Métrica / BEL | P1 | 11 §14.3 |
| S10 | Assistente de IA (superfícies) | P1 | 31 §18; 06 §9.6 |
| S11 | Catálogo, busca e lineage | P1 | 22 §34–35 |
| S12 | Compartilhar e Embed | P1 | 19; Flow F |
| S13 | Transformation DAG | P1 | 10 |
| S14 | Exports, relatórios agendados e alertas | P1 | 30 §47 |
| S15 | Governança (certificação, access requests) e Admin | P2 | 22 §35; 17 |

## 2.1 Estados globais a cobrir em **todas** as telas

Vazio · carregando (esqueleto, não spinner gigante) · erro recuperável · sem permissão · rascunho × publicado · somente leitura · tema claro/escuro (app) e tema do dashboard · densidade compacta/confortável · foco de teclado visível · modo "ver como tabela" · IA desabilitada (superfícies de IA simplesmente **não aparecem**, 06 §9.6) · colaboração/conflito (Fase 7, só reservar espaço).

---

## S00 — Application Shell
**Objetivo:** moldura constante do produto; navegação entre áreas.
**Zonas:** (a) barra superior fina (contexto de workspace/tenant, busca ⌘K, usuário, estado de rascunho quando aplicável); (b) **rail de áreas** à esquerda estreito (Home, Dashboards, Dados, Modelos, Catálogo, Admin) — padrão "rail de views" do Power BI; (c) área de conteúdo; (d) painel direito do dock (IA, comentários) **recolhível a faixa vertical** com rótulo.
**Componentes:** AppToolbar, ViewRail, PaneSwitcher, GlobalSearch/CommandPalette, Breadcrumb.
**Estados:** rail recolhido/expandido; nenhum workspace; sem permissões para área; IA desligada; ambiente embed (shell **ausente**, só runtime).
**Refs:** REF-01 (rail + canvas + painéis), REF-08 (UI minimizável, painéis docked), REF-14 (barra de ações à direita no header).
**Não fazer:** sidebar larga com logos grandes e ilustrações; painéis flutuantes como estrutura.
**Docs:** 04 §7.2 (Shell: navegação, admin, catálogo, conexões, modelagem).

## S01 — Home / Workspace
**Objetivo:** achar e abrir trabalho; começar algo novo.
**Zonas:** barra de contexto do workspace; **lista densa** (tabela) de dashboards/modelos/datasets com colunas (nome, tipo, dono, certificação, atualizado, uso); filtros à esquerda ou acima; ação primária "Novo" (menu: dashboard, a partir de objetivo [IA], importar dados).
**Componentes:** DataGrid leve, FilterChips, SearchField, Badge de certificação, Menu.
**Estados:** workspace vazio (atalhos acionáveis: conectar, enviar CSV, exemplo — como o empty state do Power BI, REF-01); sem resultados; itens depreciados.
**Refs:** REF-01 (empty state com atalhos), REF-04 (busca + contagens).
**Não fazer:** grade de cards grandes com thumbnails decorativos; "hero".
**Docs:** 22 §35 (certificação visível; popularidade/uso).

## S02 — Conexões e Datasets
**Objetivo:** conectar fonte, descobrir schema, criar dataset (Flow A) ou enviar arquivo (Flow B).
**Zonas:** lista de conexões (esquerda); detalhe (centro): status, credenciais, **schema discovery em árvore**, preview de linhas; painel direito: propriedades do dataset (nome, owner, classificação de campos, agendamento/incremental).
**Componentes:** TreeView, DataGrid (preview), PropertySection, Stepper **leve** (não wizard modal), Status/Progress (jobs de ingestão).
**Estados:** testando conexão; erro de credencial; upload em andamento (CSV com milhões de linhas, Flow B); ingestão com falha parcial; campo sem classificação.
**Refs:** REF-04 (árvore + busca), REF-11 (separação visual de tipos de campo), REF-17 (lista mestre-detalhe com contagem visível/oculto — complementar).
**Sem referência forte no pack:** formulários de credenciais, progresso de ingestão.
**Docs:** 09 (conectores/ingestão), 28 Flow A/B.

## S03 — Dashboard Builder (tela principal / "hero")
**Objetivo:** montar páginas de dashboard com widgets reais e dados reais.
**Wireframe lógico:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: nome · Rascunho ▾ · Desfazer/Refazer · Breakpoint [xl lg md sm xs] │
│          Visualizar · Salvar rascunho · Publicar   ·   [⌘K]   · [IA]       │
├──────────┬─────────────────────────────────────────────────────┬──────────┤
│ Esquerda │                     CANVAS                           │ Direita  │
│ (abas)   │   (runtime real + overlays)                          │ Inspector│
│ Estrutura│                                                      │ contextu-│
│ Dados    │   [KPI][KPI][KPI][KPI]                                │ al ao    │
│ Widgets  │   [  gráfico  ][  gráfico  ]                          │ selecio- │
│          │   [      matriz / tabela     ]                        │ nado     │
│          │                                                      │ (+ switch│
│          │                                                      │ de ícones│
├──────────┴─────────────────────────────────────────────────────┴──────────┤
│ Abas de páginas  [Visão geral][Vendas][+]       zoom · fit · seleção: 2 itens │
└────────────────────────────────────────────────────────────────────────────┘
```
**Zonas:**
- **Esquerda, 3 abas:** *Estrutura* (árvore página > container > widget, com busca, visibilidade/lock), *Dados* (DatasetTree/field picker), *Widgets* (paleta, templates, blocos).
- **Centro:** canvas com overlays; grade; zoom/pan; toolbar flutuante curta do canvas (inserir widget, texto, filtro).
- **Direita:** Inspector contextual (Página / Container / Widget / Multi-seleção). Header nomeia o objeto selecionado.
- **Rodapé:** abas de páginas, status bar (zoom, fit, contagem da seleção, breakpoint atual).
**Componentes:** AppToolbar, DashboardCanvas, WidgetFrame, WidgetSelectionOverlay, WidgetFloatingActions, OutlineTree, DatasetTree, PageTabs, StatusBar, LayoutModeToggle, Command palette.
**Estados a desenhar:** canvas vazio (com "criar a partir de um objetivo", só se IA ativa); widget selecionado; multi-seleção (alinhar/distribuir ativos); arrastando da paleta (drop zones por estratégia do container); redimensionando (rótulo de dimensões + guias); colisão/reflow; widget em erro de query; widget sem dados; widget em carregamento; breakpoint com override; nó oculto neste breakpoint; objeto bloqueado; **preview de proposta de IA** (widgets fantasmas, diff); undo "IA: …".
**Refs:** REF-01, REF-02, REF-08, REF-10, REF-12, REF-16.
**Princípios do pack aplicáveis:** seções 07, 08, 09 (pack).
**Sem referência no pack:** seletor de breakpoint e overrides (ver 1.3-F).
**Não fazer:** paleta de widgets como galeria de cards grandes; toolbar com texto; modais para configuração de widget.
**Docs:** 06 inteiro; 04 §7.2/§7.4.

## S04 — Inspector · aba **Dados** (field wells)
**Objetivo:** ligar campos do modelo semântico aos **papéis** do widget.
**Zonas:** cabeçalho com tipo do widget + **Trocar visualização** (VisualizationPicker); lista de **slots por papel** (declarados pelo plugin: eixo, valor, série, tamanho, tooltip, small multiples…); abaixo, seção "Filtros do visual"; resumo de consulta (linhas, tempo, origem — opcional).
**Componentes:** FieldWell/FieldSlot, FieldChip, VisualizationPicker, FilterBuilder, FieldTypeIcon.
**Comportamentos:** soltar do DatasetTree; adicionar por menu (acessível); chip com menu (formato, renomear, modificadores de time intelligence) e remover; **sem agregação livre para metrics** (ver 1.3-B); modo "sugerir" (Viz Recommender, Fase 2); drop zone tracejada com instrução.
**Estados:** slot vazio; campo incompatível com o slot; campo depreciado (aviso + substituto); campo sem permissão (CLS/mascarado); métrica não certificada em dashboard que exige certificadas.
**Refs:** REF-05 (field wells), REF-11/13 (slots de encoding, Show Me), REF-04.
**Docs:** 06 §9.4 ("Field picker com drag de campos semânticos para papéis"); 11 §14.2.

## S05 — Inspector · aba **Formato**
**Objetivo:** configurar aparência/comportamento com dezenas de propriedades **sem virar pilha de cards**.
**Estrutura:** busca fixa → abas **Visual | Geral** → seções com chevron, **toggle no cabeçalho**, ações em ícone à direita, "Redefinir"; seção vazia = 1 linha + "+"; pares em 2 colunas; desabilitado visível com tooltip; resumo inline e contadores.
**Conteúdo típico por widget:** Título/Subtítulo, Eixos, Legenda, Rótulos, Cores (tokens `viz.*`), Tamanho/Posição/Alinhamento (também em multi-seleção), Interações (cross-filter, drill), Condições (`visibleWhen`), Acessibilidade (`ariaSummary`), Breakpoint.
**Componentes:** Inspector, PropertySection, PropertyRow, ColorSwatchPicker, Slider+valor, Toggle, SegmentedControl, ExpressionEditor (campos condicionais).
**Estados:** multi-seleção com valores mistos; campo com override por breakpoint; valor padrão × alterado (indicador); erro de validação inline.
**Refs:** REF-03, REF-09, REF-15 (busca + contadores + resumo inline), REF-16 (edit pane contextual).
**Docs:** 06 §9.4 (forms gerados do schema); 1.3-A deste arquivo.
**Não fazer:** um card por seção; abas por tipo de configuração; labels em caixa alta gigantes.

## S06 — Dashboard Runtime (modo leitura)
**Objetivo:** consumir o dashboard; filtrar, explorar, apresentar.
**Zonas:** cabeçalho fino (título, certificação, estado "atualizado há…", Compartilhar, Exportar); **GlobalContextBar** sticky (filtros/parâmetros + período + atualizar/auto-refresh); páginas (abas); conteúdo (widgets, tokens `dash.*`); rodapé opcional (navegação de páginas).
**Componentes:** GlobalContextBar, SlicerControl, WidgetFrame, KpiCard, MatrixTable, Menu de contexto do widget ("Ver dados", "Explicar" se IA), PageTabs.
**Estados:** filtro ativo (chips removíveis); cross-filter aplicado (destaque nos demais); drill path (breadcrumb); fullscreen; **apresentação** (páginas como slides, autoplay); tempo real (indicador de conexão, resync); sem permissão em um widget (mascarado/oculto); "ver como tabela"; mobile (empilhado).
**Refs:** REF-07 (resultado final sóbrio: título métrica/dimensão, KPIs, filtros no topo), REF-14 (barra de contexto, KPIs em faixa, seções colapsáveis).
**Docs:** 04 §7.4; 28 Flow C/D.
**Não fazer:** gradientes saturados em KPIs; cartões com sombra; ícones decorativos.

## S07 — Editor de Modelo Semântico
**Objetivo:** definir entidades, dimensões, medidas, métricas e relações; publicar com segurança.
**Wireframe lógico:**
```
┌ Toolbar: modelo · Rascunho ▾ · Impacto (n) · Validar · Publicar ────────────┐
├ Esquerda: Árvore do modelo │   Canvas de diagrama (entidades+relações)  │ Properties ┤
│ Entidades / Dimensões /    │   [Entity card]──1───*──[Entity card]     │ contextual:│
│ Measures / Metrics /       │          \                                  │ entidade / │
│ Relações / Políticas       │           *──[Entity card]                  │ campo /    │
│ (contagens + busca)        │                                              │ relação /  │
├ Abas de diagramas [Todas][Vendas][+] ─────── zoom · fit ─────────────────┴ política    ┤
```
**Zonas:** árvore do modelo com **contagens** (REF-04 imagem 3); canvas de diagrama com **cards de entidade** (cabeçalho + campos tipados + expandir/recolher + visibilidade); **relações ortogonais com 1/\***, direção do filtro, ativa/inativa; Properties contextual à direita; abas de diagramas + "adicionar entidades relacionadas".
**Específico nosso (sem referência):** barra de **Draft/Publicado**; painel de **Impacto** (dashboards e métricas dependentes); validação do compilador; políticas RLS/CLS como seção de propriedades; metadata de negócio (descrição, owners, sinônimos, classificação, certificação).
**Componentes:** ModelEntityCard, ModelRelationship, ModelDiagramTabs, TreeView, PropertySection, Impact panel, Diff.
**Estados:** relação selecionada; relação inativa; ciclo detectado; entidade sem chave; campo depreciado com dependentes (remoção bloqueada); proposta de IA no draft do modelo (Flow I).
**Refs:** REF-06 (principal), REF-04 (árvore com contagens), REF-16 (árvore/outline).
**Docs:** 11 §14.2, §14.5; 28 Flow I; 22 §35.
**Não fazer:** wizard modal para relações; "Apply changes" imediato sem rascunho.

## S08 — Revisões (draft · publicar · diff · rollback)
**Objetivo:** controlar o ciclo de vida de dashboards (e modelos).
**Zonas:** lista de revisões (esq.), **diff** visual (centro: lado a lado no canvas, destaque colorido de adições/remoções/alterações), metadados e ações (dir.: publicar, restaurar, comentar).
**Componentes:** TreeView/list, DiffView (a mesma linguagem visual do preview de IA), SegmentedControl (lado a lado | sobreposto), Status badge.
**Estados:** sem diferenças; conflito (Fase 7); aprovação pendente (Fase 6); rollback confirmado (ação reversível, sem modal pesado).
**Refs:** nenhuma direta no pack. Usar a gramática "fantasma + diff colorido" do 06 §9.6.
**Docs:** 06 §9.6; 30 §47 (Fase 2: draft/publish/rollback/diff).

## S09 — Editor de Métrica / BEL
**Objetivo:** criar métricas e campos calculados.
**Zonas:** formulário **Visual** (medida base, filtro, time intelligence) ↔ **BEL** (ExpressionEditor com autocomplete de campos); painel de **preview** (resultado em tabela/mini gráfico); painel de **dependências** e validação.
**Componentes:** ExpressionEditor, SegmentedControl (Visual | BEL), FieldPicker, Preview, SearchField.
**Refs:** REF-15 (Builder | Code; preview + Table view), REF-17 (mestre-detalhe: complementar).
**Docs:** 11 §14.3–14.4; 04 §31 (ExpressionEditor); 28 Flow I.

## S10 — Assistente de IA (superfícies)
Cinco superfícies (31 §18), **todas desligáveis**:
1. **Dock lateral** persistente com **chips de contexto** (ex.: "Selecionado: 4 gráficos"), conversa, citações, mini-visualizações de evidência (renderizadas pelos plugins).
2. **Ações inline:** menu do widget ("Explicar", "Melhorar", "Trocar visualização"), barra flutuante da multi-seleção ("Organizar"), ponto de dados ("Explicar variação").
3. **⌘K** em linguagem natural ("metade da largura", "adicionar filtro de período").
4. **Editores especializados:** descrever → fórmula (BEL), "descreva a transformação" (DAG), sugerir descrições/sinônimos (modelo).
5. **Estado vazio:** "criar a partir de um objetivo" (proposta de dashboard completo para preview).
**Preview de propostas:** overlay no canvas (fantasmas/diff), aceitar/rejeitar por item; aceitar = 1 passo de undo "IA: …".
**Refs:** nenhuma de IA no pack (propositalmente). Reusar: REF-10 (overlay/handles de diff), REF-02 (mini-toolbar contextual), REF-16 (painel contextual).
**Não fazer:** chatbot em tela cheia; sparkles/glow/gradiente; bolhas decorativas; avatar de IA grande.
**Docs:** 31 §18; 06 §9.6; ADR-0032 (emenda).

## S11 — Catálogo, busca e lineage
**Objetivo:** descobrir datasets/métricas/dashboards e entender dependências.
**Zonas:** busca com filtros (tipo, certificação, owner, classificação); lista densa com selo de certificação/depreciação e uso; detalhe com **grafo de lineage** e glossário.
**Componentes:** SearchField, DataGrid, Badge, TreeView, Graph (lineage).
**Refs parciais:** REF-04 (busca + árvore), REF-06 (linguagem de diagrama/relações para lineage).
**Docs:** 22 §34–35.

## S12 — Compartilhar e Embed
**Objetivo:** dar acesso interno e externo com segurança.
**Zonas:** popover/painel "Compartilhar" (pessoas/grupos/papéis, link, estado); aba **Embed** (modo, token assinado, claims, tema, filtros via API, preview).
**Componentes:** Popover/Panel, Combobox de pessoas, CodeBlock, Preview do embed (**runtime sem shell**).
**Estados:** sem permissão para compartilhar; token expirado; tema herdado do host.
**Refs:** nenhuma no pack. Evitar modal grande; preferir painel lateral.
**Docs:** 19; 28 Flow F.

## S13 — Transformation DAG
**Objetivo:** preparar dados com um grafo de transformações.
**Zonas:** canvas de nós; paleta de operações; Properties contextual do nó; preview de dados (tabela) embaixo.
**Componentes:** Graph canvas, nós compactos, DataGrid, PropertySection.
**Refs parciais:** REF-06 (canvas de diagrama + Properties contextual), REF-17 (lista mestre-detalhe como alternativa linear).
**Docs:** 10.

## S14 — Exports, relatórios agendados e alertas
**Zonas:** lista + painel de configuração (agenda, destinatários, formato, condição do alerta). **Refs:** nenhuma direta; reutilizar padrão de Inspector (REF-09) e lista (S01).

## S15 — Governança e Admin
Certificação/depreciação, access requests (owner aprova/nega), políticas de IA por tenant, usuários/SSO/papéis, auditoria. **Refs:** nenhuma no pack; reutilizar S01 (lista) + Inspector (S05). **Docs:** 22 §35; 17; 31 §14.

---

## 2.2 Ordem recomendada para a rodada de design

1. **Foundations** (tokens app × runtime, densidade 28/24 px, estados, 2 temas) — insumo: pack §07–10 + 1.5 deste arquivo.
2. **S00 + S03** (shell + builder) — a tela que define o produto.
3. **S05 + S04** (inspector Formato e Dados) — o renderizador de schema vale para todos os plugins.
4. **S06** (runtime) e o conjunto de widgets (KPI, gráfico, matriz) — REF-07.
5. **S07** (modelo semântico, com draft/impacto) e **S08** (revisões).
6. **S01 e S02** (home e dados).
7. P1: S09, S10, S11, S12, S13, S14.
8. P2: S15 e realtime (partes de S06).

## 2.3 Perguntas ainda em aberto (precisam de decisão de produto)

- ~~**Densidade padrão**~~ — decidida no 01-BRIEF §6: 28 px padrão, 24 px compacto (ver 1.5).
- **Responsivo:** edição de breakpoints no builder é P0 ou P1? (06 §9.2 prevê; nenhuma referência)
- **Dashboard exige métricas certificadas?** (22 §35 prevê política opcional) — afeta S04 e S06.
- **Idiomas e RTL:** ICU desde o início (ADR-0032); precisa de tela de seleção de idioma/formatos?
- **Embed:** o assistente aparece em embeds (Fase 5–6)? Reservar espaço no runtime?
- **Colaboração (Fase 7):** reservar cursores/presença no canvas desde já?
- **Nome/identidade visual e voz do produto** (insumo para o design, fora do escopo aqui).

## 2.4 Limites desta análise

- Li **na íntegra** `04-frontend-architecture.md`, `06-dashboard-builder.md` e `ADR-0032`. Os demais docs foram lidos **por seções** (listadas no cabeçalho); detalhes de `05-dashboard-engine`, `07-visualization-engine`, `17-security`, `10-transformation-engine`, `19` (além dos títulos) e demais ADRs **não foram lidos**, então as telas S09–S15 têm brief mais raso.
- O critério de alvo mínimo 24×24 px é conhecimento do WCAG 2.2, não verificado em fonte nesta sessão.
- Os briefs descrevem **estrutura e comportamento**; não há decisão visual aqui.
