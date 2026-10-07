# @biweb/assistant-ui

Copilot do BIWEB Studio (IA opcional, ADR-0033): painel lateral e tela cheia, chip de contexto, respostas com evidências (mini-gráficos com tokens runtime), citações, links para relatórios, passos e ações. Markdown seguro: só **negrito**, sem HTML nem links remotos.

- Recebe um `CopilotEngine` (`reply`, `suggestions`). Em produção, a implementação fala com a Assistant API via SSE; o app usa um motor de exemplo.
- Nenhuma alteração é aplicada pela IA sem confirmação: ações sugeridas navegam ou abrem propostas.
- Estilos: `@import "@biweb/assistant-ui/copilot.css"`.
- Nenhum pacote core importa este pacote (regra `core-nao-importa-ia`). Com a IA desligada, o app não o renderiza.
