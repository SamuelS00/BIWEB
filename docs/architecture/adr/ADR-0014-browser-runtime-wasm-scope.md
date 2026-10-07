# ADR-0014 — Browser Data Runtime com worker pool; escopo restrito de WASM

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [13-browser-data-runtime](../13-browser-data-runtime.md), ADR-0008, ADR-0010

## Context
O browser precisa decodificar resultados, fazer computações locais rápidas e suportar datasets locais, sem bloquear a UI e sem transformar o cliente num warehouse.

## Decision
- Data Runtime fora do React: query manager (dedupe, prioridade, cancelamento), cache L1 em memória, **worker pool** com filas por prioridade e orçamento de memória.
- Caminho padrão: servidor agrega → Arrow → worker (JS) → `DataFrameView`.
- **WASM somente para:** compilador semântico/BEL (Rust), **DuckDB-WASM** (datasets locais, lazy), kernels geo (H3/PIP) — e outros apenas após profiling.
- Não depender de SharedArrayBuffer/threads (incompatível com embeds sem cross-origin isolation).

## Alternatives
Tudo no main thread; WASM generalizado para filtros/agregações; DataFusion-WASM como engine local; Arquero.

## Advantages
UI fluida; ganho real onde existe; código compartilhado com o servidor; datasets locais completos sem reinventar engine.

## Disadvantages
Downloads grandes quando DuckDB é necessário (mitigado por lazy loading).

## Risks
Limites de memória (wasm32/Safari) → orçamentos por dispositivo e fallback para servidor.

## Consequences
Benchmarks de decode/render no CI; regras de placement em [01 §57](../01-high-level-architecture.md#57-principio-de-processamento).
