# ADR-0017 — Autorização com Cedar; RLS/CLS compiladas no plano lógico

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [17 §25](../17-security-and-permissions.md), ADR-0020

## Context
Precisamos de RBAC, object-level security com hierarquia, ABAC e políticas de dados (linhas/colunas) consistentes entre control plane (TS) e data plane (Rust), auditáveis e sem possibilidade de bypass por otimizações/cache.

## Decision
- **Cedar** para RBAC/OLS/ABAC, avaliado embarcado (Rust nativo; WASM/JS no Node); entidades e grants vindos do Postgres.
- **DataPolicy** (RLS por entidade, CLS deny/mask) definidas no modelo semântico em BEL e **injetadas no plano semântico antes da otimização**; fail-closed para atributos ausentes.
- Teste de propriedade: todo plano físico contém os predicados aplicáveis.

## Alternatives
OPA/Rego; OpenFGA/SpiceDB (Zanzibar); RLS nativa de cada banco; filtros aplicados no frontend; código ad hoc.

## Advantages
Linguagem legível e analisável; mesma avaliação nos dois planos; segurança que sobrevive a cache e pre-aggs.

## Disadvantages
Carregamento de entidades por request; modelagem de políticas exige cuidado.

## Risks
Grafo de compartilhamento muito grande → gatilho para Zanzibar.

## Consequences
Exports/alertas executam com o principal do destinatário; política faz parte do fingerprint de cache via SQL.

## Emenda 2026-10-06 — IA nativa
- Novo atributo de contexto `via` (`ui` | `api` | `assistant` | `embed`). Políticas podem restringir ações via assistente. Ações novas: `assistant:use`, `assistant:analyze`, `assistant:propose-model-change`, `assistant:propose-transformation`. Ver [ADR-0034](ADR-0034-ai-delegated-principal.md).
