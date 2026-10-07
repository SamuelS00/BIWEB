# BIWEB

Plataforma web de Business Intelligence. Monorepo conforme `docs/architecture/25-repository.md` e ADR-0026.

| Onde | O quê |
|---|---|
| `docs/architecture/` | Blueprint e ADRs (fonte das decisões) |
| `docs/design/` | Design system: guia da marca, direções visuais, componentes e protótipo navegável |
| `apps/web` | Application Shell (SPA) — Vite + React 19 + TanStack Router |
| `apps/control-plane` | Monolito modular TS (Fastify + Temporal) — esqueleto |
| `packages/tokens` | Tokens DTCG → CSS vars, TS, temas ECharts (Style Dictionary) |
| `packages/ui` | Design system em código — React Aria Components + Tailwind v4 |
| `packages/*` | Demais pacotes do frontend (dashboard-core, runtime, builder, viz-*, data-runtime…) — esqueletos com README e épico |
| `crates/` | Data plane em Rust (Cargo workspace) — esqueletos |
| `schemas/`, `proto/` | Contratos gerados e Protobuf |
| `testing/` | E2E (Playwright + axe), carga, correção de queries, corpus, AI evals |

## Começar
```bash
mise install          # node 22, pnpm 10, rust, just (ou instale manualmente)
pnpm install
pnpm dev              # http://localhost:5173
just check            # lint + fronteiras + typecheck + testes (TS e Rust)
```

## Regras que o CI verifica
- Fronteiras entre pacotes (`.dependency-cruiser.cjs`): `dashboard-core` sem React/DOM, runtime não importa builder, plugins só dependem do `viz-sdk`, nenhum pacote core importa IA, SDKs de modelo só no `model-gateway/adapters`.
- Tokens: nenhuma cor fora de `packages/tokens`; o Tailwind só conhece valores do design system; contraste WCAG 2.2 AA testado nos dois temas.

Material de entrada do design (pack de referências, catálogo de telas, handoff) continua em `design-handoff/` e nos `.md` da raiz.
