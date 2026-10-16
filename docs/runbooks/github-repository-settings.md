# Configurações do repositório no GitHub

Este repositório versiona as políticas em [`.github/branch-protection.json`](../../.github/branch-protection.json), mas o GitHub só permite aplicá-las via interface ou API por alguém com permissão de administração.

## Proteção da `main`

Em **Settings → Rules → Rulesets**, crie ou atualize a regra `main protection` a
partir do JSON versionado. A regra exige:

- pull request e uma aprovação;
- aprovação do Code Owner, descarte de aprovação obsoleta e resolução de todas
  as conversas;
- checks `ci / ts`, `ci / e2e`, `ci / rust`, `security / dependency-audit`,
  `dependency-review / dependency-review` e `secret-scan / gitleaks`;
- branch atualizada antes de merge e bloqueio de force push e exclusão.

Depois que cada workflow rodar pela primeira vez, confirme os nomes exatos dos
checks no GitHub antes de ativar a regra. Isso evita bloquear PRs por um contexto
que ainda não existe.

## Segurança e automação

Em **Settings → Code security and analysis**, habilite Dependabot alerts,
Dependabot security updates, secret scanning e push protection. O arquivo
`.github/dependabot.yml` agenda as pull requests de atualização; `codeql.yml` e
`security.yml` executam análise estática, auditoria e geram um SBOM SPDX baixável
como artefato. `secret-scan.yml` executa Gitleaks em PRs, pushes e semanalmente;
`dependency-review.yml` bloqueia PRs que introduzam dependências com severidade
alta ou crítica. Para repositórios privados, confirme que GitHub Code Security
está habilitado, pois a Dependency Review Action depende desse recurso.

## Produção e deploy

O job de deploy usa o Environment **`production`**. Antes do primeiro deploy,
em **Settings → Environments → New environment**, crie-o e configure:

- **Required reviewers:** pelo menos uma pessoa responsável pelo deploy;
- **Deployment branches:** somente a branch protegida `main`;
- **Environment secrets:** mova `CLOUDFLARE_API_TOKEN` e
  `CLOUDFLARE_ACCOUNT_ID` dos secrets do repositório para esse Environment e
  remova as cópias globais depois de validar o próximo deploy.

O token da Cloudflare deve ser restrito à conta/projeto necessário e à permissão
Cloudflare Pages: Edit. Faça rotação periódica e revogue-o imediatamente se for
exposto. Não use `wrangler login` como credencial de CI.

## E2E e headers do Pages

O job `ci / e2e` envia `playwright-report` e `test-results` como artefato por
14 dias. Em falhas, o Playwright preserva screenshot, vídeo e trace da primeira
tentativa repetida; baixe o artefato da execução do Actions para investigar.

`apps/web/public/_headers` é copiado para o build do Vite e aplicado pelo
Cloudflare Pages. Ele define CSP, HSTS, proteção contra framing, política de
permissões e outros headers. Quando uma integração legítima passar a acessar
uma nova origem (por exemplo, API, Sentry ou fontes de imagem), atualize a CSP
de forma explícita e teste o fluxo afetado — não use curingas.

## Releases

O workflow `release.yml` abre uma PR de versões/changelog quando há Changesets
em `main`. Após aprová-la, crie e envie uma tag semver, como `v0.1.0`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

O workflow `github-release.yml` publica a GitHub Release com as notas geradas.
Publicação em npm permanece deliberadamente desativada até que o escopo do pacote
e o segredo de publicação sejam definidos.
