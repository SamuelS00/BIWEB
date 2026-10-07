# ModelEntityCard

Cartão de entidade no diagrama do modelo semântico, com ModelRelationship entre cartões; o consumidor fornece a entidade (chave, campos tipados, contagem) e as relações (cardinalidade, direção, ativa/inativa).

- Cabeçalho com nome e contagem; campos com glifo de tipo; "+ N campos" expande. Selecionado: contorno `selection`.
- Relações ortogonais com **1** e **\*** nas pontas e direção do filtro no meio. Ativa = linha sólida `text-secondary`; inativa = tracejada `text-muted` (ex.: Pedido → Calendário via `data_envio`); selecionada = 2 px em `selection`.
- O modelo tem barra Rascunho/Publicado; publicar abre o painel de Impacto e exige confirmação humana.
