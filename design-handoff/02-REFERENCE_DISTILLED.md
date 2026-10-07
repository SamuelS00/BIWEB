# 02 — REFERÊNCIAS DESTILADAS (leia este, não o pack inteiro)

> Versão curta e priorizada do `REFERENCE_PACK_BI.md`. Cada linha ensina **um princípio**. Nada aqui é para copiar visualmente.
> Para detalhe de uma referência específica, abra a ficha `REF-xx` no pack completo (ou a imagem-chave pelo link).
> Medidas são **estimativas visuais** de screenshots em escala variável: use como hipótese de partida e calibre no protótipo.

## A. Regra de ouro
**Aprender o comportamento, nunca a aparência.** Para cada padrão: "o que isso ensina?" e não "como me pareço com isso?". Sem colagem de produtos. Cor, ícone, nome, raio e marca ficam fora.

## B. Os 12 princípios que mais importam

1. **Três zonas, canvas soberano.** Navegação estreita → canvas → inspector contextual. Painéis *docked*, planos, coplanares. Só toolbar curta do canvas e popovers "flutuam".
2. **Densidade = controles pequenos e alinhados**, não fonte microscópica nem ornamento: linha fixa de 24–32 px, fonte 11–13 px, separação por filete de 1 px, ações escondidas até hover/seleção/foco, seção vazia = 1 linha.
3. **Propriedades = lista de seções, não pilha de cards.** Busca no topo; abas mínimas (Visual | Geral); toggle no cabeçalho da seção; "Redefinir" por seção; resumo inline e contador quando recolhida; desabilitado visível com motivo; pares em 2 colunas.
4. **Dados e aparência em camadas separadas** (Build × Format; Queries × Options).
5. **Slots por papel + chips** (field wells): cada papel é uma zona de drop rotulada, com borda tracejada e instrução quando vazia; campo vira chip com menu e remover.
6. **Seleção discreta:** contorno 1 px + 8 handles + rótulo de dimensões + header de ≤3 ações + mini-toolbar só do elemento clicado + "Formatar <x>" que salta ao ponto certo do painel.
7. **Árvore de estrutura como segundo caminho de seleção** (Layers, Item hierarchy, Content outline): resolve sobreposição e aninhamento.
8. **Guias e medidas transitórias:** aparecem só durante a ação ou com tecla modificadora; snap com tecla para desligar; cor da guia ≠ cor da seleção.
9. **Painéis combináveis e recolhíveis:** switcher vertical de ícones; recolhido vira faixa vertical com rótulo; UI inteira minimizável.
10. **Barra de contexto global sticky** no modo leitura: filtros + período + atualizar/auto-refresh.
11. **Resultado final sóbrio:** fundo neutro, cartões sem sombra pesada, título "Métrica" + "by Dimensão", KPI = rótulo → valor grande → variação, filtros concentrados no topo, **só o dado recebe cor saturada**.
12. **Estado explícito sempre:** On = destaque, Off = contorno, desabilitado = cinza com tooltip, selecionado, foco, drop-target, erro.

## C. Hipóteses de medidas (ponto de partida)

| Item | Valor de partida | Observação |
|---|---|---|
| Altura de linha/input (padrão) | **28 px** | Alvo mínimo WCAG 2.2 = 24×24 px |
| Altura no modo compacto | 24 px | Só com espaçamento que cumpra o alvo |
| Altura de linha de árvore | 24–28 px | Recuo 16–24 px por nível |
| Fonte de corpo | 12–13 px | 3–4 tamanhos no total; peso diferencia nível |
| Cabeçalho de seção | 11–12 px, peso médio | Sem caixa alta gigante |
| Título de painel | 13–16 px | Nunca "hero" |
| Largura de painel lateral | 240–280 px | Redimensionável; canvas encolhe, não é coberto |
| Rail de modos | 48–56 px | Ícone + tooltip |
| Switcher vertical de painéis | ~44 px | Vários painéis lado a lado |
| Handles de seleção | 8–10 px | 8 por visual |
| Raio | 2–6 px | Sem radius grande |
| Espaço entre seções | filete 1 px + 8–16 px | Sem card por seção |
| Rodapé do canvas | abas de página 36–40 px + status bar 24 px | Zoom, fit, contagem da seleção |

## D. Padrões por área

