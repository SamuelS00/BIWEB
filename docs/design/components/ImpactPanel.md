# ImpactPanel

Análise de impacto de um rascunho do modelo semântico antes da publicação; o consumidor fornece as mudanças e a lista de dependentes (dashboards, métricas, widgets) com o efeito de cada uma.

- Resumo no topo (o que mudou e quantos dependentes); depois um dependente por linha com Badge do efeito: Sem mudança (`success`), Recalcula (`warning`), Quebra (`danger`).
- "Publicar…" abre o Dialog de confirmação; nunca publica direto. Propostas de métrica feitas pela IA passam por aqui igual.
