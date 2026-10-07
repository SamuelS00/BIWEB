# BreakpointSwitcher

Seletor de breakpoint no topo do canvas do Builder; o consumidor fornece os breakpoints, o atual e quais têm override.

- `lg` é o padrão. Ponto `warning` = há nós com layout próprio nesse breakpoint (tooltip com a contagem); sem marca = derivado automaticamente.
- Ao escolher um breakpoint diferente de `lg`, o canvas mostra a largura do dispositivo e um Banner "Editando layout para md · Voltar a derivar".
- Nós ocultos no breakpoint aparecem na TreeView com o ícone de olho cortado e "oculto em md".
