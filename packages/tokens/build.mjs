// Gera dist/ a partir dos tokens DTCG em src/ (ADR-0032).
//   base.json            → escalas (espaço, raio, tamanhos, tipografia, durações)
//   app.{light,dark}     → tokens do chrome; tema via data-theme no <html>
//   runtime.{light,dark} → dash-* e viz-*; tema do dashboard, independente do app
import StyleDictionary from 'style-dictionary';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';

const DIST = 'dist';
await rm(DIST, { recursive: true, force: true });
await mkdir(`${DIST}/css`, { recursive: true });
await mkdir(`${DIST}/echarts`, { recursive: true });

StyleDictionary.registerTransform({
  name: 'name/biweb', type: 'name',
  // surface.app → surface-app; accent.DEFAULT → accent (mesmos nomes do design system)
  transform: (t) => t.path.filter((p) => p !== 'DEFAULT').join('-'),
});
StyleDictionary.registerTransform({
  name: 'typography/biweb', type: 'value', transitive: true,
  filter: (t) => (t.$type ?? t.type) === 'typography',
  transform: (t) => { const v = t.$value ?? t.value; return `${v.fontWeight} ${v.fontSize}/${v.lineHeight} ${v.fontFamily}`; },
});
StyleDictionary.registerTransform({
  name: 'cubicBezier/biweb', type: 'value', filter: (t) => (t.$type ?? t.type) === 'cubicBezier',
  transform: (t) => `cubic-bezier(${(t.$value ?? t.value).join(', ')})`,
});
const transforms = ['attribute/cti', 'name/biweb', 'typography/biweb', 'cubicBezier/biweb'];

async function run(sources, selector, name) {
  const sd = new StyleDictionary({
    source: sources, log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: { transforms, buildPath: `${DIST}/tmp/`, files: [{ destination: `${name}.css`, format: 'css/variables', options: { selector, outputReferences: true, showFileHeader: false } }] },
      json: { transforms, buildPath: `${DIST}/tmp/`, files: [{ destination: `${name}.json`, format: 'json/flat' }] },
    },
  });
  await sd.buildAllPlatforms();
  return { css: await readFile(`${DIST}/tmp/${name}.css`, 'utf8'), json: JSON.parse(await readFile(`${DIST}/tmp/${name}.json`, 'utf8')) };
}

const base = await run(['src/base.json'], ':root', 'base');
const appL = await run(['src/app.light.json'], ':root, [data-theme="light"]', 'app-light');
const appD = await run(['src/app.dark.json'], '[data-theme="dark"]', 'app-dark');
const rtL = await run(['src/runtime.light.json'], ':root, .dash-theme-light, [data-dash-theme="light"]', 'runtime-light');
const rtD = await run(['src/runtime.dark.json'], '.dash-theme-dark, [data-dash-theme="dark"]', 'runtime-dark');

const head = (t) => `/* BIWEB Studio — ${t}. Gerado de packages/tokens/src por Style Dictionary. Não edite. */\n`;
const decls = (css) => css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
// Sem data-theme explícito, segue o sistema operacional.
const autoDark = `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {${decls(appD.css)}  color-scheme: dark;\n  }\n}\n`;
await writeFile(`${DIST}/css/base.css`, head('escalas') + base.css);
await writeFile(`${DIST}/css/app.css`, head('tokens app (chrome)') + appL.css.replace('{', '{\n  color-scheme: light;') + appD.css.replace('{', '{\n  color-scheme: dark;') + autoDark);
await writeFile(`${DIST}/css/runtime.css`, head('tokens runtime (dashboard). Temas de dashboard e embeds sobrescrevem só estes') + rtL.css + rtD.css);
await writeFile(`${DIST}/css/all.css`, head('todos os tokens') + `@import "./base.css";\n@import "./app.css";\n@import "./runtime.css";\n`);

