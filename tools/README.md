# tools

Scripts de manutenção do monorepo.

| Item | Para que serve |
|---|---|
| `deploy.sh` | Tipos + testes + build da página única (artifact) e, com `static`, do build estático. Veja `docs/PROJETO.md` §9 |
| `check-docs.mjs` | Falha se uma rota de `apps/web/src/router.tsx` não estiver documentada em `docs/PROJETO.md` §4 (roda no CI) |
| `capture-presentation.mjs` + `presentation-shots.mjs` | Captura telas reais do protótipo (claro e escuro) para `docs/apresentacao/img/`. Requer dev server e Google Chrome |
| `artifact/inline.mjs` | Embute JS, CSS e imagens do build em um único HTML |
| `brand/` | Geração de logos, favicon e capas (`assets.py`, `covers.py`); veja o README da pasta |

Codegen (schema → Rust/TS) e lint de fronteiras (`.dependency-cruiser.cjs`) ainda são planejados/ficam na raiz.
