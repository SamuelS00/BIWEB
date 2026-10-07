# ADR-0020 — Cache multi-nível com fingerprint sobre o SQL pós-política

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [12 §20](../12-query-engine.md), ADR-0017

## Context
Cache é essencial para custo e latência, mas cache chaveado pelo request "cru" vaza dados entre usuários com RLS diferente.

## Decision
- Camadas: L1 browser (memória), L2 processo, L3 Valkey, L4 engine, L5 pre-aggs.
- `fingerprint = H(tenant, datasource, engine/dialeto, SQL compilado após injeção de políticas, parâmetros, dataVersion|refreshKey, opções de forma)`.
- Invalidação por versão de dados (import) e refresh key/TTL (live); single-flight contra stampede; stale-while-revalidate opcional.
- **Valkey** como implementação (licença BSD).

## Alternatives
Cache por QDL + usuário (sem compartilhamento); cache HTTP na borda; sem cache.

## Advantages
Seguro por construção e eficiente (usuários com mesma RLS efetiva compartilham).

## Disadvantages
Compilação necessária antes do lookup (overhead pequeno, ≤ 20 ms p95 alvo).

## Risks
Esquecer componente na chave → testes de propriedade de isolamento de cache.

## Consequences
Nenhum cache de resultados em CDN para dados privados; L1 nunca persistido por padrão.

## Emenda 2026-10-06 — IA nativa
- Consultas da IA (`run_query`, Insights) usam o **mesmo cache** (o fingerprint pós-política já isola por RLS). Respostas finais do modelo **não** são cacheadas entre usuários.
