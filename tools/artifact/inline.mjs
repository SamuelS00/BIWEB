// Gera uma página única (fragmento sem doctype/html/head/body) a partir de apps/web/dist-artifact:
// JS e CSS embutidos, fontes (só subconjuntos latin/latin-ext, woff2) e imagens como data: URIs.
// Uso: node tools/artifact/inline.mjs apps/web/dist-artifact out/page.html
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const [dist, out] = process.argv.slice(2);
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const jsFile = html.match(/<script[^>]+src="\.\/(assets\/[^"]+\.js)"/)[1];
const cssFile = html.match(/<link[^>]+rel="stylesheet"[^>]+href="\.\/(assets\/[^"]+\.css)"/)[1];
const mime = { '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const dataUri = (p) => `data:${mime[extname(p)]};base64,${readFileSync(p).toString('base64')}`;

// CSS: mantém @font-face latin/latin-ext, só woff2, embutido.
let css = readFileSync(join(dist, cssFile), 'utf8');
css = css.replace(/@font-face\{[^}]*\}/g, (block) => {
  const m = block.match(/url\(\.\/([^)]+?\.woff2)\)/);
  if (!m || !/-latin-(ext-)?\d{3}-/.test(m[1])) return '';
  return block.replace(/src:[^;}]+/, `src:url(${dataUri(join(dist, 'assets', m[1]))}) format("woff2")`);
});
const stray = css.match(/url\(\.\/[^)]+\)/g);
if (stray) throw new Error('URLs relativas restantes no CSS: ' + stray.slice(0, 3).join(', '));

// Imagens usadas pelo app (webp de marca e capas).
const assets = {};
for (const dir of ['brand', 'covers']) {
  if (!existsSync(join(dist, dir))) continue;
  for (const f of readdirSync(join(dist, dir))) if (f.endsWith('.webp')) assets[`${dir}/${f}`] = dataUri(join(dist, dir, f));
}

const js = readFileSync(join(dist, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
const page = `<title>BIWEB Studio</title>
<style>${css.replace(/<\/style/gi, '<\\/style')}</style>
<div id="root"></div>
<script>window.__BIWEB_ASSETS__=${JSON.stringify(assets)};</script>
<script type="module">${js}</script>
`;
writeFileSync(out, page);
console.log(`page: ${(page.length / 1024).toFixed(0)} KB · css ${(css.length / 1024).toFixed(0)} KB · js ${(js.length / 1024).toFixed(0)} KB · ${Object.keys(assets).length} imagens`);
