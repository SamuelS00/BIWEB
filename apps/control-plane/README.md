# @biweb/control-plane

Monolito modular em Node/TS: Fastify API + módulos de domínio + workers Temporal (docs/architecture/15-backend.md).

Módulos em `src/modules/`: `identity`, `tenancy`, `access`, `connectivity`, `pipelines`, `semantic`, `content`, `sharing`, `delivery`, `governance`, `extensibility`, `metering`, `platform`, `assistant`, `model-gateway`.
`assistant` e `model-gateway` são da Fase 3 e opcionais; SDKs de provedores de modelo só em `model-gateway/adapters/`.
