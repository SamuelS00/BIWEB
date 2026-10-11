# ADR-0044 — Copilot com contexto global (Intelligence Core)

- **Status:** Aceito · **Data:** 2026-10-10 · **Relacionados:** ADR-0033–0041, 31 (assistente de IA)

## Context
O Copilot hoje é contextual por módulo. O valor máximo está em conectar dados, relatórios, mapas, fluxos, linhagem e qualidade em um único contexto, sem ultrapassar permissões.

## Decision
- Adotar o **BIWEB Intelligence Core** como nome de narrativa da camada de contexto do Copilot (substitui o termo provisório "Super Brain").
- O contexto é construído de **metadados autorizados**, modelos, relacionamentos, linhagem, métricas, relatórios, mapas, fluxos, atividade, decisões e seleção atual, respeitando permissões.
- Ações seguem **Pedido → Proposta → Prévia → Aprovação → Aplicar**; nada é alterado em silêncio. A plataforma funciona com a IA desligada (ADR-0033).
- Privacidade por padrão: somente metadados; amostras mascaradas exigem aprovação.
- Criações passam pelo BCE (ADR-0042).

## Alternatives
Chatbot por módulo; contexto irrestrito sem governança.

## Advantages
Respostas e ações coerentes entre módulos, com rastreabilidade.

## Disadvantages
Custo de implementação e de governança dos contratos.

## Risks
Risco de vazamento de contexto: mitigado por permissões e política de metadados.

## Consequences
O protótipo continua com respostas simuladas e contexto por módulo até a implementação.
