# 01 — BRIEF: BIWEB Studio

> Plataforma web profissional de Business Intelligence e construção de dashboards, usada por horas por analistas, gestores e times de dados.
> Não é landing page, não é SaaS genérico, não é chatbot com dashboards anexados.

## 1. Precedência entre fontes (em caso de conflito, vence a de cima)
1. `03-ARCHITECTURE_CONSTRAINTS.md` (o que o produto realmente será)
2. `SCREEN_CATALOG_BI.md` (escopo das telas e lacunas já mapeadas)
3. Este brief
4. `02-REFERENCE_DISTILLED.md` (princípios)
5. `REFERENCE_PACK_BI.md` (detalhe das referências; consulta)
6. `SKILLS_STACK.md` (contexto de processo; **opcional**)

**Duas exceções à precedência:**
- **Profundidade de tela:** a tabela de profundidade do §8 e a lista "nunca corte" do §5 deste brief vencem a coluna de fase (P0/P1/P2) do `SCREEN_CATALOG_BI.md`. A fase indica quando a tela será implementada, não quanto ela deve ser desenhada agora. A S10 (IA) é de profundidade alta nesta rodada.
- **Decisões de produto:** as perguntas "para o time de produto" do `REFERENCE_PACK_BI.md` §15 e do `SKILLS_STACK.md` §4 já estão respondidas em `03` e em `SCREEN_CATALOG_BI.md` §1.1; a densidade está fechada no §6 deste brief (28 px padrão; 24 px compacto). Não pare para perguntar.

Conflito ou ambiguidade que você não consegue resolver: **registre em `09-decisions-and-open-questions.md` e siga com a melhor premissa**. Não pare para perguntar.

## 2. Visão do produto
O usuário conecta fontes, explora datasets, trabalha com **modelo semântico** (relações, métricas, dimensões, campos calculados), transforma dados, cria dashboards com múltiplas páginas, arrasta e redimensiona gráficos, tabelas, KPIs e mapas, configura filtros e aparência, trabalha com grandes volumes e tempo real, compartilha e, no futuro, usa plugins e visualizações customizadas. Há uma IA contextual opcional integrada.

## 3. Referências e papéis
- **Power BI** — referência **funcional**: densidade, canvas, painéis, propriedades, campos, field wells, formatação, model view, edição contextual.
- **Figma** — referência de **interação**: canvas, seleção, resize, snapping, layers, inspector compacto sem cards.
- **Tableau** — árvore de estrutura do dashboard, tipos de campo, biblioteca de objetos.
- **Grafana** — barra de contexto, edit pane que muda com a seleção, Outline, Auto × Livre.
- **Não copie nenhuma interface.** Extraia o princípio; construa identidade própria. Sem colagem visual. Para cada decisão relevante, cite o REF-xx de onde veio o princípio.

## 4. Identidade desejada
Profissional, madura, técnica, funcional, **densa sem ser confusa**, contemporânea, precisa, limpa, sofisticada, adequada a uso de muitas horas. Quem vê deve pensar "plataforma profissional de analytics", nunca "interface gerada por IA".

**Proibido:** gradientes roxo/azul, glow, neon, glassmorphism, cards gigantes, card por informação, radius grande, sombras pesadas, títulos gigantes, espaço vazio excessivo, sparkles, robôs, ícones mágicos, estética futurista, aparência de landing ou chatbot, painéis flutuantes como estrutura, componentes decorativos. (Checklist completo em `05-ACCEPTANCE_CHECKLIST.md`.)

A personalidade surge de **tipografia, proporção, densidade, grade, detalhe dos componentes de BI, estados e consistência**. Não torne cada área "especial".

## 5. Plano de trabalho (siga a ordem; escreva os arquivos incrementalmente)

| Etapa | Entrega |
|---|---|
| 1. Direção visual | 3 direções (conceito, tipografia, superfícies, contraste, densidade, borda/radius, painéis, canvas, widgets, traço distintivo). **Recomende uma e siga com ela**; sem esperar resposta |
| 2. Foundations e tokens | Tokens DTCG (app e runtime, claro e escuro), escalas, estados |
| 3. Componentes | Primitives → Application → BI, no catálogo navegável |
| 4. App Shell + Viewer | S00, S06 |
| 5. Builder | S03, S04, S05 (a experiência central) |
| 6. Data Experience | S01, S02, S07, S08 + Filter Builder |
| 7. Mapas | Configuração e camadas |
| 8. AI Copilot | S10 (ver §9) |
| 9. Protótipo interativo | Costura de tudo (ver §8) |
| 10. Crítica final | `05-ACCEPTANCE_CHECKLIST.md` + correções |

