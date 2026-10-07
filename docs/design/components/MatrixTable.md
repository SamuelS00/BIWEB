# MatrixTable

Tabela e matriz (pivot) do runtime; o consumidor fornece linhas, colunas, valores, totais e regras de formatação condicional.

- Linhas de 24 px, numerais tabulares alinhados à direita, cabeçalho em `dash-subtitle`. Totais em negrito com filete acima.
- Formatação condicional discreta: barra de dados em `viz-seq-2` atrás do número ou texto `dash-negative` com seta. Nunca preencher a célula inteira com cor forte.
- Hierarquias expandem com chevron e recuo de `space-4`. É também a vista "Ver como tabela" de qualquer widget.
