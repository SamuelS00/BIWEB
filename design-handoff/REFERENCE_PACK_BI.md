# REFERENCE PACK — Plataforma Web de Business Intelligence

> **Para quem é este documento:** agente de design (Claude/Figma) que, em uma etapa posterior, vai criar a interface da nossa plataforma de BI.
> **O que este documento NÃO é:** não é um design, nem um moodboard estético. É um catálogo de **comportamentos, estruturas e densidades** de produtos profissionais maduros.
> **Data da pesquisa:** 2026-10-06. Todas as imagens são screenshots reais de documentação/blog oficial; nada foi gerado artificialmente.

**Convenção de leitura (importante).** Em cada ficha:
- **OBSERVAR / APROVEITAR** = "quero aprender ESTE princípio".
- **NÃO COPIAR** = "NÃO quero copiar ESTA interface" (cor, ícone, nome, marca).
- Nunca reproduza uma tela de referência. Extraia o princípio, descarte a aparência.

---

## 01 — Executive summary

**Escopo.** 17 fichas de referência, 63 URLs de imagem oficiais verificadas (HTTP 200 + `image/*`), em 4 produtos:

| Bloco | Produto | Fichas | Papel |
|---|---|---|---|
| Principal | **Power BI** (Desktop/Service) | REF-01 … REF-07 | Arquitetura, densidade, edição, propriedades, dados, modelo, resultado final |
| Ferramenta de edição | **Figma** (UI3) | REF-08 … REF-10 | Padrão Navigation → Canvas → Inspector; inspector sem cards; interação direta |
| BI secundário | **Tableau** | REF-11 … REF-13 | Authoring por *shelves/pills*, Dimension vs Measure, árvore de containers |
| BI secundário | **Grafana** | REF-14 … REF-17 | Barra de contexto (filtros + tempo), edit pane contextual, Outline, Auto vs Custom |

**Os 8 aprendizados que mais importam:**

1. **Três zonas, canvas soberano.** Navegação estreita → canvas dominante → inspector contextual. Painéis *docked* e planos, não flutuantes.
2. **Densidade vem de controles pequenos e alinhados, não de ornamentos.** Linhas de 24–32 px, fonte 11–13 px, filetes de 1 px.
3. **Propriedades = lista de seções colapsáveis, não pilha de cards.** Busca no topo, toggle no cabeçalho da seção, "redefinir padrão" por seção, estado desabilitado visível.
4. **Dados e aparência são duas camadas separadas** (Power BI: *Build visual* vs *Format*; Grafana: *Queries* vs *Options*).
5. **Slots com papel + chips** (field wells): cada papel (eixo, valor, legenda, tooltip) é uma zona de drop rotulada; campos viram chips com menu e "remover".
6. **Seleção discreta, ações contextuais.** Bounding box fino + 8 handles + header de 3 ações + mini-toolbar só do elemento clicado + atalho "Format <x>" que salta ao ponto certo do painel.
7. **Estrutura em árvore como segundo caminho de seleção** (Tableau *Item hierarchy*, Grafana *Content outline*, Figma *Layers*): essencial para objetos sobrepostos e aninhados.
8. **O resultado final é sóbrio:** fundo neutro, cards brancos sem sombra, título "Métrica / by Dimensão", KPIs com valor + variação, filtros globais concentrados no topo, só o dado recebe cor.

**Desvios e limites (honestidade):**
- **Proporção pedida (60–70% Power BI):** por *número de fichas* o Power BI tem 7 de 17 (~41%), porque o agente de BI secundário entregou 7 fichas. Para refletir o peso desejado, a **Reference Matrix (seção 14) marca quase tudo de Power BI como ESSENCIAL** e rebaixa as fichas Tableau/Grafana menos centrais a COMPLEMENTAR. Se preferir, é simples aprofundar o Power BI (ex.: Selection pane, Filters pane, bookmarks, temas) em uma segunda rodada.
- **Atualidade:** as imagens de Power BI (on-object, Format pane novo, Model view, amostras 2026) e Grafana (v12.4–v13.3) são atuais. As do **Tableau são da UI clássica (~2019–2022)** — úteis só como conceito. Algumas imagens do Power BI (REF-01 #1/#2, REF-03 #3/#4, REF-06 #2) são de versões anteriores e estão **sinalizadas** nas fichas.
- **Blogs oficiais do Power BI** (`powerbi.microsoft.com`) retornam 403 para ferramentas automáticas: não foram extraídas imagens deles. Estão listados como NÃO VERIFICADOS no apêndice.
- **Medidas de densidade** (px, fontes) são **estimativas visuais** de screenshots com escala 1,25–2×, não valores oficiais. Use como ordem de grandeza.
- **Smart guides do Figma** durante o arraste: não há screenshot oficial verificável; a descrição vem do Help Center (texto).

---

## 02 — Lista das referências escolhidas

| ID | Produto | Tela / tema | Atualidade das imagens | Prioridade |
|---|---|---|---|---|
| REF-01 | Power BI | Report View completo | Mista (2 atuais on-object + 2 anteriores) | ESSENCIAL |
| REF-02 | Power BI | Visual selecionado no canvas | Atual (on-object) | ESSENCIAL |
| REF-03 | Power BI | Format / Properties pane | Atual + 2 anteriores | ESSENCIAL |
| REF-04 | Power BI | Data / Fields pane | Mista (Data pane atual na imagem 3) | ESSENCIAL |
| REF-05 | Power BI | Configuração de dados (Field wells / Build visual) | Atual + clássica | ESSENCIAL |
| REF-06 | Power BI | Model View | Atual (imagem 1) | ESSENCIAL |
| REF-07 | Power BI | Relatórios prontos sóbrios (Competitive Marketing, Corporate Spend, Store Sales) | Atual (amostras refrescadas 2026) | IMPORTANTE |
| REF-08 | Figma | Interface completa (UI3) | 2024 (existe UI 2026 mais nova, só em wireframe) | ESSENCIAL |
| REF-09 | Figma | Properties Inspector (Design panel) | 2024–2025 | ESSENCIAL |
| REF-10 | Figma | Seleção / resize / medição / alinhamento | 2024–2025 | IMPORTANTE |
| REF-11 | Tableau | Authoring workspace (Data pane + shelves) | Clássica (~2019–22) | IMPORTANTE |
| REF-12 | Tableau | Dashboard authoring (Objects, containers, Item hierarchy) | Clássica | IMPORTANTE |
| REF-13 | Tableau | Marks card / Show Me | Clássica | COMPLEMENTAR |
| REF-14 | Grafana | Dashboard denso em modo view | v13.1 + demo ao vivo | IMPORTANTE |
| REF-15 | Grafana | Edit panel (preview + query + options pane) | v12.4–v13.2 | IMPORTANTE |
| REF-16 | Grafana | Edit mode: edit pane contextual, Outline, Auto/Custom | v13.0–v13.3 | IMPORTANTE |
| REF-17 | Grafana | Novo query editor (lista mestre-detalhe) | v13.1 | COMPLEMENTAR |

**Por que Tableau e Grafana (e não Superset/Looker Studio).** Tableau adiciona o authoring por *shelves/pills*, a distinção visual Dimension × Measure e a árvore de containers de dashboard. Grafana adiciona barra de contexto global (variáveis + tempo + refresh), edit pane contextual, Outline e o modelo Layout Auto × Custom. O chart builder do Superset seria redundante com os dois.

---

## 03 — Power BI references

> Principal referência. Estudar **arquitetura, comportamento, densidade e fluxo de edição** — nunca a identidade (amarelo/preto, Segoe UI, ícones, nomes).
> Cada ficha termina com o campo **APLICAÇÃO NO NOSSO PRODUTO**. As linhas "Pré-visualização" são hotlinks das imagens oficiais listadas em IMAGENS.


### REF-01 — Power BI Desktop / Service — Report View completo
**IMAGENS:**
1. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-overview-2.png` — alt: "Screenshot of the report editor in Power BI Desktop." (2256x1374, report real "District Monthly" com ribbon, 4 visuais, Filters, Visualizations, Fields, abas de página e status bar) — VERIFICADA (HTTP 200, image/png; aberta e inspecionada). **UI de versão anterior ao on-object** (painéis Filters / Visualizations / Fields lado a lado, ~2022–2023).
2. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-report-view/report-view-blank-canvas.png` — alt: "Screenshot of Power BI Desktop in Report view with a blank canvas." (1919x1079; título/search, ribbon, rail de views, canvas vazio com empty state, aba "Page 1" + "+", zoom na status bar) — VERIFICADA (200, image/png; inspecionada). **Versão antiga** (título escuro, Fields recolhido à direita como rótulo vertical).
3. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png` — alt: "Screenshot showing multiple panes open at the same time." (591x1100; apenas painéis Format + Build a visual + switcher vertical de ícones) — VERIFICADA (200, image/png; inspecionada). **Versão atual (on-object).** Ver também REF-03.
4. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png` — alt: "Screenshot showing formatting more than one visual at a time." (842x861; canvas com 2 visuais selecionados + Filters recolhido + Format pane) — VERIFICADA (200, image/png; inspecionada). **Versão atual.**

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-overview-2.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-report-view/report-view-blank-canvas.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png)

**FONTE:** https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour (doc oficial; imagem 1) · https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-view (doc oficial; imagem 2) · https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-on-object-interaction (doc oficial; imagens 3 e 4)

**CONTEXTO:** Visão de edição de relatório: barra de título com busca, ribbon por abas (File / Home / Insert / Modeling / View / Help), rail vertical de views à esquerda (Report / Table / Model), canvas central com grade pontilhada, painéis laterais à direita (Filters, Visualizations/Build visual, Fields/Data) e abas de página embaixo com botão "+" e status bar (Page x of y, zoom). Na imagem 1 há um relatório real com 4 visuais (colunas, colunas com negativos, área/linha, bolhas) e um slicer de lista.

**OBSERVAR:**
- Estrutura em "L" invertido: ribbon no topo (~100–110 px de altura no screenshot 1919 px, ícones grandes 32–40 px com rótulo abaixo, grupos separados por divisórias finas e com legenda do grupo em texto pequeno: Clipboard / Data / Queries / Insert / Calculations / Sensitivity / Share); rail de views à esquerda (~60 px, 3 ícones, item ativo com barra amarela/verde de 3–4 px na borda esquerda); canvas no centro; painéis à direita.
- Painéis laterais empilhados horizontalmente, cada um com cabeçalho em fonte grande (~18–20 px aparente) + chevron `>>` de recolher; larguras aparentes: Filters ~265, Visualizations ~240, Fields ~240 (em captura ~1.25–1.5x; escala real de UI ~ 200–260 px). Painel recolhido vira faixa vertical estreita com texto girado ("Filters", "Fields") e chevron `<<`.
- Canvas: fundo branco com grade de pontos; página com borda tracejada quando vazia (empty state centralizado com título "Add data to your report" + 4 cards de atalhos Excel / SQL / blank table / sample dataset + link). Visuais sem moldura quando não selecionados, títulos do visual em cinza claro (~13–14 px).
- Abas de página no rodapé: altura ~40–45 px, aba ativa com sublinhado colorido de 3 px e texto em semibold, aba "+" como botão quadrado cheio de cor de marca; setas `<`/`>` de rolagem de abas à esquerda; status bar de ~25 px com "Page 3 of 4", rótulo de sensibilidade, slider de zoom (− slider + 100%) e botão "fit to page".
- Visualizations pane (imagem 1/2): linha de abas de modo ("Build visual" / Format / Analytics) como ícones grandes (~40 px) com seta apontando para o conteúdo, grade de 6 colunas de ícones de tipo de visual (~30 px cada, ~42 px de passo), depois field wells (Values, Drill through) com caixas "Add data fields here" de borda tracejada; toggles "Cross-report Off" / "Keep all filters On" em formato pílula com rótulo dentro.
- Versão atual (imagem 3): os painéis viram **Format + Build a visual** lado a lado com um switcher vertical de ícones (~45 px) na borda direita (Data, Build, Format, "+", engrenagem de opções); botões ativos com contorno vermelho nessa imagem didática. Filters fica recolhido como rótulo vertical.

**APROVEITAR:** Layout de 3 zonas (rail de views + canvas + stack de painéis recolhíveis) com densidade média-alta; ribbon agrupado por tarefa com legenda; painéis recolhíveis a faixas verticais (liberam canvas); abas de páginas inferiores com "+" fixo; status bar com zoom/fit; empty state do canvas com atalhos acionáveis; switcher de painéis em barra vertical de ícones (permite abrir vários painéis lado a lado).

**NÃO COPIAR:** Paleta amarelo/preto de marca Power BI, ícones dos visuais, logotipo/estilo do título "Untitled - Power BI Desktop", nomenclatura proprietária (Dataverse, OneLake, "Get data") e os dados de exemplo dos relatórios.

**APLICAÇÃO NO NOSSO PRODUTO:** Adotar a anatomia de editor: toolbar superior por abas/grupos, rail de modos à esquerda, canvas com grade e abas de página no rodapé, e um stack direito de painéis colapsáveis para Dados / Construir / Formatar. O estado "painel recolhido = faixa vertical com rótulo girado" e o empty state com atalhos de fonte de dados são úteis para dar prioridade ao canvas em telas pequenas.

---

