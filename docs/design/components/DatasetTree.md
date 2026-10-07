# DatasetTree

Árvore do modelo semântico no painel Dados (FieldItem + FieldTypeIcon); o consumidor fornece o modelo (entidades, dimensões, medidas, métricas, hierarquias, campos calculados), o estado de uso e a busca.

- Métricas publicadas no topo; depois entidades com contagem de campos.
- Cada campo: glifo de tipo com cor `field-*` (Aa dimensão, calendário data, Σ medida, ◆ métrica, pino geo, fx calculado, ⋮⋮ hierarquia) + nome.
- Ponto `accent` = "em uso" neste dashboard, mostrado também na entidade recolhida.
- Selos: Certificado (✓), Rascunho, PII (cadeado; mascarado para leitores), Depreciado (riscado + aviso; tooltip com substituto e dependentes).
- Busca por nome e por sinônimo, indicando o sinônimo encontrado ("= faturamento").
- Arraste um campo para um FieldWell ou para o canvas; Enter adiciona ao widget selecionado.
