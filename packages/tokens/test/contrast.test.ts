// Pares de contraste do design system (WCAG 2.2 AA) verificados nos dois temas.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const t = JSON.parse(readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'));
const hex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
function lum(h: string) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const resolve = (map: Record<string, string>, k: string) => { const v = map[k]!; const m = /^var\(--(.+)\)$/.exec(v) ?? /^\{(.+)\}$/.exec(v); return m ? map[m[1]!.replace('.DEFAULT', '').replace('.', '-')] ?? v : v; };

const app: [string, string, number][] = [
  ...['text-primary', 'text-secondary', 'text-muted'].flatMap((f) => ['surface-panel', 'surface-app', 'surface-hover', 'surface-elevated'].map((b) => [f, b, 4.5] as [string, string, number])),
  ['accent', 'surface-panel', 4.5], ['accent', 'surface-app', 4.5], ['on-accent', 'accent', 4.5], ['on-accent', 'accent-hover', 4.5], ['selection', 'surface-canvas', 3], ['border-control', 'surface-panel', 3], ['focus-ring', 'surface-canvas', 3],
  ['danger', 'surface-panel', 4.5], ['success', 'surface-panel', 4.5], ['warning', 'surface-panel', 4.5], ['guide', 'surface-canvas', 3],
];
const runtime: [string, string, number][] = [
  ['dash-title', 'dash-widget-surface', 4.5], ['dash-subtitle', 'dash-widget-surface', 4.5], ['dash-positive', 'dash-widget-surface', 4.5],
  ['dash-negative', 'dash-widget-surface', 4.5], ['viz-axis', 'dash-widget-surface', 4.5], ['viz-tooltip-text', 'viz-tooltip-bg', 4.5],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => [`viz-cat-${i}`, 'dash-widget-surface', 3] as [string, string, number]),
];
for (const theme of ['light', 'dark'] as const) {
  describe(`contraste · ${theme}`, () => {
    for (const [fam, pairs] of [['app', app], ['runtime', runtime]] as const) {
      for (const [f, b, min] of pairs) {
        it(`${f} sobre ${b} ≥ ${min}:1`, () => {
          const m = t[fam][theme] as Record<string, string>;
          const fg = resolve(m, f), bg = resolve(m, b);
          expect(hex(fg) && hex(bg), `${fg} / ${bg}`).toBe(true);
          expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
        });
      }
    }
  });
}
