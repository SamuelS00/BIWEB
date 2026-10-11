# @biweb/web

Application Shell (SPA) do BIWEB Studio: Vite + React 19 + TanStack Router + react-intl + Zustand, sobre `@biweb/ui`, `@biweb/tokens` e `@biweb/assistant-ui`.

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm --filter @biweb/web build:static   # build estático com rotas por # (prévias)
../../tools/deploy.sh                    # tipos + testes + página única do artifact
```

Tabela completa de rotas e mapa da arquitetura: [`docs/PROJETO.md`](../../docs/PROJETO.md) (seções 4 e 5). Em resumo:

| Área | Rotas | Pasta |
|---|---|---|
| Início, relatórios e editor | `/`, `/reports`, `/reports/:id`, `/reports/:id/edit` | `src/routes/`, `src/editor/` |
| Dados (Data Workspace) | `/data`, `/data/:section/:itemId`, `/connections` | `src/dataworkspace/` |
| Modelo semântico | `/models/:id` | `src/routes/model.tsx` |
| Mapas | `/maps`, `/maps/:mapId` | `src/routes/maps/` |
| Fluxos | `/workflows`, `/workflows/:id` | `src/routes/workflows/` |
| Migração | `/migration`, `/migration/:projectId` | `src/routes/migration/` |
| Copilot e login | `/copilot`, `/login` | `src/routes/copilot.tsx`, `src/routes/login/` |

**Idiomas:** pt-BR (padrão), en e es. Textos em `src/i18n/messages/` (um arquivo por domínio), formatação em `src/i18n/format.ts` e termos em `src/i18n/glossary.ts`. Regras em [`docs/PROJETO.md`](../../docs/PROJETO.md) §6.

O workspace usa tiles do OpenStreetMap como contexto cartográfico, com atribuição visível. Ativos, telemetria, fluxos e incidentes são simulados no cliente; o protótipo não requer backend.

⌘K abre a busca de relatórios e ações e permite perguntar ao Copilot. O Copilot usa um **motor de exemplo** (`src/copilot/engine.ts`) com respostas sobre os dados do Lume Varejo; em produção, a mesma interface fala com a Assistant API.

Dados em `src/fixtures/` vêm de `design-handoff/04-MOCK_DATA.md` (os relatórios adicionais e números de visualização são exemplos). Marca e capas em `public/brand` e `public/covers`.
