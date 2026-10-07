# ADR-0008 — BEL: linguagem de expressões única, em Rust, compartilhada via WASM

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [11 §14.3](../11-semantic-layer.md), ADR-0014

## Context
Campos calculados, measures, filtros, políticas RLS, formatação condicional e transformações precisam de uma linguagem de expressões tipada, portátil entre dialetos e com feedback instantâneo no editor.

## Decision
- **BEL** (BI Expression Language): sintaxe estilo fórmula (`[campo]`, funções, `@user.*`, `@param.*`), tipada, com LOD (`{FIXED ...}`), compilada para expressões DataFusion → dialeto.
- Implementação única em Rust (crate `semantic`), exposta ao browser via WASM (diagnósticos, autocomplete, tipo do resultado) e ao Node via WASM quando útil.
- Funções por allowlist; `RAW_SQL` apenas para modeladores, auditado e marcado não portátil.

## Alternatives
SQL bruto; DAX-like; expressões JS; Vega expressions; múltiplos parsers por ambiente.

## Advantages
Uma gramática, zero divergência; portabilidade; segurança.

## Disadvantages
Linguagem própria exige documentação e aprendizado; tamanho do WASM.

## Risks
Escopo da linguagem crescer demais → biblioteca de funções versionada e testes de compatibilidade.

## Consequences
Editor de expressões (CodeMirror 6) depende do `semantic.wasm`; fuzzing do parser no CI.
