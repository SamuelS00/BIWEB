# ADR-0033 — IA como camada opcional de orquestração sobre capacidades da plataforma

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** [31-ai-assistant](../31-ai-assistant.md), ADR-0005, ADR-0006, ADR-0034–0041

## Context
O produto terá um copiloto de IA que cria, edita, analisa, descobre, modela e transforma. Há o risco de construir uma "arquitetura paralela": caminhos de dados próprios (text-to-SQL), mutações diretas no documento, lógica de negócio duplicada. Também há o risco de tornar o core dependente de IA. A plataforma precisa funcionar 100% sem IA (tenants que a desabilitam, self-hosted air-gapped, incidentes de provedor).

## Decision
- A IA é um **agente com ferramentas** que **encapsulam capacidades já existentes** (Query API/QDL, `dashboard-core`/ops, semantic compiler, catálogo, lineage, Transformation Engine, Insights Engine, Viz Recommender).
- **Regra de ouro:** uma capacidade nova necessária à IA é implementada **primeiro como capacidade determinística da plataforma** (API e, quando fizer sentido, UI sem IA) e só depois exposta como ferramenta.
- **Nenhum componente core chama o Model Gateway.** Desligar a IA não degrada nenhuma outra funcionalidade.
- Orquestração no **control plane (TS)**, em módulos `assistant` e `model-gateway`, com contexto e preview no cliente (modelo híbrido).
- Text-to-SQL, geração de documento inteiro, execução de código gerado e fine-tuning ficam **fora**.

## Alternatives
Chatbot RAG sobre documentação; text-to-SQL; geração direta do documento JSON; agente no browser; serviço de IA separado desde o início; modelo fine-tuned.

## Advantages
Segurança e governança herdadas; zero duplicação; grounding forte (saídas validadas por compiladores existentes); a IA melhora conforme a plataforma melhora; desligável sem efeitos colaterais.

## Disadvantages
A IA só pode fazer o que a plataforma expõe; capacidades novas exigem trabalho no core primeiro.

## Risks
Pressão por atalhos ("deixa a IA gerar SQL") → revisão de arquitetura obrigatória para toda nova ferramenta.

## Consequences
Tool Registry versionado; cada ferramenta declara a capacidade que encapsula (`wraps`); testes garantem que o core roda com o módulo `assistant` desabilitado.
