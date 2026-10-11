# ADR-0042 — Composition Engine (BCE) e contratos canônicos de construção

- **Status:** Aceito · **Data:** 2026-10-10 · **Relacionados:** ADR-0033, ADR-0034, 21 (versionamento), apresentação `/apresentacao/`

## Context
Hoje o Copilot, o Migration Studio e os templates alteram relatórios, mapas e fluxos por caminhos diferentes. Para que humanos, IA, migração e agentes autorizados construam com previsibilidade, é preciso uma linguagem comum e validada.

## Decision
- Criar o **BIWEB Composition Engine (BCE)**: serviço lógico que define e **valida** os contratos canônicos de construção (`ReportSpec`, `MapSpec`, `WorkflowSpec`, `ComponentSpec`, `DataBindingSpec`, `InteractionSpec`, `ThemeSpec`; nomes provisórios).
- Todo autor (Copilot, Migration Engine, templates, agentes externos autorizados) produz **contratos**, nunca manipula a UI. O BCE valida; os Builders interpretam.
- Contratos são versionados; resultado aplicado continua **editável manualmente** e reversível (Pedido → Prévia → Revisão → Aplicar).
- O BCE é desenhado como componente **independente** (consumível por Copilot, Migration Engine, Builders e agentes).
- Nenhuma integração com provedor de IA específico é garantida: a arquitetura é preparada para agentes capazes de emitir os contratos autorizados.

## Alternatives
Contratos ad hoc por módulo; IA clicando na interface; contrato único gigante.

## Advantages
Previsibilidade, validação, versionamento, segurança, interoperabilidade e migração pelo mesmo caminho.

## Disadvantages
Custo de implementação e de governança dos contratos.

## Risks
Custo de manter o schema dos contratos e compatibilidade entre versões.

## Consequences
Novos módulos de construção expõem um contrato; a migração e o Copilot passam a depender dele.
