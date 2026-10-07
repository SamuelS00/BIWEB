# Dialog

Janela modal só para confirmações e decisões irreversíveis (publicar, excluir, descartar rascunho); o consumidor fornece título, corpo, ação primária e Cancelar.

- Nunca use Dialog para configuração: propriedades vão no Inspector.
- 400 px de largura (até 560 com tabela), `radius-md`, `shadow-popover`, véu `scrim`.
- O título diz a ação e o objeto ("Publicar modelo Vendas Varejo v13"); o botão primário repete o verbo. Esc e Cancelar fecham; o foco volta ao gatilho.
