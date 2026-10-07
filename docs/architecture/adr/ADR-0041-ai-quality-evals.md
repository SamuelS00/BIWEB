# ADR-0041 — Qualidade da IA como código: prompts versionados, evals que bloqueiam o CI e red-team

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0028, [31 §20](../31-ai-assistant.md#20-observabilidade-e-qualidade), [24](../24-testing-and-cicd.md)

## Context
Mudanças de prompt, ferramentas ou modelo regridem silenciosamente. A IA opera sobre dados empresariais e pode ser alvo de injeção de prompt.

## Decision
- **Prompts e descrições de ferramentas versionados no repositório**, revisados como código.
- **Evals** em `testing/ai-evals/`: tenants fixture (modelos semânticos + dados sintéticos com efeitos conhecidos), tarefas golden por modo (criar, editar, analisar, descobrir, modelar, transformar), métricas (validade de ferramentas, compilação de QDL/BEL/ops, correção numérica, aceitação de propostas simuladas). **Gate no CI** para mudanças em `assistant`/`model-gateway`/ferramentas e para troca de modelo.
- **Red-team automatizado**: injeção via títulos, descrições e valores; tentativas cross-tenant e de violação de RLS/CLS; ações proibidas; exfiltração por links.
- **Modelos fixados por rota**; trocas via feature flag com canário e comparação de métricas online (aceitação, undo após aceitar, 👍/👎, erros de ferramenta).
- Telemetria seguindo as convenções semânticas GenAI do OpenTelemetry.

## Alternatives
Testes manuais; avaliação só em produção; LLM-as-judge como única métrica.

## Advantages
Evolução segura de prompts e modelos; evidência objetiva para escolher provedores.

## Disadvantages
Custo de executar evals (mitigado por suítes rápidas no PR e completas no nightly).

## Risks
Evals pouco representativos → alimentar o corpus com casos reais anonimizados (com consentimento/política) e falhas observadas.

## Consequences
O bake-off de provedores do AI v1 usa a mesma suíte.
