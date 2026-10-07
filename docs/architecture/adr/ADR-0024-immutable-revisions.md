# ADR-0024 — Versionamento por revisões imutáveis content-addressed com ponteiros draft/published

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [21](../21-versioning-and-collaboration.md)

## Context
Dashboards e modelos semânticos precisam de histórico, rollback, diff, auditoria, publicação controlada e, depois, change requests.

## Decision
- Revisões imutáveis (`parent_id`, hash SHA-256 do JSON canonicalizado RFC 8785) em tabelas relacionais (`jsonb`); ponteiros `draft`/`published` por objeto; rollback cria nova revisão.
- Diff estrutural por entidade; diff semântico + impact analysis para modelos.
- Branches/merge de três vias por entidade na Fase 7; Git sync opcional como espelho.

## Alternatives
Git interno; histórico por snapshots sem DAG; event sourcing completo.

## Advantages
Simples, consultável, multi-tenant, auditável; integridade verificável.

## Disadvantages
Armazenamento cresce (mitigado por dedupe por hash e compressão de jsonb).

## Risks
Revisões muito grandes → limites de tamanho de documento.

## Consequences
Exports/alertas registram revisões usadas (reprodutibilidade).

## Emenda 2026-10-06 — IA nativa
- Revisões registram a participação da IA (`origin` das transações agregadas). Publicação continua sempre humana.
