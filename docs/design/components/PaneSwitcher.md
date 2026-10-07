# PaneSwitcher

Coluna vertical de 44 px à direita que abre e fecha painéis docked (Dados, Formato, Estrutura, Filtros, Assistente); o consumidor fornece a lista de painéis e quais estão abertos.

- Vários painéis podem ficar abertos lado a lado; cada um empurra o canvas.
- Aberto = `accent-subtle` + marca de 2 px em `accent` na borda esquerda.
- O Assistente (IA) é só mais um painel; com a IA desligada o botão não existe.
- Todo botão tem tooltip; o menu de contexto oferece "Mostrar rótulos".
