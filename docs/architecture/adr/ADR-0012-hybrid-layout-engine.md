# ADR-0012 — Layout híbrido por containers (grid, stack, free, tabs) com breakpoints

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [06-dashboard-builder](../06-dashboard-builder.md)

## Context
Usuários precisam de dashboards operacionais responsivos (grid) e de relatórios pixel-perfect (canvas), com aninhamento, grupos e boa experiência mobile.

## Decision
- Árvore de containers com estratégia de layout: `grid` (padrão), `stack` (auto-layout flex), `free` (absoluto, contido), `tabs`.
- `placement` por breakpoint; derivação automática para breakpoints ausentes (empilhamento em ordem de leitura no mobile).
- Solvers puros em `layout-engine`; interaction layer próprio no builder; o canvas renderiza o runtime real com overlays.

## Alternatives
Só grid (react-grid-layout); só canvas (modelo Power BI); Figma-like com constraints completas; constraints Cassowary.

## Advantages
Cobre os dois mundos sem contaminar responsividade; modelo mental simples; testável.

## Disadvantages
Interaction layer próprio é trabalho significativo; `free` exige estratégia mobile explícita.

## Risks
Complexidade de UX ao misturar estratégias → presets e templates, `grid` como padrão.

## Consequences
Constraints estilo Figma apenas dentro de `free` e numa fase posterior.
