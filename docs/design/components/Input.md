# Input

Campo de texto e numérico de 28 px; o consumidor fornece rótulo, valor, e opcionalmente prefixo (letra ou ícone), unidade, ajuda e erro.

- Numérico: valor em numerais tabulares, unidade à direita (`px`, `col`, `%`), setas ↑/↓ alteram 1 (Shift = 10), aceita expressão começando com `=`.
- `bw-input--quiet` (sem borda em repouso) só dentro do Inspector, onde a linha já delimita; fora dele use a borda `border-control`.
- Estados: `data-mixed` (multi-seleção com valores diferentes → "Misto"), `data-invalid` + `bw-help--error`, `data-disabled` com o motivo em tooltip.
- Pares (L | A, mín | máx) ficam em 2 colunas com `bw-prop-pair`.
