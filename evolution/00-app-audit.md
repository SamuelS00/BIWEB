# 00 · Auditoria da aplicação BIWEB Studio

Data da auditoria: 07/10/2026. Fonte inspecionada: aplicação atual em `apps/web`, pacotes de UI/tokens e fixtures do workspace. A implementação deve preservar o App Shell, a navegação e o design system atuais.

## Inventário da aplicação

### Navegação e telas

| Área atual | Rota | Estado observado | Encaixe das experiências |
|---|---|---|---|
| Início | `/` | Home por workspace: resumo, recentes, favoritos, saúde dos dados e atalhos do Copilot. | Entrada para os novos relatórios e status operacional. |
| Relatórios | `/reports` | Galeria com filtros, pesquisa, favoritos, grade/lista. O workspace Rede lista documentos salvos do editor. | Network Intelligence deve ser o primeiro item no workspace Rede; Incident e Street Intelligence entram na mesma galeria. |
| Relatório | `/reports/:id` | Cabeçalho, páginas, filtros e canvas compartilhado com o editor; mapa já é visualização embutida. | Relatórios demonstrativos e troca de representação; o workspace de mapa pede rota/layout próprio. |
| Editor | `/reports/:id/edit` | Editor lazy, canvas e painéis Dados/Inspector/IA; documento mutável via Zustand. | Revisão e staging de IA, toggle Gráfico/Tabela e controles por visual. |
| Dados | `/connections` | Na Rede, tela `DataPage`: fontes, datasets, schemas/campos, lineage/portabilidade, import wizard e preview geográfico. Existe também uma tela legada de conexões comerciais. | Enriquecer a tela Rede com catálogo e conectores, diagnóstico, modelagem, métricas e fluxo de conexão. |
| Modelos | `/models/:id` | Catálogo simples de métricas e entidades; indica protótipo de diagrama em design-handoff. | Evoluir para diagramas por assunto, relações e métricas visuais. |
| Copilot | `/copilot` | Conversa em tela cheia; dock compartilhado no shell; desligável por preferências. Motor atual é de exemplo, com evidências. | Evoluir o mesmo componente, sem estética de IA própria. |

### Componentes, padrões e tokens existentes

- Shell: rail de 48 px, barra superior, breadcrumb, seletor de workspace, busca `⌘K`, preferências e dock opcional. Não alterar identidade nem shell.
- UI: `@biweb/ui` fornece botões, campos, badges, banner, segmented control, menu, popover, switch, ícones, overlays e estrutura de painéis.
- Tokens DTCG em `packages/tokens`: superfícies planas, bordas finas, azul-marinho de ação, tipografia IBM Plex Sans/Mono, raios de 2–6 px e controles de 24–32 px; temas claro/escuro e densidade compacta.
- Linguagem: aplicação em pt-BR, dados densos em tabelas/listas, títulos compactos, ações contextualizadas, cards de baixa elevação e estados com texto/ícone além de cor.
- Padrões: barra de contexto de relatório, canvas contínuo em dashboards, inspector lateral, drawers/overlays e tabelas como representação auxiliar.

### Capacidades de dados e modelo

- Consulta/renderização ocorre via `apps/web/src/data` e medidas/campos do modelo semântico; o frontend não expõe SQL.
- `DataPage` já tem importação CSV/XLSX, seleção de dataset, amostra de linhas, inferência de campos, vínculos fonte→dataset→relatório, relações e cardinalidade N:1 resumida.
- Há wizard de importação e lineage gráfico, mas não há catálogo geral de conectores com teste/agenda nem agente ⇄ formulário.
- `ModelPage` lista métricas/entidades, mas não tem editor de métrica, diagrama visual, publicação com impacto graduado nem diagnóstico completo.
- O modelo do editor distingue publicado/rascunho e já tem fluxo de prévia/publicação em regras. A persistência é local/de demonstração.

### Mapas, relatórios e tempo

- Visualizações incluem mapas MapLibre/deck.gl, cena 3D, controles de camadas, clusters, rotas, heatmap e topologia; há seleção de entidades e alguns drawers/contextos do mapa.
- O workspace Rede já traz demos como mapa operacional, incidentes, capacidade, rotas, gêmeo 3D e dashboards; Incident Intelligence está parcialmente representado pelo relatório `net_incidentes`.
- A galeria do workspace Rede já existe, mas Network Intelligence não ocupa a primeira posição. Não há map workspace contínuo próprio, viewport como escopo explícito, legenda-card persistente ou gaveta de tabela integrada como layout de mapa.
- A barra do relatório rotula dados como “Ao vivo”, mas usa carimbo fixo de exemplo. Não há playback/replay sincronizado com histograma e janela de tempo.
- Alternância 2D/3D e camadas existe na cena 3D; a troca universal de gráfico para tabela por widget, com estado preservado e aviso de perda, não está presente.

## Matriz de existência e destino

| Experiência solicitada | Estado | Destino na navegação |
|---|---|---|
| Copilot contextual com chips, contexto do canvas, status/interrupção, histórico e revisão por item | Parcial | Mesmo dock `/copilot` e painel IA do editor; ampliar estado e proposta. |
| Troca Gráfico/Tabela, 2D/3D e camadas com preservação/limites | Parcial | Ação no cabeçalho do visual e controles dentro do mapa; manter no mesmo canvas. |
| Tela de dados: relações visuais, métrica Visual/expressão, lineage/impacto/diagnóstico, conectores e wizard | Parcial | `/connections` e `/models/:id`, enriquecendo telas existentes. |
| Map workspace | Não existe como workspace | Nova rota `/maps/:reportId`, acessada por relatório geográfico e navegação contextual, mantendo shell. |
| Network Intelligence | Parcial | Primeiro relatório na galeria de Rede; topologia hierárquica e saúde/utilização separadas. |
| Incident Intelligence | Parcial | Evoluir `net_incidentes`; mapa, histograma, filtros, evidências e detalhe de entidade. |
| Tempo real e replay | Parcial/ausente | Controle global do tempo no relatório/mapa; preservar filtros e seleção ao voltar ao histórico. |
| Intelligent Workflow + criação em linguagem natural | Não existe | Nova área “Fluxos” acessível pela navegação de Dados/ação de workspace; grafo, grade/Gantt e staging. |
| Street Intelligence 3D | Parcial | Evoluir “Gêmeo Digital 3D da Rede” com extrusão por medida, alternância 2D/3D e atribuição OSM. |
| Relatórios extras | Parcial | Network e Incident são prioridade; Anomaly Explorer/SLA somente se couber sem duplicar capacidade existente. |

## Limites encontrados

- O repositório contém dados demonstrativos e serviços esqueleto; testes de conexão, execução de workflow, streaming e ações do backend não são reais.
- Mapas têm cenas sintéticas. Atribuição/licença de camadas externas não pode ser presumida; exibir atribuição OSM quando usar conteúdo OSM.
- O Apêndice A do pack informa que transições/skeletons de troca, saúde de conexão/resync e diff/ghost nodes de workflow não têm evidência verificada. Qualquer estado correspondente será marcado como hipótese a validar.

