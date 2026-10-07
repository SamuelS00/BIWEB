# 05 — CHECKLIST DE ACEITE (use durante o trabalho e na crítica final)

> Cada item é **binário**: passa ou não passa. Na `08-design-critique.md`, registre o resultado de cada grupo (✔ / ✘ + onde + correção). Itens ✘ devem ser corrigidos antes da entrega, ou listados como pendência com motivo.

## A. Identidade (anti-AI-slop)
- [ ] Nenhum gradiente decorativo, glow, neon ou glassmorphism em chrome ou widgets.
- [ ] Nenhum sparkle, robô, avatar de IA, ícone "mágico" ou área roxa/violeta de IA.
- [ ] A IA usa exatamente os mesmos tokens do resto do produto.
- [ ] Radius de controles e painéis entre 2 e 6 px; sem raios grandes.
- [ ] Sombra apenas em elementos sobrepostos (popover, menu, tooltip, dialog, toast, toolbar do canvas); painéis planos.
- [ ] Nenhum título maior que 16 px no chrome do app (painéis, toolbars, Inspector, listas); nenhuma seção "hero". O valor de KPI e o conteúdo de widgets seguem a escala runtime (`dash.*`) e ficam fora deste limite.
- [ ] Nenhuma tela parece landing page ou chat.
- [ ] A identidade aparece em **tipografia, proporção, grade, detalhes dos componentes de BI e estados**, não em decoração.
- [ ] Nenhum elemento copiado de Power BI, Figma, Tableau ou Grafana (cor, ícone, nome, forma característica).
- [ ] Cor saturada só em dado, seleção, foco e estados com significado.

## B. Densidade e hierarquia
- [ ] Linhas/inputs de **28 px** no padrão e **24 px** no modo compacto; nenhum controle comum acima de 32 px.
- [ ] 3–4 tamanhos de fonte no total; hierarquia por peso e cor, não por tamanho.
- [ ] No Builder em 1440×900, o canvas ocupa **≥ 55%** da largura com os dois painéis abertos.
- [ ] O Inspector mostra ≥ 12 propriedades sem rolagem em 900 px de altura.
- [ ] Separação por filete e espaço; **nenhum card por propriedade ou por seção**.
- [ ] Seções vazias ocupam 1 linha com "+".
- [ ] Ações secundárias aparecem em hover **e** foco de teclado; ações primárias nunca só em hover.
- [ ] Todo painel nomeia o objeto que está sendo editado.

## C. Sistema e consistência
- [ ] Nenhum valor de cor, espaçamento, raio, altura ou tamanho de ícone fora dos tokens.
- [ ] Todos os componentes das telas existem no catálogo `04-component-catalog.html` com variantes e estados.
- [ ] Tokens separados em **app** e **runtime**; nada do chrome vaza para dentro do widget.
- [ ] Claro e escuro funcionam; **tema do dashboard independente do tema do app** (demonstrado).
- [ ] Os mesmos componentes têm a mesma aparência em Builder, Viewer e Modelo.
- [ ] Estados definidos para todo controle: repouso, hover, foco, selecionado, desabilitado, erro, arrastando, drop-target.
- [ ] O desabilitado é visível e tem motivo em tooltip.

## D. Builder e interação
- [ ] Seleção: contorno 1 px + 8 handles + rótulo de dimensões + header de ≤ 3 ações; selecionar não altera o tamanho do widget.
- [ ] Guias e medidas são transitórias (durante a ação ou com modificador), em cor distinta da seleção.
- [ ] Existe o par on-object (mini-toolbar/botões ancorados) **e** o Inspector; operações frequentes **não** obrigam a ir de uma ponta à outra da tela.
- [ ] Árvore de estrutura permite selecionar objetos sobrepostos e aninhados.
- [ ] Multi-seleção mostra alinhar/distribuir e "Tamanho e posição" compartilhado; valores mistos indicados.
- [ ] Drop zones visíveis por estratégia de container (grid/stack/free/tabs).
- [ ] Seletor de breakpoint com indicação de **override** e de nó oculto no breakpoint.
- [ ] Estados vazios do canvas oferecem ações (inserir widget, conectar dados, criar a partir de objetivo se IA ativa).
- [ ] Zoom/fit e status bar (contagem da seleção) presentes.

