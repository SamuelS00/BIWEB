# Direções visuais

Três direções avaliadas antes de fixar os tokens. Todas cumprem as mesmas regras: densidade de 28/24 px, raio de 2 a 6 px, painéis planos e IA sem estética própria. O que muda entre elas é onde mora a personalidade. A escolhida é a **B · Grafite técnico**, que é a deste sistema.

## A · Papel analítico

- **Conceito:** um relatório impresso que virou ferramenta. Fundo quase branco e quente, filetes finos, tipografia de leitura.
- **Tipografia:** serifada humanista para títulos de widget e KPIs, sans neutra no chrome.
- **Superfícies e contraste:** chrome e canvas no mesmo papel; os painéis se separam só por filete. Contraste baixo entre zonas.
- **Densidade e bordas:** linhas de 28 px; raio de 2 px; nenhuma sombra, nem em popover (só filete).
- **Canvas e widgets:** widgets sem borda, separados por espaço; títulos editoriais.
- **Traço distintivo:** numerais serifados nos KPIs.
- **Prós:** ótima no Viewer e para apresentação (REF-07, REF-14).
- **Contras:** no Builder, a falta de contraste entre zonas dificulta saber onde termina o canvas e começa o painel (REF-08 pede três zonas legíveis). O tema escuro perde a identidade, e a serifa em 12 px numa matriz densa cansa.

## B · Grafite técnico (recomendada)

- **Conceito:** instrumento de precisão. Chrome em grafite neutro, um único acento cobalto, e cor saturada apenas no dado.
- **Tipografia:** IBM Plex Sans no chrome e nos widgets, com numerais tabulares; IBM Plex Mono para nomes técnicos e BEL.
- **Superfícies e contraste:** três níveis nítidos: `surface-app` (shell), `surface-panel` (painéis) e `surface-canvas` com grade pontilhada. O canvas fica visivelmente "abaixo" do chrome.
- **Densidade e bordas:** linhas de 28 px (24 no compacto); raio de 4 px nos controles e 6 px nos sobrepostos; sombra só em popover e mini-toolbar.
- **Canvas e widgets:** widgets com borda de 1 px e sem sombra; seleção cobalto com 8 handles; guias em magenta.
- **Traço distintivo:** os glifos de tipo de campo (Aa, Σ, ◆, fx) e a grade de pontos do canvas como assinatura, mais o rótulo de dimensões em colunas ("6 × 4 col").
- **Prós:** separa bem o chrome (tokens app) do conteúdo (tokens runtime), como pede a arquitetura. Funciona igual nos dois temas e aguenta as 8+ horas de uso.
- **Contras:** risco de parecer genérica. Por isso a identidade foi posta nos componentes de BI (FieldChip, seleção, KPI, diff) e não em decoração.
- **REF:** três zonas e canvas soberano (REF-01, REF-08); seções por filete (REF-03, REF-09); seleção discreta e guias transitórias (REF-02, REF-10); tipos de campo por ícone e cor (REF-04, REF-11); barra de contexto (REF-14).

## C · Console escuro

- **Conceito:** sala de monitoramento. Escuro como padrão, contraste alto e acento âmbar.
- **Tipografia:** sans condensada no chrome e mono nos números.
- **Superfícies e contraste:** chrome quase preto, widgets um degrau acima; o dado brilha sobre o fundo.
- **Densidade e bordas:** linhas de 24 px como padrão; raio de 2 px.
- **Canvas e widgets:** grade de painéis justapostos, sem gutter.
- **Traço distintivo:** o âmbar no foco e na seleção.
- **Prós:** excelente para tempo real e telas de operação (REF-14, REF-16).
- **Contras:** o âmbar se aproxima do laranja do Grafana (é cópia de marca, anti-pattern 19). Os 24 px como padrão violam a meta de 28 px, e o tema claro fica como segunda classe. Analistas que montam modelo e dashboard por horas preferem o claro.

## Por que B

O produto tem três usos com pesos diferentes: construir (Builder e Modelo), ler (Viewer) e incorporar (embed com tema do host). A B é a única das três que mantém a fronteira entre chrome e conteúdo visível em qualquer tema, condição para o tema do dashboard ser independente do tema do app. Também deixa a cor saturada exclusivamente para o dado (princípio 11 das referências). A e C ficam registradas como **temas de dashboard** possíveis (runtime), não como identidade do app: um tema "Papel" para relatórios e um "Console" para telas de operação podem ser criados só sobrescrevendo `dash-*` e `viz-*`.
