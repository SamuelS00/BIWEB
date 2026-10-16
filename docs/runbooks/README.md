# runbooks

Procedimentos operacionais.

## Deploy do front-end (Cloudflare Pages)

1. Para o Cloudflare Pages, gere os tokens e o build de produção: `pnpm --filter @biweb/tokens build && pnpm --filter @biweb/web build`. Isso cria `apps/web/dist` com URLs limpas. `tools/deploy.sh static` permanece disponível somente para o pacote estático portátil, que usa rotas por hash.
2. Publicar: `npx wrangler pages deploy apps/web/dist --project-name <projeto>` (exige `wrangler login` ou `CLOUDFLARE_API_TOKEN`). Produção: `app.biwebstudio.com.br`.
3. Se o projeto Pages estiver conectado ao GitHub, o push em `main` já dispara o build.
4. Depois do deploy, abra `/data` e confira Visão geral, Fontes e o wizard.

## Avaliação self-hosted (Docker)

1. Na raiz, execute `docker compose -f infra/docker/compose.yml up --build`.
2. Abra `http://localhost:8080` e confirme `http://localhost:8080/health` com resposta `ok`.
3. Opcionalmente, publique em outra porta com `BIWEB_PORT=8181 docker compose -f infra/docker/compose.yml up --build`.
4. Para encerrar, execute `docker compose -f infra/docker/compose.yml down`.

O Compose serve somente o front-end demonstrativo. Ele não configura os backends
planejados, nem substitui o deploy de produção em Cloudflare Pages.
