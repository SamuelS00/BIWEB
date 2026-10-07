# MapLayerPanel

Painel de configuração do mapa com lista de camadas (MapLayerItem) e as propriedades da camada selecionada; o consumidor fornece as camadas (tipo, campo, visibilidade, ordem) e o schema de cada tipo.

- Tipos com glifo próprio: marcadores (com cluster), heatmap, polígonos/coroplético. A ordem da lista é a ordem de desenho (topo primeiro); arraste pela alça ⋮⋮.
- Visibilidade por camada com olho; camada oculta em `text-muted`.
- As propriedades usam os mesmos PropertySection/PropertyRow do Inspector; campos geográficos entram por FieldChip.
- Filtro geográfico: caixa (retângulo), estado (clique no polígono) ou raio; vira um FilterChip na GlobalContextBar.
