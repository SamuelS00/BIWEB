# BIWEB Studio — design system

> Guia da marca e regras de uso. Fonte dos valores: `packages/tokens/src` (DTCG). Componentes: `packages/ui`. Versão visual navegável: o artefato "BIWEB Studio" (design system) e o protótipo em `prototype/index.html`.

BIWEB Studio é uma plataforma profissional de BI usada por horas seguidas por analistas e gestores. A interface é uma ferramenta de trabalho: densa sem ser confusa, neutra no chrome, com cor saturada apenas no dado, na seleção, no foco e em estados com significado. A identidade vem da tipografia, da proporção, da grade, do detalhe dos componentes de BI e dos estados — nunca de decoração.

## Princípios

- **Canvas soberano.** Três zonas: rail de áreas (`rail-width`) → canvas → painéis docked à direita (`panel-width`) com PaneSwitcher (`pane-switcher-width`). Painéis empurram o canvas; nunca o cobrem. Só a mini-toolbar do canvas e os popovers flutuam.
- **Densidade por controles pequenos e alinhados.** Linha padrão `control-md` (28 px); modo compacto `control-sm` (24 px). Nenhum controle comum acima de `control-lg` (32 px). Fonte de 11–13 px; o chrome nunca passa de `page-title` (16 px).
- **Seções por filete, não por cards.** Separe seções do Inspector com 1 px de `border-subtle` e `space-2`–`space-4` de espaço. Nunca envolva uma propriedade ou seção em card com borda e sombra.
- **Nada muda em silêncio.** Toda alteração proposta (IA, importação, reflow) segue Sugerir → Pré-visualizar → Confirmar → Aplicar, e aplicar vira um passo de undo rotulado.
- **Estado sempre explícito.** Ligado = preenchido em `accent`; desligado = contorno `border-control`; desabilitado = `text-disabled` com o motivo em tooltip; selecionado = `accent-subtle`; foco = `focus-ring`; drop-target = tracejado `drop-target`; erro = `danger` + ícone.

## Conteúdo e voz

- Escreva em pt-BR, com frases curtas e verbos no infinitivo nos botões: "Aplicar", "Cancelar", "Adicionar filtro", "Ver como tabela".
- Use maiúscula só na primeira palavra ("Receita por região", nunca "Receita Por Região"). Sem exclamação, sem emoji, sem superlativos.
- Números no formato brasileiro: `R$ 18,4 mi`, `42.381`, `27,8%`, `−0,4 p.p.`, datas `30/09/2026`, meses `jan`, `fev`.
- Título de widget em duas linhas: métrica em `widget-title` ("Receita") e "por dimensão · período" em `widget-subtitle` ("por mês · jan–set/2026").
- KPI na ordem rótulo → valor (`kpi-value`) → variação (`kpi-delta`): "Receita · R$ 18,4 mi · ▲ +9,6% vs 2025". A variação sempre leva seta e sinal, não só cor.
- A IA é uma capacidade do produto, não uma persona: sem nome, sem avatar, sem "Olá!". Rotule a origem com "IA:" ("IA: Adicionar Receita por estado") e nomeie ações por verbos ("Explicar", "Organizar", "Trocar visualização").
- Nunca use dados de exemplo genéricos ("Metric A", "Chart 1", Lorem ipsum). Os exemplos deste sistema vêm do universo Lume Varejo.

## Cor

