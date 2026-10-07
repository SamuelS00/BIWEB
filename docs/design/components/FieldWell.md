# FieldWell

Slots por papel (encodings) na aba Dados do Inspector, com FieldChips; o consumidor fornece os papéis declarados pelo plugin (rótulo, tipos aceitos, obrigatório, cardinalidade) e os campos atribuídos.

- Slot vazio: borda tracejada `border-control` + instrução do que aceita. Durante o arrasto de um campo compatível: `drop-target` + "Solte para adicionar…"; incompatível ou sem permissão: `danger` + motivo.
- Chip: glifo de tipo, nome, modificador, menu e remover (24 px cada).
- **Métricas não oferecem agregação**: o menu do chip lista só modificadores (YTD, QTD, MTD, vs período anterior, acumulado, % do total), formato, renomear e "mostrar como". Agregação livre existe só para campos brutos.
- Arraste entre slots para trocar o papel; Delete remove o chip em foco.
