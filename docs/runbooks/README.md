# runbooks

Procedimentos operacionais.

## Deploy do front-end (Cloudflare Pages)

1. `tools/deploy.sh static` roda tipos + testes e gera `apps/web/dist-static` (rotas por hash) e a página única do artifact.
2. Publicar: `npx wrangler pages deploy apps/web/dist-static --project-name <projeto>` (exige `wrangler login` ou `CLOUDFLARE_API_TOKEN`). Produção: `app.biwebstudio.com.br`.
3. Se o projeto Pages estiver conectado ao GitHub, o push em `main` já dispara o build.
4. Depois do deploy, abra `/#/data` e confira Visão geral, Fontes e o wizard.
