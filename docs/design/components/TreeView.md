# TreeView

Árvore hierárquica com linhas de 28 px (base de Outline, DatasetTree e lista de camadas); o consumidor fornece os nós, o nível, o estado expandido e a seleção.

- Recuo de `space-4` por nível; chevron de 12 px; nome com reticências.
- Selecionado em `accent-subtle`; oculto em `text-muted` com a razão ("oculto em sm").
- Ações (ocultar, travar, "…") aparecem em hover, em foco de teclado e na linha selecionada.
- Teclado: ↑/↓ navegam, ←/→ recolhem/expandem, Enter seleciona no canvas. Como Outline, resolve seleção de objetos sobrepostos e aninhados.
