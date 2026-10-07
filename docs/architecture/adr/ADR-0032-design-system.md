# ADR-0032 — Design system com React Aria, tokens DTCG e tokens de runtime separados

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [04 §31](../04-frontend-architecture.md)

## Context
A interface é extremamente complexa (app, builder, runtime, embeds), precisa de acessibilidade (WCAG 2.2 AA), i18n, dark mode e temas de dashboard independentes do tema da aplicação.

## Decision
- **React Aria Components** como primitivas acessíveis; Tailwind v4 + CSS variables.
- Tokens em formato **W3C DTCG** → Style Dictionary (CSS vars, TS, temas ECharts/deck.gl).
- Duas famílias de tokens semânticos: **app** e **runtime de dashboard** (`dash.*`, `viz.*`); temas de dashboard e embeds só sobrescrevem tokens de runtime.
- axe e testes de teclado no CI; strings externalizadas (ICU) desde o início.

## Alternatives
Radix + shadcn/ui; MUI/Ant Design; componentes próprios sem primitivas.

## Advantages
Acessibilidade e i18n robustos para padrões complexos (grid, tree, combobox, datas, dnd acessível); temas de dashboard isolados.

## Disadvantages
Mais trabalho de estilização que bibliotecas prontas.

## Risks
Divergência visual entre superfícies → tokens como única fonte de estilo.

## Consequences
Plugins de visualização recebem tokens resolvidos; nenhuma cor hardcoded em plugins core.

## Emenda 2026-10-06 — IA nativa
- Novo pacote `assistant-ui` sobre o design system: painel, chips de contexto, markdown seguro (sem HTML, sem imagens/links remotos auto-carregados), citações, preview de propostas e mini-visualizações de evidência renderizadas pelos plugins existentes.
