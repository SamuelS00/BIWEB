# ADR-0043 — LDE e BCE como serviços independentes

- **Status:** Aceito · **Data:** 2026-10-10 · **Relacionados:** ADR-0042, 09 (ingestão), 11 (semântica)

## Context
O Living Data Engine entende e governa dados; o BCE descreve e valida aplicações. Acoplá-los ao front-end limitaria reuso e evolução.

## Decision
- O **LDE** (descoberta, semântica, perfil, relacionamentos, normalização, enriquecimento, qualidade, linhagem, publicação) é um serviço com contratos e eventos próprios; o BIWEB é seu primeiro consumidor.
- O **BCE** (ADR-0042) é outro serviço, com consumidores previstos: Copilot, Migration Engine, Builders e agentes autorizados.
- A comunicação entre eles e com o front ocorre por **contratos/eventos**, não por estado compartilhado.
- Hoje ambos existem apenas como protótipo de front-end (`apps/web/src/dataworkspace`, `routes/migration`); a extração é trabalho futuro.

## Alternatives
Monólito de front; um único serviço de dados e composição.

## Advantages
Substituibilidade, escala independente e reuso por integrações futuras.

## Disadvantages
Custo de implementação e de governança dos contratos.

## Risks
Mais fronteiras e versionamento de contratos entre serviços.

## Consequences
`apps/control-plane`, `crates/` e os pacotes de runtime seguem esqueletos até haver épico.
