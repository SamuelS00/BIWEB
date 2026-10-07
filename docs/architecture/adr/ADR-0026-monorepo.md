# ADR-0026 — Monorepo com pnpm + Turborepo + Cargo + just

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [25-repository](../25-repository.md)

## Context
Contratos compartilhados (schemas, proto, QDL, VizHost), código isomórfico TS e Rust→WASM tornam mudanças transversais frequentes.

## Decision
Monorepo único para a plataforma; pnpm workspaces + Turborepo (TS), Cargo workspace (Rust), `just` como task runner, `mise` para toolchains; repositórios separados apenas para espelhos públicos (SDKs, Helm) e plugins/conectores da comunidade. Fronteiras verificadas por lint; codegen verificado no CI.

## Alternatives
Multirepo; Nx; moon; Bazel/Buck2.

## Advantages
Mudanças atômicas em contratos; refactors baratos; visibilidade.

## Disadvantages
CI precisa de detecção de afetados e cache remoto.

## Risks
Crescimento do repo/CI → reavaliar Bazel/Buck2 com > ~100 engenheiros ou CI > 30 min com cache.

## Consequences
CODEOWNERS por contexto; Changesets para pacotes públicos.
