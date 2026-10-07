# ADR-0039 — Grounding por geração estruturada, metadados curados e evidências

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0005, ADR-0006, ADR-0008, [31 §13](../31-ai-assistant.md#13-confiabilidade-e-grounding)

## Context
É preciso minimizar métricas inexistentes, campos mal interpretados, consultas incorretas, relações falsas e conclusões sem evidência.

## Decision
- **Geração estruturada em DSLs validadas**: QDL, BEL, ops de documento, ops de DAG — sempre com IDs obtidos por ferramentas e validadas pelos compiladores/schemas existentes. Erros de validação retornam à IA (tentativas limitadas).
- **Metadados ricos**: descrição obrigatória para objetos certificados, unidade/moeda/aditividade, `synonyms`; `description` obrigatória nos `configSchema` de plugins e no catálogo de ops.
- **Conhecimento curado** na semantic layer: `ai.instructions`, `ai.verifiedQuestions` (pergunta → QDL aprovada por steward), `ai.exclude`; instruções por workspace na `AIPolicy`.
- **Evidências obrigatórias** em respostas analíticas (citações de `queryId`/insight) + **verificador de grounding** dos números.
- **Recuperação**: lexical (FTS do catálogo) + navegação por ferramentas no v1; **pgvector** (apenas metadados, no Postgres existente) somente se os evals mostrarem recall insuficiente.
- Valores de dimensão resolvidos sob demanda via QDL (respeitam RLS).

## Alternatives
Few-shot genérico sem metadados curados; banco vetorial dedicado desde o início; índice global de valores; RAG sobre dados brutos.

## Advantages
Erros detectáveis antes de chegar ao usuário; precisão sobe com a curadoria que a governança já incentiva.

## Disadvantages
Depende da qualidade de metadados mantidos pelos clientes (mitigado por sugestões de descrições/sinônimos pela própria IA, aceitas por humanos).

## Risks
Modelos grandes com metadados pobres → avisos de qualidade de metadados e priorização de objetos certificados.

## Consequences
Schema do modelo semântico ganha o bloco `ai`; o catálogo vira dependência do AI v1.
