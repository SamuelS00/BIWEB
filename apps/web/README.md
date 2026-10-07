# @biweb/web

Application Shell (SPA) do BIWEB Studio: Vite + React 19 + TanStack Router + react-intl + Zustand, sobre `@biweb/ui` e `@biweb/tokens`.

```bash
pnpm install
pnpm dev          # gera os tokens e abre http://localhost:5173
```

| Rota | Tela (SCREEN_CATALOG) | Estado |
|---|---|---|
| `/` | S01 Home | Lista de dashboards (fixture Lume Varejo) |
| `/connections` | S02 Conexões | Lista e estado de erro |
| `/dashboards/:id` | S06 Viewer | Barra de contexto + KPIs; widgets via dashboard-runtime (E2.4) |
| `/dashboards/:id/edit` | S03–S05 Builder | Zonas, painéis e Inspector com componentes reais; canvas via E2.4/E2.6. Carregado sob demanda |
| `/models/:id` | S07 Modelo | Barra rascunho/publicado |

Os dados em `src/fixtures/` vêm de `design-handoff/04-MOCK_DATA.md` e saem quando a Management API existir.
