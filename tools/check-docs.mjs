#!/usr/bin/env node
// Confere se toda rota declarada em apps/web/src/router.tsx aparece em docs/PROJETO.md (seção de rotas).
// Parâmetros são normalizados ($id, $reportId… → $), então a doc pode usar nomes curtos.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const router = readFileSync(join(root, 'apps/web/src/router.tsx'), 'utf8');
const doc = readFileSync(join(root, 'docs/PROJETO.md'), 'utf8');
const norm = (p) => p.replace(/\$[A-Za-z]+/g, '$');

const routes = [...new Set([...router.matchAll(/path:\s*'(\/[^']*)'/g)].map((m) => m[1]))];
const docText = norm(doc);
const missing = routes.filter((r) => !docText.includes(norm(r)));
if (missing.length) {
  console.error('Rotas sem documentação em docs/PROJETO.md (seção 4):\n' + missing.map((m) => `  - ${m}`).join('\n'));
  console.error('\nAtualize a tabela de rotas no mesmo commit (veja AGENTS.md).');
  process.exit(1);
}
console.log(`✓ ${routes.length} rotas documentadas`);