- Duas famílias de tokens. **App** (`surface-*`, `text-*`, `border-*`, `accent*`, `danger*`, `success*`, `warning*`, `selection*`, `focus-ring`, `field-*`) pinta o chrome: painéis, toolbars, seleção, handles, guias. **Runtime** (`dash-*`, `viz-*`) pinta tudo o que está dentro de um widget. Nunca use um token app dentro de um widget nem um token runtime no chrome.
- O dashboard tem tema próprio, independente do tema do app: um dashboard claro pode viver num app escuro. Aplique o tema do app em `data-theme` no `<html>` e o do dashboard num contêiner do canvas; um embed recebe os tokens `dash-*`/`viz-*` do host.
- O chrome é neutro: `surface-app` para o shell, `surface-panel` para painéis, `surface-canvas` atrás do dashboard (com pontos `canvas-dot` a cada `space-2`). `accent` é a única cor saturada do chrome — ação primária, aba ativa, switch ligado, link.
- Texto: `text-primary` para valores e nomes, `text-secondary` para rótulos, `text-muted` para dicas e contadores. Os três passam 4,5:1 em `surface-panel`, `surface-app`, `surface-hover` e `surface-elevated` nos dois temas.
- Seleção e guia nunca têm a mesma cor: seleção em `selection` (cobalto), guias e medidas em `guide` (magenta).
- Status: `danger` (erro, remoção), `warning` (rascunho, depreciado, não certificado), `success` (conectado, certificado). `success` é verde-azulado, fora do eixo vermelho–verde, e todo status leva ícone ou palavra.
- Tipos de campo: `field-dimension`, `field-measure`, `field-metric`, `field-geo`, `field-calc`. Cada um tem também um glifo próprio (ver Iconografia); a cor nunca é o único sinal.
- Visualizações: séries categóricas `viz-cat-1` … `viz-cat-8` na ordem (derivadas de Okabe & Ito, com conjunto próprio no escuro); heatmap e coroplético em `viz-seq-1` … `viz-seq-5`; variação em `viz-div-*` (laranja = queda, azul = alta). Eixos `viz-axis`, grade `viz-grid`, tooltip `viz-tooltip-bg`/`viz-tooltip-text`. No cross-filter, cubra as marcas não destacadas com `viz-highlight-dim`.
- Preview de IA: widget fantasma com contorno tracejado `ghost-border` sobre `ghost-bg`; remoção com `danger-subtle` e contorno `danger`; alteração com handles de diff em `accent`.

## Tipografia

- Família `sans` = IBM Plex Sans (Google Fonts, pesos 400/500/600) para todo o chrome e os widgets; família `mono` = IBM Plex Mono para nomes técnicos (`vendas_pedidos`), expressões BEL e IDs. Carregue `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap`.
- Use numerais tabulares (`font-variant-numeric: tabular-nums`) em toda coluna de números, input numérico e KPI.
- Chrome em quatro tamanhos: `caption`/`section-label` (11), `body`/`body-strong` (12), `panel-title` (13), `page-title` (16). Diferencie nível por peso e cor, não por tamanho. Cabeçalho de seção é `section-label`, sem caixa alta.
- Runtime: `widget-title`, `widget-subtitle`, `kpi-value`, `kpi-delta`. `kpi-value` (28 px) é o único tamanho acima de 16 px e só existe dentro de widget.

## Espaço, tamanho e grade

- Base de 4 px: `space-1` (4) … `space-8` (32). Padding lateral de painel `space-3`; recuo por nível de árvore `space-4`; pares em 2 colunas com gap `space-2`.
- Dashboard: grade de 12 colunas no breakpoint `lg` (padrão), linhas de 40 px, gutter `space-4` (`space-6` em `xl`), margem `space-8` no canvas. Abaixo de `sm`, os visuais empilham em ordem de leitura. Breakpoints: xl ≥1600, lg ≥1200, md ≥992, sm ≥768, xs <768.
- Alturas: `control-sm` 24, `control-md` 28, `control-lg` 32. Ícones `icon-sm` 12, `icon-md` 16, `icon-lg` 20; todo ícone clicável tem área de 24×24 no mínimo.
- Rodapé do Builder: `page-tabs-height` (abas de página) + `status-bar-height` (zoom, ajustar, seleção, QueryStatus).
- Em 1440×900 com rail, dois painéis e switcher, o canvas fica com cerca de 60% da largura; nunca deixe cair abaixo de 55%.

## Bordas, raios e elevação

