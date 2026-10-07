# ADR-0035 — Mudanças da IA como ChangeSets (ops do Dashboard Engine) com preview, confirmação e rebase

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0002, ADR-0004, ADR-0024, [31 §8](../31-ai-assistant.md#8-ações-modelo-seguro-de-execução)

## Context
A IA precisa criar e alterar widgets, filtros, layouts, dashboards, métricas e transformações sem alterações acidentais ou destrutivas, sem agir sobre estado desatualizado, com undo e auditoria.

## Decision
- A IA produz **ChangeSets**: conjuntos de itens, cada um com **ops no formato do DocumentStore** (as mesmas usadas por comandos, undo e autosave), com `base` (revisão/draftVersion + entidades tocadas), `risk`, resultado de validação e `origin: assistant`.
- O **Proposal Service** simula o ChangeSet com `dashboard-core` (schema, referências, plugins, permissões) **antes** de mostrar.
- O cliente renderiza uma **camada de preview** (diff no canvas); o usuário aceita (tudo ou por item), rejeita ou pede ajuste. Aplicar gera **uma transação de undo**.
- **Estado obsoleto:** rebase por entidade/propriedade (mesma regra prevista para colaboração); conflito leva a regenerar.
- Autoaplicação apenas por opt-in do usuário, para risco `low`, no draft pessoal, sem remoções.
- Objetos governados (modelo semântico, pipelines): ChangeSet aplicado num **draft** do objeto, com impact analysis via lineage. **Publicação continua humana.**
- Ações **inexistentes** para a IA: publicar, apagar objetos publicados, compartilhar, conceder acesso, gerenciar conexões/credenciais.

## Alternatives
Execução direta com undo posterior; confirmação textual sem preview; IA gerando o documento inteiro.

## Advantages
Reaproveita undo/redo, autosave, diff e validação; fundação útil também para templates, paste entre dashboards, importação e colaboração.

## Disadvantages
Mais um conceito no `dashboard-core` (camada de proposta).

## Risks
Excesso de confirmações cansando o usuário → opt-in de autoaplicação para baixo risco e agrupamento por itens.

## Consequences
`dashboard-core` implementa ChangeSet como cidadão de primeira classe nas **Fases 1–2** (antes da IA); revisões e ops carregam `ChangeOrigin`.
