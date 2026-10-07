# ADR-0040 — Conversas do usuário, ancoradas a objetos, contexto remontado por turno, streaming SSE

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0037, [31 §17](../31-ai-assistant.md#17-conversas-e-histórico)

## Context
É preciso definir o dono e o escopo das conversas, a persistência, o comportamento ao trocar de objeto e como evitar contexto obsoleto, de forma coerente com multi-tenancy e retenção.

## Decision
- Conversa pertence ao **usuário** (privada), no escopo de um **workspace**; **âncora** opcional (dashboard/modelo/dataset/pipeline) que pode mudar; cada turno registra objeto e revisão de contexto.
- **Contexto remontado a cada turno** a partir do estado atual (snapshot + reconsulta com authz). O histórico guarda texto e resumos de ferramentas, com resultados **por referência** (queryId), não dados brutos.
- Persistência em Postgres (`assistant.*`, RLS); retenção conforme `AIPolicy` (N dias ou modo efêmero); resumo de históricos longos com modelo `fast`.
- Transporte: **HTTP POST + SSE** por turno (eventos tipados: texto, progresso de ferramentas, propostas, citações, avisos de política); cancelamento via abort, que propaga às chamadas de modelo e queries.
- Compartilhar conversa: fase posterior, como artefato com revalidação de permissões.

## Alternatives
Conversa por dashboard (compartilhada); sessões sempre efêmeras; WebSocket dedicado; estado de documento guardado no histórico.

## Advantages
Privacidade por padrão; sem contexto obsoleto; transporte simples, compatível com proxies e com o control plane atual.

## Disadvantages
Sem colaboração em conversas no v1.

## Risks
Retenção mal configurada → padrões conservadores e expiração automática por job.

## Consequences
Jobs de expiração (Temporal maintenance); eventos de auditoria por turno.
