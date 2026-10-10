#!/usr/bin/env node
// Captura telas reais do protótipo para docs/apresentacao (claro e escuro). Requer o dev server rodando.
//   BIWEB_URL=http://127.0.0.1:5173 node tools/capture-presentation.mjs [nome ...]
// Usa o Google Chrome instalado (playwright-core). Saída: docs/apresentacao/img/<nome>-{l,d}.jpg
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'testing/e2e/package.json'));
const { chromium } = (() => { for (const m of ['@playwright/test', 'playwright-core']) { try { return require(m); } catch { /* tenta o próximo */ } } return createRequire(join(root, 'node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/package.json'))('playwright-core'); })();
const BASE = process.env.BIWEB_URL ?? 'http://127.0.0.1:5173';
const OUT = join(root, 'docs/apresentacao/img');
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const W = 1440, H = 880;

const T = (page, text, opts = {}) => page.getByText(text, { exact: opts.exact ?? false }).first();
/** Cada tela: [nome, url, passos(page)]. */
const SHOTS = (await import('./presentation-shots.mjs')).default;

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('biweb.session', '1'); localStorage.setItem('biweb.workspace', '"rede"'); } catch {} });
  for (const [name, url, steps, opt] of SHOTS) {
    if (only.length && !only.includes(name)) continue;
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      if (steps) await steps(page, { T });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(OUT, `${name}-${scheme[0]}.jpg`), type: 'jpeg', quality: 80, ...(opt?.clip ? { clip: opt.clip } : {}) });
      console.log('✓', name, scheme);
    } catch (e) { console.error('✗', name, scheme, String(e).split('\n')[0]); }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
