# Contribuindo para o BIWEB

## Ambiente local

Use Node 22 e pnpm 10. Depois de clonar:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Consulte [`AGENTS.md`](AGENTS.md) e [`docs/PROJETO.md`](docs/PROJETO.md) antes
de alterar o produto. Eles definem arquitetura, i18n, design system e a
documentação que deve acompanhar cada mudança.

## Antes de abrir uma pull request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
node tools/check-docs.mjs
```

Mantenha as mudanças pequenas, teste o comportamento afetado e atualize a
documentação. Não inclua segredos, arquivos gerados, `node_modules` ou mudanças
sem relação com a PR. O GitHub bloqueia segredos no push quando o recurso está
habilitado e o workflow Gitleaks verifica toda PR; revogue credenciais expostas,
em vez de apenas removê-las do arquivo.

## Commits e revisão

Use mensagens em português no formato `tipo(escopo): resumo`, por exemplo
`feat(discovery): adiciona filtro de fontes`. A branch `main` exige pull request
com aprovação de Code Owner e checks obrigatórios; consulte
[`docs/runbooks/github-repository-settings.md`](docs/runbooks/github-repository-settings.md).

## Releases

Para alterar um pacote público, crie um Changeset com `pnpm changeset` na mesma
PR. O processo completo está em [`.changeset/README.md`](.changeset/README.md).
