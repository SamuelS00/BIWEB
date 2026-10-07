# @biweb/web

Application Shell (SPA) do BIWEB Studio: Vite + React 19 + TanStack Router + react-intl + Zustand, sobre `@biweb/ui`, `@biweb/tokens` e `@biweb/assistant-ui`.

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm --filter @biweb/web build:static   # build estático com rotas por # (prévias)
```

| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Início | Saudação, pulso do negócio (KPIs com sparkline), continue de onde parou, favoritos, Copilot, atividade e saúde dos dados |
| `/reports` | Relatórios | Catálogo com capas em grade ou lista; filtros por categoria, status e tipo; busca; ordenação; favoritos |
| `/reports/:id` | Relatório aberto | Cabeçalho com capa e metadados, barra de contexto, páginas, KPIs e gráficos de exemplo, filtro cruzado, ver como tabela, perguntar ao Copilot |
| `/reports/:id/edit` | Editor | Painéis Dados e Inspector; canvas via E2.4/E2.6. Carregado sob demanda |
| `/copilot` | Copilot | Conversa em tela cheia (a mesma do painel lateral) |
| `/connections` | Dados | Conexões e datasets |
| `/models/:id` | Modelo | Métricas e entidades do modelo semântico |

⌘K abre a busca de relatórios e ações e permite perguntar ao Copilot. O Copilot usa um **motor de exemplo** (`src/copilot/engine.ts`) com respostas sobre os dados do Lume Varejo; em produção, a mesma interface fala com a Assistant API.

Dados em `src/fixtures/` vêm de `design-handoff/04-MOCK_DATA.md` (os relatórios adicionais e números de visualização são exemplos). Marca e capas em `public/brand` e `public/covers`.
