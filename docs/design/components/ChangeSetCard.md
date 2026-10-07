# ChangeSetCard

Proposta da IA (ChangeSet) no painel Assistente, ligada à pré-visualização no canvas; o consumidor fornece o contexto, a lista de itens (adição `+`, alteração `~`, remoção `−`) e as ações.

- Título fixo "Alteração proposta"; cada item com operação, descrição e checkbox para aceitar/rejeitar por item.
- No canvas: adição = widget fantasma (`ghost-border` tracejado + `ghost-bg` + etiqueta "Proposto"); remoção = `danger-subtle` + contorno `danger`; alteração = handles de diff em `accent`.
- Sempre **Cancelar / Aplicar** em `control-lg`; o rótulo do primário diz quantos itens serão aplicados. Aplicar = 1 passo de undo "IA: …".
- Mesmos tokens do resto do app: sem roxo, gradiente, avatar ou ícone de IA. Chip de contexto discreto ("Contexto: Receita por mês").
- Com a IA desligada, este componente e o painel não aparecem.
