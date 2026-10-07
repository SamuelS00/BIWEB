# WidgetFrame

Moldura de todo widget no dashboard (runtime) e, no Builder, a sobreposição de seleção (app); o consumidor fornece o título (métrica), o subtítulo (por dimensão · período), o conteúdo do plugin e até 3 ações.

- Dentro da moldura só tokens runtime: `dash-widget-surface`, `dash-widget-border`, `dash-title`, `dash-subtitle`, `viz-*`. Sem sombra; raio `radius-sm`.
- Título em duas linhas: `widget-title` + `widget-subtitle`. Ações (filtros do visual, tela cheia, "…") aparecem em hover, foco e seleção.
- Seleção (tokens app): contorno de 1 px em `selection` desenhado por fora, 8 handles de `handle-size`, rótulo de dimensões em colunas e pixels; nada se desloca ao selecionar.
- Mini-toolbar ancorada (`shadow-toolbar`) com Dados, "Formatar <elemento clicado>" e "…" — evita ir ao Inspector para operações frequentes.
- O menu "…" sempre oferece "Ver como tabela"; cada plugin expõe `ariaSummary` como `aria-label` do gráfico.
