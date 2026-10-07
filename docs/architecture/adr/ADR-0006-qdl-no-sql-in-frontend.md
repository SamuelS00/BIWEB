# ADR-0006 — QDL semântica como contrato Frontend ↔ Query API (sem SQL no cliente)

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [12-query-engine](../12-query-engine.md), [schemas/query.ts](../schemas/query.ts)

## Context
SQL montado no frontend acopla UI a dialetos, impede segurança compilada, cache seguro e aggregate awareness, e expõe superfície de injeção.

## Decision
- Contrato `QueryRequest` (QDL v1): dimensions (com time grain e binning espacial), metrics (com modificadores), filtros em árvore, metric filters, parâmetros, ordenação, limite, totals, pivot, cálculos BEL, opções e contexto.
- Resposta: Arrow IPC (ou JSON) + `QueryResponseMeta`.
- Evolução: campos opcionais aditivos; `qdl: 2` para quebra; servidor suporta N e N-1.

## Alternatives
SQL no frontend; GraphQL sobre o modelo; MDX; Substrait como contrato público.

## Advantages
Desacoplamento total UI ↔ engines; segurança e cache no servidor; mesma QDL para dashboards, embeds, APIs, alertas e browser local (DuckDB-WASM).

## Disadvantages
Expressividade limitada pela QDL (mitigada por BEL e evolução do contrato).

## Risks
Pressão por "escape hatch" de SQL → apenas para modeladores, via datasets `kind: sql` auditados.

## Consequences
Dashboard Engine gera QDL a partir de bindings; Query Service rejeita qualquer outra entrada.

## Emenda 2026-10-06 — IA nativa
- A QDL é **o único caminho de dados da IA** (text-to-SQL rejeitado). `context.purpose` ganha `assistant` e `insight`, mais `conversationId`/`toolCallId`. `options.egress` limita o que volta a consumidores de IA.