// Tema do Tailwind v4 gerado dos tokens: remove a paleta e as escalas padrão do Tailwind
// para que utilitários só existam para valores do design system.
const colorNames = [...new Set([...Object.keys(appL.json), ...Object.keys(rtL.json)])].filter((k) => !k.startsWith('shadow-'));
const bj = base.json;
const pick = (pre) => Object.keys(bj).filter((k) => k.startsWith(pre));
const tw = [
  '@theme inline {',
  '  --color-*: initial;',
  ...colorNames.map((k) => `  --color-${k}: var(--${k});`),
  '  --shadow-*: initial;',
  ...Object.keys(appL.json).filter((k) => k.startsWith('shadow-')).map((k) => `  --${k}: var(--${k});`),
  '  --font-*: initial;',
  '  --font-sans: var(--font-sans);',
  '  --font-mono: var(--font-mono);',
  '}',
  '@theme {',
  '  --spacing: 4px;',
  '  --radius-*: initial;',
  ...pick('radius-').map((k) => `  --${k}: ${bj[k]};`),
  '  --text-*: initial;',
  '  --text-caption: 11px; --text-caption--line-height: 16px;',
  '  --text-body: 12px; --text-body--line-height: 16px;',
  '  --text-panel-title: 13px; --text-panel-title--line-height: 20px;',
  '  --text-page-title: 16px; --text-page-title--line-height: 24px;',
  '  --text-display: 20px; --text-display--line-height: 28px;',
  '  --text-kpi: 28px; --text-kpi--line-height: 32px;',
  '}',
].join('\n');
await writeFile(`${DIST}/css/tailwind.css`, head('tema Tailwind v4 (use depois de @import "tailwindcss")') + tw + '\n');

const tokens = { base: base.json, app: { light: appL.json, dark: appD.json }, runtime: { light: rtL.json, dark: rtD.json } };
await writeFile(`${DIST}/tokens.json`, JSON.stringify(tokens, null, 2));
await writeFile(`${DIST}/index.js`, `// Gerado. Não edite.\nexport const tokens = ${JSON.stringify(tokens, null, 2)};\nexport default tokens;\n`);
const keys = (o) => Object.keys(o).map((k) => JSON.stringify(k)).join(' | ');
await writeFile(`${DIST}/index.d.ts`, `// Gerado. Não edite.\nexport type BaseToken = ${keys(base.json)};\nexport type AppToken = ${keys(appL.json)};\nexport type RuntimeToken = ${keys(rtL.json)};\nexport type Theme = 'light' | 'dark';\nexport declare const tokens: {\n  base: Record<BaseToken, string>;\n  app: Record<Theme, Record<AppToken, string>>;\n  runtime: Record<Theme, Record<RuntimeToken, string>>;\n};\nexport default tokens;\n`);

// Tema ECharts por tema de dashboard (plugins recebem tokens resolvidos; nenhuma cor hardcoded).
for (const [th, rt] of Object.entries(tokens.runtime)) {
  const cats = Object.keys(rt).filter((k) => /^viz-cat-\d+$/.test(k)).sort((a, b) => +a.split('-')[2] - +b.split('-')[2]).map((k) => rt[k]);
  const axis = { axisLine: { lineStyle: { color: rt['viz-axis'] } }, axisTick: { lineStyle: { color: rt['viz-axis'] } }, axisLabel: { color: rt['viz-axis'] }, splitLine: { lineStyle: { color: rt['viz-grid'] } } };
  const theme = {
    color: cats, backgroundColor: 'transparent',
    textStyle: { fontFamily: base.json['font-sans'], color: rt['dash-title'] },
    title: { textStyle: { color: rt['dash-title'] }, subtextStyle: { color: rt['dash-subtitle'] } },
    legend: { textStyle: { color: rt['dash-subtitle'] } },
    tooltip: { backgroundColor: rt['viz-tooltip-bg'], borderWidth: 0, textStyle: { color: rt['viz-tooltip-text'] } },
    categoryAxis: axis, valueAxis: axis, timeAxis: axis, logAxis: axis,
    visualMap: { inRange: { color: [1, 2, 3, 4, 5].map((i) => rt[`viz-seq-${i}`]) } },
  };
  await writeFile(`${DIST}/echarts/${th}.json`, JSON.stringify(theme, null, 2));
}
await rm(`${DIST}/tmp`, { recursive: true, force: true });
console.log('tokens: dist/css/{base,app,runtime,all}.css, dist/index.js, dist/echarts/{light,dark}.json');
