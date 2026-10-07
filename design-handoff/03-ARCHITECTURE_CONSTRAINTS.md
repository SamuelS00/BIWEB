# 03 — RESTRIÇÕES DA ARQUITETURA (o que o design não pode contradizer)

> Síntese de `docs/architecture/04-frontend-architecture.md`, `06-dashboard-builder.md` e `adr/ADR-0032-design-system.md`. Leia isto em vez dos originais; se precisar de detalhe, os originais mandam.
> Status dos ADRs: **Proposto** (2026-10-06). Onde algo for ambíguo, registre em `09-decisions-and-open-questions.md` em vez de decidir sozinho.

## 1. Superfícies do produto
| Superfície | Tokens que usa |
|---|---|
| Application UI (home, dados, modelos, admin) | tokens **app** + componentes `ui` |
| Dashboard Builder | tokens **app** no chrome do editor + tokens **runtime** no canvas |
| Dashboard Runtime (viewer, fullscreen, apresentação) | tokens **runtime** (+ `ui` mínimos para controles de filtro, estilizados por runtime) |
| Embedded (iframe) | idem runtime; o host pode injetar tokens |
| Assistente de IA | tokens **app** (painel) + tokens **runtime** (mini-visualizações de evidência) |

**Regra:** tudo que está *dentro de um widget* usa tokens runtime. Seleção, handles, guias, painéis e toolbars usam tokens app. Cor não é hardcoded em plugin core.

## 2. Tokens
- Formato **W3C DTCG**; Style Dictionary gera CSS vars, TS e temas para ECharts/deck.gl.
- **Primitivos:** paleta, escala tipográfica, espaçamento (**base 4 px**), raios, sombras, durações.
- **Semânticos de app:** `surface.*`, `text.*`, `border.*`, `accent.*`, `danger.*`, `focus.ring`. O design acrescenta `selection.*` e `state.{success,warning,info}` (ver 01-BRIEF §6); não renomeie os da arquitetura.
- **Runtime (únicos que temas de dashboard e embeds sobrescrevem):** `dash.background`, `dash.widget.surface`, `dash.title.*`, `viz.palette.categorical[0..n]`, `viz.palette.sequential.*`, `viz.palette.diverging.*`, `viz.axis.*`, `viz.grid.*`, `viz.tooltip.*`.
- Tema do app: `data-theme="light|dark"` no root. **Dashboards têm tema próprio independente** (dashboard claro dentro de app escuro, e vice-versa; embed herda o tema escolhido pelo host).
- Paletas de visualização validadas para contraste (WCAG) e daltonismo; **paleta categórica distinta para escuro**.

## 3. Componentes e tecnologia (afeta o que é viável desenhar)
- **React Aria Components** (primitivas acessíveis, sem estilo próprio) + **Tailwind v4** + CSS variables. Cobrem Tree, Combobox, DatePicker, DataGrid leve, drag-and-drop acessível.
- `packages/ui` inclui: Button, Input, Select, Combobox, Dialog, Popover, Menu, Tabs, Tree, DataGrid leve, Toast, Tooltip, ColorPicker, **ExpressionEditor (CodeMirror 6 + BEL via WASM)**, **FieldPicker**, **Inspector forms gerados de JSON Schema**.
- i18n com ICU (strings externalizadas desde o início); RTL previsto.

## 4. Acessibilidade (meta WCAG 2.2 AA)
- Cada visualização expõe `ariaSummary` e **"ver como tabela"** (o runtime oferece alternativa tabular para qualquer widget com dados).
- Builder navegável por teclado: mover/redimensionar com setas (**1 unidade; 10 com Shift**), atalhos remapeáveis, ⌘K.
- axe e testes de teclado no CI.

## 5. Modelo de layout (06 §9.1–9.2)
Containers com estratégia:
| Estratégia | Comportamento | Uso |
|---|---|---|
| `grid` (**padrão da página**) | 12/24 colunas, linhas de altura fixa, compactação vertical opcional, colisão e reflow | 80% dos dashboards |
| `stack` | Auto-layout (direção, gap, alinhamento, wrap, grow/shrink) | Faixas de KPIs, barras de filtro |
| `free` | Posição absoluta, z-index, rotação, snap — **contido num container** | Relatórios pixel-perfect, sobreposição |
| `tabs` | Filhos como abas | Visões alternativas |

