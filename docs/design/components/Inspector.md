# Inspector

Painel de propriedades do objeto selecionado, composto por PropertySection e PropertyRow e gerado do JSON Schema do plugin; o consumidor fornece o objeto (tipo + nome), as abas e o schema com os hints `x-ui`.

- O cabeçalho nomeia o objeto: "Gráfico de barras · Receita por região". Com multi-seleção: "3 visuais" e valores "Misto".
- Busca fixa no topo; abas mínimas (Dados | Formato).
- Seções separadas por filete `border-subtle`, nunca cards. Cabeçalho: chevron + nome (`section-label`) + Switch opcional + ações em hover/foco (Redefinir).
- Recolhida, a seção mostra resumo inline ("Desligado") ou contador. Vazia, ocupa uma linha com "+".
- Linha de 28 px: rótulo de 76 px à esquerda, controle à direita; pares em 2 colunas.
- Em 900 px de altura mostra ≥ 12 propriedades sem rolagem.
- Hints `x-ui` necessários: `sectionToggle`, `default` (Redefinir), `keywords` (busca), `disabledReason`, `summary`, `pair`, `unit`, `expression`, `scope` (Visual | Geral).