**Se o tempo ou o contexto acabarem, corte nesta ordem:** mapas → S02/S08 → profundidade da S01 → variações de direção. **Nunca corte:** tokens, componentes, Builder, Inspector, Viewer, IA com preview/aplicar, crítica final.

## 6. Design system
- **Tokens semânticos de app:** `surface.{app,canvas,panel,elevated}`, `text.{primary,secondary,muted}`, `border.{subtle,default,focus}`, `accent.*` (ação primária), `danger.*` (erro e destrutivo), `state.{success,warning,info}`, `selection.*`, `focus.ring`. Os nomes seguem `03-ARCHITECTURE_CONSTRAINTS.md` §2.
- **Tokens de runtime:** `dash.*`, `viz.*` (ver `03-ARCHITECTURE_CONSTRAINTS.md` §2).
- **Escalas:** tipografia (3–4 tamanhos), espaçamento (base 4 px), radius (2–6 px), alturas de controle (24/28/32), ícones (12/16/20), larguras de painel (240–280 px), durações, elevação mínima.
- **Estados:** repouso, hover, foco, selecionado, desabilitado (visível, com tooltip), arrastando, drop-target, erro.
- Sem valores avulsos por tela. Todos os valores vêm dos tokens.
- **Medidas de partida** (hipóteses; calibre no protótipo): `02-REFERENCE_DISTILLED.md` §C.

## 7. Componentes
Construa por composição; mostre variantes e estados no catálogo.
- **Primitives:** Button, IconButton, SegmentedControl, Input (numérico com unidade/expressão), Select, Combobox, Checkbox, Radio, Switch, Slider, ColorSwatchPicker, Tabs, Tooltip, Menu, ContextMenu, Popover, Dialog, Toast, Badge, Chip, Divider, SearchField, Banner.
- **Application:** AppSidebar (rail), Toolbar, CommandBar (⌘K), Panel, PaneSwitcher, Inspector, TreeView, PropertySection, PropertyRow, ResizablePanel, Breadcrumb, TabStrip, StatusBar, EmptyState.
- **BI (onde mora a identidade):** DashboardCanvas, WidgetFrame, WidgetSelectionOverlay, WidgetFloatingActions, VisualizationPicker, DatasetTree, FieldItem + FieldTypeIcon, MetricItem, DimensionItem, FieldWell/FieldSlot, FieldChip, FilterBuilder, FilterChip, GlobalContextBar, KpiCard, MatrixTable, DashboardPageTab, QueryStatus, MapLayerItem, ModelEntityCard, ModelRelationship, ModelDiagramTabs, OutlineTree, LayoutModeToggle, ImpactPanel, DiffView.
Melhore a lista se as referências indicarem algo a mais.

## 8. Telas e protótipo

**Poucas experiências, profundamente resolvidas.** Detalhe das telas em `SCREEN_CATALOG_BI.md` (S00–S15).

| Profundidade | Telas |
|---|---|
| **Alta** | S03 Builder (vazio e completo) · S04 Inspector Dados · S05 Inspector Formato · S06 Viewer · S07 Modelo semântico · S10 IA (todos os fluxos) |
| **Média** | S01 Home/lista de dashboards · S02 Conexões e Dataset Explorer · S08 Revisões/diff · Filter Builder · Configuração de mapa |
| **Só reservar espaço** | S09, S11–S15 |

**Visualizações:** KPI, barras, linha, área, dispersão, tabela, matriz, mapa, heatmap, filtros, texto, containers, customizada (plugin). O Visualization Picker é compacto (miniaturas, requisitos, incompatíveis esmaecidos).
**Mapas:** marcadores, clusters, heatmap, polígonos, camadas, filtro geográfico, painel de configuração.
**Shell:** explore rail de áreas → barra superior → região contextual à esquerda + workspace central + inspector à direita, **sem tratar como regra absoluta**; use as referências para achar a melhor solução. Equilibre **edição no objeto** e **Inspector**, sem obrigar o usuário a ir de uma ponta à outra para operações frequentes.