Breakpoints: `xl ≥1600`, `lg ≥1200` (**padrão**), `md ≥992`, `sm ≥768`, `xs <768`. Posicionamento é **por breakpoint**; ausência = derivação automática (abaixo de `sm`, empilha em ordem de leitura). O editor permite "editar layout para o breakpoint X" (override explícito), ocultar nós por breakpoint e pré-visualizar dispositivos. Constraints estilo Figma só dentro de `free` e em fase posterior.

## 6. Builder (06 §9.3–9.4)
- O **canvas renderiza o runtime real** (mesmos plugins e dados) com overlays por cima: seleção, handles, guias, medidas, drop zones. **Não existe preview separado.**
- Peças: Interaction Layer, Overlays, **Inspector** (forms gerados do JSON Schema do plugin + core, com hints `x-ui`: widget de cor, slider, field picker, seção, condição), **Layers/Component tree**, Paleta de widgets/templates/blocos, **Field picker** do modelo semântico, Command palette ⌘K, Clipboard.
- Funcionalidades: drag da paleta e entre containers; multi-seleção (Shift/Cmd-clique e marquee); alinhar/distribuir; agrupar/desagrupar; copiar/colar com remapeamento; z-index só em `free`; `locked`, `hidden[breakpoint]`, `visibleWhen`; undo/redo por transações; snapping por bordas/centros de irmãos + grade.
- **Edição de dados do widget:** field picker com **drag de campos semânticos para papéis (encodings)**; o plugin declara os papéis.
- Meta de performance: 60 fps em drag com 50 widgets.

## 7. Dados e modelo semântico (obrigatório)
- Dashboard = documento declarativo versionado. **Sem SQL no frontend**; o widget gera uma consulta semântica.
- Modelo: **Entidade** (com chave) → **Dimensões** (categorical, time com grains, geo, boolean, bucket), **Medidas** (com aditividade), **Métricas** (conceitos publicados, compostos de medidas/métricas), **Relações** (cardinalidade, direção, ativa/inativa), **Hierarquias**, **Parâmetros**, **Campos calculados (BEL)**, **Políticas** (RLS/CLS), metadata (rótulo, descrição, owners, formato, unidade, moeda, timezone, **sinônimos**, **classificação**: pública/interna/confidencial/restrita/PII).
- **"Revenue não é SUM(amount)":** o usuário arrasta uma métrica; não escolhe agregação livre nela. Modificadores de time intelligence (YTD, QTD, MTD, PoP, running total, % do total) são aplicáveis.
- Governança visível: certificação `draft → certified → deprecated`, owners, campos depreciados com substituto e dependentes, política opcional "dashboards publicados só usam métricas certificadas".

## 8. Ciclo de vida
- Dashboard: **draft → publicado**, com diff, rollback e revisões. Modelo semântico: rascunho com **análise de impacto** e **publicação humana** (inclusive quando a IA propõe).
- Modos de runtime: view, fullscreen, apresentação (páginas como slides, autoplay).
- Tempo real é previsto (fase posterior): indicador de conexão e resync.

## 9. IA (opcional, nativa — fase posterior, mas o design deve reservar espaço)
- Superfícies: **dock lateral** com chips de contexto; **ações inline** (menu do widget: Explicar, Melhorar, Trocar visualização; multi-seleção: Organizar; ponto de dados: Explicar variação); **⌘K** em linguagem natural; editores especializados (BEL, transformação, modelo); **estado vazio** "criar a partir de um objetivo".
- Propostas = **ChangeSets** com **preview no canvas** (widgets fantasmas = adição, destaque vermelho = remoção, handles de diff = alteração), aceitar/rejeitar **por item**. Aceitar = **1 passo de undo rotulado "IA: …"**. Nada da IA escreve direto no documento.
- Respostas analíticas trazem **evidências** (mini-visualizações renderizadas pelos mesmos plugins) e citam dados usados.
- Com IA desligada, **as superfícies de IA não aparecem** e o builder não muda de comportamento. Nenhum SDK de modelo no frontend.
- A IA usa tokens app/runtime existentes; **sem estética própria**.

## 10. Fora do escopo desta rodada de design
Plugins/SDK públicos, SQL API, multiplayer/presença, SCIM, BYOK, residência de dados. Reservar espaço no shell, sem desenhar.