**Layout:** rail de áreas à esquerda; canvas; stack de painéis à direita (Dados / Formato / IA); rodapé com abas de página e status bar. Barra superior fina por grupos com legenda. Estados vazios acionáveis (atalhos, não ilustrações).
**Canvas:** grade pontilhada; zoom/fit; overlay em camada própria; drop zones por estratégia do container; alinhar/distribuir como ícones que reagem a 1 vs vários selecionados; Enter/Shift+Enter desce/sobe hierarquia; menu "selecionar camada".
**Inspector:** cabeçalho nomeia o objeto ("Gráfico de barras · Receita por região"); busca fixa; seções com chevron + toggle + ações em ícone à direita; campos com label acima ou letra/ícone embutido; numérico com spinner, unidade e expressão; cor = swatch + chevron; slider + valor.
**Dados:** árvore Entidade → campos, busca fixa, ícone de tipo + cor semântica (dimensão × medida), checkbox ou arraste, badge "em uso" com a entidade recolhida, ações em hover/foco, contagens por grupo, hierarquia de data com expansor.
**Modelo:** cards de entidade (cabeçalho + campos tipados + expandir/recolher + visibilidade); relações ortogonais com **1** e **\*** nas pontas, direção do filtro no meio, linha sólida = ativa e tracejada = inativa; seleção destaca a linha; Properties contextual; abas de diagramas; "adicionar relacionadas".
**Widget no dashboard:** cartão com título em 2 linhas (métrica + "by dimensão"); header de ações discreto; KPI com variação; matriz com totais em negrito e formatação condicional discreta; tooltip rico; "Ver dados".
**Modo leitura:** barra de contexto sticky; KPIs em faixa; seções colapsáveis; fullscreen; apresentação; indicador de conexão em tempo real.
**Tipos de campo:** conjunto próprio e pequeno de ícones (numérico, texto, data, medida, calculado, geográfico, ID, hierarquia) + selo de certificação/depreciação.

## E. Fichas condensadas

