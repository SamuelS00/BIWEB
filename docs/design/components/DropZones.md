# DropZones

Indicadores de destino durante o arrasto no canvas, um por estratégia de container; o consumidor (camada de overlays do Builder) fornece a estratégia, a posição calculada e a validade do destino.

- Grade: células tracejadas `border-default` aparecem só durante o arrasto; o destino é um retângulo `drop-target` com o tamanho em colunas.
- Pilha: linha de inserção de 2 px em `drop-target` entre irmãos.
- Livre: posição absoluta com guias `guide` e coordenadas; limitado ao container.
- Abas: "+ Nova aba" sublinhado em `drop-target`.
- Destino inválido: cursor de bloqueio e contorno `danger` com o motivo em tooltip.
