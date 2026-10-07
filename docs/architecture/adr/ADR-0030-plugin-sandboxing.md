# ADR-0030 — Sandboxing de plugins por tipo e nível de confiança

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [18-plugins](../18-plugins.md)

## Context
Plugins de terceiros (visualizações, conectores, UDFs, ações) executam código não confiável próximo a dados sensíveis.

## Decision
- Viz first-party/certificados in-page; terceiros em **iframe sandbox** (origem nula, CSP, dados via postMessage/transferables).
- UDFs/transformações e conectores leves como **WASM components** (wasmtime, fuel, limites de memória, sem rede/FS diretos).
- Conectores complexos em **containers** isolados com egress proxy e allowlist.
- Manifests assinados (cosign), permissões negadas por padrão e aprovadas por instalação, versões fixadas, kill switch.

## Alternatives
Tudo in-page/in-process; apenas plugins first-party; Web Workers como sandbox de UI (sem DOM).

## Advantages
Ecossistema aberto sem comprometer dados/tenants.

## Disadvantages
Overhead de iframes/containers; DX mais complexa.

## Risks
Escapes de sandbox → atualizações de runtime, pentests, princípio do menor privilégio.

## Consequences
Conformance kits por tipo de plugin no CI do registry.

## Emenda 2026-10-06 — IA nativa
- Plugins podem contribuir **ferramentas ao assistente** (`assistantTools`), executadas nos mesmos sandboxes, com permissões aprovadas pelo admin e apenas `read`/`propose` (Fase 5+).