| REF | Produto · tela | Aprender | Não copiar | Imagem-chave |
|---|---|---|---|---|
| 01 | Power BI · Report View | Rail de modos + canvas + painéis recolhíveis a faixa vertical + abas de página + status bar + empty state com atalhos | Amarelo/preto, ícones, nomes | [Report editor](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-overview-2.png) *(UI anterior; só estrutura)* |
| 02 | Power BI · Visual selecionado | 8 handles, header de 3 ações, botões flutuantes Dados/Formato, mini-toolbar, dropdown de elementos sobrepostos | Azul do contorno, glifos | [Build visual](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png) · [Mini-toolbar](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/mini-toolbar-shortcut-menu.png) |
| 03 | Power BI · Format pane | Busca + abas Visual/Geral + accordion com toggle + subcartões só para grupos + "Redefinir" + desabilitado visível | Verde-azulado, nomes por visual | [Painéis lado a lado](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png) · [Seção expandida](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png) |
| 04 | Power BI · Data pane | Árvore tabela→campo, checkbox, ícones de tipo, badge "em uso", hover actions, contagens | Glifos, "Semantic model/Perspectives" | [Fields list](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-fields-list-2.png) · [Data pane atual](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png) |
| 05 | Power BI · Field wells | Slot por papel + chip (menu + remover) + vazio tracejado + "sugerir" | **Agregação no chip para métricas** | [Build a visual](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png) · [Field wells clássico](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visualization-field-manager-2.png) |
| 06 | Power BI · Model View | Cards de tabela, relações 1/*, direção, ativa/inativa, Properties contextual, abas de diagrama | Amarelo de seleção, ícones de visibilidade | [Model view](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png) · [Propriedades da relação](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/relationships-options-03.png) *(UI anterior)* |
| 07 | Power BI · Relatórios prontos | Cartão métrica + "by dimensão", KPI com variação, filtros no topo, paleta restrita, matriz com formatação condicional | Tema azul-marinho/ciano, logos | [Competitive Marketing](https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/competitive-marketing-analysis.png) · [Corporate Spend](https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/corporate-spend.png) |
| 08 | Figma · Interface completa | Navigation → Canvas → Inspector, docked, UI minimizável, toolbar curta | Azul/roxo, ícones, fundo de marketing | [UI3](https://cdn.sanity.io/images/599r6htc/regionalized/3225dab2b34419e6bc17bf52633ed13b4e86cd6d-3262x1836.jpg) |
| 09 | Figma · Properties | Seções por filete (sem cards), seção vazia = linha + "+", campos 24 px sem borda no repouso, ícone embutido, 2 colunas, "mostrar rótulos" | Ícones, #0D99FF | [Design panel](https://help.figma.com/hc/article_attachments/31937313497879) |
| 10 | Figma · Seleção/medição | Handles pequenos, rótulo de dimensões, medidas/guias transitórias, alinhar por contexto | Vermelho das guias, roxo de componente | [Medição](https://help.figma.com/hc/article_attachments/30101683610903) · [Seleção + painel](https://help.figma.com/hc/article_attachments/29799649003671) |
| 11 | Tableau · Authoring | Dimensões × medidas por ícone+cor, cards vazios instrutivos, status bar de marcas | Azul/verde das pills | *(UI clássica ~2019–22; só conceito)* [Workspace](https://help.tableau.com/current/pro/desktop/en-us/Img/environ_workspace1.png) |
| 12 | Tableau · Dashboard | Biblioteca de objetos, Tiled/Floating, **Item hierarchy** (árvore), tamanho do dashboard | Cinza-azulado, nomes | [Objects](https://help.tableau.com/current/pro/desktop/en-us/Img/layout_container1.png) · [Hierarquia](https://help.tableau.com/current/pro/desktop/en-us/Img/dashboard_drag_hierarchy.gif) |
| 13 | Tableau · Marks/Show Me | Slots de encoding, seletor de gráfico com miniaturas e requisitos, incompatíveis esmaecidos | Terminologia, miniaturas | [Show Me](https://help.tableau.com/current/pro/desktop/en-us/Img/showme3.png) |
| 14 | Grafana · Dashboard denso | Barra de contexto sticky (variáveis + tempo + refresh), KPIs em faixa, seções colapsáveis | Gradientes dos stat tiles, laranja | [Dashboard](https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-image-map-v13.1.png) |
| 15 | Grafana · Edit panel | Preview + dados + options pane com busca, contadores, resumo inline; "Table view"; Builder\|Code | PromQL, azul "Run" | [Panel editor](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-panel-editor-2-v12.4.png) |
| 16 | Grafana · Edit mode | **Edit pane que muda com a seleção**, Outline com busca, Layout Auto\|Custom, show/hide rules | Laranja, azul do Save | [Edit mode](https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-edit-v13.0.png) · [Outline](https://grafana.com/media/docs/grafana/dashboards/screenshot-content-outline-v13.3.png) · [Auto layout](https://grafana.com/media/docs/grafana/dashboards/screenshot-auto-layout-indicators-v13.2.png) |
| 17 | Grafana · Query editor | Mestre-detalhe, barra colorida de tipo na borda, rodapé de metadados | Cores, ícone de assistente | *(complementar)* |

## F. Anti-patterns (reprovam o design)

1. Card para tudo (borda + sombra + padding por seção). 2. Radius grande (>6 px em controles). 3. Sombras fortes / tudo flutuando. 4. Gradientes decorativos, glow, neon, glassmorphism. 5. Baixa densidade / espaço vazio excessivo. 6. Títulos gigantes, "hero". 7. Controles gigantes (inputs 40–48 px). 8. Propriedades espalhadas (canvas + modal + menu). 9. Modais para configuração. 10. Layout de chatbot. 11. Sparkles, robôs, avatar de IA. 12. "Futurismo" sem função. 13. Ação primária só em hover. 14. Esconder o desabilitado. 15. Seleção que empurra o layout. 16. Cor decorativa no chrome. 17. Ícone sem tooltip e sem opção de rótulo. 18. Painéis flutuantes como estrutura. 19. Copiar marca/cores/ícones de uma referência.

## G. Inventário de componentes derivado das refs

**Foundations:** grid do app, grid do dashboard, escala de espaçamento, escala tipográfica curta, neutros do chrome, cor semântica (seleção, foco, dado, dimensão/medida, estado), elevação mínima, ícones de linha, estados, atalhos.
**Primitives:** Button, IconButton, SegmentedControl, Input (numérico com unidade/expressão), Select, Combobox, Checkbox, Radio, Switch (pílula On/Off), Slider+valor, ColorSwatchPicker, Tabs (sublinhado), SearchField, Tooltip, Popover, Menu, ContextMenu, Dialog, Toast, Badge/Counter, Chip, Divider, Banner dispensável.
**Application:** AppToolbar (grupos com legenda), ViewRail, PaneSwitcher, Panel (recolhível a faixa), Inspector, PropertySection, PropertyRow, TreeView, TabStrip/PageTabs, StatusBar, CommandBar (⌘K), Breadcrumb, EmptyState acionável, ContextualMiniToolbar, GlobalContextBar, SaveSplitButton.
**BI:** DashboardCanvas, WidgetFrame, WidgetSelectionOverlay, WidgetFloatingActions, VisualizationPicker, DatasetTree, FieldItem, FieldTypeIcon, MetricItem, DimensionItem, FieldWell/FieldSlot, FieldChip, FilterBuilder, FilterChip, SlicerControl, KpiCard, MatrixTable, QueryStatus, MapLayerItem, ModelEntityCard, ModelRelationship, ModelDiagramTabs, OutlineTree, LayoutModeToggle, ShowDataToggle, ImpactPanel, DiffView, DashboardPageTab.

## H. Prioridade das referências

**Essenciais:** REF-01, 02, 03, 04, 05, 06, 08, 09. **Importantes:** REF-07, 10, 11, 12, 14, 15, 16. **Complementares:** REF-13, 17.

## I. Limites conhecidos
- Imagens do Tableau são da UI clássica. REF-01 #1, REF-06 (propriedades da relação) e algumas do Format pane são de versões anteriores: use para estrutura, não para aparência.
- Não há referência visual para: responsivo (breakpoints), permissões, embed, diff de revisão, IA contextual. Esses pedem **desenho original**, derivando dos princípios acima.
- Se não conseguir abrir as imagens por link, use apenas o texto desta página: ele é suficiente.
