# GlobalContextBar

Barra sticky no topo do dashboard em modo leitura com período, filtros globais (FilterChip), estado de conexão e atualizar; o consumidor fornece os filtros, seus valores e o estado da fonte.

- Usa tokens runtime (pertence ao dashboard e acompanha o tema dele e o do host no embed).
- FilterChip ativo: borda em `viz-cat-1`, valores em negrito e botão de remover; inativo mostra "Todas".
- Indicador "Ao vivo" com ponto `dash-positive` + palavra; em resync, "Reconectando…" com `warning`.
- Fica fixo ao rolar; KPIs vêm logo abaixo, em faixa.
