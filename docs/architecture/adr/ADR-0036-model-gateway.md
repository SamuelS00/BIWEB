# ADR-0036 — Model Gateway como ponto único de acesso a modelos

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0037, [31 §15](../31-ai-assistant.md#15-provedores-e-modelos), [31 §16](../31-ai-assistant.md#16-custo)

## Context
Precisamos de independência de fornecedor, modelos diferentes por tarefa, requisitos enterprise (BYO, região, retenção), controle de egress de dados, quotas, metering e telemetria — sem introduzir complexidade desnecessária no v1.

## Decision
- Interface interna `ModelGateway` (módulo do control plane): requisições com **classe de tarefa** (`fast`, `standard`; `deep` prevista), mensagens com **partes rotuladas por classe de dado**, ferramentas, schema de saída, budget e atribuição (tenant/usuário/feature).
- Responsabilidades: **roteamento por configuração** (tarefa → modelo/versão fixada), **egress guard** (política de IA + classificação de campos + detecção de padrões), quotas e pré-estimativa, **metering**, cache de prefixo, retries/fallback, **telemetria GenAI**.
- v1: **um provedor** (escolhido por bake-off de evals) e duas classes. Adapters adicionais, BYO por tenant e endpoints privados ficam previstos na interface, implementados sob demanda.
- Tipos de SDKs de terceiros não vazam para fora dos adapters.
- **Gatilho de extração** como serviço: consumidores fora do control plane, rede dedicada para endpoints privados, ou escala independente.

## Alternatives
Chamar SDKs de provedores diretamente nos módulos; proxy de terceiros para LLM; serviço separado desde o início; multi-provedor completo no v1.

## Advantages
Um chokepoint para segurança, custo e observabilidade; troca de modelo sem tocar no orquestrador.

## Disadvantages
Pequena camada a manter.

## Risks
Interface "mínimo denominador comum" perder recursos úteis → capacidades declaradas por adapter (tool calling, structured output, cache).

## Consequences
Nenhum código fora do gateway fala com provedores; lint impede imports de SDKs de modelo em outros módulos.
