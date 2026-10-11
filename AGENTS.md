# AGENTS.md — BIWEB Studio

Instruções para agentes de IA (Claude Code, Codex, Cursor…) e para quem contribui. O contexto completo está em [`docs/PROJETO.md`](docs/PROJETO.md): **leia antes de mexer no código**.

## Resumo
- Hoje só existe o front-end `apps/web` (React 19 + Vite + TanStack Router + zustand + React Aria), 100% no browser com dados demonstrativos determinísticos. `control-plane`, `crates/` e quase todos os `packages/*` são esqueletos.
- Textos de UI em pt-BR. Estilo só com tokens (`packages/tokens`); nada de cor literal.
- Design system aprovado: **preserve-o**. Sem glow, gradiente de fundo, partículas, sparkle por tudo nem gráficos decorativos.

## Comandos (a partir de `apps/web`; `pnpm` pode não estar no PATH)
```bash
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173   # dev
npx tsc -p tsconfig.json --noEmit                                  # tipos
npx vitest run                                                     # testes
node ../../tools/check-docs.mjs                                    # rotas × documentação
../../tools/deploy.sh                                              # tipos + testes + build
```
Fronteiras: `node node_modules/dependency-cruiser/bin/dependency-cruise.mjs apps/web/src packages --config .dependency-cruiser.cjs` (na raiz). Ciclos em runtime quebram o CI.

## Documentação: mantenha sempre atualizada
A documentação é parte da entrega. **No mesmo commit** da mudança de código, atualize o que for afetado:

| Se você… | Atualize |
|---|---|
| criou, renomeou ou removeu **rota** | tabela da seção 4 de `docs/PROJETO.md` (o CI roda `tools/check-docs.mjs` e falha se faltar), `apps/web/README.md` se a área mudou |
| criou ou moveu **pasta/módulo** em `apps/web/src` ou `packages/` | seções 2 e 5 de `docs/PROJETO.md` (árvore, subseção do módulo) |
| mudou **comando, build, CI, deploy, secrets ou domínio** | seções 3, 8 e 9 de `docs/PROJETO.md` e `docs/runbooks/README.md` |
| criou **convenção**, armadilha ou receita nova | seções 6 e 7 de `docs/PROJETO.md` |
| resolveu um **problema relevante** ou tomou decisão | `docs/PROBLEMAS-RESOLVIDOS.md` (problema → solução → onde), e ADR em `docs/architecture/adr/` se contrariar o blueprint |
| mudou **testes** (novos, removidos, cobertura) | seção 8 de `docs/PROJETO.md` |
| mudou algo que **clientes veem** (módulo novo, número exibido, UI visível) | `apps/web/public/apresentacao/index.html` (endpoint `/apresentacao/`) e regenere as capturas (`tools/capture-presentation.mjs`); seção 13 de `docs/PROJETO.md` |
| removeu arquivo ou pasta referenciados | procure menções com `grep -rn` e ajuste os links |

Sempre atualize a **data de revisão** no topo de `docs/PROJETO.md`. Antes de dar a tarefa como pronta, rode `node tools/check-docs.mjs` e confira se a doc descreve o que o código faz agora, não o que fazia antes.

## Regras de trabalho
1. **Analise antes de codar**: leia o código existente, reutilize componentes (`@biweb/ui`) e padrões; refatore de forma incremental e preserve o que funciona.
2. **Não quebre URLs existentes**; rotas antigas redirecionam.
3. **IA propõe, humano aplica** (Pedido → Prévia → Aplicar). A plataforma tem que funcionar com a IA desligada.
4. Dados de demonstração **determinísticos** (semeados); números iguais em todas as telas.
5. TypeScript estrito (`noUncheckedIndexedAccess`). Armazenamento do browser sempre em `try/catch`. Movimento respeita `prefers-reduced-motion`.
6. Não use `manualChunks` no Vite. Não crie arquivos que diferem só por caixa.
7. Verifique no navegador mudanças de UI (dev server) antes de dar como pronto; rode `tsc` e `vitest`.

## Git e deploy
- **Commit e push só quando o usuário pedir.** Mensagens em pt-BR: `tipo(escopo): resumo`, corpo com bullets.
- `.pnpm-store/` e `.wrangler/` ficam fora do git. Nunca commite segredos ou tokens.
- Push em `main` dispara o deploy automático no Cloudflare Pages (projeto `biweb`, `app.biwebstudio.com.br`). Detalhes em `docs/PROJETO.md` §9 e `docs/runbooks/README.md`.
- Credenciais (token do Cloudflare, secrets do GitHub) são cadastradas pelo usuário; agentes não digitam segredos.
