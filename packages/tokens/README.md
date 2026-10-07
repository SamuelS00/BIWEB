# @biweb/tokens

Fonte única de estilo do BIWEB Studio (ADR-0032). Tokens em **W3C DTCG** em `src/`, compilados por **Style Dictionary**.

| Arquivo em `src/` | O que contém | Saída |
|---|---|---|
| `base.json` | Espaço (base 4 px), raios, alturas de controle, ícones, larguras de painel, tipografia, durações | `dist/css/base.css` |
| `app.light.json`, `app.dark.json` | Tokens do chrome (`surface`, `text`, `border`, `accent`, `danger`, `success`, `warning`, `selection`, `focus`, `field`, sombras) | `dist/css/app.css` — `[data-theme]` no `<html>`; sem atributo, segue o sistema |
| `runtime.light.json`, `runtime.dark.json` | Tokens do dashboard (`dash-*`, `viz-*`) | `dist/css/runtime.css` — `.dash-theme-*` ou `[data-dash-theme]` no contêiner do dashboard |

Também gera `dist/index.js` (+ tipos), `dist/tokens.json` e `dist/echarts/{light,dark}.json` (tema para os adapters ECharts).

## Regras
- **App × runtime**: tudo dentro de um widget usa só `dash-*`/`viz-*`; seleção, handles, guias e painéis usam tokens app. Temas de dashboard e embeds sobrescrevem **apenas** os tokens runtime.
- O tema do dashboard é independente do tema do app.
- Nenhuma cor literal fora daqui. `pnpm test` verifica os pares de contraste WCAG 2.2 AA nos dois temas.

## Nomes
Os nomes CSS seguem o design system (`--surface-app`, `--viz-cat-1`, `--dash-widget-surface`). Equivalência com a nomenclatura dos docs de arquitetura: `viz.palette.categorical[n]` → `viz-cat-n`, `viz.palette.sequential.*` → `viz-seq-1…5`, `viz.palette.diverging.*` → `viz-div-*`, `dash.title.*` → `dash-title`/`dash-subtitle`, `focus.ring` → `focus-ring`.

A referência visual (guia da marca, componentes e direções) está em `docs/design/`.

```css
@import "@biweb/tokens/css/all.css";
```
