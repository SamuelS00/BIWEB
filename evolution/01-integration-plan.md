# 01 · Plano de integração

| Experiência | Encaixe e mudança | Novo | Fase | Referências-base |
|---|---|---|---|---|
| AI Copilot | Evoluir dock e painel de IA do editor; contexto explícito, cancelamento, revisão e confirmação | Controles de contexto/revisão e histórico de sessões | 1 | REF-21, REF-25, REF-23 (essenciais); REF-19, REF-20 |
| Troca de visualização | Controles no workspace de mapa e no cabeçalho dos visuais existentes; preservar estado e avisar perdas | Gráfico/Tabela e limites de representação | 1 | REF-26 (essencial), REF-28, REF-29 |
| Tela de dados/modelo | Enriquecer `/connections` e `/models/:id`; manter wizard, lineage e entidades | Catálogo, alternância Agent/Form, diagrama editável, editor de métrica/impacto | 1 | REF-55, REF-57, REF-61, REF-65, REF-66/67/70–73 |
| Map workspace | Workspace próprio para mapa; galeria/report ganha entrada contextual | Canvas contínuo, camadas por domínio, legenda, escopo do viewport, drawer de tabela | 2 | REF-43/44/45 (importantes) |
| Network Intelligence | Primeiro item da galeria Rede; aprimorar topologia do relatório `net_operacoes` | Separação saúde/utilização e seleção de nó/enlace | 2 | REF-36 e REF-99 (essenciais) |
| Incident Intelligence | Evoluir `net_incidentes` e oferecer mapa/timeline sincronizados | Camadas ponto/cluster/heatmap/hexbin e explicação baseada em evidências demonstrativas | 2 | REF-41 e REF-100/102 (essenciais); REF-40 |
| Tempo real/replay | Barra global temporal em relatório/mapa | Estado live, pausa por interação, histograma e janela histórica | 2 | REF-31, REF-33 (essenciais); REF-30/34/35 |
| Intelligent Workflow | Nova rota `/workflows`, dentro da navegação do produto | Grafo, grupos, grade/Gantt, retry, logs e proposta natural com Aprovar separado de Executar | 3 | REF-80/84/85 (essenciais); REF-77/79 |
| Street Intelligence 3D | Evoluir o gêmeo 3D atual em workspace de mapa | Extrusão métrica e 2D↔3D, atribuição explícita | 3 | REF-46/47/48 (essenciais); REF-110 |
| Relatórios extras de confiabilidade e produto | Três experiências locais navegáveis ligadas à galeria | Anomaly Explorer, SLA & Risk Monitor e Customer Behavior com filtros e dados sintéticos | 3 | REF-103/105/106; matriz seção 22 |

Todas as integrações deste plano são demonstrativas no cliente. Filtros, proposta/execução de fluxos, atualização e ações de análise alteram estado local; nenhum backend ou serviço externo é necessário para explorar o protótipo.

Implementação orientada a demonstração: fixtures locais e estados locais, sem simular integrações reais como se estivessem conectadas. Mudanças de IA ficam em staging até confirmação. Mudanças em dados/modelos seguem rascunho, prévia, impacto e publicar.
