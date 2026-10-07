# ADR-0004 — Edição por comandos/operações invertíveis; CRDT adiado

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [05](../05-dashboard-engine.md), [21](../21-versioning-and-collaboration.md)

## Context
O builder precisa de undo/redo robusto, autosave, diff e, no futuro, colaboração simultânea. CRDTs (Yjs, Automerge, Loro) resolvem colaboração, mas impõem custos em validação de schema, migrations e persistência.

## Decision
- Todas as mudanças passam por **comandos** de domínio que geram **operações atômicas** (set/delete em caminhos do documento normalizado) com inversas.
- Undo/redo por transações; autosave por op-log; revisões nomeadas no salvar/publicar.
- **Sem CRDT na fundação.** Multiplayer futuro: servidor autoritativo com LWW por propriedade + fractional indexing (modelo Figma) para documentos estruturados; Yjs/Loro apenas para rich text.

## Alternatives
Snapshots completos para undo; Yjs desde o início; Automerge desde o início; OT.

## Advantages
Simplicidade agora; validação centralizada; caminho aberto para colaboração sem reescrita.

## Disadvantages
Colaboração offline robusta não será suportada sem CRDT completo.

## Risks
Se colaboração simultânea virar requisito de curto prazo, antecipar a Fase 7 do roadmap.

## Consequences
Comandos são a única via de mutação (lint/tests garantem); estado efêmero (seleção) fora do documento.

## Emenda 2026-10-06 — IA nativa
- **ChangeSet** passa a ser cidadão de primeira classe do `dashboard-core` (Fases 1–2): um conjunto de ops com base, aplicado como **uma transação de undo**, com camada de preview efêmera e rebase por entidade/propriedade. Também serve para templates, paste entre dashboards e importação. Transações carregam `ChangeOrigin`.
