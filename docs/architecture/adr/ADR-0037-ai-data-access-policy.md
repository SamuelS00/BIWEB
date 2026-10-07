# ADR-0037 — Política de IA por tenant/workspace e níveis de acesso a dados

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0036, ADR-0019, ADR-0029, [31 §14.3](../31-ai-assistant.md#143-níveis-de-acesso-a-dados-política-do-tenant)

## Context
Clientes têm restrições diferentes: alguns proíbem enviar dados a provedores externos, outros aceitam só metadados, exigem fornecedores ou regiões específicas, modelos privados, ou querem desabilitar a IA.

## Decision
- **`AIPolicy`** por tenant com override por workspace (**prevalece o mais restritivo**): `enabled`, `dataAccess` (`metadata-only` | `aggregates` | `row-level`), limites (linhas/colunas ao modelo, tamanho mínimo de grupo), classificações mascaradas, allowlist de provedores/regiões, **BYO endpoint** (credencial no cofre), retenção (`persistent` N dias | `ephemeral`), logging de prompts (`metadata` | `sampled-content` | `full-content`), toggles por modo e por papel, instruções do tenant.
- **Postura padrão do SaaS (aceita em 2026-10-06):** `dataAccess = aggregates`; retenção de conversas = **30 dias** (`persistent`); `promptLogging = metadata` (nenhum conteúdo de prompt/resposta registrado; apenas telemetria amostrada e auditoria em metadados). Tenants podem endurecer (`metadata-only`, `ephemeral`) por conta própria; afrouxar (`row-level`, logging de conteúdo, retenção maior) exige opt-in explícito de admin e é auditado.
- Self-hosted → `disabled` até configurar; air-gapped → somente BYO.
- Aplicada no **egress guard** (gateway), no **Query Service** (`options.egress`) e no Tool Registry (ferramentas disponíveis).
- **Classificação de campos** (PII/sensível/restrito) capturada desde a Fase 1 nos datasets e herdada pela semantic layer — pré-requisito do mascaramento.
- Edições/entitlements: `ai.assistant`, `ai.analysis`, `ai.modeling`, `ai.transform`, `ai.byo_model`, créditos.

## Alternatives
Liga/desliga global; política só por tenant; confiar apenas em contratos com o provedor.

## Advantages
Atende do SaaS padrão ao regulado sem bifurcar código; `metadata-only` ainda entrega criação e edição úteis.

## Disadvantages
Mais combinações a testar.

## Risks
Classificação incompleta de campos → padrão conservador para campos não classificados em tenants regulados; detecção de padrões como defesa em profundidade.

## Consequences
Matriz de testes de política no CI; auditoria registra as classes de dados enviadas a cada turno.
