# ADR-0016 — Multi-tenancy com cells, tenant_id + Postgres RLS e isolamento por recurso

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [16-multi-tenancy](../16-multi-tenancy.md)

## Context
SaaS multi-tenant primeiro, com futuras exigências de clientes dedicados, residência de dados, private networking e self-hosted — sem bifurcar o código.

## Decision
- **Cells** desde o primeiro commit: Tenant Router global mapeia tenant → cell; cada cell é a stack completa. Dedicado = cell dedicada; self-hosted = cell instalada pelo cliente.
- Postgres compartilhado na cell com `tenant_id` em toda PK + **RLS** (`SET LOCAL app.tenant_id`); ClickHouse com database/usuário/quotas por tenant; S3 por prefixo (+ KMS por tenant no enterprise); cache, filas e realtime namespaced.
- Ferramenta de migração de tenant entre cells prevista.

## Alternatives
Database por tenant no Postgres; schema por tenant; tudo compartilhado sem RLS; deployment por cliente desde o início.

## Advantages
Blast radius limitado, escala por adição de cells, residência regional, mesmo artefato para todas as modalidades, defesa em profundidade.

## Disadvantages
Global plane adicional; operações cross-cell (analytics da plataforma) exigem agregação.

## Risks
Bug de isolamento → suíte automática cross-tenant em toda rota, registros-armadilha, revisão de segurança.

## Consequences
Nenhum código assume cell única; URLs e configs parametrizadas.

## Emenda 2026-10-06 — IA nativa
- Conversas, turnos e propostas com `tenant_id` + RLS. Quotas e metering de IA por tenant/usuário. **Roteamento regional de modelos conforme a cell** (residência). BYO model por tenant. O cache de prompt nunca mistura conteúdo de tenants.
