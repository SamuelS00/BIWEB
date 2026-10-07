# @biweb/ui

Design system do BIWEB Studio em código: **React Aria Components** (acessibilidade, teclado, i18n) + **Tailwind v4** + **@biweb/tokens** (ADR-0032).

## Uso
```css
/* app.css do aplicativo (Vite + @tailwindcss/vite) */
@import "@biweb/ui/styles.css";
@source "./src";
```
```tsx
import { Button, Panel, PropertySection, PropertyRow, NumberField } from '@biweb/ui';
```
- O tema do app vai em `data-theme="light|dark"` no `<html>` (sem atributo, segue o sistema).
- O tema do dashboard vai no contêiner do canvas: `className="dash-theme-dark"` ou `data-dash-theme="dark"`.
- Densidade compacta: sobrescreva `--control-md: 24px` no root.
- O Tailwind só conhece valores do design system: `bg-surface-panel`, `text-text-muted`, `border-border-subtle`, `rounded-sm`, `text-body`, `p-3` (base 4 px). A paleta padrão do Tailwind foi removida.

## Conteúdo
| Camada | Itens |
|---|---|
| Estilos | `src/styles/components.css` (classes `bw-*`, espelho do design system), `src/styles/react-aria.css` (estados `data-*`) |
| Primitives (React) | Button, IconButton, SegmentedControl, TextField, NumberField, Select, Switch, Checkbox, Tabs, Menu, Dialog, Badge, Counter, Banner, Icon |
| Application (React) | Panel, PropertySection, PropertyRow, TreeView, ViewRail, PaneSwitcher, PageTabs, StatusBar, EmptyState |
| BI (React) | FieldTypeIcon, FieldChip, FieldWell |
| Conteúdo (React) | Avatar, Skeleton |
| Movimento | `src/styles/motion.css`: `bw-page`, `bw-stagger` (+ `--i`), `bw-lift`, `bw-grow-x/y`, `bw-draw`, `bw-skeleton`, `bw-typing`; desliga com prefers-reduced-motion |
| Só CSS por enquanto | Tooltip rico, Toast, Slider, Radio, ColorSwatchPicker, CommandBar, AppToolbar, BreakpointSwitcher, FilterBuilder, MatrixTable, MapLayerPanel, ModelEntityCard, ImpactPanel, DiffView, DropZones, WidgetFrame, KpiCard, GlobalContextBar, VisualizationPicker, ChangeSetCard |

Os componentes "só CSS" já têm classes e prévia em `docs/design/components/`; ganham componente React no épico em que são usados (E2.6 Builder, E2.4 runtime, E3.A7 assistente). Widgets (`WidgetFrame`, `KpiCard`, `MatrixTable`) pertencem a `dashboard-runtime`/`viz-core` e usam só tokens runtime.

Referência visual completa: `docs/design/README.md` (guia da marca), `docs/design/components/` e o protótipo em `docs/design/prototype/index.html`.
