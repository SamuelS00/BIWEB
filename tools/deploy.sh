#!/usr/bin/env bash
# Gera os pacotes de deploy do BIWEB Studio (apps/web).
#   tools/deploy.sh            -> verifica (tsc + testes) e gera a página única do artifact
#   tools/deploy.sh static     -> também gera o build estático (rotas com #) em apps/web/dist-static
#   tools/deploy.sh --skip-checks
# A publicação do artifact é feita a partir de apps/web/dist-artifact/page.html.
set -euo pipefail
cd "$(dirname "$0")/../apps/web"
VITE="node node_modules/vite/bin/vite.js"   # pnpm pode não estar no PATH
static=0; checks=1
for a in "$@"; do case "$a" in static) static=1;; --skip-checks) checks=0;; esac; done

if [ "$checks" = 1 ]; then
  echo "▸ Checando tipos"; npx tsc -p tsconfig.json --noEmit
  echo "▸ Rodando testes"; npx vitest run --passWithNoTests
fi
echo "▸ Build da página única (artifact)"
VITE_HASH_HISTORY=1 VITE_SINGLE_FILE=1 $VITE build --outDir dist-artifact
node ../../tools/artifact/inline.mjs dist-artifact dist-artifact/page.html
if [ "$static" = 1 ]; then
  echo "▸ Build estático"; VITE_HASH_HISTORY=1 $VITE build --outDir dist-static
fi
echo "✓ Pronto: $(pwd)/dist-artifact/page.html"