## E. Dados e modelo
- [ ] Árvore de dados separa entidades, dimensões, medidas, métricas, hierarquias e campos calculados por ícone **e** cor semântica.
- [ ] Mostra certificação, depreciação (com substituto), classificação (PII) e "em uso" mesmo com a entidade recolhida.
- [ ] Busca encontra por nome e por **sinônimo**.
- [ ] Slots por papel + chips; vazio tracejado com instrução; campo incompatível sinalizado.
- [ ] **Métricas não oferecem agregação livre**; time intelligence aparece como modificador.
- [ ] Modelo semântico: relações com **1/\***, direção do filtro, ativa/inativa, seleção destacada, Properties contextual.
- [ ] Modelo tem barra Rascunho/Publicado e painel de **Impacto**; publicar exige confirmação humana.
- [ ] Revisões têm diff visual (mesma linguagem do preview de IA).
- [ ] Visualization Picker é compacto (miniaturas), com incompatíveis esmaecidos e dica de requisitos; **sem catálogo de cards grandes**.

## F. Viewer
- [ ] GlobalContextBar sticky com filtros, período e atualizar; filtros ativos removíveis.
- [ ] KPI = rótulo → valor → variação; título de widget "Métrica" + "by Dimensão".
- [ ] Cross-filter e drill demonstrados.
- [ ] Fullscreen/apresentação e indicador de conexão em tempo real.
- [ ] "Ver como tabela" em qualquer widget.

## G. Mapas
- [ ] Painel de camadas (MapLayerItem) com tipo, visibilidade e ordem.
- [ ] Configuração para marcadores, clusters, heatmap, polígonos e filtro geográfico; mesmos padrões do Inspector.

## H. IA
- [ ] Dock lateral é um painel do PaneSwitcher, não a tela principal.
- [ ] Chip de contexto discreto mostra o widget/seleção usado ("Contexto: Receita por mês").
- [ ] Resposta analítica traz evidência (mini-visualização com os mesmos plugins) e citação de dados.
- [ ] Proposta aparece como "Alteração proposta" com **Cancelar / Aplicar** e preview no canvas (fantasma, diff).
- [ ] Fluxo Sugerir → Pré-visualizar → Confirmar → Aplicar; **nada é reorganizado em silêncio**.
- [ ] Aplicar gera 1 passo de undo rotulado "IA: …".
- [ ] Modo "IA desligada" demonstrado: superfícies de IA ausentes, produto intacto.
- [ ] Aceitar/rejeitar por item funciona no protótipo.

## I. Acessibilidade e idioma
- [ ] Alvo mínimo 24×24 px; foco visível em todos os controles; ordem de tabulação coerente.
- [ ] Contraste de texto e de componentes conforme WCAG 2.2 AA nos dois temas.
- [ ] Paleta categórica distinguível por daltonismo; informação nunca só por cor.
- [ ] Atalhos de teclado do Builder documentados (setas 1/10 unidades, Enter/Shift+Enter, ⌘K).
- [ ] Conteúdo em pt-BR com formatos corretos; strings preparadas para i18n.

## J. Conteúdo
- [ ] Todos os dados vêm de `04-MOCK_DATA.md`; nenhum "Lorem ipsum", "Metric A", "Chart 1", "Item 1".
- [ ] Números fecham entre telas (KPIs, séries, regiões, categorias).

## K. Entrega
- [ ] Todos os 10 arquivos do contrato (BRIEF §12) foram gerados, ou a ausência está justificada.
- [ ] `05-screen-specs.md` cita REF-xx para cada decisão relevante.
- [ ] `09-decisions-and-open-questions.md` lista premissas e perguntas ao produto.