**Protótipo interativo** (HTML navegável, sem etapa de build, abre direto no navegador): navegação Home → Viewer → Builder → Modelo; selecionar, mover e redimensionar widgets (com guias e rótulo de dimensões); abas do Inspector; menus e popovers; trocar visualização; adicionar filtro; alternar tema do app e do dashboard; alternar densidade; recolher painéis; dock de IA; preview de proposta; **aplicar e cancelar**; alternar "IA desligada". Viewport base **1440×900**; verifique **1280 e 1920**.

## 9. AI Copilot
A IA **não tem estética própria**: mesmos tokens, sem roxo, glow, robô, sparkles, avatar nem aparência de ChatGPT. É capacidade do produto, não persona.

Superfícies (todas desligáveis): **dock lateral** (painel do PaneSwitcher); **ações inline** (menu do widget; barra da multi-seleção "Organizar"; ponto de dados "Explicar variação"); **⌘K** em linguagem natural; **estado vazio** "criar a partir de um objetivo".

Fluxos a desenhar e prototipar (dados em `04-MOCK_DATA.md` §12–14):
1. **Explicar:** seleciona "Receita por mês" → "Por que caiu em setembro?" → chip discreto "Contexto: Receita por mês" → resposta com evidências (mini-visualizações com os mesmos plugins) e citação dos dados → ações sugeridas.
2. **Propor alteração:** "Crie vendas por estado." → cartão "Alteração proposta · Adicionar visualização · Receita por estado" com **Cancelar / Aplicar** → preview no canvas.
3. **Preview no canvas:** widget fantasma (adição), destaque (remoção), handles de diff (alteração); aceitar/rejeitar **por item**; aplicar = 1 passo de undo "IA: …".
4. **Criação assistida de dashboard** a partir de um objetivo, com proposta completa em preview.
5. **IA propondo métrica** no rascunho do modelo: vai para análise de impacto e **publicação humana**.

Princípio: **Sugerir → Pré-visualizar → Confirmar → Aplicar.** Nunca reorganizar em silêncio.

## 10. Conteúdo
Use **apenas** `04-MOCK_DATA.md` (varejo brasileiro, números que fecham, pt-BR). Sem Lorem ipsum, "Metric A", "Chart 1", "Item 1". Mantenha o mesmo universo em todo o protótipo.

## 11. Crítica final (obrigatória)
Após o primeiro protótipo completo, revise como **Staff Product Designer independente** usando `05-ACCEPTANCE_CHECKLIST.md`. Procure aparência de IA, excesso de cards, radius, espaço vazio, baixa densidade, hierarquia inconsistente, componentes fora do sistema, painéis mal organizados, propriedades redundantes, ações difíceis de descobrir, desalinhamentos, inconsistência entre telas, elementos bonitos porém improdutivos, violações de WCAG 2.2. **Corrija e registre o que mudou** em `08-design-critique.md`.

## 12. Entregáveis (nenhum pode faltar)

Grave **todos** em uma pasta de saída chamada **`design-output/`** (para não se misturar com os arquivos de entrada). Caminhos abaixo são relativos a ela.

| Arquivo | Conteúdo |
|---|---|
| `01-visual-direction.md` | 3 direções, recomendação e justificativa |
| `02-design-tokens.json` | Tokens DTCG (app e runtime, claro e escuro) |
| `02-design-tokens.css` | Os mesmos tokens como CSS variables |
| `03-foundations.md` | Tipografia, espaçamento, radius, alturas, ícones, painéis, estados, regras de uso |
| `04-component-catalog.html` | Catálogo navegável de todos os componentes (variantes e estados) |
| `05-screen-specs.md` | Por tela: zonas, componentes, estados, interações, REF-xx aplicados |
| `06-prototype/index.html` | Protótipo interativo (mais arquivos de apoio) |
| `07-ai-copilot-spec.md` | Superfícies, fluxos, estados, regras |
| `08-design-critique.md` | Resultado do checklist, problemas, correções, pendências |
| `09-decisions-and-open-questions.md` | Decisões, premissas e perguntas ao time de produto |

Se o ambiente não permitir um formato, entregue o equivalente mais próximo e diga **explicitamente** o que não foi gerado e por quê. Ao final, liste os arquivos gerados com uma linha cada.

## 13. Critério de sucesso
**Produtividade + clareza + densidade + consistência + identidade.** Não é "uma interface bonita de BI": é a base de um produto maduro o bastante para competir com ferramentas profissionais de analytics. O resultado deve ser inequivocamente **BIWEB Studio**.