### REF-02 — Power BI Desktop — Visual selecionado no canvas
**IMAGENS:**
1. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png` — alt: "Screenshot showing building a visual with on-object formatting." (1096x611; gráfico de linhas selecionado com 8 handles circulares, header à direita com filtro/focus mode/"...", flyout "Build a visual" à esquerda e dois botões flutuantes Build/Format) — VERIFICADA (200, image/png; inspecionada). **Versão atual (on-object).**
2. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/mini-toolbar-shortcut-menu.png` — alt: "Screenshot showing mini-toolbar formatting options." (844x515; mini-toolbar flutuante com Segoe UI / 9 / A+ A- / régua / B I U / preenchimento / cor da fonte / alinhamento / casas decimais + menu contextual Delete / Reset to default / Add zoom slider / Format axis values; handles quadrados azuis do visual) — VERIFICADA (200, image/png; inspecionada). **Versão atual.**
3. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/select-overlapping-elements.png` — alt: "Screenshot showing selecting overlapping elements." (863x602; seletor "Clothing markers" com dropdown listando elementos do visual: linhas, gridlines, markers, Background; marcadores selecionados mostram handles azuis) — VERIFICADA (200, image/png; inspecionada). **Versão atual.**
4. (Complementar) `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-panes-2.png` — alt: "Screenshot of the Power BI report editor, highlighting a column chart." (1257x1100; visual selecionado com moldura vermelha didática, handles laterais/cantos finos, header com grip de arrastar, filtro, focus mode, "...", ao lado dos painéis Filters on this visual / Visualizations / Fields) — VERIFICADA (200, image/png; inspecionada). **Versão antiga (pré on-object):** handles em forma de colchetes/barras.
5. (Complementar) `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-format-donut-slices.png` — alt: "Screenshot showing on-object formatting for a donut chart." (567x346; seleção de fatia com mini-toolbar Fill/Border + dropdown "Components slice" + menu Reset to default / Format slices) — VERIFICADA (200, image/png; inspecionada).

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/mini-toolbar-shortcut-menu.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/select-overlapping-elements.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-panes-2.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-format-donut-slices.png)

**FONTE:** https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-on-object-interaction (doc oficial; imagens 1, 2, 3, 5) · https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour (doc oficial; imagem 4)

**CONTEXTO:** Um visual (linha / colunas / donut) está selecionado no canvas. Com on-object interaction, o próprio visual vira superfície de edição: dois botões flutuantes ao lado (Build / Format), mini-toolbar contextual ao clicar num elemento interno (eixo, série, fatia), seletor de elemento e menu de contexto.

**OBSERVAR:**
- Bounding box: linha fina cinza/azul (1 px) contornando o visual, com **8 handles circulares** brancos de borda escura (~16–20 px de diâmetro na imagem 1; cantos + meio de cada lado). Em Desktop recente o contorno é azul e os handles quadrados brancos com borda azul (~14 px) (imagens 2, 3, 5); na versão antiga (imagem 4) eram pequenos colchetes/barras cinza.
- Header do visual no canto superior direito, dentro do box: 3 ícones de linha ~20–24 px (filtro, focus mode/expandir, "…" mais opções), em cinza, com espaçamento de ~12–16 px; visível ao selecionar/hover. Na versão antiga também havia um grip de arrastar (≡) no topo central do visual.
- Botões flutuantes **fora** do visual, na borda esquerda (ou direita se não houver espaço): quadrados ~44x44 px com ícone "Build visual" e "Format visual" (pincel com +), empilhados com ~8 px de gap; ao clicar, o Build abre um flyout/popover "Build a visual".
- Elementos internos selecionáveis individualmente (título, eixo, série, fatia, gridlines) com handles azuis circulares pequenos no próprio elemento; ao selecionar aparece mini-toolbar flutuante (fundo branco, sombra suave, ~2 linhas, controles ~28–32 px) e abaixo o menu de contexto (Delete / Reset to default / Add... / Format <elemento>) — o último item abre o Format pane já no card correspondente.
- Elementos sobrepostos: popover com **dropdown de elementos** (lista vertical: "Clothing" line, "Accessories" line, Horizontal gridlines, markers, Background) ao lado dos controles Fill / Border — resolve a seleção de coisas sobrepostas sem precisar de clique perfeito.
- Relação com painéis: o visual selecionado atualiza Build/Format/Filters ("Filters on this visual"); seleção múltipla (imagem em REF-01 #4) mostra o Format pane com "Size and position" para vários visuais, sem handles de fatia.

**APROVEITAR:** Edição direta no objeto (duplo clique = modo de formatação), botões flutuantes de Build/Format ancorados ao visual, mini-toolbar contextual com só as opções do elemento clicado, menu "Format <x>" que salta ao ponto certo do painel, dropdown de elementos para seleção sobreposta, handles consistentes (8) e header discreto com 3 ações no canto superior direito.

**NÃO COPIAR:** Cor azul exata do contorno/handles do Power BI, forma e glifos dos ícones (funil, focus mode), copy proprietário ("Build a visual", "Suggest a type") e os dois botões flutuantes com o pincel-verde "+" característico.

**APLICAÇÃO NO NOSSO PRODUTO:** Mostrar bounding box com 8 handles e um header de 3 ações compactas no canto superior direito do visual selecionado. Oferecer um par de botões flutuantes (Dados / Formato) ao lado do visual e uma mini-toolbar contextual que atalha para a seção correspondente do painel de propriedades; o seletor de elementos em dropdown evita erros em gráficos densos.

---

### REF-03 — Power BI Desktop — Format / Properties pane
**IMAGENS:**
1. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png` — alt: "Screenshot showing multiple panes open at the same time." (591x1100; Format pane com busca, abas Visual / Properties / "…", lista de accordions: Size and style, Title [On], X-axis [On], Y-axis [On], Legend [On], Gridlines, Zoom slider [Off], Markers, Category label [Off], Plot area background, Reference line, Symmetry shading [Off], Ratio line [Off]; ao lado Build a visual com field wells) — VERIFICADA (200, image/png; inspecionada). **Versão atual (novo Format pane / on-object).**
2. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png` — alt: "Screenshot showing formatting more than one visual at a time." (842x861; Format pane com "Size and style" expandido: card interno "Size and position" com Height / Width / Lock aspect ratio / Horizontal / Vertical em campos numéricos com spinner, cards Padding, Background [On], Visual border [Off], Shadow [Off], "Reset to default", depois Title [On] expandido com Text e dropdown Heading 3) — VERIFICADA (200, image/png; inspecionada). **Versão atual.** Mostra accordion aninhado em cartões.
3. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-visual-elements-for-reports/visual-elements-for-reports_09.png` — alt: "Screenshot of formatting options for the Visual header." (802x665; abas Visual / General, accordions Properties, Title [On], Effects, Header icons [On] expandido com subcard Colors: Background/Border/Icon como color pickers (swatch + chevron), Transparency com campo "55 %" + slider; subcard "Icons") — VERIFICADA (200, image/png; inspecionada). **Versão intermediária** (já com tabs Visual/General e cards, mas com cabeçalho "Format visual").
4. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visual-pane-format-2.png` — alt: "Screenshot of the Format visual pane in the report editor." (268x852; ícones de modo Build/Format/Analytics, busca, abas Visual / General, accordions X-axis [On], Y-axis [On], Legend [Off desabilitado/acinzentado], Small multiples [desabilitado], Gridlines, Zoom slider [Off], Columns, Data labels [Off], Plot area background) — VERIFICADA (200, image/png; inspecionada). Mostra **estado desabilitado** (chevron e texto cinza, toggle Off claro).

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-visual-elements-for-reports/visual-elements-for-reports_09.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visual-pane-format-2.png)

**FONTE:** https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-on-object-interaction (imagens 1, 2) · https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-visual-elements-for-reports (imagem 3) · https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour (imagem 4) — todos doc oficial. Texto complementar (não visto como imagem): https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-format-pane-overview e https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-customize-title-background-and-legend.

**CONTEXTO:** Painel de formatação de um visual (e de página/relatório): busca no topo, abas de escopo (Visual | General/Properties), lista longa de seções em accordion — cada seção pode ter toggle liga/desliga no cabeçalho — e, dentro, cartões com campos (texto, dropdown, numérico com spinner, color picker, slider+valor, toggles).

**OBSERVAR:**
- Ordem vertical padrão: (1) cabeçalho do painel com título + chevron de recolher/fechar, (2) campo de busca com ícone de lupa (borda 1 px arredondada, ~32 px de altura no screenshot ~1.5x), (3) abas Visual | Properties/General com sublinhado de 2–3 px colorido na ativa + menu "…", (4) lista de accordions.
- Linha de accordion: chevron `>` (rotaciona para `v` aberto) à esquerda + rótulo ~13–14 px semibold/medium + toggle pílula à direita; altura de linha ~30–32 px reais (≈ 61 px no screenshot de 591 px, que parece 2x); separador horizontal fino de 1 px entre seções; sem borda de card no nível 1.
- Toggles: pílula com texto dentro ("On" fundo escuro/verde-azulado com bolinha branca à direita, "Off" fundo branco com borda cinza e bolinha à esquerda), ~44x20 px; seções sem toggle (Size and style, Gridlines, Markers...) apenas expandem. Seção desabilitada: texto e chevron cinza-claro, toggle Off esmaecido (Legend/Small multiples, imagem 4).
- Seção expandida: fundo cinza-claro do bloco e **subcartões brancos arredondados** (raio ~4 px, sombra sutil) com subcabeçalho próprio (ex.: "Size and position", "Title", "Colors"), labels acima dos inputs (~12 px, cinza escuro), inputs de largura total (~160–180 px) com spinner ↑↓ para numéricos, dropdowns com chevron, color picker como swatch quadrado + chevron, slider com campo numérico "%" ao lado, "Reset to default" no rodapé do bloco (ícone de seta circular + texto, cinza quando já é padrão).
- Densidade: ~12–14 px de fonte; ~8–12 px de padding interno; linhas de campo (label + input) ~48–56 px; gaps entre cartões ~8 px. Largura do painel ~240–270 px; rolagem vertical com scrollbar discreta.
- Busca filtra seções e propriedades pela palavra (apresentada no topo como primeira ação) — essencial dado o volume de propriedades (dezenas por visual).
- Tabs do Format: "Visual" (propriedades do conteúdo: eixos, legenda, séries) vs "General"/"Properties" (tamanho, título, efeitos, header icons) — separa o que depende do tipo de visual do que é comum a todos.

**APROVEITAR:** Accordion de dois níveis (seção com toggle → cartões internos), busca no topo do painel, abas Visual/Geral, toggles On/Off no cabeçalho da seção (liga/desliga sem expandir), estado desabilitado visível em vez de ocultar, "Reset to default" por seção, labels acima dos campos, campos numéricos com spinner + unidade, sliders pareados com valor numérico, color picker compacto (swatch + chevron).

**NÃO COPIAR:** Verde-azulado do toggle e do sublinhado de abas, a nomenclatura exata (Plot area background, Symmetry shading, Ratio line), a estrutura proprietária por tipo de visual e a tipografia Segoe UI.

**APLICAÇÃO NO NOSSO PRODUTO:** Painel de propriedades à direita com busca fixa no topo, abas "Visual" e "Geral", seções em accordion com toggle no cabeçalho e subcartões para grupos de campos. Para visuais com muitas propriedades, usar altura de linha ~28–32 px, fonte 12–13 px e "Redefinir padrão" por seção; mostrar seções desabilitadas com explicação de tooltip quando um pré-requisito (ex.: legenda sem campo) não existe.

---

### REF-04 — Power BI Desktop — Data / Fields pane
**IMAGENS:**
1. `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-fields-list-2.png` — alt: "Screenshot of the Fields pane with example selections." (269x1125; cabeçalho "Fields" + `>>`, busca, árvore: Sales (com badge de check verde = tabela com campo usado), District, Item, Store expandida (Average Selling... , Chain, City, Count of Open..., DistrictID, DM, DM_Pic, Name, New Stores, New Stores Tar..., Open Month, Open Month No, Open Store Co..., Open Year, OpenDate [com expansor de hierarquia de data], PostalCode, SelectedAreaSize, Store Type, StoreNumber, StoreNumberN..., Territory, Total Stores), Time com "FiscalMonth" marcado; cada campo com checkbox + ícone de tipo; scrollbar à direita) — VERIFICADA (200, image/png; inspecionada). **Versão anterior à unificação "Data pane"** (rótulo ainda "Fields"), mas os ícones de tipo são os atuais.
2. `https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-field-list/field-list-01b.png` — alt: "Screenshot of the new Model view Fields list in Power BI Desktop." (288x494; "Fields" + `>`, busca, tabela "financials" expandida com ícone Σ (campos numéricos/agregáveis), ícone de calendário (Date), campos de texto sem ícone; linha "Sales" em hover com ícones de olho (visibilidade) e "…") — VERIFICADA (GET 200 image/png; o HEAD com -L devolveu text/html mas HEAD sem -L e GET devolvem image/png; inspecionada). Lado a lado existe `field-list-01a.png` (original) — também baixada OK (PNG 285x501).
3. `https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png` — alt: "Screenshot of Model view." (1531x780; **painel "Data" atual** com abas Tables / Model, banner informativo dispensável, busca e árvore "Semantic model" com Calculation groups (1), Cultures (4), Measures (1,408), Perspectives (3), Relationships (8), Roles (4), Tables (12); ao lado painel Properties com cards e diagrama) — VERIFICADA (200, image/png; inspecionada). **Versão atual (rótulo "Data" + abas Tables/Model, Model view).**

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-fields-list-2.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-field-list/field-list-01b.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png)

**FONTE:** https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour (imagem 1) · https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-field-list (imagem 2; doc oficial sobre a Fields list unificada: ícones, busca, menus de contexto, tooltips) · https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-modeling-view (imagem 3) — todos doc oficial.

**CONTEXTO:** Árvore de tabelas e campos do modelo semântico, com busca no topo, expandir/recolher por tabela, checkboxes para colocar o campo no visual selecionado (ou arrastar para o canvas / field wells) e ícones que indicam o tipo de cada item.

**OBSERVAR:**
- Cabeçalho do painel: título ("Fields"/"Data") + `>>`; abaixo busca com lupa (altura ~34 px aparente). Na versão atual do Desktop o Data pane ganha abas Tables | Model (imagem 3) e banner de ajuda dispensável (X).
- Árvore de 2 níveis: nível 1 = tabelas (chevron `>`/`v` + ícone de tabela ~20 px + nome); nível 2 = campos recuados ~28–32 px, **checkbox à esquerda** (~14 px, quadrado arredondado; marcado com fundo verde-azulado e check branco) + ícone de tipo + nome (truncado com "…" quando longo). Linha ~36 px na captura (~24–28 px reais). Tabela com campo em uso recebe **badge circular verde com check** sobreposto ao ícone da tabela (visível quando a tabela está recolhida).
- Ícones de tipo (vistos): Σ = coluna numérica agregável; calculadora = medida; calculadora/tabela com "fx" = coluna calculada; ícone de calendário = campo de data (com chevron que expande a hierarquia de data Year/Quarter/Month/Day); globo = campo geográfico (PostalCode, Territory); ícone de cartão/ID = campo de identidade (StoreNumberName); campos de texto simples sem ícone (ou ícone discreto). Hierarquias aparecem com expansor próprio (chevron ao lado do checkbox, ex.: OpenDate) e ícone de hierarquia.
- Ações em hover/seleção (imagem 2): linha ganha fundo cinza, e aparecem ícone de olho (visibilidade) e `…` (menu de contexto) à direita; o menu inclui itens como New measure, Hide in report view, Add to hierarchy etc. (somente texto/alt da doc; menus vistos nas imagens 02a/02b da página, não abertas).
- Tabelas de medidas dedicadas ficam no topo (conforme doc); medidas podem ser agrupadas em display folders com `\` (apenas doc).
- Painel de modelo (imagem 3): grupos colapsáveis com **contagem** entre parênteses (Measures (1,408), Tables (12)), em fonte ~13 px, chevron + rótulo, sem checkboxes — padrão de explorador de modelo.
- Rolagem: scrollbar fina cinza dentro do painel; o cabeçalho (título + busca) fica fixo.

**APROVEITAR:** Árvore tabela → campos com checkbox para uso rápido, ícones de tipo curtos e legíveis (Σ, calculadora, calendário, globo, ID), badge de "em uso" na tabela recolhida, busca fixa, hover com ações (visibilidade, menu "…"), contagem por grupo no modo modelo, banner de ajuda dispensável, truncamento com reticências + tooltip.

**NÃO COPIAR:** Glifos exatos dos ícones de tipo da Microsoft, o verde-azulado do check, a nomenclatura "Semantic model/Calculation groups/Perspectives" e a terminologia/branding de "Fields/Data pane".

**APLICAÇÃO NO NOSSO PRODUTO:** Um painel "Dados" com busca, árvore por tabela e checkboxes que alimentam o visual selecionado, mais o arrastar-e-soltar para as zonas de campo. Definir um conjunto próprio e pequeno de ícones de tipo (numérico, texto, data, medida, geográfico, hierarquia) e um indicador de "campo em uso" visível mesmo com a tabela recolhida; manter linha de ~26 px e ações ocultas até hover.

---

### REF-05 — Power BI — Configuração de dados de uma visualização (Build visual / Field wells / on-object "Build a visual")

**IMAGENS:**
1. https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png — "Screenshot showing building a visual with on-object formatting." (1096x611) — VERIFICADA (200, image/png; inspecionada visualmente). Produto atual (layout on-object, GA/2024+). Mostra o popover "Build a visual" ao lado do visual selecionado.
2. https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visualization-field-manager-2.png — "Screenshot of the Visualizations pane field wells." (268x1154) — VERIFICADA (200, image/png; inspecionada). Painel clássico "Visualizations > Build visual" com slots X-axis, Y-axis, Legend, Small multiples, Tooltips e Drill through (service/web, ~2023-24).
3. https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png — "Screenshot showing multiple panes open at the same time." (591x1100) — VERIFICADA (200, image/png; inspecionada). Painéis Format + Build a visual lado a lado, com o pane switcher à direita. Mostra um scatter com Values / X Axis / Y Axis / Legend / Size / Play Axis / Tooltips.

Extras verificadas e inspecionadas (úteis para detalhes):
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-aggregation.png — "Screenshot of how to elect the aggregation you want." — VERIFICADA. Popover secundário "Data" com Field + dropdown Aggregation (Sum, Average, Minimum, Maximum, Count (Distinct), Count, Standard deviation, Variance, Median).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiselect-suggest-type.png — "Screenshot showing using multiselect in choosing fields." — VERIFICADA. Painel Data (lista de campos em árvore com checkboxes e busca) abrindo sobre o Build a visual com toggle "Suggest a type".
- https://learn.microsoft.com/en-us/power-bi/visuals/media/power-bi-report-add-visualizations-ii/map-2.png — "Screenshot that shows Chain in the fields list and in the Legend area." — VERIFICADA. Mostra a relação lista de campos (marcado por checkbox) -> slot "Legend" com chip "Chain" (dropdown + X).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-add-data.png — "Screenshot showing on-object Add data." — VERIFICADA.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-build-visual.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visualization-field-manager-2.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-aggregation.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiselect-suggest-type.png)

![ref](https://learn.microsoft.com/en-us/power-bi/visuals/media/power-bi-report-add-visualizations-ii/map-2.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-add-data.png)

**FONTE:**
- https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-on-object-interaction (docs oficiais — "Use on-object interaction"; imagens 1, 3 e extras)
- https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour (docs oficiais — "Take a tour of the report editor"; imagem 2)
- https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-report-add-visualizations (docs oficiais — "Add visualizations to a Power BI report"; imagem map-2)

**CONTEXTO:** Usuário com um visual selecionado no canvas de relatório configurando quais campos alimentam cada papel (eixo, valores, legenda...). Existem dois modos coexistindo no produto atual: (a) o painel clássico "Visualizations", aba "Build visual", com a galeria de tipos de visual e "field wells" (slots rotulados com área tracejada "Add data fields here"); (b) o novo modo on-object, onde um popover "Build a visual" aparece colado ao visual selecionado, com os mesmos slots numa lista única de chips ("Data"), botão "+Add data" e toggle "Suggest a type" (quando desligado, expande os slots completos por papel: Values, X Axis, Y Axis, Legend, Size, Play Axis, Tooltips). O usuário arrasta campos da lista (ou marca checkbox) e o Power BI infere o papel.

**OBSERVAR:**
- Painel clássico (imagem 2): grade de ícones dos tipos de visual no topo (6 colunas, ~6 linhas), depois os wells empilhados verticalmente, cada um com um rótulo pequeno acima ("X-axis", "Y-axis", "Legend", "Small multiples", "Tooltips") e uma caixa tracejada. Wells vazios mostram placeholder "Add data fields here"; wells preenchidos mostram o chip do campo.
- Chip de campo: retângulo cinza com cantos suavemente arredondados, nome do campo truncado com reticências ("Total Sales Variance %"), um chevron "v" (menu: aggregation/rename/remove/show-as etc.) e um "X" (remover) alinhados à direita no mesmo chip. Em map-2, o chip "Chain" mostra o mesmo padrão chevron + X.
- Seção "Drill through" no mesmo painel: título em negrito, toggles "Cross-report" (Off) e "Keep all filters" (On) e um well próprio "Add drill-through fields here" — ou seja, configurações de comportamento convivem com os wells de dados no mesmo painel, com o toggle como controle.
- Wells variam conforme o tipo de visual: coluna agrupada tem X-axis/Y-axis/Legend/Small multiples/Tooltips; mapa tem Location/Legend/Latitude/Longitude/Bubble size; scatter tem Values/X Axis/Y Axis/Legend/Size/Play Axis/Tooltips. A lista de slots é derivada do tipo do visual.
- On-object (imagem 1): o popover "Build a visual" é um card cinza-claro com sombra suave, flutuando ao lado do visual (o visual tem alças de redimensionamento circulares). Estrutura: título -> "Visual types" (5 ícones "mais usados" + dropdown "v") -> toggle "Suggest a type" -> seção "Data" com chips empilhados (Month, Sales Amount, Category) e um botão "+Add data" em outline. O atribuição de papel é inferida (não mostra rótulos de slot quando "Suggest a type" está On).
- Cada chip on-object tem "X" (remover) e ">" (abre sub-painel "Data" do campo com Field, Aggregation e, em tipos relevantes, outros ajustes). Imagem on-object-aggregation: o sub-painel abre à direita do popover, com dropdown de agregação (lista com Sum/Average/Min/Max/Count (Distinct)/Count/Std dev/Variance/Median).
- Ao lado do visual aparecem dois botões de ícone (Build a visual / Format) — o "pane switcher" vertical (imagem 3 mostra também botão de Data/Fields, "+" e engrenagem). Os painéis podem ficar abertos simultaneamente (Format à esquerda + Build à direita) com cabeçalho de título + chevron de recolher + X de fechar.
- Densidade: linhas de ~45–50 px por chip, espaçamento vertical generoso entre wells (rótulo + caixa), tipografia pequena e discreta; os wells vazios usam borda tracejada para sinalizar "alvo de drop".

**APROVEITAR:**
- Modelo mental "slot com papel + chip": cada papel (eixo, valor, legenda, tooltip, small multiples) é uma zona de drop rotulada; campos viram chips removíveis. Lista de slots dependente do tipo de visual.
- Chip com duas ações fixas à direita (menu "v" para propriedades do campo, "X" para remover) — previsível, uma única linha, truncamento com reticências.
- Estado vazio explícito (caixa tracejada + "Add ... here") que também comunica onde soltar.
- Agregação como propriedade do campo no chip (sub-painel), não como slot separado.
- Dois modos de densidade: inferência automática ("Suggest a type", lista única "Data") para velocidade, e slots explícitos para controle fino.
- Painéis recolhíveis e combináveis (pane switcher) para economizar área do canvas.
- Seções de comportamento (Drill through) com toggles abaixo dos wells de dados, no mesmo painel.

**NÃO COPIAR:**
- Ícones dos visuais, ícones de pane switcher, cinza quente/amarelo Power BI, tipografia Segoe UI, o nome "Build visual / Visualizations / Fields", terminologia exata "Drill through / Keep all filters".
- O layout exato do popover on-object com sombra e a galeria de ícones de visuais do Power BI.
- A paleta (azul/verde-água das amostras) e o estilo de sombras/bordas do produto.

**APLICAÇÃO NO NOSSO PRODUTO:** Para Field Wells / Data Mapping do widget, adotar o padrão "painel de dados com slots por papel" onde cada tipo de widget declara seus papéis (eixo X, valor, série/legenda, tooltip, small multiples) e o usuário solta campos do dicionário de dados em cada slot, gerando chips com menu (agregação, formato, renomear) e remover. Manter estado vazio com borda tracejada e texto de instrução, e permitir um modo "sugerir" (auto-atribuir papel por tipo de campo) que o usuário possa expandir em slots explícitos. A agregação deve viver no chip (sub-painel Field + Aggregation) para reduzir slots. Painel de configuração separado do painel de dados (Format vs Build) e combináveis lado a lado é um bom modelo para dashboards densos.

---

### REF-06 — Power BI — Model View (diagrama de modelo semântico)

**IMAGENS:**
1. https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png — "Screenshot of Model view." (1531x780) — VERIFICADA (200, image/png; inspecionada visualmente). Produto atual (Desktop com ribbon moderno, painel Properties + painel Data com abas Tables/Model, "Semantic model" tree, aba "All tables"/"Verbose" e "+" nos layouts, zoom 70%). Melhor imagem para a ficha.
2. https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/relationships-options-03.png — "Screenshot of adjusting relationships in the properties pane." (1915x816) — VERIFICADA (200, image/png; inspecionada). Mostra relação selecionada em amarelo e Properties > Relationship com Table/Column, Cardinality "Many to one (*:1)", "Make this relationship active", "Cross filter direction: Single", "Apply changes" e link "Open relationship editor". Layout de ribbon/painel é de versão mais antiga (painel "Fields" em vez de "Data").
3. https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-05.png — "Screenshot of the related tables add in the new Modeling view tab." (1531x780) — VERIFICADA (200, image/png; inspecionada). Diagrama maior (zoom 45%) em aba "Layout 1" com cards de tabela expandidos mostrando listas de campos com ícones de tipo, painéis Properties/Data recolhidos à direita.

Extras verificadas e inspecionadas:
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/relationships-options-04.png — "Screenshot of the edit relationship window." — VERIFICADA. Diálogo "Edit relationship" com duas tabelas com preview de dados, Cardinality, Cross filter direction, "Make this relationship active".
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-relationship-view/model-view-03.png — "Screenshot of Model view, the model view icon, and relationship details are highlighted." — VERIFICADA (versão antiga, Desktop ~2020/21; mostra cards com listas de campos longas, scrollbar interna, "Collapse ^" por card e indicadores 1 / * em destaque).

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/relationships-options-03.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-05.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/relationships-options-04.png)

![ref](https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-relationship-view/model-view-03.png)

**FONTE:**
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-modeling-view (docs oficiais — "Work with Modeling view"; imagens 1 e 3)
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-create-and-manage-relationships (docs oficiais — "Create and manage relationships"; imagem 2 e extras)
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationship-view (docs oficiais — "Work with Model view")

**CONTEXTO:** O usuário está na Model view do Power BI Desktop, organizando o modelo semântico: tabelas aparecem como cards num canvas livre (estilo diagrama), conectadas por linhas de relacionamento. Há abas de layouts/diagramas na base (All tables + layouts personalizados) para focar em subconjuntos de tabelas; painel Properties à direita edita o item selecionado (card, coluna ou relacionamento); painel Data/Fields lista o modelo (Tables / Model tab, com árvore "Semantic model": Calculation groups, Cultures, Measures, Perspectives, Relationships, Roles, Tables).

**OBSERVAR:**
- Cada tabela é um card branco com cabeçalho (ícone de tabela + nome em negrito, ícone de olho para visibilidade e menu "⋮"), seguido da lista de campos em fonte pequena (~11px) com ícones de tipo à esquerda (Σ para medidas/numérico, calendário, hierarquia) e ícone de olho riscado ("hidden") à direita; rodapé "Expand v"/"Collapse ^" para controlar quantos campos aparecem. Cards longos ganham scrollbar interna.
- Relacionamentos: linhas ortogonais (retas com cantos de 90°) entre cards, terminando nos campos-chave; nas pontas aparecem rótulos pequenos "1" e "*" (cardinalidade 1:* / *:1), e no meio da linha um pequeno ícone com seta/triângulo indicando direção do filtro (seta simples = Single; losango de duas setas = Both). Linha sólida = relação ativa; linha tracejada = inativa (ver `Date` -> `Sales`: linhas pontilhadas).
- Seleção de relacionamento: a linha fica amarela/dourada e o painel Properties à direita mostra "Relationship": Table+Column (dois pares), Cardinality (dropdown), "Make this relationship active" (toggle), Cross filter direction (dropdown), botões "Apply changes" e "Open relationship editor". Edição inline no painel, com diálogo modal completo como segunda via.
- Painel Properties (imagem 1, sem seleção de relação): seção "Cards" com toggles Yes/No: "Show the database in the header when applicable", "Show related fields when card is collapsed", "Pin related fields to top of card" — preferências de visualização do diagrama separadas das propriedades do item.
- Abas de layout na base (imagem 1): "All tables", "Verbose" (aba ativa com sublinhado verde) e botão "+" verde para criar novo diagrama; clique-direito numa tabela > "Add related tables" popula um layout só com as tabelas relacionadas. Imagem 3 mostra "All tables" + "Layout 1".
- Painel Data com abas "Tables | Model": aba Model mostra a árvore de objetos do modelo com contadores entre parênteses (Measures (1,408), Relationships (8), Roles (4), Tables (12)); campo de busca no topo; faixa informativa dispensável (X) "View and organize all of the items in your semantic model".
- Rodapé: slider de zoom com percentual (70%/45%/72%), botão de reset e botão "fit to screen"; canvas com fundo cinza liso e scrollbars.
- Densidade: texto muito pequeno nos cards (diagramas com 8–12 tabelas legíveis em ~70% de zoom); o ribbon superior é Home com grupos "Data / Queries / Relationships / Calculations / Security / Q&A / Sensitivity / Share".

**APROVEITAR:**
- Cards de tabela compactos e recolhíveis com cabeçalho (nome + ações) e lista de campos tipados com ícone; "Expand/Collapse" por card; ocultar campos individualmente.
- Notação de relacionamento: "1" e "*" nas pontas, indicador de direção no meio, linha sólida/tracejada (ativa/inativa), destaque ao selecionar.
- Painel Properties contextual à direita que muda conforme a seleção (relationship / card / canvas) e edita direto, com "Apply changes" explícito.
- Múltiplos diagramas/layouts por aba para dominar modelos grandes, com "Add related tables".
- Painel lateral com árvore de objetos do modelo (Tables, Measures, Relationships, Roles...) com contagens e busca.
- Canvas com zoom/fit e controles no rodapé.

**NÃO COPIAR:**
- Ícones de tipo de campo, ícone de olho/oculto, ícones de direção de filtro específicos do Power BI.
- Paleta (amarelo de seleção, verde da aba ativa, cinza do canvas), estilo exato do ribbon e dos cards (cabeçalho com ícone de tabela amarelo/laranja).
- Terminologia exata "Cross filter direction", "Make this relationship active" sem adaptar ao nosso domínio; nomes das seções "Cultures / Perspectives / Calculation groups".

**APLICAÇÃO NO NOSSO PRODUTO:** Serve como referência para um futuro Semantic Model Editor: canvas de diagrama com cards de tabela (cabeçalho + lista de campos com ícone de tipo e visibilidade, recolhíveis), relações como linhas ortogonais com "1"/"*" e indicador de direção de filtro, e painel Properties contextual à direita para editar relação (cardinalidade, direção, ativa/inativa) e card. Incluir abas de diagramas/layouts para trabalhar subconjuntos do modelo e um painel de árvore do modelo (tabelas, medidas, relacionamentos) com busca e contadores. Manter preferências de visualização do diagrama (mostrar campos relacionados, fixar chaves no topo) separadas das propriedades semânticas.

---

### REF-07 — Power BI — Relatório pronto, corporativo e sóbrio (amostras oficiais atualizadas: "Competitive Marketing Analysis" e "Corporate Spend")

**IMAGENS:**
1. https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/competitive-marketing-analysis.png — "Screenshot of the refreshed Competitive Marketing Analysis overview page with sales metrics, channel and product performance, and monthly trends." (3187x1772) — VERIFICADA (200, image/png; inspecionada visualmente). Amostra atualizada (2026): tema azul-marinho/ciano, fundo cinza muito claro, cards brancos.
2. https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/corporate-spend.png — "Screenshot of the refreshed Corporate Spend sample comparing plan variance across regions and months with conditional formatting." (3187x1797) — VERIFICADA (200, image/png; inspecionada). Mais sóbria e tabular: KPIs, botões de "Breakdown by", matriz grande e barras divergentes.
3. https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/store-sales.png — "Screenshot of the refreshed Store Sales sample using the modern base theme and larger canvas." (2007x1092) — VERIFICADA (200, image/png; inspecionada). Alternativa clean com tema base moderno; inclui mapa, donut, linha e scatter.

Observação sobre as amostras citadas na tarefa:
- "Sales & Returns" (https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/sales-returns-sample-pbix.png, VERIFICADA) é DECORATIVA (skateboards, vermelho forte, fundo azul com gradiente) — não recomendada.
- "Procurement Analysis" (`media/sample-procurement/procurement-dashboard.png`, VERIFICADA, 1600x1229) é o dashboard clássico do Service (tiles, teal, sombra); sóbrio, mas é versão antiga (2016–2018). Útil só como referência de grid de tiles com KPI grande.
- "Retail Analysis", "Customer Profitability" e "Sales and Marketing" têm screenshots antigos/decorativos (2016–2020); só use como complemento. Existe "Financial sample" apenas como Excel; não achei uma imagem oficial atual verificada.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/competitive-marketing-analysis.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/corporate-spend.png)

![ref](https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/store-sales.png)

**FONTE:**
- https://learn.microsoft.com/en-us/power-bi/create-reports/sample-datasets (docs oficiais — "What are Power BI samples"; imagens 1–3)
- https://learn.microsoft.com/en-us/power-bi/create-reports/sample-sales-returns (docs oficiais — Sales and Returns; imagem não recomendada)
- https://learn.microsoft.com/en-us/power-bi/create-reports/sample-procurement (docs oficiais — Procurement Analysis)

**CONTEXTO:** Relatórios de exemplo publicados pela Microsoft, já na linha visual 2025–2026: canvas grande 16:9, fundo cinza claríssimo, "cards" brancos com cantos levemente arredondados e sombra quase nula, título + subtítulo em cada visual, e um cabeçalho de página simples. Representam o "resultado final" de widgets (KPI cards, gráficos, matriz, slicers/botões) no canvas.

**OBSERVAR:**
- Grid claro: margens externas consistentes (~20–40 px) e calhas uniformes entre cards; visuais com alturas alinhadas (linha 1: KPIs; linha 2: gráficos; linha 3: gráfico largo/matriz). Em Competitive Marketing, coluna esquerda de 5 KPI cards empilhados + donut + barras + linha larga em baixo, com bordas alinhadas ao grid.
- Título de visual em duas linhas: métrica em negrito (ex.: "Units Sold") + subtítulo em cinza mais claro com a dimensão ("by Channel", "by Product and Channel", "by Months and Channel"). Padrão "Métrica / by Dimensão" repetido em todos os visuais, alinhado à esquerda no topo do card. Em Store Sales e Revenue Opportunities o mesmo padrão aparece.
- KPI cards: rótulo pequeno cinza no topo, valor grande (~28–36 px) logo abaixo, e uma linha secundária menor com delta/comparação ("Units YoY Change % 7.7%") separada por divisor fino; na amostra, cards com faixa de cor lateral e rótulo vertical ("Online", "Social Media") ligam cor do KPI à série do gráfico.
- Corporate Spend: 4 KPI cards em linha (Var to Plan %, Var to LE1/2/3 %) com valor grande e segunda linha com valores absolutos; abaixo, botões segmentados "Breakdown by" (Var to Plan / Var to Plan % / Business Area / Country / Region / Sales Region / IT Area / IT Sub Area) com botão ativo em azul sólido — funcionam como slicer/field parameter; seletor de região em dropdown no canto superior direito.
- Corporate Spend: matriz "Trends details" com formatação condicional em células (barras de dados azul/laranja divergentes em torno de zero), números alinhados à direita, totais em negrito, scroll interno; barras horizontais com valor ao lado e legenda de gradiente divergente no rodapé. Tooltip customizado ("For Ireland the Var to Plan was ($375,145)") aparece em fundo branco com sombra.
- Filtros globais ficam no topo da página: seletor de data (Competitive Marketing: "31 Dec 2013 – 30 Dec 2014 / In the last 12 months from last date") e dropdown de região (Corporate Spend); sem filtros dispersos no meio do canvas. Botão "Details" no card de barras sinaliza drill/detalhe.
- Cor: paleta contida (azul-marinho + ciano em Competitive Marketing; azul + laranja divergente em Corporate Spend); texto em cinza escuro; só o dado recebe cor; grid e eixos em cinza muito leve (linhas tracejadas finas).
- Consistência tipográfica: tamanhos de título, rótulos de eixo e valores repetidos em todos os visuais; título da página em caixa-alta com subtítulo menor na mesma linha ("COMPETITIVE MARKETING ANALYSIS REPORT / Executive Overview").
- A Contoso/Regional Sales (https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/regional-sales.png, VERIFICADA) adiciona cabeçalho azul-marinho com logo, navegação por abas de página (Overview / Trend Analytics / Won Key Influencers) com sub-abas, e toggle de bookmarks "By Manager / By Product" acima de uma matriz — referência para navegação, mas com branding.

**APROVEITAR:**
- Estrutura "cartão = título (métrica) + subtítulo (dimensão) + corpo" e KPI card com valor grande + linha de comparação.
- Linha de KPIs no topo, seguida de gráficos e uma matriz/tabela de detalhe larga em baixo (hierarquia de resumo -> detalhe).
- Grid alinhado com calhas constantes; fundo cinza muito claro com cards brancos (separação sem bordas pesadas).
- Filtros/segmentadores concentrados em um cabeçalho de página (data, região) e botões segmentados para alternar dimensão ("Breakdown by").
- Formatação condicional discreta em tabelas/matrizes (barras de dados, escala divergente) com totais em negrito.
- Paleta restrita e consistente entre KPI, séries e legendas; só o dado leva cor saturada.
- Tooltips ricos e botão de detalhe/drill discretos, só aparecem ao interagir.

**NÃO COPIAR:**
- Os dados, nomes e logos (Contoso, VanArsdel, Maximus UM-70), a paleta específica (azul-marinho + ciano), o tema Power BI/Segoe UI e o estilo exato de ícones de visual (pin/filtro/expandir/"...").
- Elementos decorativos de amostras antigas (fundos com gradiente, imagens de skate do Sales & Returns, mapas Bing com texto sobreposto).
- Cabeçalho com logo e abas de navegação coloridas do Regional Sales (branding).

**APLICAÇÃO NO NOSSO PRODUTO:** Mostra como o resultado final deve conviver com a arquitetura de widgets: cada widget renderiza dentro de um "card" padronizado (cabeçalho com título em duas linhas métrica/dimensão + corpo) sobre um grid 12 colunas com calhas constantes, e a página tem um cabeçalho para filtros globais. O KPI card deve ser um widget com valor, rótulo e linha de variação, e a tabela/matriz de detalhe deve ocupar linha inteira com formatação condicional discreta. Tokens de cor devem ser contidos (neutros + 1–2 cores de dado) para dashboards sóbrios.

---

## 04 — Figma references

> Estudar a **experiência de edição** (estrutura, compactação, interação). Não copiar a aparência do Figma.

### REF-08 — Figma / Interface completa do editor (Navigation → Canvas → Inspector)

**IMAGENS:**
1. https://cdn.sanity.io/images/599r6htc/regionalized/3225dab2b34419e6bc17bf52633ed13b4e86cd6d-3262x1836.jpg — alt oficial: "Figma's UI3 interface showing design work in the canvas is placed over a vibrant background" (3262x1836, image/jpeg). Status: VERIFICADA (HTTP 200) e INSPECIONADA. É a melhor imagem da pesquisa para esta ficha: UI3 completa com frame selecionado (nome do arquivo "Trivet / Key flows" no topo esquerdo, abas File/Assets, Pages, Layers com hierarquia, canvas com 3 telas, toolbar flutuante embaixo, painel Design à direita com Position/Layout/Appearance/Fill/Stroke/Effects/Layout grid/Export).
2. https://help.figma.com/hc/article_attachments/41460320730519 — "explore-design-file-annotation.png" (1920x1080, image/png). Status: VERIFICADA (HTTP 200) e INSPECIONADA. É um wireframe esquemático oficial (não é screenshot real): navigation bar fina (A), left sidebar (B), canvas (C), right sidebar (D) e toolbar flutuante embaixo (E). Serve só como diagrama de zonas, sem conteúdo.
3. https://help.figma.com/hc/article_attachments/26978261264023 — alt: "Social media post design showing a dog with donuts, including profile name, image, and caption on a layered Figma canvas." (1920x1080, image/png). Status: VERIFICADA e INSPECIONADA. Recorte do left sidebar (Pages + Layers com ícones de tipo, cadeado/olho no hover) ao lado do canvas com frame selecionado e dimension label.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://cdn.sanity.io/images/599r6htc/regionalized/3225dab2b34419e6bc17bf52633ed13b4e86cd6d-3262x1836.jpg)

![ref](https://help.figma.com/hc/article_attachments/41460320730519)

![ref](https://help.figma.com/hc/article_attachments/26978261264023)

**FONTE:**
- https://www.figma.com/blog/our-approach-to-designing-ui3/ — blog oficial (imagem 1). Texto: painéis docked (revertendo o design flutuante original), sistema de labels, foco em "work center stage".
- https://help.figma.com/hc/en-us/articles/15297425105303 ("Explore design files") — Help Center (imagem 2). Descreve toolbar, left sidebar, right sidebar e canvas.
- https://help.figma.com/hc/en-us/articles/360039831974 ("Explore the navigation bar and left sidebar") — Help Center, versão mais recente da UI (nav bar vertical + left sidebar).
- https://help.figma.com/hc/en-us/articles/360040449873 ("Select layers and objects") — página sobre seleção/Layers panel (hover na layer destaca em azul o objeto no canvas); a imagem 3 acima veio da página "Explore design files" (15297425105303), não desta.

**CONTEXTO:** Figma Design é o editor de design de interfaces. A UI3 (lançada em 2024) reorganizou o editor em 3 regiões desacopladas do canvas: navegação à esquerda (páginas + árvore de layers), toolbar flutuante de ferramentas na base, e painel de propriedades à direita. O canvas ocupa o centro e é a "estrela" da tela. O Help Center descreve oficialmente: "navigation panel on the left, toolbar at the bottom, properties panel on the right".

**OBSERVAR:**
- Esquerda (inspecionado na imagem 1): cabeçalho com menu do arquivo (logo + chevron), nome do arquivo ("Trivet") e subtítulo ("Key flows"), botão de recolher painel; abaixo, abas segmentadas "File | Assets" com ícone de busca; seção "Pages" com chevron + botão "+"; lista de páginas com emoji como marcador; seção "Layers" com árvore indentada. Linhas de layer com ~24–28px de altura e ícone de tipo à esquerda (frame #, componente ◇, grupo tracejado); seleção em azul claro e layers filhas com tom azul-claro mais fraco (herança visual da seleção).
- Direita: avatares de colaboradores + botão Play/Share azul no topo; abas "Design | Prototype" com zoom "100%" com chevron na mesma linha (barra de abas compacta, ~32px). Abaixo, cabeçalho do objeto selecionado ("Frame ⌄") com ícones de ação (código, componente, mais) e depois seções separadas por filetes finos: Position, Layout, Appearance, Fill, Stroke, Effects, Layout grid, Export. Seções vazias (Stroke/Effects/Layout grid/Export) ficam colapsadas a uma linha com só um "+" à direita.
- Canvas: fundo cinza-esverdeado claro (neste screenshot, amarelo-esverdeado de marketing; no editor real é cinza neutro) e apenas o selecionado tem contorno azul + handles; o resto da chrome some. Toolbar flutuante centralizada na base com Select (azul ativo), Frame, Shape, Pen, Text, Comment, AI e um segmento "</>" separado por divisor.
- Os três painéis têm fundo branco, bordas finas e separação clara do canvas (decisão da UI3: painéis docked, não flutuantes, ancorados à borda — segundo o blog, a equipe reverteu a ideia de painéis flutuantes após o lançamento).
- Há atalho para minimizar toda a UI (Ctrl/Cmd+Shift+\ ) — esconde nav bar e painéis, deixando só o canvas.
- Largura aproximada (estimada nos 1600 px da imagem 1, cuja largura da janela equivale a ~1425 px de UI): esquerda ~200 px, direita ~210 px, relativamente estreitas, o canvas fica com ~65% da largura. A largura do left sidebar é ajustável (Help Center).

**APROVEITAR:**
- O arranjo Navigation (esq.) → Canvas (centro) → Inspector (dir.) com painéis estreitos e docked.
- Árvore de layers com indentação, ícones de tipo, hover revelando ações (lock/visibility) e seleção sincronizada com o canvas (highlight azul no hover).
- Abas segmentadas simples no topo de cada painel (File/Assets; Design/Prototype).
- Toolbar flutuante curta e centrada na base do canvas, só com ícones.
- Opção de minimizar toda a UI e larguras ajustáveis.

**NÃO COPIAR:** logotipo Figma, azul de seleção #0D99FF e roxo/azul de marca, ícones proprietários (frame #, auto layout, componente), botão "Share" azul, avatares/cursores de colaboração, emojis de página, fundos coloridos de marketing, nomes "Design/Prototype", features de AI/Dev Mode, a toolbar de ferramentas de desenho (irrelevante para BI).

**APLICAÇÃO NO NOSSO PRODUTO:** Para a tela de edição de relatório/dashboard, adotar o mesmo padrão em três colunas: à esquerda uma árvore de páginas/visuais/campos de dados (equivalente a Pages + Layers), ao centro o canvas do dashboard com apenas o visual selecionado destacado, e à direita um inspector de propriedades do visual selecionado. Painéis docked, estreitos, com abas segmentadas, e uma toolbar flutuante curta na base do canvas (inserir visual, texto, filtro). Manter a chrome neutra para o conteúdo (gráficos) ser o destaque, e oferecer modo "minimizar UI" para visualização.

---

### REF-09 — Figma / Properties Inspector (Design panel de objeto selecionado)

**IMAGENS:**
1. https://help.figma.com/hc/article_attachments/31937313497879 — alt: "Figma properties panel showing Design and Prototype tabs with options. With the Design tab selected, you can adjust design properties for a layer. With the Prototype tab open, you can choose from prototype settings." (1920x1920, image/png). Status: VERIFICADA e INSPECIONADA. Painel Design de um Frame: cabeçalho "Frame ⌄" + ícones; Position com 6 botões de alinhamento em dois grupos de 3 (ícones, sem texto), campos X/Y, rotação, flip; Layout com 4 ícones de modo (none/vertical/horizontal/grid), W/H, "Clip content" checkbox; Appearance (olho, gota de blend) com campos de opacidade 100% e raio de canto; Fill (começo). À direita, o painel Prototype ao lado.
2. https://cdn.sanity.io/images/599r6htc/regionalized/3225dab2b34419e6bc17bf52633ed13b4e86cd6d-3262x1836.jpg — (mesma imagem 1 de REF-08) mostra o painel inteiro com Fill preenchido (E4FF97, 100 %) e Stroke/Effects/Layout grid/Export colapsados com "+". Status: VERIFICADA e INSPECIONADA (ver REF-08). Fonte: blog our-approach-to-designing-ui3.
3. https://cdn.sanity.io/images/599r6htc/regionalized/ec686ab4733a96f7953930c29c96eebc1b333041-1608x1072.png — alt: "Auto layout settings panel in Figma's redesigned UI, showing options for width, height, direction, spacing, and alignment. The panel is set to Hug width, Fill height, and includes options for clipping..." (1608x1072, image/png). Status: VERIFICADA e INSPECIONADA. Recorte limpo e ampliado da seção "Auto layout": campos W "Hug" / H "Fill" com dropdown, segmented control de direção (↓ → ↩), gap 16, matriz de alinhamento 3x3 de pontos, padding horizontal/vertical (0/0) e "Clip content" como dropdown.
4. (Complementar) https://help.figma.com/hc/article_attachments/26459737498519 — recorte da seção Layout isolada: W 100 / H 100, ícone de proporção, checkbox "Clip content". Status: VERIFICADA (HTTP 200, image/png) e INSPECIONADA.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://help.figma.com/hc/article_attachments/31937313497879)

![ref](https://cdn.sanity.io/images/599r6htc/regionalized/3225dab2b34419e6bc17bf52633ed13b4e86cd6d-3262x1836.jpg)

![ref](https://cdn.sanity.io/images/599r6htc/regionalized/ec686ab4733a96f7953930c29c96eebc1b333041-1608x1072.png)

![ref](https://help.figma.com/hc/article_attachments/26459737498519)

**FONTE:**
- https://help.figma.com/hc/en-us/articles/360039832014 ("Design, prototype, and explore layer properties in the right sidebar") — Help Center oficial (imagem 1).
- https://www.figma.com/blog/behind-our-redesign-ui3/ — blog oficial (imagem 3).
- https://help.figma.com/hc/en-us/articles/15297425105303 — Help Center ("Explore design files"; imagem 4 aparece ali em texto sobre Layout).
- https://www.figma.com/blog/our-approach-to-designing-ui3/ — texto sobre o novo sistema de labels/tooltips (alts de imagens do post: "The new UI uses tooltips that say 'vertical padding' and 'vertical layout'").

**CONTEXTO:** O Design panel mostra e edita as propriedades do objeto selecionado. Se nada está selecionado, mostra estilos e variáveis locais e a cor de fundo da página. O painel é contextual: as seções mudam conforme o tipo (frame, texto, vetor, instância). O Help Center lista: Alignment/rotation/position, frame size, corner radius, constraints, layout guides, component properties, auto layout, blend modes, text, fill, stroke, effects, export. Há dica oficial: o dropdown ao lado do zoom oferece "Property labels" para exibir rótulos textuais dos ícones.

**OBSERVAR:**
- Cabeçalho do painel: nome/tipo do objeto ("Frame ⌄") em fonte maior (~13–14 px, peso médio) com ações em ícone à direita; os títulos de seção ("Position", "Layout", "Appearance", "Fill") são texto de ~11–12 px em peso médio; os campos têm valor em ~11 px.
- Campos numéricos: pílula/retângulo cinza claro (~#F5F5F5), cantos de ~4–6 px, altura ~24 px, com o rótulo curto (X, Y, W, H) ou um ícone dentro do campo à esquerda em cinza e o valor à direita-do-ícone em preto. Sem borda no repouso; borda azul no foco (ver "(100/4)+256" na imagem de cálculo: dá para digitar expressões matemáticas).
- Agrupamento: 2 colunas de campos (X|Y, W|H) + uma terceira coluna estreita de botões-ícone ("tidy up", "proporção", "mais") — grade consistente de 3 colunas.
- Ícones no lugar de rótulos: alinhamento (6 ícones em segmentos de 3), flip horizontal/vertical, rotação, direção de layout (↓ → ↩), clip content, visibilidade (olho), blend (gota), "mais opções" (…). O texto aparece só como tooltip ou, opcionalmente, via "Property labels".
- Cada seção: título à esquerda e ações de seção (ícones) à direita na mesma linha (ex.: Layout → ícones "resize to fit" e "adicionar auto layout"; Fill → ícone de estilo/variável "⁘" e "+"; Appearance → olho e gota).
- Seções vazias (Stroke, Effects, Layout grid, Export) ficam como uma linha de ~32 px com título cinza e um "+" — adicionar é um clique, sem abrir formulário. Seções com conteúdo (Fill) mostram uma linha: swatch + hex + opacidade % + olho + "−".
- Seções separadas por filete horizontal fino, não por cards, nem sombras; espaçamento vertical entre seções ~16–20 px, entre linhas de campo ~8 px.
- Edição contextual: no auto layout, rótulos como "Hug"/"Fill" aparecem como valor do campo de largura com dropdown para alternar o modo; o campo numérico e o modo são o mesmo controle.

**APROVEITAR:**
- Painel de propriedades organizado em seções com título + ações de seção em ícone à direita.
- Linha de campo de 2 colunas com ícone/letra embutido no campo e coluna estreita de ações.
- Campos de fundo cinza claro sem borda no repouso, borda no foco.
- Seções vazias reduzidas a uma linha com "+", expandindo ao adicionar (ex.: Filtros, Formatação condicional, Ordenação).
- Segmented controls de ícone para alternativas pequenas (direção, alinhamento, tipo de gráfico).
- Opção "mostrar rótulos" para quem preferir texto em vez de ícones (acessibilidade).
- Aceitar expressões/valores digitados (ex.: tamanho, espaçamento).

**NÃO COPIAR:** conjunto de ícones da Figma (align, auto layout, blend), azul de foco #0D99FF, as seções específicas de design (constraints, blend modes, layout grid), a aba Prototype, o nome "Appearance/Fill/Stroke" literal onde não fizer sentido para BI, e o estilo exato do ícone dentro do campo.

**APLICAÇÃO NO NOSSO PRODUTO:** O painel de propriedades de um visual deve ter seções em lista, sem cards: Dados (campos/medidas), Formato, Eixos, Cores, Legenda, Filtros, Tamanho/Posição — cada uma com um título curto e ações em ícone à direita. Campos compactos (24–28 px), duas colunas quando for par (largura/altura, mínimo/máximo), e seções ainda não configuradas mostradas como uma linha com "+". Os ícones devem ter tooltip e existir um toggle "mostrar rótulos". O cabeçalho do inspector deve ter o nome/tipo do visual selecionado, como o "Frame ⌄" do Figma, e deixar claro qual objeto está sendo editado.

---

### REF-10 — Figma / Seleção, resize e alinhamento (selection box, handles, smart guides, medição)

**IMAGENS:**
1. https://help.figma.com/hc/article_attachments/30101683610903 — alt: "Red measurement lines and values displayed between a product image and text sections, showing distances in a layout design." (2290x1488, image/png). Status: VERIFICADA e INSPECIONADA. Mostra a imagem de produto selecionada (contorno e handles quadrados roxos, dimension label roxo "506 × 624" centrado abaixo) com linhas vermelhas de medição até as bordas do frame e pílulas vermelhas com os valores (242 acima, 96 à esquerda, 838 à direita). É a melhor imagem para medição/distâncias.
2. https://help.figma.com/hc/article_attachments/29799649003671 — alt: "Figma interface showing alignment, position, rotation, and dimensions controls for adjusting layer properties." (1920x1290, image/png). Status: VERIFICADA e INSPECIONADA. Frame "Example frame" selecionado: contorno azul, 4 handles quadrados brancos com borda azul, rótulo do nome acima, dimension label azul "256 × 256" abaixo; ao lado o Design panel com legendas anotadas "Alignment / Position / Rotation / Dimensions".
3. https://help.figma.com/hc/article_attachments/31672085673751 — "Select layer" no menu de contexto (1920x1920, image/png; sem alt no HTML). Status: VERIFICADA e INSPECIONADA. Menu de contexto escuro com submenu "Select layer" listando as layers sob o cursor (appWindow, illustration), mostrando seleção por camadas empilhadas.
4. (Complementares, sem inspeção) https://help.figma.com/hc/article_attachments/30101645086231 — alt: "Measuring distance between polygon anchor points with a red line in vector edit mode" (GIF 1920x1080, HTTP 200, image/gif; só alt). https://help.figma.com/hc/article_attachments/24303550566551 — alt: "Scale panel showing width 400, height 400, scale multiplier dropdown, and anchor point selector centered." (PNG 1920x1440, HTTP 200; só alt).

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://help.figma.com/hc/article_attachments/30101683610903)

![ref](https://help.figma.com/hc/article_attachments/29799649003671)

![ref](https://help.figma.com/hc/article_attachments/31672085673751)

![ref](https://help.figma.com/hc/article_attachments/30101645086231)

![ref](https://help.figma.com/hc/article_attachments/24303550566551)

**FONTE:**
- https://help.figma.com/hc/en-us/articles/360039956974 ("Measure distances between layers") — Help Center oficial (imagem 1).
- https://help.figma.com/hc/en-us/articles/360039956914 ("Adjust alignment, rotation, position, and dimensions") — Help Center oficial (imagem 2; texto sobre Snap to objects, distribuição, tidy up).
- https://help.figma.com/hc/en-us/articles/360040449873 ("Select layers and objects") — Help Center oficial (imagem 3).
- https://help.figma.com/hc/en-us/articles/360040451453 ("Scale layers while maintaining proportions") — scale tool.

**CONTEXTO:** Manipulação direta no canvas. Ao selecionar um objeto, a Figma mostra o bounding box com handles, o nome do objeto (frames) e um rótulo de dimensões; ao arrastar/redimensionar, linhas guia vermelhas aparecem quando o objeto se alinha com outros (centros e bordas externas — configuração "Snap to objects"). Segurando Option/Alt com um objeto selecionado e passando o mouse sobre outro, aparecem linhas vermelhas de medição e pílulas com os valores (com Cmd/Ctrl+Option/Alt para objetos aninhados). A cor/espessura da linha de medição não é configurável. Ctrl temporariamente desliga o snap.

**OBSERVAR:**
- Selection box: contorno fino (1 px) e 4 handles quadrados nos cantos (~8 px, brancos com borda azul no frame; roxos translúcidos em frames/imagens dentro de um componente/auto layout). Handles de rotação ficam fora dos cantos e só aparecem ao aproximar o cursor (visto no menu de contexto: círculos vazios nas bordas).
- Dimension label: pílula preenchida (azul no selecionado normal, roxo em contexto de componente) com texto branco "256 × 256", ~11 px, centrada abaixo da seleção; o nome do frame aparece acima à esquerda em azul, sem pílula.
- Medição: linhas vermelhas 1 px da seleção até as bordas de referência e pílulas vermelhas com número branco, no meio de cada linha; só aparece enquanto Alt está pressionado — feedback transitório, não ocupa a UI permanente.
- Smart guides ao arrastar/redimensionar: linhas vermelhas/rosa finas cruzando o canvas quando bordas/centros se alinham (Snap to objects); some ao soltar. (Fonte: texto do Help Center — "a red guide appears on the canvas"; a imagem de smart guide de arrasto não foi encontrada em URL verificável, então este ponto vem do doc.)
- Alinhamento: 6 botões de ícone no topo do Design panel (esq., centro-h, dir.; topo, centro-v, base) que atuam no pai quando 1 objeto está selecionado e entre si quando há vários; atalhos Alt+A/D/W/S/H/V. Distribuição (espaços iguais horizontal/vertical) e "Tidy up" para linhas/colunas/grade aparecem quando há múltiplos selecionados.
- Campo W/H aceita aritmética (ex. "(100/4)+256"), e há uma ferramenta Scale (K) com multiplicador e âncora, para escalar proporcionalmente.
- Seleção em camadas: duplo-clique ou Enter desce um nível; Shift+Enter sobe; Tab percorre irmãos; Cmd/Ctrl-clique seleciona o filho mais profundo; menu "Select layer" lista tudo sob o cursor; também seleção por marquee e "Select All with Same Fill/Stroke/Effect/Font" (menu de contexto, visto na imagem 360056940754).

**APROVEITAR:**
- Bounding box discreto com handles pequenos e um único rótulo de dimensões compacto.
- Guias de alinhamento e distâncias transitórias (aparecem só durante a ação ou com modificador).
- Linhas de medição com pílulas numéricas para espaçamento entre visuais.
- Alinhar/distribuir como um grupo de ícones no inspector que reage ao número de objetos selecionados.
- Descer/subir na hierarquia (Enter/Shift+Enter) e "selecionar camada sob o cursor" para objetos sobrepostos.
- Snap com desativação temporária por tecla modificadora.

**NÃO COPIAR:** o vermelho/laranja-avermelhado #F24822 característico das guias e pílulas de medida, o azul de seleção, o roxo de componente, o design das alças de rotação, atalhos idênticos (Alt+A/D/W/S) se conflitarem com os do produto, e o estilo exato dos cursores.

**APLICAÇÃO NO NOSSO PRODUTO:** No canvas de dashboard, ao selecionar um visual, mostrar uma borda fina com alças nos cantos e um rótulo "largura × altura" (em unidades do grid, px ou colunas). Durante o arraste/redimensionamento, exibir guias de alinhamento em uma cor própria da paleta (distinta da seleção) e, com tecla modificadora, as distâncias entre visuais. No inspector, expor ícones de alinhar/distribuir que só ficam ativos quando faz sentido (1 vs vários visuais selecionados). Para o grid de dashboard, considerar snap a colunas em vez de pixels livres, com tecla para desligar o snap.

---

## 05 — Secondary BI references

> Duas ferramentas escolhidas por adicionarem o que Power BI e Figma não mostram bem.

**Justificativa da escolha**

Confirmei as duas sugestoes iniciais: **Tableau** e **Grafana**. Superset nao foi usado.

- **Tableau** adiciona o que Power BI e Figma mostram mal: o modelo de authoring por *shelves* e *pills* (arrastar campo para Columns/Rows/Marks/Filters), a distincao visual Dimension vs Measure e discreto vs continuo (por cor e icone), o Marks card como encoding por slots e o Show Me como seletor de grafico condicionado aos campos escolhidos. No dashboard, o painel Objects + Tiled/Floating + Item hierarchy (arvore de containers) e uma alternativa clara ao modelo livre do Power BI.
- **Grafana** adiciona densidade e tempo real: barra de variaveis/filtros + time picker + refresh no topo, linhas colapsaveis, painel de edicao com abas Queries/Transformations e options pane com busca e secoes colapsaveis (docs v12.4/v13.1), e a edicao "context-aware" de dashboard (edit pane lateral + Content outline em arvore + tabs/rows aninhados + layout Auto vs Custom) da familia Dynamic Dashboards, documentada ate v13.x. Isso e exatamente o que Power BI Desktop (Fields/Format/Selection pane) e Figma nao ilustram com fidelidade.

Superset nao foi trocado: o chart builder dele (dataset panel + "Data/Customize") seria redundante com Tableau (pills/shelves) e com Grafana (options pane).

**Metodo / honestidade:** todas as URLs de imagem abaixo foram verificadas com `curl -sIL` (User-Agent de navegador): HTTP 200 e `content-type: image/png|gif`. Eu baixei as imagens apenas para o scratchpad (`.../scratchpad/img/`, fora do projeto) e abri com Read; onde o texto diz "inspecao visual" a descricao vem da imagem, onde diz "doc/alt" vem da documentacao. **Atencao de data:** os screenshots do Tableau na help.tableau.com ("current") ainda mostram a UI classica (provavelmente 2019-2022); o conceito e valido, mas nao e a UI "on-object" mais recente do Tableau 2024/2025 (nao capturada aqui). Os do Grafana sao recentes (v12.4 a v13.3 nos nomes de arquivo; a doc "latest" ja esta na v13.x). O blog grafana.com bloqueia curl (403); as URLs de imagem do blog foram obtidas via WebFetch e depois verificadas por HEAD (200).

### REF-11 — Tableau / Authoring workspace completo (Data pane + shelves + canvas)

**IMAGENS:**
1. https://help.tableau.com/current/pro/desktop/en-us/Img/environ_workspace1.png — alt: "A Tableau workbook showing the parts of the Tableau workspace." — HTTP 200 image/png (161 KB) — Tableau Desktop, UI classica; tem marcadores A-I (barra de titulo, shelves, toolbar, canvas, data pane, abas de sheet, status bar). Inspecao visual feita.
2. https://help.tableau.com/current/pro/desktop/en-us/Img/online_workspace.png — alt: "Tableau Cloud Worksheet with various callouts for different parts of the view." — HTTP 200 image/png — Tableau Cloud (web authoring); mostra tambem Pages, Filters, Marks e Measure Values em colunas. Inspecao visual feita.
3. https://help.tableau.com/current/pro/desktop/en-us/Img/schema3.png — alt: "A Data pane with a list of dimensions and measures." — HTTP 200 image/png — recorte do Data pane (185x600). Inspecao visual feita.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/environ_workspace1.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/online_workspace.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/schema3.png)

**FONTE:** https://help.tableau.com/current/pro/desktop/en-us/environ_workspace.htm (doc oficial, "Tableau Workspace"); https://help.tableau.com/current/pro/desktop/en-us/getstarted_web_authoring.htm (doc oficial, web authoring); https://help.tableau.com/current/pro/desktop/en-us/datafields_typesandroles.htm (doc oficial, tipos/papeis dos campos).

**CONTEXTO:** Tela principal de uma worksheet. Esquerda: abas Data/Analytics, fonte de dados ativa, busca de campos e lista de campos separada por uma linha entre Dimensions (acima) e Measures (abaixo). Centro-esquerda: cards empilhados Pages, Filters, Marks, e legenda ("Region") abaixo. Topo do canvas: shelves Columns e Rows com pills. Direita/centro: a viz. Rodape: abas "Data Source / Sheet 1 / novas sheets" e status bar ("192 marks, 3 rows by 16 columns, SUM(Profit): 286,397").

**OBSERVAR:**
- Pills com cor semantica: azul = discreto (ex.: YEAR(Order Date), Segment), verde = continuo (SUM(Profit)). A mesma cor distingue campos no Data pane (icones Abc, #, calendario, globo).
- Shelves horizontais Columns/Rows com rotulo e icone a esquerda ("iii Columns", "≡ Rows"), alturas compactas (~24 px), pills com cantos totalmente arredondados e "caret" para menu de contexto.
- Cards laterais com cabecalho texto simples e area de drop tracejada/vazia ("Pages", "Filters"): o card vazio ensina onde soltar.
- Marks card: dropdown de tipo de marca (Automatic) + grade 2x3 de botoes de encoding (Color, Size, Label, Detail, Tooltip, Path) e pills abaixo. Legenda separada, colada abaixo, com titulo igual ao campo.
- Hierarquia de barras: menu (texto), toolbar de icones sem rotulo, area de trabalho; abas de sheet no rodape como no Excel; status bar rica em contagem de marcas.
- Data pane tem busca com icone de lupa, toggle de visualizacao (lista/agrupado) e rolagem independente; campos calculados em italico (Measure Names, Latitude (generated)).

**APROVEITAR:** (1) a ideia de "slots de encoding" com acao de soltar (campo → Eixo/Cor/Tamanho/Rotulo/Tooltip/Detalhe) com card vazio instrutivo; (2) separacao visual Dimension/Measure no painel de campos por icone+cor, com busca e rolagem proprias; (3) abas de pagina no rodape + status bar com contagem de linhas/marcas e soma da selecao; (4) agrupamento vertical de cards de configuracao (Filtros, Marcas, Legenda) a esquerda do canvas.

**NÃO COPIAR:** Paleta azul/verde das pills e o par de cores azul-laranja de series; a iconografia propria (grade de pontos do logo, icones Abc/#); nomes proprietarios (Shelves, Marks, Show Me, Pills); a barra de menu classica "File Data Worksheet…" e o visual de 2019-2022. Nao replicar a mecanica identica de Measure Names/Values.

**APLICAÇÃO NO NOSSO PRODUTO:** O painel "Campos" do nosso editor de relatorios pode adotar o mesmo principio de separar dimensao e medida por icone+cor (com a nossa paleta), mantendo busca fixa no topo. Os "wells" de Eixo/Legenda/Valores/Dica podem ficar visiveis como cards com area de drop vazia e texto instrutivo. Como o Tableau mostra, uma status bar com contagem de linhas e soma da selecao e util e barata; vale incluir no rodape do canvas junto com as abas de pagina.

---

### REF-12 — Tableau / Dashboard authoring (Dashboard/Layout tabs, Objects, containers, Item hierarchy)

**IMAGENS:**
1. https://help.tableau.com/current/pro/desktop/en-us/Img/layout_container1.png — alt: "Objects section of the Dashboard pane with the horizontal and vertical options highlighted." — HTTP 200 image/png — painel esquerdo: abas Dashboard/Layout, Device Preview, Size, lista de Sheets, secao Objects (Horizontal, Vertical, Text, Image, Web Page, Blank), toggle Tiled/Floating, "Show dashboard title". Inspecao visual feita.
2. https://help.tableau.com/current/pro/desktop/en-us/Img/dashboard_drag_hierarchy.gif — alt: "Reorder both tiled and floating objects in the hierarchy." — HTTP 200 image/gif (312x220) — "Item hierarchy": arvore Dashboard > Horizontal container > Vertical container > Navigation buttons, com icones por tipo. Inspecao visual feita (primeiro frame).
3. https://help.tableau.com/current/pro/desktop/en-us/Img/online_dashboard.png — alt: "A tableau cloud Dashboard with three visualizations." — HTTP 200 image/png — dashboard de ponta a ponta no Tableau Cloud com painel esquerdo e 3 vizs com titulo, filtro "Region (All)" e legenda. Inspecao visual feita.
4. (Opcional) https://help.tableau.com/current/pro/desktop/en-us/Img/layout_container2_494x662.png — alt: "Objects dragged onto a layout container in a viz." — HTTP 200 image/png — seta de drag de uma sheet do painel para o canvas e o toggle Tiled/Floating.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/layout_container1.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/dashboard_drag_hierarchy.gif)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/online_dashboard.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/layout_container2_494x662.png)

**FONTE:** https://help.tableau.com/current/pro/desktop/en-us/dashboards_organize_floatingandtiled.htm (doc oficial, "Size and Lay Out Your Dashboard"); https://help.tableau.com/current/pro/desktop/en-us/dashboards_create.htm (doc oficial, "Create a Dashboard"); https://help.tableau.com/current/pro/desktop/en-us/dashboards_best_practices.htm (doc oficial, "Best Practices for Creating Dashboards").

**CONTEXTO:** Ao criar um dashboard, a sidebar esquerda troca para duas abas: **Dashboard** (tamanho, sheets disponiveis, objetos) e **Layout** (propriedades do item selecionado e a Item hierarchy). O usuario arrasta sheets e objetos para o canvas; cada um entra num container tiled (grade com divisores) ou floating (posicionamento livre com x/y/z). Containers Horizontal/Vertical servem para distribuir espaco igualmente e reorganizar sheets.

**OBSERVAR:**
- Sidebar em abas com rotulo de texto e menu de caret ("Dashboard | Layout ▾"); dentro dela, **Size** (dropdown: "min 1000x620 - auto", "Desktop Browser (1000 x 8...)"), **Sheets** (lista com icone de grafico), **Objects** (grade 2 colunas com icones + rotulo) e rodape fixo (Tiled | Floating + checkbox "Show dashboard title").
- Toggle segmentado Tiled/Floating colado ao fundo da sidebar, no escopo do "o que eu vou soltar".
- Item hierarchy (Layout tab): arvore recolhivel com icones por tipo, drag para reordenar tiled e floating; item vira "Horizontal container 1", renomeavel pelo menu de contexto.
- Dashboard pronto (online_dashboard.png): titulo em caixa alta pequena, filtro "Region" discreto no canto superior direito, legendas de cor no topo, subtitulos italicos ("most recent period") e linhas finas separando tiles. Sem cartoes com sombra, apenas divisores finos.
- Cada item tem um pop-up menu no canto superior ("Use as Filter", "Edit", "Remove from Dashboard") e a doc mostra "Show/Hide button" para colapsar containers flutuantes.
- Painel "Layout" tem controles numericos para posicao/tamanho (x, y, width, height) e fundo/borda/padding por item.

**APROVEITAR:** (1) o painel esquerdo do modo dashboard como "biblioteca de objetos" (visuais, texto, imagem, em branco, container H/V) com toggle Tiled/Floating; (2) a **arvore de hierarquia de itens** como alternativa precisa ao clique no canvas (selecao de itens sobrepostos, reordenar, renomear); (3) opcao de tamanho do dashboard (fixo, intervalo, automatico) numa linha so; (4) "Use as Filter" por visual como acao explicita no menu do item; (5) botoes Show/Hide para areas expansiveis.

**NÃO COPIAR:** O cinza escuro/azul-acinzentado da UI de selecao; icones Horizontal/Vertical (retangulos com divisor); terminologia "Tiled/Floating" literal se quisermos outro vocabulario; a conveniencia de "Phone/Default" device layouts identicos em UI (e proprietario do Tableau Desktop). Nao copiar a paleta azul/laranja dos mapas de exemplo.

**APLICAÇÃO NO NOSSO PRODUTO:** O editor de paginas pode ter, alem de arrastar no canvas, uma "Estrutura/Camadas" em arvore na sidebar (como Item hierarchy e a Selection pane do Power BI, porem com containers aninhados). O alternador Grade/Livre fica no rodape do painel de objetos. Para dashboards responsivos, um container H/V com "distribuir igualmente" reduz o trabalho de alinhamento; o tamanho do canvas (fixo/auto) fica num dropdown no topo do painel. A doc oficial tambem ensina limitar a poucos visuais por dashboard.

---

### REF-13 — Tableau / Marks card, shelves e Show Me

**IMAGENS:**
1. https://help.tableau.com/current/pro/desktop/en-us/Img/build_manual_shelves_marks2.png — alt: "Marks card with shelves for Segment, Region, and Sum (Quantity). For the Sum (Quantity) measure, a context menu shows options for Color, Label, Shape, Detail, and Tooltip." — HTTP 200 image/png (23 KB) — card Marks com dropdown "Shape", botoes Color/Size/Label/Detail/Tooltip/Shape, pills de Segment, Region e SUM(Quantity), e menu de contexto de uma pill. Inspecao visual feita.
2. https://help.tableau.com/current/pro/desktop/en-us/Img/showme3.png — alt: "The show me preview menu with a variety of chart types." — HTTP 200 image/png (188x593) — painel Show Me com grade de miniaturas, uma selecionada (barras empilhadas, borda laranja) e dica abaixo ("For stacked bars use: 1 Measure, 1 Dimension, optional Dimension on…") + botao "Choose for me". Inspecao visual feita.
3. https://help.tableau.com/current/pro/desktop/en-us/Img/wwd_shelf_cr1.png — alt: "The segment dimension is placed on the columns shelf and the profit measure is placed on the rows shelf." — HTTP 200 image/png — exemplo das shelves com campos. Nao inspecionado visualmente (so alt/doc).

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/build_manual_shelves_marks2.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/showme3.png)

![ref](https://help.tableau.com/current/pro/desktop/en-us/Img/wwd_shelf_cr1.png)

**FONTE:** https://help.tableau.com/current/pro/desktop/en-us/buildmanual_shelves.htm (doc oficial, "Shelves and Cards Reference"); https://help.tableau.com/current/pro/desktop/en-us/buildauto_showme.htm (doc oficial, "Use Show Me to Start a View").

**CONTEXTO:** O Marks card controla como cada marca e desenhada: tipo de marca (Automatic, Bar, Line, Circle…) e slots de encoding (Color, Size, Label/Text, Detail, Tooltip, Shape, Path). Show Me e um painel (botao "Show Me" na toolbar) que lista tipos de grafico habilitados/desabilitados conforme os campos selecionados no Data pane e explica o requisito minimo ao passar o mouse.

**OBSERVAR:**
- Grade 3x2 de botoes grandes com icone + rotulo (Color/Size/Label/Detail/Tooltip/Shape) — encodings sao tratados como "slots" iguais, nao como lista de propriedades.
- Pills dentro do Marks card ganham um pequeno icone a esquerda indicando o slot ao qual pertencem (ex.: pontinhos de cor para Color), e sao tambem arrastaveis entre slots.
- Menu de contexto da pill ("Color, Label, Shape, Detail, Tooltip") para atribuir sem arrastar: dupla via (arrastar OU menu).
- Show Me: miniaturas 3 colunas sem texto; miniatura indisponivel fica esmaecida; a selecionada tem borda laranja. Abaixo, uma "receita" textual com pills de exemplo mostra o que cada tipo precisa (medida/dimensao).
- Botao "Choose for me" no rodape do Show Me para recomendacao automatica.
- Shelves Pages, Filters, Columns, Rows tem placeholders "drop field here" (doc) e, na tabela, "Drop field here" ao redor da viz.

**APROVEITAR:** (1) Sheet de "slots" de encoding com botoes grandes e pills com icone de slot; (2) alternativa por menu de contexto ao drag-and-drop para acessibilidade; (3) seletor de tipo de grafico com miniaturas, esmaecimento de tipos incompativeis e dica "requisitos: 1 medida + 1 dimensao"; (4) botao de recomendacao ("Sugerir").

**NÃO COPIAR:** Terminologia e iconografia exatas dos slots; as miniaturas de Show Me em azul/laranja do Tableau; o gesto "Choose for me" como marca (Tableau tem proprio). Nao replicar a regra proprietaria de habilitacao de graficos.

**APLICAÇÃO NO NOSSO PRODUTO:** A secao "Formatar visual" pode comecar com um cartao de "Mapeamento" que reuse a metafora de slots (Eixo X, Eixo Y, Legenda, Tamanho, Dica) com area vazia instrutiva, antes do formato avancado. O seletor de tipo de grafico pode usar miniaturas com estado desabilitado e uma linha curta de requisitos ao passar o mouse. Esse padrao funciona bem como painel lateral estreito (~190-200 px de largura, como no Show Me).

---

### REF-14 — Grafana / Dashboard em modo view (denso, variaveis, time picker, sidebar de acoes)

**IMAGENS:**
1. https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-image-map-v13.1.png — alt: "An annotated image of a Grafana dashboard" — HTTP 200 image/png (199 KB) — Grafana v13.1: breadcrumb + search + ações no header; barra com variavel ("State"), "Filters/Group by", time range "Last 6 hours GMT", refresh, share, botao Edit; linha "Population" com abas "1980-2020 / 1900-1979"; 2 paineis; coluna de ícones à direita (export, outline, filtros, info, recolher). Inspecao visual feita.
2. https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-w-groupings-v13.1.png — alt: "Dashboard with nested groupings" — HTTP 200 image/png — dashboard com agrupamentos aninhados (rows/tabs). Verificado por HEAD; NAO inspecionado visualmente.
3. Live (sem imagem estatica; inspecao visual em 06/10/2026 via navegador): https://play.grafana.org/d/appenv-banking-exec-overview/banking-executive-overview — "Grafana Bank — Executive Overview", demo publica oficial (play.grafana.org). Mostra faixa de 8 stat tiles coloridos (Money Moved $275K, Success 94.0%, Loans 191k, Approval 37.6%, Fraud 0, Logins 5K, Chats 211, Tickets 49) e abaixo 3 paineis (Money Moved $/h, Transfers by Result, Customer Activity com mini-tabela Mean/Max). Header com time picker "Last 6 hours", Refresh e intervalo "30s", Share, Edit.
4. (Imagem de apoio, v11.2) https://grafana.com/media/docs/grafana/dashboards/screenshot-time-picker-11.2.png — alt: "Time picker" — HTTP 200 image/png — popover do time picker (ranges rapidos). Nao inspecionado visualmente.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-image-map-v13.1.png)

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-w-groupings-v13.1.png)

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-time-picker-11.2.png)

**FONTE:** https://grafana.com/docs/grafana/latest/visualizations/dashboards/use-dashboards/ (doc oficial); https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/dashboard-groupings/ (doc oficial); https://play.grafana.org (demo publica oficial).

**CONTEXTO:** Visualizacao de um dashboard (nao edicao). A faixa de controles fica abaixo do header: variaveis/filtros a esquerda; tempo (picker + zoom out + refresh + auto-refresh) a direita, mais Share e Edit. O conteudo e organizado em linhas/secoes colapsaveis (e agora abas) e a direita ha uma barra vertical de acoes (exportar, outline, filtros, info, recolher).

**OBSERVAR:**
- Controles de contexto (variaveis + tempo) numa unica barra horizontal sticky sob o header; todo controle e um "segmented button" com borda de 1 px: rotulo + valor + caret (ex.: "State | All ▾", "Last 6 hours GMT ▾").
- Time picker composto: setas anterior/proximo periodo, relogio+intervalo, zoom out, e Refresh com split-button de auto-refresh. Fuso aparece ao lado do intervalo em cor de destaque (laranja).
- Stat tiles ("sparkline stat") com numero grande, titulo curto truncado ("Money M…") e mini serie no fundo; cores de fundo por limiar/gradiente. Alta densidade: 8 KPIs em linha (play.grafana.org).
- Paineis: cartoes de borda fina sem sombra, titulo no canto superior esquerdo, legenda abaixo, grade 24 colunas implicita; a linha "Population" tem cabecalho com chevron recolhivel e linha-guia vertical a esquerda.
- Barra lateral direita estreita (~60 px) com 5-6 icones: exportar, outline, filtros, info, recolher (v13.1).
- Tema escuro por padrao; todo texto de eixo e legenda e pequeno (11-12 px na escala do screenshot), com contraste medio.

**APROVEITAR:** (1) barra unica de contexto (filtros + tempo + atualizar) acima dos visuais, com botoes segmentados e rotulo+valor; (2) secoes colapsaveis com chevron + linha-guia, e abas dentro de secao; (3) KPI tiles compactos com sparkline e titulo truncado com tooltip; (4) acoes de dashboard (Share/Edit/Exportar) agrupadas na direita do header.

**NÃO COPIAR:** O logo/branding Grafana e o laranja de destaque; os gradientes saturados dos stat tiles (verde/roxo/azul) como estilo de KPI; a barra lateral de icones do Grafana v13; o nome "Last 6 hours" como unico preset (usar nossos presets/idioma). Nao copiar o esquema de legendas (paleta classica verde/amarelo/azul).

**APLICAÇÃO NO NOSSO PRODUTO:** Para dashboards operacionais/BI de leitura, vale uma barra fixa sob o header com filtros globais + intervalo de datas + atualizar, usando botoes segmentados compactos. KPIs podem ficar numa faixa de 4-8 tiles com sparkline discreta. Secoes recolhiveis agrupam grandes volumes de visuais sem criar muitas paginas, parecido com o Power BI + bookmarks mas mais leve. Deve-se tratar tempo real como opcional (auto-refresh por dropdown).

---

### REF-15 — Grafana / Edit panel (query editor + options pane com busca e secoes colapsaveis)

**IMAGENS:**
1. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-panel-editor-2-v12.4.png — alt: "Panel editor" — HTTP 200 image/png (329 KB, 2596x1456) — Grafana v12.4. Inspecao visual feita.
2. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-visualization-presets-v13.0.png — alt: "Panel styles example for time series visualization" — HTTP 200 image/png — v13.0, presets de estilo no painel de opcoes. Verificado por HEAD; NAO inspecionado visualmente.
3. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-viz-suggestions-v13.2.png — alt: "Visualization selector" — HTTP 200 image/png (680x792) — seletor de visualizacao com sugestoes (v13.2). Verificado por HEAD; NAO inspecionado visualmente.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-panel-editor-2-v12.4.png)

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-visualization-presets-v13.0.png)

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-viz-suggestions-v13.2.png)

**FONTE:** https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-editor-overview/ (doc oficial); https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/ (doc oficial, para o seletor de visualizacao).

**CONTEXTO:** Editor de painel em tela cheia. Coluna esquerda larga: preview do painel (topo, com toggle "Table view" e time controls) e, abaixo, abas **Queries (1)**, **Transformations (0)**. Coluna direita (~25% da largura): "options pane" com cabecalho do tipo de visualizacao ("Time series — Change"), icone de filtro de opcoes e icone de busca, e secoes colapsaveis (Panel options, Tooltip, Legend, Axis, Graph styles, Standard options, Data links and actions, Value mappings, Thresholds, "+ Add field override").

**OBSERVAR:**
- Divisao 3 zonas: preview acima, query editor abaixo (redimensionavel por divisor horizontal), options pane a direita; preview e query editor compartilham a coluna esquerda.
- Abas "Queries/Transformations" com contador em pill cinza ao lado ("Queries 1", "Transformations 0") e sublinhado laranja na aba ativa.
- Linha de ferramenta da query: "Data source [prometheus-1 ▾] ?" + "Query options MD = auto = 500, Interval = 30s" resumo em linha + botao "Query inspector". A linha de "Query options" mostra o resumo dos valores atuais mesmo recolhida.
- Cada query e um cartao "A" com chevron, nome do data source em italico, "Saved queries ▾", icones (ajuda, ocultar, duplicar, olho, lixeira, grip) e toggle "Explain" + botao primario azul "Run queries" + segmentado "Builder | Code". O editor de codigo (PromQL) tem destaque de sintaxe e botao "Metrics browser >".
- Rodape de acoes: "+ Add query", "+ Add from saved queries", "+ Expression", "+ Recorded query".
- Options pane: cada secao e um cabecalho de uma linha com chevron; sem cartoes; contadores no cabecalho (Thresholds "2"); botao largo "Add field override" no fim. Cabecalho tem icone de busca e icone de filtro de opcoes.

**APROVEITAR:** (1) layout 3 zonas para edicao de visual: preview + dados + opcoes; (2) options pane como lista de secoes colapsaveis com busca e contadores no cabecalho; (3) resumo "inline" dos parametros recolhidos (Query options, Options: Legend: Auto · Format: Time series…) para evitar abrir tudo; (4) abas com contadores; (5) alternancia Builder/Code para modo visual vs. expressao (DAX/SQL no nosso caso); (6) botao de "Table view" no preview para ver os dados por tras do visual.

**NÃO COPIAR:** PromQL/"Metrics browser", conceito de data source por painel, Transformations como camada de pipeline (muito tecnico para publico de BI de negocio); icone de grip, o azul "Run queries" e o laranja de aba ativa; o nome "Field override"/"Overrides" proprio do Grafana; a densidade extrema de icones na barra do cartao de query.

**APLICAÇÃO NO NOSSO PRODUTO:** O painel "Formatar visual" do nosso editor deve usar secoes colapsaveis com busca (no topo) e contadores de overrides, como o options pane, em vez de abas por tipo de configuracao. Para consultas/medidas, um modo "Builder | Codigo" evita forcar o usuario a escrever expressoes. Mostrar um toggle "Ver dados" (tabela) no preview ajuda na depuracao e reduz tickets de "o que esta por tras deste grafico?".

---

### REF-16 — Grafana / Edit mode do dashboard: edit pane contextual, Content outline, tabs/rows e layout Auto vs Custom

**IMAGENS:**
1. https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-edit-v13.0.png — alt: "Dashboard with tabs nested inside rows in edit mode showing sidebar and toolbar" — HTTP 200 image/png (3024x1808) — v13.0, dashboard "node exporter" em modo edicao com painel lateral "Row" aberto. Inspecao visual feita.
2. https://grafana.com/media/docs/grafana/dashboards/screenshot-content-outline-v13.3.png — alt: "Dashboard with outline open" — HTTP 200 image/png (2574x1182) — v13.3, arvore Dashboard > Filters/Variables/Annotations & Alerts/Links > Parent row > Nested tab > Panel, com busca. Inspecao visual feita.
3. https://grafana.com/media/docs/grafana/dashboards/screenshot-edit-mode-imagemap-v13.1.png — alt: "An annotated image of the sidebar and toolbar" — HTTP 200 image/png — v13.1, painel "Dashboard" (View all settings, Title, Description, Layout Custom|Auto, Filters, Variables, Annotations, Links) com barra de icones. Inspecao visual feita.
4. https://grafana.com/media/docs/grafana/dashboards/screenshot-auto-layout-indicators-v13.2.png — alt: "Dashboard showing auto layout indicators" — HTTP 200 image/png — v13.2, secao "Sample visualizations" com icone de grid, "+ Add panel", "Group panels", "New row", "Ungroup rows" e popover "Panel sizes are managed by auto layout — Edit auto layout / Switch to custom layout". Inspecao visual feita.
5. https://a-us.storyblok.com/f/1022730/449a5962c5/dynamic-dashboards-grafana-12.png — alt: "Dynamic dashboard screenshot in Grafana 12" — HTTP 200 image/png (1940x1268) — dashboard "Thanos Dynamic Dashboard" com edit pane a direita "Dashboard" e arvore Outline expandida. Inspecao visual feita. (URL obtida via WebFetch da pagina do blog https://grafana.com/blog/dynamic-dashboards-grafana-12/ e verificada por HEAD.)
6. (Opcional) https://a-us.storyblok.com/f/1022730/7ea26b2c46/dynamic-dashboards-editing-grafana-12.png — alt: "Examples of editing tools in dynamic dashboards in Grafana 12" (1301x648) e https://a-us.storyblok.com/f/1022730/e99efe09a0/dynamic-dashboards-navigation-grafana12.png — alt: "Examples of different navigation tools in dynamic dashboards in Grafana 12" — HTTP 200 image/png. Verificados por HEAD; nao inspecionados visualmente.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-dashboard-edit-v13.0.png)

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-content-outline-v13.3.png)

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-edit-mode-imagemap-v13.1.png)

![ref](https://grafana.com/media/docs/grafana/dashboards/screenshot-auto-layout-indicators-v13.2.png)

![ref](https://a-us.storyblok.com/f/1022730/449a5962c5/dynamic-dashboards-grafana-12.png)

![ref](https://a-us.storyblok.com/f/1022730/7ea26b2c46/dynamic-dashboards-editing-grafana-12.png)

![ref](https://a-us.storyblok.com/f/1022730/e99efe09a0/dynamic-dashboards-navigation-grafana12.png)

**FONTE:** https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/ (doc oficial); https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/dashboard-groupings/ (doc oficial); https://grafana.com/blog/dynamic-dashboards-grafana-12/ (blog oficial); https://grafana.com/whats-new/2026-04-08-dynamic-dashboards-is-now-generally-available/ (anuncio GA, abril/2026).

**CONTEXTO:** Ao clicar Edit, o dashboard entra em modo de edicao: a toolbar ganha **Save** (split button) e **Exit edit**, e surge uma **sidebar de edicao** a direita, composta por (a) um painel contextual (Dashboard / Row / Tab / Panel, conforme a selecao) e (b) uma coluna estreita de icones (+ adicionar, configuracoes, comentarios/anotacoes, JSON model, import/export, **outline**, filtros, info, recolher). Dynamic dashboards (GA em abril/2026) adicionam tabs e rows aninhaveis, layout Auto-grid e regras de show/hide.

**OBSERVAR:**
- **Edit pane contextual**: o titulo do painel muda com a selecao ("Row" aqui) e mostra so campos relevantes: Title, Fill screen, Hide row header, Variables (+ "Add variable"), Layout segmentado "Rows | Tabs", Repeat options, "Show / hide rules" (Row visibility Show|Hide, "Time range less than 6 hours", "+ Add rule").
- Selecao no canvas mostrada por **contorno tracejado azul** na secao ativa (linha "System timesync"); chevron e titulo em fonte maior (≈18 px) para linhas.
- **Content outline**: arvore com busca, icone por tipo (filtro, variavel, anotacao, link, linha, aba, painel), chevrons e indentacao com linha-guia; serve de navegacao e selecao.
- **Layout Custom | Auto** (segmentado) por secao: Auto-grid distribui paineis automaticamente; popover alerta "Panel sizes are managed by auto layout"; botoes "+ Add panel", "Group panels", "+ New row", "Ungroup rows" aparecem ao final da secao, nao num menu global.
- Barra superior de edicao: variaveis (datasource, Host) e filtros ad hoc ("filter0 job = node", "Group by: key", toggle "Reboot") antes do time picker; botao primario azul "Save" com caret e "Exit edit" sem destaque.
- Painel redimensionavel (alca no canto inferior direito dos paineis) e painel lateral recolhivel pelo icone inferior (→|).
- A sidebar tem larguras estaveis (~360-420 px em 1x) e nao cobre o canvas: o canvas encolhe (responsivo).

**APROVEITAR:** (1) painel de propriedades **contextual** que muda com a selecao (Dashboard/Secao/Aba/Visual); (2) **Outline** em arvore com busca como navegacao da pagina; (3) alternancia **Layout: Auto | Custom** por secao com aviso quando o modo automatico gerencia tamanhos; (4) botoes de adicionar visual/grupo no fim da secao; (5) "Show/hide rules" por regra (condicional por intervalo ou variavel); (6) toolbar de edicao com Salvar (split button) e Sair da edicao claros; (7) coluna de icones estreita para trocar de painel (config, JSON, outline).

**NÃO COPIAR:** Branding, o laranja (aba/foco) e o azul do botao Save; o icone de "JSON model" (nao e relevante para publico de negocio); o fato de que a edicao compartilha a barra de variaveis do dashboard em modo edicao; nomes "Dynamic dashboards", "Content outline", "Auto-grid". Nao copiar a ausencia de multi-selecao/alinhamento fino (o Grafana prioriza grid de 24 colunas).

**APLICAÇÃO NO NOSSO PRODUTO:** Nosso editor pode ter a lateral direita como "painel de propriedades contextual" que varia: Pagina, Secao, Visual. Uma aba/icone "Estrutura" abre uma arvore (pagina > secao > visual) com busca, equivalente ao Content outline e a Selection pane do Power BI. O alternador "Automatico | Livre" por secao e uma boa estrategia para equilibrar produtividade (grid automatico) e controle (posicionamento livre) em dashboards. Selecao com contorno tracejado azul-claro e alca de redimensionamento e visualmente leve.

---

### REF-17 — Grafana / Novo query editor (v13.1): lista de Queries & Expressions + Transformations + editor

**IMAGENS:**
1. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-imagemap-v13.1.png — alt: "An annotated image of the Grafana panel query editor" — HTTP 200 image/png (2484x888) — Grafana v13.1. Inspecao visual feita.
2. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-v13.1.png — alt: "The Prometheus query editor" — HTTP 200 image/png — verificado por HEAD; nao inspecionado visualmente.
3. https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-stacked-view-v13.1.png — alt: "Query editor in stacked view" — HTTP 200 image/png — verificado por HEAD; nao inspecionado visualmente.

**Pré-visualização (hotlink das imagens oficiais acima):**

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-imagemap-v13.1.png)

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-v13.1.png)

![ref](https://grafana.com/media/docs/grafana/panels-visualizations/screenshot-query-editor-stacked-view-v13.1.png)

**FONTE:** https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/ (doc oficial).

**CONTEXTO:** No Grafana v13.1 o query editor foi redesenhado: coluna esquerda estreita com abas "Data | Alerts (0)", secoes colapsaveis **Queries & Expressions (+)** e **Transformations (+)**, cada item como cartao-lista (A, B = queries Prometheus; C, D = expressoes/Join by field, Labels to fields) e rodape "6 items · Select… · olho 6 · olho cortado 0". A area direita mostra o editor do item selecionado.

**OBSERVAR:**
- Lista mestre-detalhe: itens A/B/C/D com icone do tipo de fonte (chama do Prometheus, grade para expressao) e **barra colorida na borda esquerda** (laranja = query, roxo = expressao, verde = transformacao); item ativo tem contorno laranja.
- Cabecalho do editor: icone do data source, nome com caret, nome da query ("A" + lapis para renomear), acoes Replace/Save/olho/lixeira/menu "⋮".
- Botao "Query with Assistant" (assistente de IA) ao lado do toggle Explain e do "Run queries"; segmentado Builder | Code.
- Rodape fixo de metadados: "Query options ▾ · Max data points 615 · Min interval No limit · Interval 30s · Relative time 1h · Time shift 1…" e "Inspect queries".
- Rodape da lista: contagem de itens, "Select…", contadores de visiveis/ocultos.
- Icone de "expandir/recolher" no canto superior esquerdo para maximizar o editor.

**APROVEITAR:** (1) estrutura mestre-detalhe para cadeias de passos (Fonte → Transformacoes → Medidas calculadas); (2) barra colorida na borda esquerda para tipo de item, em vez de icone grande; (3) contadores de visivel/oculto no rodape de lista; (4) metadados de execucao resumidos num rodape fixo; (5) acao de IA como botao secundario junto do editor, nao como painel separado.

**NÃO COPIAR:** Fluxos de queries Prometheus/PromQL, conceito de expressoes; as cores laranja/roxo/verde das bordas; o icone de Assistente. Nao copiar a densidade tecnica de "Max data points/Min interval", irrelevante para BI de negocio.

**APLICAÇÃO NO NOSSO PRODUTO:** Se o produto tiver uma etapa de preparacao de dados/medidas por visual (ex.: "Modelo de dados" ou "Medidas rapidas"), pode adotar uma lista de itens (Consulta, Transformacao, Medida) a esquerda e o editor a direita, com contagem visivel/oculto e um rodape de metadados (linhas, tempo de execucao). Este e um padrao mais util para uma tela dedicada de dados do que para o painel de formato.


---

## 06 — Padrões recorrentes (análise visual)

Estimativas de densidade abaixo vêm de screenshots em escala variável; tratar como **ordem de grandeza**.

### 06.01 Densidade

| Aspecto | Power BI | Figma (UI3) | Tableau | Grafana |
|---|---|---|---|---|
| Altura de controle/input | ~28–32 px | ~24 px | ~24 px (shelves, pills) | ~28–32 px (segmented 1 px) |
| Altura de linha em árvore/lista | 24–28 px (campos) | 24–28 px (layers) | 24–30 px (cards) | ~24–28 px (outline) |
| Linha de seção/accordion | ~30–32 px | ~32 px (seção vazia = 1 linha + "+") | 1 linha por card | 1 linha com chevron |
| Fonte de corpo | 12–13 px | 11–12 px | 11–12 px | ~12 px |
| Largura de painel lateral | 240–270 px | ~240 px (ajustável) | ~190–200 px (Show Me) | options pane ~25% da tela; edit pane 360–420 px |
| Espaço entre seções | filete 1 px + 8–12 px | filete 1 px + 16–20 px | divisores finos | divisores finos |
| Quantidade visível | Muita, mas painéis recolhíveis | Muita; seções vazias colapsadas | Muita; toolbar sem rótulos | Muita; KPIs em faixa de 6–8 |
| Uso de painéis | Switcher vertical de ícones; vários abertos lado a lado | 3 docked fixos; UI minimizável (Cmd/Ctrl+Shift+\) | Sidebar em abas Dashboard/Layout | Edit pane contextual + coluna de ícones |

**Leitura:** a densidade nesses produtos **não** vem de fontes microscópicas, e sim de (1) altura de linha fixa e pequena, (2) alinhamento rígido a uma grade, (3) separação por filete/espaço em vez de moldura, (4) ações escondidas até hover/seleção, (5) seções vazias reduzidas a uma linha.

### 06.02 Layout

Padrão universal: **navegação à esquerda + canvas central + inspector contextual à direita**.
- Figma: Pages/Layers (esq.) → canvas → Design panel (dir.), toolbar flutuante curta na base.
- Power BI: rail de views (esq., ~48–60 px) → canvas → stack de painéis à direita (Filters / Build / Format / Data), abas de página no rodapé, status bar com zoom.
- Tableau: Data pane (esq.) + cards (Filters/Marks) → shelves no topo do canvas → abas de sheet no rodapé.
- Grafana: header + barra de contexto (variáveis + tempo) → conteúdo em seções colapsáveis → edit pane contextual + coluna de ícones à direita.

Variantes úteis: **painel colapsa para faixa vertical com rótulo girado** (Power BI); **painéis lado a lado** com switcher (Power BI); **UI inteira minimizável** (Figma); **canvas encolhe** em vez de ser coberto pelo edit pane (Grafana).

### 06.03 Hierarquia

1. O **canvas/conteúdo** é o elemento mais forte; a chrome é neutra e baixa em contraste.
2. **Cabeçalho do inspector nomeia o objeto selecionado** ("Frame ⌄", "Row", "Visual: <tipo>") — o usuário sempre sabe o que está editando.
3. **Títulos de seção** em peso médio, pequenos (11–13 px); títulos de painel levemente maiores (13–18 px). Nada de títulos gigantes.
4. **Labels** acima dos campos (Power BI) ou **ícone/letra dentro do campo** (Figma: X, Y, W, H).
5. **Metadata** (contagens, "Page 3 of 4", marcas, linhas) em cinza médio, fonte pequena, no rodapé ou ao lado do cabeçalho.
6. **Estados:** apenas o estado ativo/selecionado/foco recebe cor de destaque; Off = contorno cinza; **desabilitado = cinza claro, mas visível**.

### 06.04 Propriedades

Como dezenas de propriedades cabem sem dezenas de cards:
- **Uma única superfície** com seções separadas por filete de 1 px (Figma) ou accordion de dois níveis (Power BI: seção sem moldura → subcartões internos só quando há grupos de campos).
- **Toggle no cabeçalho da seção** (liga/desliga sem expandir) — Power BI.
- **Seções vazias = uma linha com "+"** — Figma.
- **Busca no topo** que filtra seções *e* propriedades — Power BI, Grafana.
- **Abas por escopo**, poucas: "Visual" (depende do tipo) vs "Geral" (comum a todos) — Power BI.
- **Resumo inline do que está recolhido** ("Legend: Auto · Format: Time series") — Grafana.
- **Contadores no cabeçalho** (Thresholds 2) — Grafana.
- **"Redefinir padrão" por seção** — Power BI.
- **Ícones com tooltip + opção "mostrar rótulos"** — Figma.
- **Atalho do canvas ao painel:** "Format <elemento>" no menu de contexto abre o painel já na seção correta — Power BI.

### 06.05 Canvas

- **Seleção:** contorno de 1 px + handles (4 em frames Figma; **8** nos visuais Power BI) + rótulo de dimensões compacto ("256 × 256").
- **Header do objeto:** 3 ações discretas no canto superior direito (filtro, focus, "…") visíveis em hover/seleção — Power BI.
- **Botões flutuantes ancorados** ao objeto (Build / Format) — Power BI on-object.
- **Mini-toolbar contextual** só com opções do elemento clicado (eixo, fatia, série) — Power BI.
- **Seleção sobreposta:** dropdown de elementos (Power BI), menu "Select layer" (Figma), **árvore** (Tableau Item hierarchy, Grafana Outline).
- **Guias e medição:** linhas e pílulas **transitórias** (somente durante a ação ou com modificador) — Figma. Snap com tecla para desligar.
- **Resize:** alças nos cantos/bordas; em grid, snap a colunas (Grafana grade de 24 colunas — estimativa visual).
- **Edição de múltiplos:** Format pane com "Size and position" para vários visuais (Power BI).
- **Rodapé do canvas:** abas de página + "+", status bar (zoom, fit, contagem de marcas/linhas e soma da seleção — Tableau).

### 06.06 Data Explorer

- **Árvore tabela → campos**, 2 níveis, com busca fixa no topo e rolagem independente.
- **Ícones de tipo curtos** (numérico Σ, medida, calculada fx, data, geográfico, ID) — e, no Tableau, **cor semântica** (azul discreto / verde contínuo; Dimensions acima, Measures abaixo de uma linha).
- **Checkbox para uso rápido** + arrastar para slot (Power BI); **badge "em uso" na tabela recolhida**.
- **Ações só em hover:** visibilidade, "…".
- **Hierarquias** com expansor próprio (data: Ano/Trimestre/Mês/Dia).
- **Modo modelo:** grupos com **contagem** (Measures (1.408), Tables (12)) + busca — Power BI Data pane (aba Model).
- **Banner de ajuda dispensável** em vez de modal.

### 06.07 Visualizações dentro do dashboard

- **Cartão padronizado:** título em duas linhas — **métrica em negrito + "by Dimensão" em cinza** — sobre fundo claro, sem sombra pesada; bordas alinhadas à grade com calhas constantes.
- **KPI card:** rótulo pequeno → valor grande (~28–36 px) → linha de variação com divisor.
- **Linha 1 KPIs → linha 2 gráficos → linha 3 matriz/detalhe** (resumo → detalhe).
- **Filtros globais concentrados** num cabeçalho de página (data, região) + botões segmentados "Breakdown by".
- **Paleta restrita:** neutros + 1–2 cores de dado; grid/eixos cinza muito leve; formatação condicional discreta em matrizes.
- **Interações aparecem só ao interagir:** tooltips ricos, botão "Details".

---

## 07 — Layout principles

1. **Canvas é soberano.** Chrome em tons neutros; painéis estreitos (≈ 240–270 px) e recolhíveis.
2. **Painéis docked, planos, coplanares.** Evite painéis flutuantes como estrutura (a Figma reverteu o design flutuante da UI3). Só a toolbar curta do canvas e popovers contextuais "flutuam".
3. **Esquerda = "o que existe" (páginas, estrutura, dados). Direita = "como está configurado" (propriedades do selecionado).** Centro = "onde acontece".
4. **Painéis combináveis:** permitir 2 painéis abertos lado a lado (Format + Build) via switcher vertical de ícones.
5. **Recolher sem perder a pista:** painel recolhido vira faixa vertical com rótulo e chevron; UI total minimizável.
6. **Rodapé útil:** abas de página + "+" + status bar (zoom, fit, contagens).
7. **Barra de contexto global sticky** para filtros/período/atualização no modo de leitura (Grafana).
8. **Largura ajustável** nos painéis; canvas encolhe em vez de ser coberto.
9. **Estados vazios acionáveis** (atalhos de fonte de dados, "+ adicionar visual") — não ilustrações grandes.
10. **Modos como trilho vertical estreito** (Report / Tabela / Modelo — Power BI) em vez de menus profundos.

## 08 — Density principles

1. **Linha fixa e pequena:** 24–32 px para controles/linhas; fonte 11–13 px.
2. **Separar por filete 1 px e espaço**, não por card/sombra. Fundo do painel único.
3. **Só o campo tem fundo** (cinza claro, sem borda no repouso, borda no foco) — Figma.
4. **Esconder ações até hover/seleção** (visibilidade, "…", remover).
5. **Colapsar o vazio:** seções não usadas ocupam uma linha.
6. **Mostrar resumo do recolhido** (valores atuais, contadores) para evitar abrir tudo.
7. **Ícones com tooltip** + toggle de rótulos para quem prefere texto.
8. **Tipografia curta de hierarquia:** 3–4 tamanhos no total; peso, não tamanho, diferencia níveis.
9. **Grade rígida:** alinhamento perfeito é o que torna a densidade "limpa" e não "confusa".
10. **Densidade configurável** (compacta/confortável) é boa ideia, mas o padrão deve ser o compacto.

## 09 — Canvas interaction principles

1. **Selecionar não pode destruir o dashboard:** contorno 1 px + handles pequenos; o resto da página permanece intocado.
2. **8 handles** para visuais livres; **snap a colunas** em grade.
3. **Header de objeto com no máximo 3 ações**; o resto vai em "…".
4. **Edição direta no objeto** (duplo clique, mini-toolbar do elemento) *e* edição no painel — sempre os dois caminhos.
5. **Dois botões flutuantes ancorados** (Dados / Formato) abrem popovers contextuais.
6. **Seleção sobreposta** resolvida por dropdown de elementos, menu "selecionar camada" e árvore de estrutura.
7. **Guias e distâncias transitórias,** com tecla modificadora e snap desligável; cor da guia ≠ cor da seleção.
8. **Rótulo de dimensões** compacto durante resize.
9. **Descer/subir hierarquia** (Enter / Shift+Enter) e seleção múltipla com "Tamanho e posição" compartilhado.
10. **Alinhar/distribuir** como ícones no inspector que só ativam com 1 (relativo ao pai) ou vários (entre si).
11. **Modo Auto × Livre por seção** (Grafana): automatização com escape para controle fino.
12. **Feedback de drop:** zonas tracejadas e contorno de destino durante o arraste.

## 10 — Inspector / Properties principles

1. **Cabeçalho = nome e tipo do objeto selecionado.**
2. **Busca fixa no topo.**
3. **Abas mínimas** (Visual | Geral).
4. **Seção = título + toggle + ações em ícone à direita;** conteúdo só ao expandir.
5. **Dois níveis no máximo** (seção → grupo). Subcartões só para grupos de campos relacionados.
6. **Campos:** label acima (ou ícone/letra embutida), input de largura total, pares em 2 colunas (W|H, mín|máx), numéricos com spinner e unidade, cor = swatch + chevron, slider pareado com valor numérico.
7. **Aceitar expressões** nos campos numéricos (ex.: `(100/4)+256`).
8. **"Redefinir padrão"** por seção.
9. **Desabilitado visível** + tooltip explicando o pré-requisito (não esconder).
10. **Mapeamento de dados e formato em painéis/abas separados.**
11. **Atalho de contexto:** "Formatar <elemento>" no canvas leva ao ponto exato.
12. **Contadores e resumos inline** nos cabeçalhos recolhidos.
13. **Modo "Builder | Código"** quando houver expressões (DAX/SQL).

## 11 — Data exploration principles

1. **Árvore tabela → campo**, busca fixa, rolagem independente.
2. **Tipos distintos por ícone *e* cor semântica** (dimensão × medida; discreto × contínuo).
3. **Uso por checkbox e por arraste**; menu de contexto como terceira via (acessível).
4. **Slots por papel + chips** (eixo, valor, legenda, tooltip, small multiples…), derivados do tipo de visual; chip com menu (agregação, formato, renomear) e remover; **agregação vive no chip**.
5. **Estado vazio do slot:** borda tracejada + instrução.
6. **Modo "sugerir"** (auto-atribuir papel) com opção de expandir em slots explícitos.
7. **Indicador "em uso"** visível mesmo com a tabela recolhida.
8. **Model view:** cards de tabela colapsáveis (cabeçalho + campos tipados + visibilidade), relações ortogonais com **1 / \*** nas pontas, indicador de direção do filtro no meio, linha **sólida = ativa / tracejada = inativa**, seleção destaca a linha, Properties contextual com "Aplicar alterações" explícito, **abas de diagramas** + "adicionar tabelas relacionadas".
9. **Árvore do modelo com contagens** (Tabelas, Medidas, Relações, Funções).
10. **Ver dados por trás do visual** (toggle "Table view" — Grafana).

---

## 12 — Component inventory

Derivado das referências (não é lista final). A coluna "Onde aparece" cita fichas.

### FOUNDATIONS
| Foundation | Observação derivada | Onde |
|---|---|---|
| Grid de layout do app | 3 zonas + rodapé; larguras de painel 240–270 px | 01, 08, 11, 14 |
| Grid de dashboard | 12/24 colunas, calhas constantes, snap | 07, 16 |
| Escala de espaçamento | passo pequeno (4/8) + filete 1 px | 03, 09 |
| Escala tipográfica | 3–4 tamanhos; peso diferencia | 03, 09 |
| Neutros de chrome | superfície única + cinza claro para campos | 08, 09 |
| Cor semântica | seleção, foco, dado, dimensão/medida, estado (On/Off/Desabilitado) | 03, 11 |
| Elevação mínima | só popovers/toolbar do canvas | 08, 02 |
| Ícones de linha monocromáticos | tooltip obrigatório; modo com rótulos | 09 |
| Estados | repouso, hover, foco, selecionado, desabilitado, arrastando, drop-target | 02, 05 |
| Atalhos de teclado | Enter/Shift+Enter, Alt (medição), Cmd/Ctrl+Shift+\ | 10, 08 |

### PRIMITIVES
Button (primário/secundário/ícone), IconButton, **SegmentedControl**, Input (texto/numérico com spinner e unidade/expressão), Select/Dropdown, **ColorSwatchPicker**, Slider + valor, Toggle (pílula On/Off), Checkbox, Tabs (sublinhado), **SearchField**, Tooltip, Popover, Menu / ContextMenu, Badge/Counter, Chip/Pill, Divider, Scrollbar fina, Banner dispensável.

### APPLICATION COMPONENTS
AppToolbar/Ribbon por grupos com legenda, ViewRail (modos), **Sidebar/Panel** (colapsável a faixa vertical, redimensionável), **PaneSwitcher** (trilho de ícones), **Inspector** (cabeçalho do objeto + busca + abas), **PropertySection** (título + toggle + ações + corpo), PropertyGroupCard, PropertyRow (label + input; par 2 colunas), **TreeView** (indentação, ícone de tipo, hover actions, seleção sincronizada), **PageTabs** (rodapé, "+", scroll), **StatusBar** (zoom, fit, contagens), CanvasFloatingToolbar, EmptyState acionável, ContextualMiniToolbar, ContextMenu, Breadcrumb/Title, **GlobalContextBar** (filtros + período + refresh + Share/Edit), Save split-button.

### BI-SPECIFIC COMPONENTS
| Componente | Descrição derivada das refs |
|---|---|
| **DashboardCanvas** | Grade pontilhada; página; zoom/fit; empty state; modo Auto/Livre por seção |
| **WidgetFrame** | Cartão padronizado: título métrica + "by dimensão"; header de 3 ações; contorno + 8 handles ao selecionar |
| **WidgetSelectionOverlay** | Bounding box, handles, rótulo de dimensões, guias/medidas transitórias |
| **WidgetFloatingActions** | Botões Dados / Formato ancorados + popover "Construir visual" |
| **VisualizationPicker** | Miniaturas com esmaecimento de incompatíveis, dica de requisitos, "Sugerir" |
| **FieldWell / FieldSlot** | Slot rotulado por papel, borda tracejada vazia, drop target |
| **FieldChip** | Nome truncado + menu (agregação/formato) + remover |
| **DatasetTree** | Tabela → campos, ícone de tipo, checkbox, badge "em uso", busca, contagens, hierarquia de data |
| **MetricItem / MeasureItem** | Medida com ícone próprio, display folders, ação em hover |
| **FieldTypeIcon** | Numérico, texto, data, medida, calculado, geográfico, ID, hierarquia |
| **FilterBuilder** | Seção "Filtros" (no visual / na página / em todas as páginas) com cartões de filtro |
| **SlicerControl / GlobalFilterBar** | Data, região, "Breakdown by" segmentado |
| **KpiCard** | Rótulo + valor grande + variação + (opcional) sparkline |
| **MatrixTable** | Totais em negrito, data bars/escala divergente discreta |
| **ModelEntityCard** | Cabeçalho + campos tipados + expandir/recolher + visibilidade |
| **ModelRelationship** | Linha ortogonal, 1/\*, direção de filtro, ativa/inativa, seleção |
| **ModelDiagramTabs** | Abas de diagramas + "Adicionar tabelas relacionadas" |
| **DashboardPageTab** | Aba de página no rodapé (ativa sublinhada), "+" fixo |
| **OutlineTree / SelectionPane** | Árvore página > seção > visual com busca e reordenação |
| **LayoutModeToggle** | Auto × Livre; Grade × Flutuante |
| **ShowDataToggle** | "Ver dados" (tabela) por trás do visual |
| **QueryItemList** *(opcional)* | Mestre-detalhe para Fonte → Transformação → Medida |

---

## 13 — Anti-patterns (WHAT NOT TO DO)

> Critério: ferramenta usada **horas por dia**, com **muita informação** e **manipulação direta**. Cada item explica o custo.

| # | Evitar | Por que prejudica uma ferramenta de BI |
|---|---|---|
| 1 | **"Card para tudo"** (cada seção/campo numa caixa com borda e sombra) | Multiplica bordas e padding; dobra a altura do painel; destrói o ritmo de leitura. As refs usam filete 1 px + espaço. |
| 2 | **Radius enorme** (16–24 px em tudo) | Desperdiça área em cantos, faz botões e campos parecerem brinquedos; cantos de 2–6 px são o padrão nos produtos maduros. |
| 3 | **Sombras excessivas / tudo "flutuando"** | Perde-se a noção de hierarquia (o que está acima do quê); poluição visual em tela cheia de widgets. Elevação só para popover/toolbar do canvas. |
| 4 | **Gradientes decorativos e glow** | Competem com o dado; reduzem contraste; cansam em uso prolongado; dificultam leitura de cor semântica. |
| 5 | **Baixa densidade / muito empty space** | Rolagem constante em painéis com dezenas de propriedades; o usuário perde o contexto. |
| 6 | **Títulos gigantes e cabeçalhos "hero"** | Em tela de trabalho, título não é conteúdo. Usar 11–16 px com peso. |
| 7 | **Controles gigantes (inputs 40–48 px, botões largos)** | Reduz o número de propriedades visíveis, aumenta movimento do mouse; 24–32 px basta. |
| 8 | **Propriedades espalhadas** (parte no canvas, parte em modal, parte em menu) | Usuário não sabe onde achar; use um inspector único + atalhos contextuais para ele. |
| 9 | **Excesso de modais** | Interrompem o fluxo e escondem o canvas. Prefira popover, painel e edição inline (Power BI "Edit relationship" é exceção, com alternativa inline). |
| 10 | **UI parecida com chatbot** (coluna central estreita, bolhas, input fixo em baixo) | Nosso produto é uma superfície de trabalho multi-painel, não um chat. |
| 11 | **Sparkles / ícones de IA em todo lugar** | Ruído e falsa promessa; se houver IA, um botão secundário discreto (ex.: "Sugerir") como no Show Me / Suggest a type. |
| 12 | **Visual "futurista" sem função** (neon, glassmorphism, partículas) | Reduz contraste, compromete acessibilidade e leitura de dados. |
| 13 | **Hover-only para ações críticas** | Ações secundárias podem ficar em hover; as primárias precisam estar visíveis ou ter atalho. |
| 14 | **Esconder o desabilitado** | Usuário não descobre recursos; mostre cinza + tooltip do pré-requisito. |
| 15 | **Seleção que "empurra" o layout** | A seleção deve sobrepor contorno/handles sem mudar tamanho do widget. |
| 16 | **Cor decorativa em chrome** | A cor deve significar algo (seleção, tipo de campo, estado). Só o dado recebe cor saturada. |
| 17 | **Ícones sem tooltip e sem opção de rótulo** | Ambiguidade; custo de aprendizado alto. |
| 18 | **Painéis flutuantes como estrutura** | Cobrem o canvas, geram arrasto/gerência de janelas; docked é melhor para sessões longas. |
| 19 | **Copiar a marca de uma referência** (amarelo PBI, azul Figma, laranja Grafana, pills Tableau) | O objetivo é aprender comportamento e criar identidade própria. |

---

## 14 — Reference matrix

| Referência | Produto | Principal aprendizado | Aplicação no nosso produto | Prioridade |
|---|---|---|---|---|
| REF-01 Report View | Power BI | Anatomia: ribbon por grupos + rail de modos + canvas + stack de painéis recolhíveis + abas de página + status bar | Esqueleto macro do editor de dashboard | ESSENCIAL |
| REF-02 Visual selecionado | Power BI | 8 handles, header de 3 ações, botões flutuantes Dados/Formato, mini-toolbar, dropdown de elementos | Overlay de seleção do WidgetFrame | ESSENCIAL |
| REF-03 Format pane | Power BI | Busca + abas Visual/Geral + accordion com toggle + subcartões + "Redefinir" + desabilitado visível | Inspector de propriedades | ESSENCIAL |
| REF-04 Data/Fields pane | Power BI | Árvore tabela→campo com checkbox, ícones de tipo, badge "em uso", hover actions, contagens | DatasetTree | ESSENCIAL |
| REF-05 Field wells | Power BI | Slots por papel + chips (agregação no chip) + modo "sugerir" | Data mapping do widget | ESSENCIAL |
| REF-06 Model View | Power BI | Cards de tabela, relações 1/\*, ativa/inativa, Properties contextual, abas de diagramas | Semantic Model Editor | ESSENCIAL |
| REF-07 Relatórios prontos | Power BI | Cartão métrica + "by dimensão", KPI cards, filtros no topo, paleta restrita | Padrão de resultado final dos widgets | IMPORTANTE |
| REF-08 Interface completa | Figma | Navigation → Canvas → Inspector; docked; UI minimizável | Validação do layout de 3 zonas | ESSENCIAL |
| REF-09 Properties Inspector | Figma | Seções sem cards, seções vazias = 1 linha + "+", campos 24 px, ícone embutido, pares 2 colunas | Densidade e compactação do inspector | ESSENCIAL |
| REF-10 Seleção/resize/alinhamento | Figma | Handles pequenos, rótulo de dimensões, medidas/guias transitórios, alinhar por contexto | Interação direta no canvas | IMPORTANTE |
| REF-11 Authoring workspace | Tableau | Pills com cor semântica, Dimensions × Measures, status bar de marcas | DatasetTree + tipos de campo | IMPORTANTE |
| REF-12 Dashboard authoring | Tableau | Biblioteca de objetos, Tiled/Floating, **Item hierarchy**, tamanho do dashboard | Árvore de estrutura + modos de layout | IMPORTANTE |
| REF-13 Marks / Show Me | Tableau | Slots de encoding, seletor de gráfico com requisitos, "Choose for me" | VisualizationPicker | COMPLEMENTAR |
| REF-14 Dashboard denso (view) | Grafana | Barra de contexto sticky, KPIs em faixa, seções colapsáveis | GlobalContextBar + modo leitura | IMPORTANTE |
| REF-15 Edit panel | Grafana | Preview + dados + options pane com busca/contadores/resumo inline; "Table view" | Editor de widget em tela cheia (se existir) | IMPORTANTE |
| REF-16 Edit mode contextual | Grafana | Edit pane que muda com seleção, **Outline**, Auto × Custom, regras de show/hide | Inspector contextual + estrutura + modos | IMPORTANTE |
| REF-17 Query editor v13.1 | Grafana | Mestre-detalhe, barra colorida de tipo, rodapé de metadados | Tela de preparação de dados/medidas | COMPLEMENTAR |

---

## 15 — Recomendações para o futuro agente de design

**Como usar este pacote**
1. **Leia primeiro as seções 07–11** (princípios) e depois as fichas para ver o princípio no contexto.
2. **Abra as imagens** das fichas ESSENCIAIS (REF-01 a 06, 08, 09). As imagens são hotlinks oficiais; se alguma quebrar, use a URL da FONTE.
3. **Em cada decisão de design, faça a pergunta:** *"Qual princípio de qual REF estou aplicando?"* Se a resposta for "copiei a aparência", refaça.
4. **Nunca importe cor, ícone, nome ou raio de borda de uma referência.** Derive tokens próprios (cor de seleção, cor de dado, cor de dimensão/medida, escala de raio e espaçamento).

**Ordem sugerida de trabalho (quando for projetar — não agora)**
1. Tokens/foundations (grid, tipografia curta, neutros, raios 2–6 px, elevação mínima, estados).
2. Shell do editor (3 zonas + rodapé + rail de modos) — REF-01/08.
3. Inspector (REF-03/09) e DatasetTree + FieldWells (REF-04/05/11).
4. Overlay de seleção do widget (REF-02/10) e árvore de estrutura (REF-12/16).
5. Resultado final do dashboard e KPI/Matriz (REF-07).
6. Semantic Model Editor (REF-06).
7. Modo leitura com barra de contexto (REF-14).

**Decisões que dependem do produto (perguntar ao time de produto antes)**
- Tema claro, escuro ou ambos? (Power BI = claro; Grafana = escuro por padrão.)
- Grade do dashboard: 12 ou 24 colunas? Livre, grade, ou Auto × Livre por seção?
- Vamos ter DAX/expressões? (Se sim, modo Builder | Código.)
- Haverá "sugestão de visual" por IA? (Se sim: botão discreto, sem sparkles.)
- Modo leitura com tempo real/auto-refresh é requisito?
- Densidade padrão: compacta (24–28 px) com opção confortável?

**Riscos a evitar**
- Misturar referências de produtos de consumo (chat, notas, landing pages): foram propositalmente excluídas.
- Reproduzir visual de screenshot de marketing (por exemplo, fundos coloridos da imagem do blog da Figma): usar só a estrutura.
- Tratar as medidas deste documento como regra: são estimativas; calibrar no protótipo.

---

## Apêndice A — Status de verificação e limitações

- **Verificação:** todas as URLs de imagem listadas em IMAGENS passaram `HEAD`/`GET` com HTTP 200 e `image/*` (exceção anotada: `field-list-01b.png`, em que `HEAD -L` devolveu `text/html` mas o GET retorna `image/png`; as imagens do blog Grafana foram obtidas via WebFetch e confirmadas por HEAD). Onde a ficha diz "inspecionada", a descrição vem da imagem; onde diz "só alt/doc", vem da documentação.
- **Não verificados (403 para automação):** `powerbi.microsoft.com/en-us/blog/on-object-public-preview-opt-in/`, `powerbi.microsoft.com/en-us/blog/introducing-the-new-format-pane-preview/`, `community.fabric.microsoft.com/...power-bi-september-2026-feature-summary...`, `grafana.com/blog/dynamic-dashboards-grafana-12/` (imagens extraídas via WebFetch). Podem ser abertos manualmente no navegador para screenshots ainda mais recentes.
- **Tableau:** imagens da UI clássica (~2019–2022); a UI "on-object" 2024/2025 não foi capturada.
- **Figma:** a documentação 2026 já descreve nova *navigation bar* vertical; só há wireframes abstratos dela. Imagem de smart guide durante arraste: não encontrada.
- **Imagens de versões anteriores usadas só para comportamento:** Power BI REF-01 #1/#2, REF-03 #3/#4, REF-04 #1, REF-06 #2, REF-02 #4.
- **Dashboard denso ao vivo (Grafana):** link à demo pública oficial `play.grafana.org` (inspecionado em 2026-10-06); não é imagem estática.
- **Direitos:** as imagens são hotlinks para documentação/blog oficial, para estudo interno. Não redistribuir nem reutilizar em produto.

## Apêndice B — Links úteis adicionais por bloco (da pesquisa)


### Power BI (A: REF-01–04)

Todas as imagens abaixo foram testadas com HEAD (200, image/png) — salvo onde indicado.

Field wells / Build visual:
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visualization-field-manager-2.png` — "Screenshot of the Visualizations pane field wells." (268x1154) — VERIFICADA (HTTP/image/png; visualização apenas por alt, não aberta).
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visual-pane-icons.png` — "Screenshot of the visualizations in the Visualizations pane." — NÃO TESTADA com HEAD (apenas listada no HTML da página).
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-add-data.png` — "on-object Add data" (658x401) — VERIFICADA (200, image/png; baixada, não inspecionada por inteiro).
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiselect-suggest-type.png` — "multiselect in choosing fields" (420x480) — VERIFICADA (200, image/png).
- Correção: no REF-02 #4 e acima, a URL correta da imagem de painéis é `.../create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-panes-2.png` (verificada).
- Field wells aparecem também em REF-01 #1/#2 e em REF-03 #1 (`multiple-panes-pane-switcher.png`, wells com chip "campo + X + >" e botão "+Add data").

Model view:
- `https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-07.png` — Model view completo (inspecionada, ver REF-04 #3) — VERIFICADA.
- Páginas: https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-modeling-view (também `modeling-view-02..06.png`: ícone da view, "+" de novo diagrama, "Add related tables", storage mode — URLs listadas na página; não testadas individualmente).

Relatórios prontos / efeitos visuais:
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-visual-elements-for-reports/visual-elements-for-reports_01.png` — "sample Power BI Desktop report with enhanced visuals" (1439x651; relatório com wallpaper, cards KPI, combo, slider e bolhas, painéis recolhidos) — VERIFICADA (GET 200 image/png; inspecionada).
- `.../visual-elements-for-reports_05.png`, `_07.png`, `_08.png` — header do visual à direita do título / topo direito / embaixo (05 verificada 200 image/png; 07 e 08 listadas, não testadas).
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-overview-2.png` — relatório real em edição (REF-01).
- `https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-edit-title.png`, `on-object-empty-visual.png`, `on-object-format-color.png`, `change-page-type-help.png` — 200 image/png (verificadas por HEAD no caso de edit-title, empty-visual, format-color; change-page-type-help NÃO testada).

Páginas de doc úteis:
- https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-on-object-interaction — melhor fonte atual (25 imagens).
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-field-list — Fields list unificada (a/b imagens: original vs. nova; 20 imagens `field-list-NNa/b.png` — só 01a/01b/02b testadas).
- https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-format-pane-overview — texto do Format pane (sem `<img>` extraíveis por curl).
- https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-customize-title-background-and-legend — texto sobre Title/Background/Legend (sem `<img>` extraíveis).
- https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-view — Report view (imagens antigas, 2022-ish).

NÃO VERIFICADAS (403 para curl/WebFetch — só indicadas pelo WebSearch, imagens não extraídas):
- https://powerbi.microsoft.com/en-us/blog/on-object-public-preview-opt-in/ (blog oficial, on-object preview opt-in)
- https://powerbi.microsoft.com/en-us/blog/introducing-the-new-format-pane-preview/ (blog oficial, novo Format pane)
- https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-september-2026-feature-summary/5325831 (resumo de recursos; menciona refinamento do on-object: flyout Build abre só em "Add data")
- Sugestão: abrir esses blogs no browser (Chrome/pane) se forem necessárias screenshots mais novas (2024–2026) do Desktop.

### Power BI (B: REF-05–07)

Todas VERIFICADAS (HTTP 200, image/png no HEAD e GET) e as marcadas com (inspecionada) foram abertas com a ferramenta Read.

Report view / editor completo:
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-overview-2.png — "Screenshot of the report editor in Power BI Desktop." (2256x1374) — (inspecionada) Report view completo no Desktop: ribbon Home, painel Filters (cards "Category is (All)" etc., "Filters on this page / on all pages"), Visualizations (Build visual + Format, grid de ícones, wells Values/Drill through) e Fields (árvore de tabelas com busca), abas de página na base (Info / Overview / District Monthly Sales / New Stores) e barra de status com zoom. Fonte: https://learn.microsoft.com/en-us/power-bi/create-reports/service-the-report-editor-take-a-tour
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/desktop-report-view/report-view-blank-canvas.png — "Screenshot of Power BI Desktop in Report view with a blank canvas." (1919x1079) — não inspecionada visualmente (só HEAD/GET). Fonte: https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-report-view
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-report-editor-panes-2.png — "Screenshot of the Power BI report editor, highlighting a column chart." (1257x1100) — VERIFICADA (não inspecionada).

Format pane / Data pane:
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-visual-pane-format-2.png — "Screenshot of the Format visual pane in the report editor." (268x852) — VERIFICADA (não inspecionada). Fonte: página do report editor acima.
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/service-the-report-editor-take-a-tour/power-bi-fields-list-2.png — "Screenshot of the Fields pane with example selections." (269x1125) — VERIFICADA (não inspecionada).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/multiple-panes-pane-switcher.png — Format pane (Search + abas Visual/Properties + seções colapsáveis com toggles On/Off: Size and style, Title, X-axis, Y-axis, Legend...) ao lado de Build a visual (inspecionada; ver REF-05).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/mini-toolbar-shortcut-menu.png — "Screenshot showing mini-toolbar formatting options." (on-object, mini toolbar de formatação) — VERIFICADA (não inspecionada).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/power-bi-on-object-interaction/on-object-multiselect.png — "Screenshot showing formatting more than one visual at a time." — VERIFICADA (não inspecionada).

Small multiples / drill through:
- https://learn.microsoft.com/en-us/power-bi/visuals/media/power-bi-visualization-small-multiples/small-mulitple-sales-category-region.png — "Screenshot showing a stacked column chart for sales by product split into small multiples by country or region." (826x705) — VERIFICADA (não inspecionada). Fonte: https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-small-multiples

Relacionamentos / Model view:
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-create-and-manage-relationships/candmrel_create_compproj.png — "Screenshot of the Create relationship dialog box." (705x601) — VERIFICADA (não inspecionada). Fonte: https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-create-and-manage-relationships
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-04.png — "Screenshot of the Add related tables options after right clicking a table." (440x490) — VERIFICADA (não inspecionada). Fonte: https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-modeling-view
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-modeling-view/modeling-view-06.png — "Screenshot highlighting changing the Storage mode on multiple tables." (1531x780) — VERIFICADA (não inspecionada).
- https://learn.microsoft.com/en-us/power-bi/transform-model/media/desktop-relationship-view/model-view-02.png — "Screenshot of Model view after the update." (915x792) — VERIFICADA (não inspecionada).

Relatórios de exemplo (alternativas):
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/regional-sales.png — Regional Sales (Contoso, cabeçalho azul-marinho + abas de navegação, KPI cards com faixa superior, funil, matriz com data bars) — (inspecionada). Fonte: https://learn.microsoft.com/en-us/power-bi/create-reports/sample-datasets
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/revenue-opportunities.png — Revenue Opportunities (KPI cards, treemap, mapa, tooltip em página, barra de drill through "Select a State below to enable Drill through") — (inspecionada; paleta roxo/amarelo menos sóbria).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/adventureworks-sales.png, `employee-hiring-and-history.png` — VERIFICADAS (200, image/png); não inspecionadas (AdventureWorks usa tema escuro).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-procurement/procurement-dashboard.png — Dashboard do Service no estilo antigo (tiles com título MAIÚSCULO, valor grande, teal) — (inspecionada; versão antiga ~2016–2018).
- https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-datasets/sales-returns-sample-pbix.png — Sales & Returns no Desktop (inspecionada; decorativa, não recomendada).

Imagens NÃO usadas por falha na verificação de HEAD: `https://learn.microsoft.com/en-us/power-bi/create-reports/media/sample-tutorial-connect-to-the-samples/retail-report-overview.png` (HEAD retornou content-type text/html, GET retornou image/png; tratar como NÃO VERIFICADA estritamente).

### Figma

- https://help.figma.com/hc/en-us/articles/15297425105303 — Explore design files (visão geral: toolbar, sidebars, canvas).
- https://help.figma.com/hc/en-us/articles/360039831974 — Explore the navigation bar and left sidebar (UI mais recente).
- https://help.figma.com/hc/en-us/articles/360039832014 — Design, prototype, and explore layer properties in the right sidebar (Property labels).
- https://help.figma.com/hc/en-us/articles/360041064174 — Access design tools from the toolbar (imagem de toolbar: https://help.figma.com/hc/article_attachments/33673944882583, alt "Figma toolbar showing icons for Move, Frame, Shape, Pen, Text, Comments, Actions menu and mode switcher", não inspecionada).
- https://help.figma.com/hc/en-us/articles/360040449873 — Select layers and objects.
- https://help.figma.com/hc/en-us/articles/360039956914 — Adjust alignment, rotation, position, and dimensions (Snap to objects, distribute, tidy up).
- https://help.figma.com/hc/en-us/articles/360039956974 — Measure distances between layers.
- https://help.figma.com/hc/en-us/articles/360040451453 — Scale layers while maintaining proportions.
- https://help.figma.com/hc/en-us/articles/360039957734 — Apply constraints to define how layers resize.
- https://www.figma.com/blog/our-approach-to-designing-ui3/ — Figma on Figma: Our approach to designing UI3.
- https://www.figma.com/blog/behind-our-redesign-ui3/ — Inside the redesigned Figma, where your work takes center stage.
- https://www.figma.com/blog/config-2024-recap/ — Config 2024 recap (anúncio da UI3).

### Tableau / Grafana

- Tableau workspace: https://help.tableau.com/current/pro/desktop/en-us/environ_workspace.htm
- Tableau dashboard layout (containers, tiled/floating, item hierarchy): https://help.tableau.com/current/pro/desktop/en-us/dashboards_organize_floatingandtiled.htm
- Tableau dashboard best practices: https://help.tableau.com/current/pro/desktop/en-us/dashboards_best_practices.htm
- Tableau Show Me: https://help.tableau.com/current/pro/desktop/en-us/buildauto_showme.htm
- Tableau shelves/cards reference: https://help.tableau.com/current/pro/desktop/en-us/buildmanual_shelves.htm
- Tableau tipos e papeis de campo (discreto/continuo, dimension/measure): https://help.tableau.com/current/pro/desktop/en-us/datafields_typesandroles.htm
- Grafana panel editor: https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-editor-overview/
- Grafana query & transform data: https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/
- Grafana create dashboard (edit mode, sidebar, outline, auto layout): https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/
- Grafana dashboard groupings (rows/tabs): https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard/dashboard-groupings/
- Grafana variables: https://grafana.com/docs/grafana/latest/visualizations/dashboards/variables/ (imagens: https://grafana.com/media/docs/grafana/dashboards/screenshot-selected-variables-v12.png e https://grafana.com/media/docs/grafana/dashboards/screenshot-template-query-v12.1.png, ambas HTTP 200 image/png, nao inspecionadas visualmente)
- Grafana use dashboards (time picker, refresh): https://grafana.com/docs/grafana/latest/visualizations/dashboards/use-dashboards/
- Grafana blog dynamic dashboards: https://grafana.com/blog/dynamic-dashboards-grafana-12/ (403 para curl; abre no navegador)
- Grafana "What's new" GA de dynamic dashboards: https://grafana.com/whats-new/2026-04-08-dynamic-dashboards-is-now-generally-available/
- Demo publica Grafana (play): https://play.grafana.org e https://play.grafana.org/d/appenv-banking-exec-overview/banking-executive-overview (dashboard de BI "executive overview")
- API publica da demo para listar dashboards: https://play.grafana.org/api/search?type=dash-db
