# 03 · Componentes novos

Inventário limitado ao que não existe na UI atual. Componentes usam os tokens `surface-*`, `border-*`, `accent`, `text-*`, `viz-*` e medidas da BIWEB.

| Componente | Zona | Tokens/padrão |
|---|---|---|
| Workspace de mapa contínuo | Nova rota | `surface-panel`, `border-subtle`, controles mínimos de 24 px |
| Legenda-cartão por domínio | Mapa | `text-secondary`, sequencial `viz-seq-*`, status textual com ícone |
| Filtro por viewport | Barra de contexto | Switch/control padrão com escopo nomeado |
| Gaveta de tabela espacial | Mapa | painel plano, tabela existente, seleção sincronizada |
| Linha temporal com histograma e brush | Barra temporal | tokens de visualização e controles com rótulo acessível |
| Busca espacial categorizada | Toolbar | campo BIWEB e resultados agrupados por ativo, trecho, local e incidente |
| Layer manager por domínio | Painel contextual | grupos de switches existentes, opacidade no ponto de uso e legenda contextual |
| Toolbar espacial e estilos de base | Canvas | `SegmentedControl`, estados `aria-pressed`, transição curta e ferramentas agrupadas |
| Inspector de ativo/trecho | Canvas | drawer contextual com estado, métricas, dependências, histórico e análise com Copilot |
| Cartografia OSM e overlays analíticos | Canvas | tiles atribuídos, SVG de rede/fluxo/eventos e medidas demonstrativas |
| Selection summary e route card | Canvas | resumo contextual com contagem e CTA de análise local |
| Timeline recolhível | Rodapé do mapa | range e controles de play/pause, velocidade, live e replay |
| Diagrama semântico por assunto | Modelos | canvas existente, nós planos e aresta com cardinalidade |
| Editor de métrica Visual/Expressão | Modelo | campo/formulário existente; validação inline |
| Catálogo de conectores + modo Agent/Form | Dados | `SegmentedControl`, linhas de tabela e `Banner` |
| Canvas de workflow com grupos e minimapa | Fluxos | superfícies planas, status texto/ícone, sem depender de cor |
| Alternância grafo/grade/Gantt | Fluxos | `SegmentedControl`, grade/tabela e timeline compartilhadas |
| Proposta/revisão do workflow | Fluxos/Copilot | resumo + detalhe por mudança; Aprovar e Executar separados |

Não são componentes novos: badges, banners, selects, switches, tabelas, painéis, canvas de dashboard, mapa de relatório e Copilot.

As três demos de análise foram montadas com componentes já existentes (`Badge`, `Button`, `SegmentedControl`, widget e tabela), mais estilos locais que usam os tokens do BIWEB. Não introduzem um sistema visual paralelo.
