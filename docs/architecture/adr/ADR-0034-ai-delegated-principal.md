# ADR-0034 — A IA age com o principal delegado do usuário (nunca acima dele)

- **Status:** Proposto · **Data:** 2026-10-06 · **Relacionados:** ADR-0017, ADR-0016, [31 §14](../31-ai-assistant.md#14-segurança-privacidade-e-multi-tenancy)

## Context
A IA acessa metadados, dados e documentos e propõe mudanças. Ela não pode ter acesso maior que o usuário, deve respeitar tenant, RLS/CLS e políticas, e os tenants podem querer restringir o que é feito via IA.

## Decision
- Toda ferramenta executa com o **principal do usuário** e `context.via = "assistant"` no Cedar. Políticas podem **restringir** ações via assistente (`forbid ... when { context.via == "assistant" }`); nunca ampliar.
- No data plane: **token delegado de vida curta** (claims do usuário + `via` + escopo de ferramenta + `conversationId`). O Query Service aplica as mesmas RLS/CLS, cost guard e quotas, mais os limites de **egress** da política de IA.
- O `UIContextSnapshot` é tratado como dica: todo ID é reconsultado com autorização.
- Não existe service account de IA com acesso amplo. Automação futura (relatórios com narrativa) usa o principal do dono/destinatário, como já ocorre em Delivery.

## Alternatives
Service account privilegiada da IA com filtragem posterior; confiar no contexto enviado pelo cliente; permissões próprias de IA desacopladas das do usuário.

## Advantages
Impossível, por construção, a IA ver mais que o usuário; uma única fonte de verdade de autorização; auditoria clara.

## Disadvantages
Toda chamada de ferramenta avalia autorização (custo pequeno, com cache de decisões).

## Risks
Erros de propagação do `via` → testes de propriedade e suíte de segurança específica.

## Consequences
Cedar ganha o atributo de contexto `via`; o Query Service aceita tokens delegados com escopo.