- Raios: `radius-xs` (2) em handles, checkbox e badges de tipo; `radius-sm` (4) em botões, inputs, chips, menus e widgets; `radius-md` (6) em popover, dialog e toast. Nada acima de 6 px.
- Painéis, widgets e seções são planos. Sombra existe só em elementos sobrepostos: `shadow-popover` (popover, menu, tooltip rico, dialog, toast) e `shadow-toolbar` (mini-toolbar e ações flutuantes do canvas).
- Filetes de 1 px: `border-subtle` entre seções e linhas; `border-default` em separadores de toolbar e widget em edição; `border-control` em controles (≥3:1).
- Proibido: gradientes, glow, neon, glassmorphism, cards por propriedade, títulos "hero", sparkles, robôs, área roxa de IA, painéis flutuantes como estrutura.

## Interação e estados

- **Foco:** anel de 2 px em `focus-ring` com 1 px de folga na cor da superfície (`outline: 2px solid var(--focus-ring); outline-offset: 1px`). Sempre visível com teclado.
- **Hover e foco revelam ações secundárias** (visibilidade, "…", remover). Ações primárias nunca dependem de hover.
- **Desabilitado** fica visível em `text-disabled` e explica o motivo em tooltip ("Disponível apenas em containers livres").
- **Seleção de widget:** contorno de 1 px em `selection`, 8 handles de `handle-size` (`selection-handle-fill` com contorno `selection`), rótulo de dimensões em `caption` sobre `selection`, e no máximo 3 ações no cabeçalho. Selecionar nunca altera o tamanho do widget nem empurra o layout.
- **Guias e medidas** aparecem só durante o arrasto ou com Alt pressionado, em `guide`.
- **Teclado no Builder:** setas movem 1 unidade de grade (Shift = 10); Enter desce na hierarquia, Shift+Enter sobe; ⌘K abre a CommandBar; Esc limpa a seleção.
- **Movimento:** 80 ms para hover e pressionado, 120 ms para abrir popover e menu, 160 ms para recolher painel; sem easing elástico. Respeite `prefers-reduced-motion` (sem animação).

## Iconografia

- Ícones de linha próprios, traço de 1,5 px em grade de 16 px, cantos retos, desenhados em `currentColor`. Não use ícones de Power BI, Figma, Tableau ou Grafana.
- Glifos de tipo de campo (mesma grade, sempre com cor `field-*`): `Aa` dimensão categórica, calendário dimensão de data, `Σ` medida, `◆` métrica publicada, pino geográfico, `fx` campo calculado, `⋮⋮` hierarquia, `#` ID. Selos: certificado (✓ em `success`), depreciado (riscado + `warning`), PII (cadeado + `warning`).
- Todo ícone sem rótulo tem tooltip e nome acessível; o rail e a toolbar oferecem "Mostrar rótulos".
- A IA não tem ícone próprio: suas ações aparecem como texto em menus e na barra de seleção.
- O sistema ainda não tem logotipo: escreva "BIWEB Studio" em `body-strong` na barra superior até haver uma marca.

## Componentes

Os componentes são classes CSS com prefixo `bw-` em `components/bundle.css`, sobre os tokens. Cada pasta em `components/` tem um preview e um README com o que o consumidor fornece. Implementação prevista: React Aria Components + Tailwind v4 lendo estas variáveis.

- **Primitives:** Button, IconButton, SegmentedControl, Input, Select, Checkbox, Radio, Switch, Slider, ColorSwatchPicker, Tabs, Menu, Tooltip, Badge, Dialog, Toast, Banner.
- **Application:** ViewRail, AppToolbar (Breadcrumb + SaveSplitButton), CommandBar (⌘K), Inspector (PropertySection + PropertyRow), TreeView, PaneSwitcher, PageTabs, StatusBar, EmptyState, BreakpointSwitcher.
- **BI:** WidgetFrame (com seleção), DropZones, KpiCard, MatrixTable, DatasetTree (FieldItem), FieldWell (FieldChip), FilterBuilder, GlobalContextBar (FilterChip), VisualizationPicker, MapLayerPanel (MapLayerItem), ModelEntityCard, ImpactPanel, DiffView, ChangeSetCard (proposta da IA).
- Use Dialog só para confirmar decisões irreversíveis; configuração vive no Inspector. Erro persistente é Banner; confirmação breve é Toast.
