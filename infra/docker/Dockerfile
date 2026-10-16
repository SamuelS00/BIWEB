# syntax=docker/dockerfile:1

# A imagem final só serve o bundle estático. Node e dependências de build não
# fazem parte do runtime.
FROM node:22.23.3-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY tools ./tools

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @biweb/tokens build
# O container é servido como site estático: o histórico por hash não requer
# rewrite no proxy para as rotas do produto.
# O nginx encaminha rotas desconhecidas para index.html; não é necessário hash na URL.
RUN pnpm --filter @biweb/web build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
