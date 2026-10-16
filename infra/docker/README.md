# docker

Imagem OCI e Compose para servir o front-end em uma avaliação self-hosted. O
container gera o bundle do Vite em uma etapa Node 22/pnpm e o entrega por Nginx
sem privilégios, na porta `8080`.

Na raiz do repositório:

```bash
docker compose -f infra/docker/compose.yml up --build
```

Abra `http://localhost:8080`. Para escolher outra porta no host, defina
`BIWEB_PORT`, por exemplo `BIWEB_PORT=8181 docker compose -f
infra/docker/compose.yml up --build`.

O endpoint `GET /health` retorna `200 OK` e é usado pelo healthcheck. Para
parar e remover o container: `docker compose -f infra/docker/compose.yml down`.

Também é possível construir a imagem diretamente:

```bash
docker build -f infra/docker/Dockerfile -t biweb-web:local .
docker run --rm -p 8080:8080 biweb-web:local
```
