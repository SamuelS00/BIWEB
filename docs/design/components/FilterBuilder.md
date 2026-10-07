# FilterBuilder

Construtor de condições para filtros de visual, página e dashboard; o consumidor fornece os campos do modelo, os operadores por tipo e as condições atuais.

- Cada linha: campo (com glifo de tipo) · operador · valor(es) · remover. Operadores dependem do tipo (texto: está em, contém; data: entre, últimos N; métrica: maior que, top N).
- Condições unidas por E; "Grupo OU" cria um bloco recuado. Rodapé com a contagem de linhas resultante.
- Filtros sobre métricas aplicam após a agregação e dizem isso no tooltip do operador.
- Vive no painel Filtros (docked), nunca em modal.
