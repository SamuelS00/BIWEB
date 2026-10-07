# ColorSwatchPicker

Popover de cor aberto a partir do swatch de uma PropertyRow; o consumidor fornece a paleta do tema do dashboard e o valor atual.

- Mostra primeiro as cores do tema (`viz-cat-*`, `viz-seq-*`), que acompanham troca de tema; uma cor fixa (hex) só via "Personalizada…" e fica marcada como fora do tema.
- Selecionado: anel de 2 px em `text-primary` com folga. Cada swatch tem nome acessível ("Série 1").
- Sempre mostre o nome da cor ao lado do swatch na PropertyRow.
