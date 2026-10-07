# ADR-0009 — ClickHouse como serving engine; Parquet em object storage como fonte da verdade

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [03-data-architecture](../03-data-architecture.md)

## Context
Dados importados (arquivos, APIs, OLTP) precisam ser servidos com latência interativa, alta concorrência, ingestão contínua e isolamento por tenant, a custo controlado, em SaaS e self-hosted.

## Decision
- **Parquet (ZSTD) em object storage** é a fonte da verdade dos datasets gerenciados, em snapshots imutáveis com manifesto no Postgres (semântica compatível com Iceberg; adoção de Iceberg decidida na Fase 3).
- **ClickHouse** é o engine de serving (importados, pre-aggs, realtime, telemetria): database por tenant, usuário/quotas/settings profile por tenant, publicação atômica de versões. ClickHouse Cloud no SaaS inicial; operador no self-hosted.
- Toda tabela de serving é **reconstruível** do curated.

## Alternatives
StarRocks, Druid, Pinot, DuckDB servidor, Trino sobre lake, Snowflake/BigQuery internos, Postgres (ver [03 §16](../03-data-architecture.md)).

## Advantages
Performance de agregação, ingestão contínua, funções geo/H3, controles de recursos nativos, opção gerenciada e self-hosted, licença Apache; DR e migração de tenants simplificados pela reconstruibilidade.

## Disadvantages
Joins grandes exigem cuidado; overhead com muitas tabelas pequenas; dois armazenamentos (Parquet + ClickHouse) a manter consistentes.

## Risks
R5 (muitos tenants/tabelas) → monitoramento de parts, tier DuckDB, evicção de inativos, clusters adicionais.

## Consequences
Pipeline sempre escreve Parquet antes do load; Query Engine trata ClickHouse como mais um dialeto (sem acoplamento).
**Revisitar** se workloads importados forem dominados por joins grandes (StarRocks) ou se BYO lakehouse for requisito (Iceberg + engine sobre lake).
