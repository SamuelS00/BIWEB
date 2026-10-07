# ADR-0010 — Apache Arrow como formato de dados ponta a ponta

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [13 §17.2](../13-browser-data-runtime.md)

## Context
Resultados trafegam entre conectores, engines, Query Service, cache, browser, workers e GPU. JSON é lento para parse, verboso e perde tipos.

## Decision
- Arrow RecordBatches internamente no data plane; **Arrow IPC stream** como formato padrão da Query API (JSON como alternativa para respostas pequenas e terceiros).
- Compressão via **Content-Encoding** HTTP (br/gzip; zstd quando suportado), não via compressão de buffers IPC.
- Browser: decode em worker, transferência por transferables; `DataFrameView` sobre typed arrays; atributos binários direto para deck.gl.
- Metadados de campo (papel, formato, unidade) no schema metadata do Arrow.

## Alternatives
JSON apenas; Protobuf/MessagePack; CSV; formatos próprios.

## Advantages
Menos bytes e CPU, tipos preservados, streaming, zero-copy entre threads e até a GPU, mesmo formato no cache.

## Disadvantages
Debug menos trivial; int64/decimal exigem cuidado em JS (BigInt).

## Risks
Bugs/limitações em decoders JS → benchmark Arrow JS vs Flechette na Fase 1 e testes de tipos.

## Consequences
Cache L3 armazena Arrow comprimido; plugins consomem `DataFrameView`, nunca JSON de linhas.
